import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import multer from 'multer';
import { processRankingVideo } from './server/ffmpeg/rankingProcessor.js';
import { processSplitScreenVideo } from './server/ffmpeg/splitScreenProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enhanced font path helper with bold/italic support
const getFontPath = (family = 'Arial', bold = false, italic = false) => {
  const os = platform();

  // Map font family to actual font files
  const fontMap = {
    'Arial': {
      regular: os === 'win32' ? 'C:/Windows/Fonts/arial.ttf' :
               os === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
               '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
      bold: os === 'win32' ? 'C:/Windows/Fonts/arialbd.ttf' :
            os === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
      italic: os === 'win32' ? 'C:/Windows/Fonts/ariali.ttf' :
              os === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
              '/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf',
      boldItalic: os === 'win32' ? 'C:/Windows/Fonts/arialbi.ttf' :
                  os === 'darwin' ? '/System/Library/Fonts/Helvetica.ttc' :
                  '/usr/share/fonts/truetype/liberation/LiberationSans-BoldItalic.ttf'
    },
    'Inter': {
      regular: os === 'win32' ? 'C:/Windows/Fonts/Inter-Regular.ttf' :
               os === 'darwin' ? '/System/Library/Fonts/Supplemental/Inter-Regular.otf' :
               '/usr/share/fonts/truetype/inter/Inter-Regular.ttf',
      bold: os === 'win32' ? 'C:/Windows/Fonts/Inter-Bold.ttf' :
            os === 'darwin' ? '/System/Library/Fonts/Supplemental/Inter-Bold.otf' :
            '/usr/share/fonts/truetype/inter/Inter-Bold.ttf'
    },
    'Oswald': {
      regular: os === 'win32' ? 'C:/Windows/Fonts/Oswald-Regular.ttf' :
               os === 'darwin' ? '/System/Library/Fonts/Supplemental/Oswald-Regular.ttf' :
               '/usr/share/fonts/truetype/oswald/Oswald-Regular.ttf',
      bold: os === 'win32' ? 'C:/Windows/Fonts/Oswald-Bold.ttf' :
            os === 'darwin' ? '/System/Library/Fonts/Supplemental/Oswald-Bold.ttf' :
            '/usr/share/fonts/truetype/oswald/Oswald-Bold.ttf'
    }
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
};

// Helper to escape FFmpeg text strings
const escapeFFmpegText = (text) => {
  if (!text) return '';
  // FFmpeg uses : as separator, need to escape it
  return text.replace(/'/g, "\\'")
             .replace(/:/g, "\\:")
             .replace(/\[/g, "\\[")
             .replace(/\]/g, "\\]")
             .replace(/,/g, "\\,")
             .replace(/;/g, "\\;");
};

// Convert hex color to FFmpeg format with proper alpha support
const hexToFFmpegColor = (hex, alpha = 1) => {
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
};

// Calculate accurate positions matching frontend preview
const calculateTitlePosition = (titlePosition, titleStyle, outputWidth, outputHeight) => {
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
};

// Calculate ranking graphic position matching frontend constraints
const calculateRankingPosition = (position, size, outputWidth, outputHeight) => {
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
};

// Build transition filters for xfade
const buildTransitionFilter = (transitionSettings, videoCount, clipDurations) => {
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
};

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

const downloadsDir = join(__dirname, 'downloads');
if (!existsSync(downloadsDir)) {
  mkdirSync(downloadsDir, { recursive: true });
}

const uploadsDir = join(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 100 * 1024 * 1024 }
});

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Serve downloaded videos
app.use('/downloads', express.static(downloadsDir));

