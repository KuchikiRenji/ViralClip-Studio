import { spawn } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import {
  getFontPath,
  escapeFFmpegText,
  hexToFFmpegColor,
  calculateTitlePosition,
  calculateRankingPosition,
  getQualitySettings,
  buildFFmpegArgs
} from './utils.js';
import {
  buildCaptionFilters,
  buildOverlayFilters,
  buildTransitionChain,
  buildAudioFilters
} from './filters.js';

/**
 * Process ranking video with all effects
 */
export async function processRankingVideo(req, res, options = {}) {
  // Don't send response from here, return result instead
  const sendResponse = false;
  const uploadedFiles = [];

  try {
    console.log('🎬 Enhanced Ranking Video Processor Started');

    // Parse configuration
    const { config } = req.body;
    if (!config) {
      throw new Error('Missing config parameter');
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
      videos: videoConfigs // Contains caption data
    } = parsedConfig;

    // Get files from request
    const videoFiles = req.files?.videos || [];
    const musicFile = req.files?.backgroundMusic?.[0];

    if (!videoFiles || videoFiles.length === 0) {
      throw new Error('No video files uploaded');
    }

    console.log(`📹 Processing ${videoFiles.length} videos with quality: ${quality}`);

    // Get quality settings
    const qualitySettings = getQualitySettings(quality);
    const { width: outputWidth, height: outputHeight, crf, preset, bitrate } = qualitySettings;

    console.log(`📐 Output: ${outputWidth}x${outputHeight}`);

    // Calculate video area
    const videoAreaHeight = Math.round((videoHeight / 100) * outputHeight);
    const videoAreaY = outputHeight - videoAreaHeight;

    // Prepare output path
    const outputId = Buffer.from(`${Date.now()}-${Math.random()}`)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 16);
    const outputPath = join(options.downloadsDir || './downloads', `ranking_${outputId}.mp4`);

    // Build FFmpeg inputs
    const inputs = [];
    const filterComplex = [];

    // Add video inputs
    videoFiles.forEach((file, i) => {
      inputs.push('-i', file.path);
      uploadedFiles.push(file.path);
    });

    // Add music input if provided
    let musicIndex = -1;
    if (musicFile) {
      musicIndex = videoFiles.length;
      inputs.push('-i', musicFile.path);
      uploadedFiles.push(musicFile.path);
      console.log('🎵 Background music added');
    }

    // Calculate total duration
    const totalDuration = clipDurations.reduce((sum, d) => sum + (d || 5), 0);

    // Step 1: Process videos (trim, scale, position)
    const videoStreams = [];

    for (let i = 0; i < videoFiles.length; i++) {
      const trimStart = trimStarts?.[i] || 0;
      const duration = clipDurations?.[i] || 5;

      // Trim and scale
      filterComplex.push(
        `[${i}:v]trim=start=${trimStart}:duration=${duration},setpts=PTS-STARTPTS,` +
        `scale=${outputWidth}:${videoAreaHeight}:force_original_aspect_ratio=decrease:flags=lanczos,` +
        `pad=${outputWidth}:${videoAreaHeight}:(ow-iw)/2:(oh-ih)/2:color=${background}[v${i}scaled]`
      );

      // Create full frame with video at bottom
      filterComplex.push(
        `color=c=${background}:s=${outputWidth}x${outputHeight}:d=${duration}[bg${i}]`,
        `[bg${i}][v${i}scaled]overlay=0:${videoAreaY}[v${i}full]`
      );

      videoStreams.push(`[v${i}full]`);
    }

    // Step 2: Apply transitions
    const transitionResult = buildTransitionChain(videoStreams, transitionSettings, clipDurations);
    filterComplex.push(...transitionResult.filters);
    let currentVideoStream = transitionResult.outputStream;

    // Step 3: Add per-video captions
    if (videoConfigs && videoConfigs.length > 0) {
      const captionFilters = buildCaptionFilters(videoConfigs, clipDurations, outputWidth, outputHeight);
      if (captionFilters.length > 0) {
        console.log(`💬 Adding ${captionFilters.length} caption filters`);
        const captionFilter = captionFilters.join(',');
        filterComplex.push(`${currentVideoStream}${captionFilter}[withCaptions]`);
        currentVideoStream = '[withCaptions]';
      }
    }

    // Step 4: Add overlays
    if (overlays && overlays.length > 0) {
      const overlayFilters = buildOverlayFilters(overlays, outputWidth, outputHeight, totalDuration);
      if (overlayFilters.length > 0) {
        console.log(`🎨 Adding ${overlayFilters.length} overlay filters`);
        const overlayFilter = overlayFilters.join(',');
        filterComplex.push(`${currentVideoStream}${overlayFilter}[withOverlays]`);
        currentVideoStream = '[withOverlays]';
      }
    }

    // Step 5: Add title
    if (title && titleStyle) {
      const titlePos = calculateTitlePosition(titlePosition, titleStyle, outputWidth, outputHeight);
      const textColor = hexToFFmpegColor(titleStyle.color);
      const strokeColor = hexToFFmpegColor(titleStyle.strokeColor || '#000000');
      const strokeWidth = Math.round((titleStyle.strokeWidth || 2) * (outputWidth / 1080));
      const fontPath = getFontPath(titleStyle.fontFamily, titleStyle.bold, titleStyle.italic);

      console.log(`📝 Adding title: ${title}`);

      const titleFilter =
        `drawtext=text='${escapeFFmpegText(title)}':` +
        `fontfile='${fontPath}':` +
        `fontsize=${titlePos.fontSize}:` +
        `fontcolor=${textColor}:` +
        `x=${titlePos.x}:` +
        `y=${titlePos.y}:` +
        `borderw=${strokeWidth}:` +
        `bordercolor=${strokeColor}`;

      filterComplex.push(`${currentVideoStream}${titleFilter}[withTitle]`);
      currentVideoStream = '[withTitle]';
    }

    // Step 6: Add ranking graphics
    if (rankingGraphic && rankingGraphic.style) {
      console.log('🏆 Adding ranking graphics');

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

      const rankingFilters = [];
      let accumulatedTime = 0;

      for (let i = 0; i < videoFiles.length; i++) {
        const clipDuration = clipDurations?.[i] || 5;
        const startTime = accumulatedTime;
        const endTime = accumulatedTime + clipDuration;
        const rank = i + 1;

        // Background box
        const boxColor = hexToFFmpegColor(color);
        rankingFilters.push(
          `drawbox=x=${x}:y=${y}:w=${size}:h=${size}:` +
          `color=${boxColor}:t=fill:` +
          `enable='between(t,${startTime},${endTime})'`
        );

        // Rank number
        const fontSize = Math.round(size * 0.5);
        const textX = x + Math.round(size / 2);
        const textY = y + Math.round(size / 2);

        rankingFilters.push(
          `drawtext=text='${rank}':` +
          `fontfile='${getFontPath('Arial', true, false)}':` +
          `fontsize=${fontSize}:` +
          `fontcolor=0xFFFFFFFF:` +
          `x=${textX - fontSize / 4}:` +
          `y=${textY - fontSize / 2}:` +
          `enable='between(t,${startTime},${endTime})'`
        );

        // Add animation if enabled
        if (rankingGraphic.animation) {
          // Pulse effect: scale the size slightly based on time
          // This requires a more complex filter chain - simplified for now
          console.log('🎭 Ranking animation enabled (pulse effect)');
        }

        accumulatedTime += clipDuration;
      }

      if (rankingFilters.length > 0) {
        const rankingFilter = rankingFilters.join(',');
        filterComplex.push(`${currentVideoStream}${rankingFilter}[withRanking]`);
        currentVideoStream = '[withRanking]';
      }
    }

    // Step 7: Process audio
    const audioResult = buildAudioFilters(musicIndex, videoFiles.length, clipDurations, backgroundMusic);
    let audioStream = null;

    if (audioResult.filters.length > 0) {
      console.log('🎵 Processing audio with mixing and effects');
      filterComplex.push(...audioResult.filters);
      audioStream = audioResult.outputStream;
    }

    // Final output formatting
    filterComplex.push(`${currentVideoStream}format=yuv420p[outv]`);

    // Build complete filter complex
    const filterComplexStr = filterComplex.join(';');

    // Build FFmpeg command
    const ffmpegArgs = buildFFmpegArgs(
      inputs,
      filterComplexStr,
      outputPath,
      '[outv]',
      audioStream,
      { preset, crf, bitrate, fps }
    );

    console.log('🚀 Starting FFmpeg processing...');

    // Execute FFmpeg
    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    let lastProgress = 0;

    ffmpegProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();

      // Parse and report progress
      const progressMatch = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (progressMatch) {
        const hours = parseInt(progressMatch[1]);
        const minutes = parseInt(progressMatch[2]);
        const seconds = parseFloat(progressMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;
        const progress = Math.min(100, Math.round((currentTime / totalDuration) * 100));

        if (progress > lastProgress) {
          console.log(`⏳ Progress: ${progress}%`);
          lastProgress = progress;

          // Could emit progress to client via WebSocket or SSE
          if (options.onProgress) {
            options.onProgress(progress);
          }
        }
      }
    });

    return new Promise((resolve, reject) => {
      ffmpegProcess.on('error', (err) => {
        console.error('❌ FFmpeg error:', err);
        cleanup(uploadedFiles);
        reject(err);
      });

      ffmpegProcess.on('close', (code) => {
        cleanup(uploadedFiles);

        if (code !== 0) {
          console.error('❌ FFmpeg exited with code', code);
          console.error('Last stderr:', stderr.slice(-2000));
          reject(new Error(`FFmpeg exited with code ${code}`));
        } else {
          console.log('✅ Video exported successfully:', outputPath);
          resolve({
            url: `/downloads/ranking_${outputId}.mp4`,
            path: outputPath,
            duration: totalDuration
          });
        }
      });
    });

  } catch (error) {
    console.error('❌ Ranking processor error:', error);
    cleanup(uploadedFiles);
    throw error;
  }
}

/**
 * Cleanup uploaded files
 */
function cleanup(files) {
  files.forEach(file => {
    try {
      unlinkSync(file);
    } catch (e) {
      // Ignore cleanup errors
    }
  });
}