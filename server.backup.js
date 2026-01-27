import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFontPath = (weight = 'normal') => {
  const os = platform();

  // FFmpeg accepts forward slashes on all platforms including Windows
  if (os === 'win32') {
    if (weight === 'black') return 'C:/Windows/Fonts/arialbd.ttf';
    if (weight === 'bold') return 'C:/Windows/Fonts/arialbd.ttf';
    return 'C:/Windows/Fonts/arial.ttf';
  } else if (os === 'darwin') {
    if (weight === 'black') return '/System/Library/Fonts/Supplemental/Arial Black.ttf';
    if (weight === 'bold') return '/System/Library/Fonts/Supplemental/Arial Bold.ttf';
    return '/System/Library/Fonts/Supplemental/Arial.ttf';
  } else {
    if (weight === 'black') return '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
    if (weight === 'bold') return '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf';
    return '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf';
  }
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

app.post('/api/export-ranking-video', upload.array('videos', 10), async (req, res) => {
  const uploadedFiles = [];

  try {
    console.log('📦 Received ranking video export request');

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
      fps,
      quality,
      transitionSettings,
      backgroundMusic,
      rankingGraphic,
      overlays
    } = parsedConfig;

    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No video files uploaded' });
    }

    console.log(`📹 Processing ${files.length} videos with quality: ${quality || '1080p'}`);

    const outputId = Buffer.from(`${Date.now()}-${Math.random()}`)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 16);
    const outputPath = join(downloadsDir, `ranking_${outputId}.mp4`);

    let outputWidth, outputHeight;
    if (quality === '720p') {
      outputWidth = 720;
      outputHeight = 1280;
    } else if (quality === '4k') {
      outputWidth = 2160;
      outputHeight = 3840;
    } else {
      outputWidth = 1080;
      outputHeight = 1920;
    }

    console.log(`📐 Export dimensions: ${outputWidth}x${outputHeight}`);
    const videoAreaHeight = Math.round((videoHeight / 100) * outputHeight);
    const videoAreaY = outputHeight - videoAreaHeight;

    let filterComplex = '';
    const inputs = [];

    for (let i = 0; i < files.length; i++) {
      const trimStart = trimStarts[i] || 0;
      const duration = clipDurations[i] || 5;

      inputs.push('-i', files[i].path);
      uploadedFiles.push(files[i].path);

      filterComplex += `[${i}:v]trim=start=${trimStart}:duration=${duration},setpts=PTS-STARTPTS,`;
      filterComplex += `scale=${outputWidth}:${videoAreaHeight}:force_original_aspect_ratio=decrease:flags=lanczos,`;
      filterComplex += `pad=${outputWidth}:${videoAreaHeight}:(ow-iw)/2:(oh-ih)/2:${background}[v${i}scaled];`;
      filterComplex += `color=c=${background}:s=${outputWidth}x${outputHeight}:d=${duration}[bg${i}];`;
      filterComplex += `[bg${i}][v${i}scaled]overlay=0:${videoAreaY}[v${i}];`;
    }

    for (let i = 0; i < files.length; i++) {
      filterComplex += `[v${i}]`;
    }
    filterComplex += `concat=n=${files.length}:v=1:a=0[outv];`;

    const baseResolution = 1080;
    const scaleFactor = outputWidth / baseResolution;
    let currentStream = '[outv]';
    let streamCounter = 0;

    if (title && titleStyle) {
      const x = Math.round((titlePosition.x / 100) * outputWidth);
      const y = Math.round((titlePosition.y / 100) * outputHeight);
      const fontSize = Math.round((titleStyle.fontSize || 24) * scaleFactor);
      const color = titleStyle.color.replace('#', '0x');
      const strokeColor = titleStyle.strokeColor.replace('#', '0x');
      const strokeWidth = Math.round((titleStyle.strokeWidth || 2) * scaleFactor);

      console.log(`📝 Scaled text: fontSize=${fontSize}, strokeWidth=${strokeWidth}, scaleFactor=${scaleFactor.toFixed(2)}`);

      filterComplex += `${currentStream}drawtext=text='${title.replace(/'/g, "\\'")}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${color}:borderw=${strokeWidth}:bordercolor=${strokeColor}:font=${titleStyle.fontFamily || 'Arial'}[stream${streamCounter}];`;
      currentStream = `[stream${streamCounter}]`;
      streamCounter++;
    }

    if (rankingGraphic && rankingGraphic.style) {
      console.log('🎨 Rendering ranking graphics:', rankingGraphic);

      const RANKING_COLORS = {
        number: '3b82f6',
        badge: '8b5cf6',
        medal: 'f59e0b',
        trophy: '10b981',
        custom: 'ec4899'
      };

      const color = RANKING_COLORS[rankingGraphic.style] || '3b82f6';
      const size = Math.round(rankingGraphic.size * scaleFactor);
      const padding = Math.round(size * 0.2);

      let x, y;
      switch (rankingGraphic.position) {
        case 'top-left':
          x = padding;
          y = padding;
          break;
        case 'top-right':
          x = outputWidth - size - padding;
          y = padding;
          break;
        case 'bottom-left':
          x = padding;
          y = Math.round(outputHeight * 0.3) - size - padding;
          break;
        case 'bottom-right':
          x = outputWidth - size - padding;
          y = Math.round(outputHeight * 0.3) - size - padding;
          break;
        case 'center':
        default:
          x = Math.round((outputWidth - size) / 2);
          y = Math.round(outputHeight * 0.15);
          break;
      }

      let accumulatedTime = 0;
      const badgeFontSize = Math.round(size * 0.5);

      // Apply all badges as a single filter chain
      let badgeFilters = '';
      for (let i = 0; i < files.length; i++) {
        const clipDuration = clipDurations[i] || 5;
        const startTime = accumulatedTime;
        const endTime = accumulatedTime + clipDuration;
        const rank = i + 1;

        // Add comma separator if not first filter
        if (i > 0) badgeFilters += ',';

        // Draw box (badge background)
        // Use escaped quotes for Windows compatibility
        badgeFilters += `drawbox=x=${x}:y=${y}:w=${size}:h=${size}:color=0x${color}:t=fill:enable=\\'between(t\\,${startTime}\\,${endTime})\\'`;

        // Draw text (rank number) on top of box
        badgeFilters += `,drawtext=text=\\'${rank}\\':escape_text=false:fontfile=${getFontPath('bold')}:fontsize=${badgeFontSize}:fontcolor=white:x=${x}+(${size}-text_w)/2:y=${y}+(${size}-text_h)/2:enable=\\'between(t\\,${startTime}\\,${endTime})\\'`;

        accumulatedTime += clipDuration;
      }

      // Apply all badge filters as one chain
      filterComplex += `${currentStream}${badgeFilters}[stream${streamCounter}];`;
      currentStream = `[stream${streamCounter}]`;
      streamCounter++;
    }

    filterComplex += `${currentStream}copy[outvtext]`;

    console.log('🎬 Starting FFmpeg processing...');

    let crf, preset, bitrate;
    if (quality === '720p') {
      crf = '23';
      preset = 'fast';
      bitrate = '3M';
    } else if (quality === '4k') {
      crf = '15';
      preset = 'slow';
      bitrate = '20M';
    } else {
      crf = '18';
      preset = 'medium';
      bitrate = '8M';
    }

    const ffmpegArgs = [
      ...inputs,
      '-filter_complex', filterComplex,
      '-map', '[outvtext]',
      '-r', fps.toString(),
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', crf,
      '-b:v', bitrate,
      '-maxrate', bitrate,
      '-bufsize', `${parseInt(bitrate) * 2}M`,
      '-pix_fmt', 'yuv420p',
      '-y',
      outputPath
    ];

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

      const fileUrl = `/downloads/ranking_${outputId}.mp4`;
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

app.post('/api/export-split-screen-video', upload.fields([{ name: 'mainVideo', maxCount: 1 }, { name: 'backgroundVideo', maxCount: 1 }]), async (req, res) => {
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
