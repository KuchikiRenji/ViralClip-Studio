const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { join } = path;

// Helper function to get font file path based on OS and weight
function getFontPath(family = 'Arial', bold = false, italic = false) {
  const platform = process.platform;

  // Map font family to actual font files
  const fontMap = {
    'Arial': {
      regular: platform === 'win32' ? 'C:/Windows/Fonts/arial.ttf' :
               platform === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
               '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
      bold: platform === 'win32' ? 'C:/Windows/Fonts/arialbd.ttf' :
            platform === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
      italic: platform === 'win32' ? 'C:/Windows/Fonts/ariali.ttf' :
              platform === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
              '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
      boldItalic: platform === 'win32' ? 'C:/Windows/Fonts/arialbi.ttf' :
                  platform === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
                  '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf'
    },
    'Inter': {
      regular: platform === 'win32' ? 'C:/Windows/Fonts/Inter-Regular.ttf' :
               platform === 'darwin' ? '/System/Library/Fonts/Supplemental/Inter-Regular.otf' :
               '/usr/share/fonts/truetype/inter/Inter-Regular.ttf',
      bold: platform === 'win32' ? 'C:/Windows/Fonts/Inter-Bold.ttf' :
            platform === 'darwin' ? '/System/Library/Fonts/Supplemental/Inter-Bold.otf' :
            '/usr/share/fonts/truetype/inter/Inter-Bold.ttf'
    },
    // Add more font mappings as needed
  };

  const fontPaths = fontMap[family] || fontMap['Arial'];

  if (bold && italic) {
    return fontPaths.boldItalic || fontPaths.bold || fontPaths.regular;
  } else if (bold) {
    return fontPaths.bold || fontPaths.regular;
  } else if (italic) {
    return fontPaths.italic || fontPaths.regular;
  }

  return fontPaths.regular;
}

// Helper to escape FFmpeg text strings
function escapeFFmpegText(text) {
  if (!text) return '';
  // FFmpeg uses : as separator, need to escape it
  return text.replace(/'/g, "\\'")
             .replace(/:/g, "\\:")
             .replace(/\[/g, "\\[")
             .replace(/\]/g, "\\]")
             .replace(/,/g, "\\,")
             .replace(/;/g, "\\;");
}

// Convert hex color to FFmpeg format with proper alpha support
function hexToFFmpegColor(hex, alpha = 1) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to BGR format (FFmpeg uses BGR not RGB)
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const a = Math.round(alpha * 255);

  // Format as 0xRRGGBBAA for FFmpeg
  const bgr = ((b << 16) | (g << 8) | r).toString(16).padStart(6, '0');
  const alphaHex = a.toString(16).padStart(2, '0');

  return `0x${bgr}${alphaHex}`;
}

// Calculate accurate positions matching frontend preview
function calculateTitlePosition(titlePosition, titleStyle, outputWidth, outputHeight) {
  // Frontend uses percentage-based positioning with translate(-50%, 0) for centering
  const x = (titlePosition.x / 100) * outputWidth;
  const y = (titlePosition.y / 100) * outputHeight;

  // Frontend scales font by 0.6 for preview, we need to match this ratio
  const fontSize = Math.round((titleStyle.fontSize || 24) * (outputWidth / 1080) * 0.6);

  // FFmpeg drawtext positioning to match CSS translate(-50%, 0)
  // We need to center the text horizontally
  const xExpression = `(${x}-text_w/2)`;

  return {
    x: xExpression,
    y: Math.round(y),
    fontSize
  };
}