// Minimal API endpoint to download/convert a remote video to MP4 using yt-dlp
app.post('/api/download-video', async (req, res) => {
  try {
    const { url } = req.body || {};

    if (typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Missing or invalid URL' });
    }

    // Basic safety: only allow common social platforms we expect
    const allowedHosts = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];
    const lowerUrl = url.toLowerCase();
    const isAllowed = allowedHosts.some((host) => lowerUrl.includes(host));

    if (!isAllowed) {
      return res.status(400).json({ error: 'Unsupported video host' });
    }

    const safeId = Buffer.from(`${Date.now()}-${Math.random()}`)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 16);
    const outputTemplate = join(downloadsDir, `${safeId}.%(ext)s`);

    // Use yt-dlp to download highest quality video+audio and convert/merge to MP4.
    // Assumes yt-dlp is available on PATH.
    const ytDlpArgs = [
      '-f',
      'bv*+ba/b', // best video + best audio, fallback to best
      '--merge-output-format',
      'mp4',
      '-o',
      outputTemplate,
      url,
    ];

    const child = spawn('yt-dlp', ytDlpArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      console.error('yt-dlp spawn error:', err);
      const error = /** @type {any} */ (err);
      if (error && error.code === 'ENOENT') {
        return res
          .status(500)
          .json({ error: 'yt-dlp is not installed or not found in PATH on the server.' });
      }
      return res.status(500).json({ error: 'Failed to start video download' });
    });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp exited with code', code, stderr);
        return res.status(500).json({ error: 'Video download failed' });
      }

      // Find the generated MP4 file (yt-dlp may choose the exact extension)
      let finalFileName = null;
      try {
        const files = readdirSync(downloadsDir);
        const prefix = `${safeId}.`;
        const candidates = files.filter((name) => name.startsWith(prefix) && name.toLowerCase().endsWith('.mp4'));
        if (candidates.length > 0) {
          finalFileName = candidates[0];
        }
      } catch (e) {
        console.error('Error reading downloads directory:', e);
      }

      if (!finalFileName) {
        console.error('yt-dlp finished but MP4 file not found for id:', safeId);
        console.error('yt-dlp stderr output:', stderr || '(no stderr output)');
        try {
          const files = readdirSync(downloadsDir);
          console.error('Files in downloads directory:', files.filter(f => f.includes(safeId)));
        } catch (e) {
          console.error('Could not list downloads directory');
        }
        console.error('💡 HINT: This usually means FFmpeg is not in PATH. yt-dlp needs FFmpeg to merge video+audio streams.');
        return res.status(500).json({
          error: 'Video file not created. Make sure FFmpeg is installed and in your PATH. See WINDOWS_SETUP.md for details.'
        });
      }

      // Return a local URL that the frontend can fetch
      const fileUrl = `/downloads/${finalFileName}`;
      return res.status(200).json({ url: fileUrl });
    });
  } catch (error) {
    console.error('Download endpoint error:', error);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
});

// Enhanced modular ranking video export
app.post('/api/export-ranking-video', upload.fields([
  { name: 'videos', maxCount: 10 },
  { name: 'backgroundMusic', maxCount: 1 }
]), async (req, res) => {
  try {
    const result = await processRankingVideo(req, res, { downloadsDir });

    // If processRankingVideo didn't send response, send it now
    if (!res.headersSent) {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Video export failed',
        message: error.message
      });
    }
  }
});

// Keep the old implementation as backup (remove after testing)
app.post('/api/export-ranking-video-old', upload.fields([
  { name: 'videos', maxCount: 10 },
  { name: 'backgroundMusic', maxCount: 1 }
]), async (req, res) => {
  const uploadedFiles = [];

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

    const files = req.files?.videos || [];
    const musicFile = req.files?.backgroundMusic?.[0];

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
    const outputPath = join(downloadsDir, `ranking_${outputId}.mp4`);

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

      audioFilters[audioFilters.length - 1] += ',aloop=loop=-1:size=2e+09[music]';

      // For now, just use music as the audio track
      // TODO: Mix with video audio if needed
      audioStream = '[music]';

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
        try { unlinkSync(f); } catch (e) {}
      });

      return res.status(500).json({
        error: 'FFmpeg processing failed to start',
        details: err.message
      });
    });

    ffmpegProcess.on('close', (code) => {
      // Cleanup uploaded files
      uploadedFiles.forEach(f => {
        try { unlinkSync(f); } catch (e) {}
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
        url: fileUrl
      });
    });

  } catch (error) {
    console.error('❌ Export endpoint error:', error);

    // Cleanup on error
    uploadedFiles.forEach(f => {
      try { unlinkSync(f); } catch (e) {}
    });

    return res.status(500).json({
      error: 'Unexpected server error',
      message: error.message
    });
  }
});

// Enhanced modular split screen video export
app.post('/api/export-split-screen-video', upload.fields([{ name: 'mainVideo', maxCount: 1 }, { name: 'backgroundVideo', maxCount: 1 }]), async (req, res) => {
  try {
    const result = await processSplitScreenVideo(req, res, { downloadsDir });

    // If processSplitScreenVideo didn't send response, send it now
    if (!res.headersSent) {
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('Split screen export error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Split screen video export failed',
        message: error.message
      });
    }
  }
});