// Calculate ranking graphic position matching frontend constraints
function calculateRankingPosition(position, size, outputWidth, outputHeight) {
  const scaledSize = Math.round(size * (outputWidth / 1080));
  const padding = Math.round(scaledSize * 0.2);

  // Frontend constrains to top 30% of container
  const maxTopPercent = 0.3;
  const constrainedHeight = outputHeight * maxTopPercent;

  let x, y;

  switch (position) {
    case 'top-left':
      x = padding;
      y = padding;
      break;
    case 'top-right':
      x = outputWidth - scaledSize - padding;
      y = padding;
      break;
    case 'bottom-left':
      // Frontend remaps bottom positions to top area
      x = padding;
      y = Math.min(padding + scaledSize * 0.5, constrainedHeight - scaledSize);
      break;
    case 'bottom-right':
      // Frontend remaps bottom positions to top area
      x = outputWidth - scaledSize - padding;
      y = Math.min(padding + scaledSize * 0.5, constrainedHeight - scaledSize);
      break;
    case 'center':
      x = Math.round((outputWidth - scaledSize) / 2);
      y = Math.round(constrainedHeight / 2 - scaledSize / 2);
      break;
    default:
      x = padding;
      y = padding;
  }

  return { x, y, size: scaledSize };
}

// Build transition filters for xfade
function buildTransitionFilter(transitionSettings, videoCount, clipDurations) {
  if (!transitionSettings || transitionSettings.type === 'none' || videoCount < 2) {
    return null;
  }

  const { type, duration } = transitionSettings;
  const transitionDuration = Math.min(duration || 0.5, 2); // Cap at 2 seconds

  // Map frontend transition types to FFmpeg xfade transitions
  const transitionMap = {
    'fade': 'fade',
    'wipe-left': 'wipeleft',
    'wipe-right': 'wiperight',
    'wipe-up': 'wipeup',
    'wipe-down': 'wipedown',
    'slide-left': 'slideleft',
    'slide-right': 'slideright',
    // These need custom implementation
    'zoom-in': 'fade', // Fallback to fade for now
    'zoom-out': 'fade', // Fallback to fade for now
    'blur': 'fade', // Fallback to fade for now
    'glitch': 'fade', // Fallback to fade for now
    'rotate': 'fade', // Fallback to fade for now
    'cube': 'fade' // Fallback to fade for now
  };

  const ffmpegTransition = transitionMap[type] || 'fade';

  return {
    type: ffmpegTransition,
    duration: transitionDuration
  };
}

// Enhanced export endpoint with perfect accuracy
async function exportRankingVideo(req, res, options = {}) {
  const uploadedFiles = [];
  const tempAudioFile = options.tempDir ?
    path.join(options.tempDir, `bg_music_${Date.now()}.mp3`) : null;

  try {
    console.log('📦 Enhanced ranking video export request received');

    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Missing config parameter' });
    }

    const parsedConfig = JSON.parse(config);
    const {
      clipDurations,
      trimStarts,
      title,
      titlePosition,
      titleStyle,
      background,
      videoHeight,
      fps = 30,
      quality = '1080p',
      transitionSettings,
      backgroundMusic,
      rankingGraphic,
      overlays,
      captions
    } = parsedConfig;

    const files = req.files?.filter(f => f.fieldname === 'videos') || [];
    const musicFile = req.files?.find(f => f.fieldname === 'backgroundMusic');

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No video files uploaded' });
    }

    console.log(`📹 Processing ${files.length} videos with quality: ${quality}`);
    if (musicFile) {
      console.log('🎵 Background music file uploaded');
    }

    // Output settings based on quality
    let outputWidth, outputHeight, crf, preset, bitrate;

    switch (quality) {
      case '720p':
        outputWidth = 720;
        outputHeight = 1280;
        crf = '23';
        preset = 'fast';
        bitrate = '3M';
        break;
      case '4k':
        outputWidth = 2160;
        outputHeight = 3840;
        crf = '15';
        preset = 'slow';
        bitrate = '20M';
        break;
      default: // 1080p
        outputWidth = 1080;
        outputHeight = 1920;
        crf = '18';
        preset = 'medium';
        bitrate = '8M';
    }

    console.log(`📐 Export dimensions: ${outputWidth}x${outputHeight}`);

    // Calculate video area (where videos are shown)
    const videoAreaHeight = Math.round((videoHeight / 100) * outputHeight);
    const videoAreaY = outputHeight - videoAreaHeight;

    // Prepare output path
    const outputId = Buffer.from(`${Date.now()}-${Math.random()}`)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 16);
    const outputPath = options.outputPath ||
      join(options.downloadsDir || './downloads', `ranking_${outputId}.mp4`);

    // Build FFmpeg command
    const inputs = [];
    const filterComplex = [];

    // Add video inputs
    for (let i = 0; i < files.length; i++) {
      inputs.push('-i', files[i].path);
      uploadedFiles.push(files[i].path);
    }

    // Add background music if provided
    let musicIndex = -1;
    if (musicFile) {
      musicIndex = files.length;
      inputs.push('-i', musicFile.path);
      uploadedFiles.push(musicFile.path);
    }

    // Build filter complex chain
    let currentVideoStream = '';
    let videoStreams = [];

    // Step 1: Process each video (trim, scale, position)
    for (let i = 0; i < files.length; i++) {
      const trimStart = trimStarts?.[i] || 0;
      const duration = clipDurations?.[i] || 5;

      // Trim and reset PTS
      filterComplex.push(
        `[${i}:v]trim=start=${trimStart}:duration=${duration},setpts=PTS-STARTPTS,` +
        `scale=${outputWidth}:${videoAreaHeight}:force_original_aspect_ratio=decrease:flags=lanczos,` +
        `pad=${outputWidth}:${videoAreaHeight}:(ow-iw)/2:(oh-ih)/2:color=${background}[v${i}scaled]`
      );

      // Create full frame with video positioned at bottom
      filterComplex.push(
        `color=c=${background}:s=${outputWidth}x${outputHeight}:d=${duration}[bg${i}]`,
        `[bg${i}][v${i}scaled]overlay=0:${videoAreaY}[v${i}full]`
      );

      videoStreams.push(`[v${i}full]`);
    }

    // Step 2: Apply transitions or concatenate
    const transition = buildTransitionFilter(transitionSettings, files.length, clipDurations);

    if (transition && files.length > 1) {
      console.log(`🎬 Applying ${transition.type} transitions (${transition.duration}s)`);

      // Use xfade for transitions between clips
      let currentStream = videoStreams[0];

      for (let i = 1; i < videoStreams.length; i++) {
        const prevDuration = clipDurations?.[i - 1] || 5;
        const offset = prevDuration - transition.duration;

        filterComplex.push(
          `${currentStream}${videoStreams[i]}xfade=transition=${transition.type}:` +
          `duration=${transition.duration}:offset=${offset}[xfade${i}]`
        );

        currentStream = `[xfade${i}]`;
      }

      currentVideoStream = currentStream;
    } else {
      // Simple concatenation without transitions
      filterComplex.push(
        `${videoStreams.join('')}concat=n=${files.length}:v=1:a=0[concatenated]`
      );
      currentVideoStream = '[concatenated]';
    }

    // Step 3: Add title with accurate positioning
    if (title && titleStyle) {
      const titlePos = calculateTitlePosition(titlePosition, titleStyle, outputWidth, outputHeight);
      const textColor = hexToFFmpegColor(titleStyle.color);
      const strokeColor = hexToFFmpegColor(titleStyle.strokeColor || '#000000');
      const strokeWidth = Math.round((titleStyle.strokeWidth || 2) * (outputWidth / 1080));
      const fontPath = getFontPath(titleStyle.fontFamily, titleStyle.bold, titleStyle.italic);

      console.log(`📝 Title: fontSize=${titlePos.fontSize}, x=${titlePos.x}, y=${titlePos.y}`);

      // Build drawtext filter with all styling
      const drawtextFilter =
        `drawtext=text='${escapeFFmpegText(title)}':` +
        `fontfile='${fontPath}':` +
        `fontsize=${titlePos.fontSize}:` +
        `fontcolor=${textColor}:` +
        `x=${titlePos.x}:` +
        `y=${titlePos.y}:` +
        `borderw=${strokeWidth}:` +
        `bordercolor=${strokeColor}`;

      filterComplex.push(
        `${currentVideoStream}${drawtextFilter}[withTitle]`
      );

      currentVideoStream = '[withTitle]';
    }

    // Step 4: Add ranking graphics with accurate positioning
    if (rankingGraphic && rankingGraphic.style) {
      console.log('🎨 Adding ranking graphics:', rankingGraphic);

      const RANKING_COLORS = {
        number: '#3b82f6',
        badge: '#8b5cf6',
        medal: '#f59e0b',
        trophy: '#10b981',
        custom: '#ec4899'
      };

      const color = RANKING_COLORS[rankingGraphic.style] || '#3b82f6';
      const { x, y, size } = calculateRankingPosition(
        rankingGraphic.position,
        rankingGraphic.size || 80,
        outputWidth,
        outputHeight
      );

      // Build ranking graphics for each video clip
      let accumulatedTime = 0;
      const rankingFilters = [];

      for (let i = 0; i < files.length; i++) {
        const clipDuration = clipDurations?.[i] || 5;
        const startTime = accumulatedTime;
        const endTime = accumulatedTime + clipDuration;
        const rank = i + 1;

        // Draw background box
        const boxColor = hexToFFmpegColor(color);
        rankingFilters.push(
          `drawbox=x=${x}:y=${y}:w=${size}:h=${size}:` +
          `color=${boxColor}:t=fill:` +
          `enable='between(t,${startTime},${endTime})'`
        );

        // Draw rank number
        const fontSize = Math.round(size * 0.5);
        const textX = x + Math.round(size / 2);
        const textY = y + Math.round(size / 2);

        rankingFilters.push(
          `drawtext=text='${rank}':` +
          `fontfile='${getFontPath('Arial', true, false)}':` +
          `fontsize=${fontSize}:` +
          `fontcolor=0xFFFFFF:` +
          `x=${textX - fontSize / 4}:` +
          `y=${textY - fontSize / 2}:` +
          `enable='between(t,${startTime},${endTime})'`
        );

        accumulatedTime += clipDuration;
      }

      // Apply all ranking filters
      if (rankingFilters.length > 0) {
        const rankingFilter = rankingFilters.join(',');
        filterComplex.push(
          `${currentVideoStream}${rankingFilter}[withRanking]`
        );
        currentVideoStream = '[withRanking]';
      }
    }

    // Step 5: Handle audio (background music mixing)
    let audioStream = '';

    if (musicFile && backgroundMusic) {
      console.log('🎵 Processing background music');

      const musicVolume = (backgroundMusic.volume || 50) / 100;
      const totalDuration = clipDurations.reduce((sum, d) => sum + (d || 5), 0);

      // Build audio filter chain
      const audioFilters = [];

      // Adjust music volume
      audioFilters.push(`[${musicIndex}:a]volume=${musicVolume}`);

      // Apply fade in if enabled
      if (backgroundMusic.fadeIn) {
        audioFilters[audioFilters.length - 1] += ',afade=t=in:st=0:d=2';
      }

      // Apply fade out if enabled
      if (backgroundMusic.fadeOut) {
        audioFilters[audioFilters.length - 1] += `,afade=t=out:st=${totalDuration - 2}:d=2`;
      }

      audioFilters[audioFilters.length - 1] += '[music]';

      // Extract and concatenate video audio tracks (if they exist)
      const videoAudioStreams = [];
      for (let i = 0; i < files.length; i++) {
        const duration = clipDurations?.[i] || 5;
        audioFilters.push(
          `[${i}:a]atrim=0:${duration},asetpts=PTS-STARTPTS[a${i}]`
        );
        videoAudioStreams.push(`[a${i}]`);
      }

      if (videoAudioStreams.length > 0) {
        // Concatenate video audio
        audioFilters.push(
          `${videoAudioStreams.join('')}concat=n=${files.length}:v=0:a=1[videoAudio]`
        );

        // Mix video audio with background music
        if (backgroundMusic.ducking) {
          // Apply ducking (compress music when video audio is present)
          const duckingAmount = (backgroundMusic.duckingAmount || 50) / 100;
          audioFilters.push(
            `[music][videoAudio]sidechaincompress=threshold=0.1:ratio=${2 + duckingAmount * 8}:` +
            `attack=10:release=100[duckedMusic]`,
            `[videoAudio][duckedMusic]amix=inputs=2:duration=first[mixedAudio]`
          );
        } else {
          // Simple mix without ducking
          audioFilters.push(
            `[videoAudio][music]amix=inputs=2:duration=first[mixedAudio]`
          );
        }

        audioStream = '[mixedAudio]';
      } else {
        // Only background music, no video audio
        audioStream = '[music]';
      }

      // Add audio filters to filterComplex
      filterComplex.push(...audioFilters);
    }

    // Final output stream
    filterComplex.push(
      `${currentVideoStream}format=yuv420p[outv]`
    );

    // Build complete filter complex string
    const filterComplexStr = filterComplex.join(';');

    // Build FFmpeg command arguments
    const ffmpegArgs = [
      ...inputs,
      '-filter_complex', filterComplexStr,
      '-map', '[outv]'
    ];

    // Add audio mapping if we have audio
    if (audioStream) {
      ffmpegArgs.push('-map', audioStream);
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k');
    }

    // Video encoding settings
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', crf,
      '-b:v', bitrate,
      '-maxrate', bitrate,
      '-bufsize', `${parseInt(bitrate) * 2}M`,
      '-r', fps.toString(),
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart', // Optimize for streaming
      '-y',
      outputPath
    );

    console.log('🎬 Starting FFmpeg with enhanced accuracy...');

    // Execute FFmpeg
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    let lastProgress = 0;

    ffmpegProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();

      // Parse progress
      const progressMatch = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (progressMatch) {
        const hours = parseInt(progressMatch[1]);
        const minutes = parseInt(progressMatch[2]);
        const seconds = parseFloat(progressMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const totalDuration = clipDurations.reduce((sum, d) => sum + (d || 5), 0);
        const progress = Math.min(100, Math.round((currentTime / totalDuration) * 100));

        if (progress > lastProgress) {
          console.log(`⏳ Progress: ${progress}%`);
          lastProgress = progress;
        }
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('❌ FFmpeg spawn error:', err);

      // Cleanup
      uploadedFiles.forEach(f => {
        try { fs.unlinkSync(f); } catch (e) {}
      });

      return res.status(500).json({
        error: 'FFmpeg processing failed to start',
        details: err.message
      });
    });

    ffmpegProcess.on('close', (code) => {
      // Cleanup uploaded files
      uploadedFiles.forEach(f => {
        try { fs.unlinkSync(f); } catch (e) {}
      });

      if (code !== 0) {
        console.error('❌ FFmpeg exited with code', code);
        console.error('FFmpeg stderr:', stderr.slice(-2000)); // Last 2000 chars

        return res.status(500).json({
          error: 'Video processing failed',
          details: stderr.slice(-1000)
        });
      }

      console.log('✅ Video exported successfully with enhanced accuracy:', outputPath);

      // Return the download URL
      const fileUrl = `/downloads/ranking_${outputId}.mp4`;
      return res.status(200).json({
        url: fileUrl,
        size: fs.statSync(outputPath).size,
        duration: clipDurations.reduce((sum, d) => sum + (d || 5), 0)
      });
    });

  } catch (error) {
    console.error('❌ Export endpoint error:', error);

    // Cleanup on error
    uploadedFiles.forEach(f => {
      try { fs.unlinkSync(f); } catch (e) {}
    });

    if (tempAudioFile && fs.existsSync(tempAudioFile)) {
      try { fs.unlinkSync(tempAudioFile); } catch (e) {}
    }

    return res.status(500).json({
      error: 'Unexpected server error',
      message: error.message
    });
  }
}

module.exports = {
  exportRankingVideo,
  getFontPath,
  hexToFFmpegColor,
  calculateTitlePosition,
  calculateRankingPosition,
  buildTransitionFilter
};