// Keep the old implementation as backup (remove after testing)
app.post('/api/export-split-screen-video-old', upload.fields([{ name: 'mainVideo', maxCount: 1 }, { name: 'backgroundVideo', maxCount: 1 }]), async (req, res) => {
  const uploadedFiles = [];

  try {
    console.log('📦 Received split-screen video export request');

    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Missing config parameter' });
    }

    const parsedConfig = JSON.parse(config);
    console.log('📋 Received config on server:', JSON.stringify(parsedConfig, null, 2));

    const {
      splitVariant,
      splitRatio,
      subtitles,
      mainVolume,
      backgroundVolume,
      durationSeconds,
      fps
    } = parsedConfig;

    if (subtitles) {
      console.log('📝 Subtitle config:', JSON.stringify(subtitles, null, 2));
    }

    const mainVideoFile = req.files?.mainVideo?.[0];
    const backgroundVideoFile = req.files?.backgroundVideo?.[0];

    if (!mainVideoFile || !backgroundVideoFile) {
      return res.status(400).json({ error: 'Both main and background videos are required' });
    }

    uploadedFiles.push(mainVideoFile.path, backgroundVideoFile.path);

    console.log('📹 Processing split-screen video');

    const outputId = Buffer.from(`${Date.now()}-${Math.random()}`)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 16);
    const outputPath = join(downloadsDir, `splitscreen_${outputId}.mp4`);

    const outputWidth = 1080;
    const outputHeight = 1920;
    console.log('📐 Using fixed portrait dimensions:', outputWidth, 'x', outputHeight);

    const ratio = Math.max(0.1, Math.min(0.9, splitRatio));

    let videoFilter = '';

    if (splitVariant === 'vertical') {
      const splitX = Math.round(outputWidth * ratio);
      videoFilter = `[0:v]scale=${splitX}:${outputHeight}:force_original_aspect_ratio=increase:flags=lanczos,crop=${splitX}:${outputHeight},unsharp=5:5:1.0:5:5:0.0[main_scaled];[1:v]scale=${outputWidth - splitX}:${outputHeight}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outputWidth - splitX}:${outputHeight},unsharp=5:5:1.0:5:5:0.0[bg_scaled];[main_scaled][bg_scaled]hstack=inputs=2[v]`;
    } else {
      const splitY = Math.round(outputHeight * ratio);
      videoFilter = `[0:v]scale=${outputWidth}:${splitY}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outputWidth}:${splitY},unsharp=5:5:1.0:5:5:0.0[main_scaled];[1:v]scale=${outputWidth}:${outputHeight - splitY}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outputWidth}:${outputHeight - splitY},unsharp=5:5:1.0:5:5:0.0[bg_scaled];[main_scaled][bg_scaled]vstack=inputs=2[v]`;
    }

    if (subtitles?.enabled && subtitles.scriptText?.trim()) {
      const scriptText = subtitles.scriptText.trim();
      const words = scriptText.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
      const TARGET_WORDS_PER_SECOND = 1.2;
      const maxWords = 3;

      console.log('📍 Subtitle position received:', subtitles.position);
      console.log('📍 Subtitle custom position:', subtitles.customPosition);
      console.log('📝 Subtitle template:', subtitles.template);

      const resolveColor = (color) => {
        if (!color || color === 'transparent') return null;
        if (color.startsWith('var(--color-text-primary)')) return 'white';
        if (color.startsWith('var(--color-background-primary)')) return 'white';
        if (color.startsWith('var(--color-brand-primary)')) return '0x3B82F6';
        if (color.startsWith('var(--color-brand-accent)')) return '0xF97316';
        if (color.startsWith('var(--color-brand-secondary)')) return '0x8B5CF6';
        if (color.includes('color-mix')) return '0x000000@0.7';
        if (color.startsWith('#')) return '0x' + color.slice(1);
        return color;
      };

      const textColor = resolveColor(subtitles.template.color) || 'white';
      const bgColor = resolveColor(subtitles.template.bgColor);
      const strokeColor = resolveColor(subtitles.template.strokeColor);
      const strokeWidth = subtitles.template.strokeWidth || 0;
      const fontSize = Math.round(subtitles.size * 2.3);

      console.log('📏 Font size calculation:');
      console.log('  - Input size:', subtitles.size);
      console.log('  - Calculated fontSize:', fontSize);
      console.log('  - Font family:', subtitles.template.fontFamily);
      console.log('  - Font weight:', subtitles.template.weight);
      console.log('  - Text color:', textColor);
      console.log('  - BG color:', bgColor);
      console.log('  - Stroke:', strokeWidth, strokeColor);
      console.log('  - Transform:', subtitles.template.transform);

      let x = outputWidth / 2;
      let y = outputHeight / 2;

      if (subtitles.position === 'top') {
        y = fontSize + 40;
      } else if (subtitles.position === 'bottom') {
        y = outputHeight - fontSize - 100;
      } else if (subtitles.position === 'center') {
        y = outputHeight / 2;
      } else if (subtitles.position === 'custom' && subtitles.customPosition) {
        x = Math.round((subtitles.customPosition.x / 100) * outputWidth);
        y = Math.round((subtitles.customPosition.y / 100) * outputHeight);
      }

      const totalDuration = durationSeconds;
      let drawtextFilter = '';

      for (let time = 0; time < totalDuration; time += 0.5) {
        const wordIndex = Math.floor(time * TARGET_WORDS_PER_SECOND);
        if (wordIndex < words.length) {
          const start = wordIndex;
          const end = Math.min(words.length, start + maxWords);
          const subtitleWords = words.slice(start, end);

          if (subtitleWords.length > 0) {
            let text = subtitleWords.join(' ');
            if (subtitles.template?.transform === 'uppercase') {
              text = text.toUpperCase();
            }
            text = text.replace(/'/g, "'\\\\\\''");

            const startTime = time;
            const endTime = Math.min(time + 0.5, totalDuration);

            // Map font family and weight to actual font file
            const fontFile = getFontPath(subtitles.template.weight);

            let drawtextOptions = [
              `text='${text}'`,
              `fontfile=${fontFile}`,
              `fontsize=${fontSize}`,
              `fontcolor=${textColor}`,
              `x=(w-text_w)/2`,
              `y=${y}`,
              `enable='between(t,${startTime},${endTime})'`
            ];

            if (bgColor) {
              drawtextOptions.push(`box=1`);
              drawtextOptions.push(`boxcolor=${bgColor}`);
              drawtextOptions.push(`boxborderw=10`);
            }

            if (strokeWidth > 0 && strokeColor) {
              drawtextOptions.push(`borderw=${strokeWidth}`);
              drawtextOptions.push(`bordercolor=${strokeColor}`);
            }

            drawtextFilter += `drawtext=${drawtextOptions.join(':')},`;
          }
        }
      }

      if (drawtextFilter) {
        drawtextFilter = drawtextFilter.slice(0, -1);
        videoFilter = `${videoFilter};[v]${drawtextFilter}[vout]`;
      } else {
        videoFilter += `[vout]`;
      }
    } else {
      videoFilter += `[vout]`;
    }

    console.log('🎬 Starting FFmpeg processing...');

    const ffmpegArgs = [
      '-i', mainVideoFile.path,
      '-i', backgroundVideoFile.path,
      '-filter_complex', videoFilter,
      '-map', '[vout]'
    ];

    if (backgroundVolume > 0) {
      ffmpegArgs.push(
        '-filter_complex:a', `[0:a?]volume=${mainVolume}[a0];[1:a?]volume=${backgroundVolume}[a1];[a0][a1]amix=inputs=2:duration=longest[aout]`,
        '-map', '[aout]'
      );
    } else {
      ffmpegArgs.push(
        '-map', '0:a?'
      );
      if (mainVolume !== 1) {
        ffmpegArgs.push('-af', `volume=${mainVolume}`);
      }
    }

    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'slow',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-s', `${outputWidth}x${outputHeight}`,
      '-r', fps.toString(),
      '-t', durationSeconds.toString(),
      '-c:a', 'aac',
      '-b:a', '256k',
      '-movflags', '+faststart',
      '-y',
      outputPath
    );

    console.log('📝 FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';
    ffmpegProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const progressMatch = stderr.match(/time=(\d+):(\d+):(\d+\.\d+)/);
      if (progressMatch) {
        console.log(`⏳ Progress: ${progressMatch[0]}`);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('❌ FFmpeg spawn error:', err);
      uploadedFiles.forEach(f => {
        try { unlinkSync(f); } catch (e) {}
      });
      return res.status(500).json({ error: 'FFmpeg processing failed to start' });
    });

    ffmpegProcess.on('close', (code) => {
      uploadedFiles.forEach(f => {
        try { unlinkSync(f); } catch (e) {}
      });

      if (code !== 0) {
        console.error('❌ FFmpeg exited with code', code);
        console.error('FFmpeg stderr:', stderr);
        return res.status(500).json({ error: 'Video processing failed', details: stderr });
      }

      console.log('✅ Video exported successfully:', outputPath);

      const fileUrl = `/downloads/splitscreen_${outputId}.mp4`;
      return res.status(200).json({ url: fileUrl });
    });

  } catch (error) {
    console.error('❌ Export endpoint error:', error);
    uploadedFiles.forEach(f => {
      try { unlinkSync(f); } catch (e) {}
    });
    return res.status(500).json({ error: 'Unexpected server error', message: error.message });
  }
});

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0');

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;
