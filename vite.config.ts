import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import multer from 'multer';

const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_SOUNDHELIX_TARGET = 'https://www.soundhelix.com/examples/mp3/';
const ENV_PREFIX = '';

const getFontPath = (weight: string = 'normal'): string => {
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', ENV_PREFIX);
  const resolvedPort = Number(env.VITE_DEV_SERVER_PORT ?? DEFAULT_PORT);
  const validPort = Number.isFinite(resolvedPort) && resolvedPort > 0 ? resolvedPort : DEFAULT_PORT;
  const resolvedHost = env.VITE_DEV_SERVER_HOST ?? DEFAULT_HOST;
  const soundhelixTarget = env.VITE_SOUNDHELIX_TARGET ?? DEFAULT_SOUNDHELIX_TARGET;
  const currentDir = dirname(fileURLToPath(import.meta.url));

  const enableCoopHeaders = true;

  const downloadsDir = resolve(currentDir, './downloads');

  // Ensure downloads directory exists for dev server
  if (!existsSync(downloadsDir)) {
    mkdirSync(downloadsDir, { recursive: true });
  }

  return {
    plugins: [
      react(),
      {
        name: 'dev-download-video-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/download-video', (req, res, next) => {
            if (req.method !== 'POST') {
              return next();
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk.toString();

              // Simple guard against extremely large bodies – this endpoint only needs a URL
              if (body.length > 10 * 1024) {
                res.statusCode = 413;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Request body too large' }));
                req.destroy();
              }
            });

            req.on('end', () => {
              try {
                const parsed = body ? JSON.parse(body) : {};
                const url: unknown = (parsed as any).url;

                if (typeof url !== 'string' || !url.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing or invalid URL' }));
                  return;
                }

                const allowedHosts = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];
                const lowerUrl = url.toLowerCase();
                const isAllowed = allowedHosts.some((host) => lowerUrl.includes(host));

                if (!isAllowed) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Unsupported video host' }));
                  return;
                }

                const safeId = Buffer.from(`${Date.now()}-${Math.random()}`)
                  .toString('base64')
                  .replace(/[^a-z0-9]/gi, '')
                  .slice(0, 16);
                const outputTemplate = join(downloadsDir, `${safeId}.%(ext)s`);

                const ytDlpArgs = [
                  '-f',
                  'bv*+ba/b',
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
                  console.error('yt-dlp spawn error (dev):', err);
                  const error: any = err;
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  if (error && error.code === 'ENOENT') {
                    res.end(
                      JSON.stringify({
                        error: 'yt-dlp is not installed or not found in PATH on this machine.',
                      }),
                    );
                  } else {
                    res.end(JSON.stringify({ error: 'Failed to start video download' }));
                  }
                });

                child.on('close', (code) => {
                  if (code !== 0) {
                    console.error('yt-dlp exited with code (dev)', code, stderr);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Video download failed' }));
                    return;
                  }

                  // Find the generated MP4 file (yt-dlp may choose the exact extension)
                  let finalFileName: string | null = null;
                  try {
                    const files = readdirSync(downloadsDir);
                    const prefix = `${safeId}.`;
                    const candidates = files.filter(
                      (name) => name.startsWith(prefix) && name.toLowerCase().endsWith('.mp4'),
                    );
                    if (candidates.length > 0) {
                      finalFileName = candidates[0];
                    }
                  } catch (e) {
                    console.error('Error reading downloads directory (dev):', e);
                  }

                  if (!finalFileName) {
                    console.error('yt-dlp finished but MP4 file not found for id (dev):', safeId);
                    console.error('yt-dlp stderr output:', stderr || '(no stderr output)');
                    try {
                      const files = readdirSync(downloadsDir);
                      console.error('Files in downloads directory:', files.filter(f => f.includes(safeId)));
                    } catch (e) {
                      console.error('Could not list downloads directory');
                    }
                    console.error('💡 HINT: This usually means FFmpeg is not in PATH. yt-dlp needs FFmpeg to merge video+audio streams.');
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: 'Video file not created. Make sure FFmpeg is installed and in your PATH. See WINDOWS_SETUP.md for details.'
                    }));
                    return;
                  }

                  const fileUrl = `/downloads/${finalFileName}`;
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ url: fileUrl }));
                });
              } catch (error) {
                console.error('Download endpoint error (dev):', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Unexpected server error' }));
              }
            });
          });
        },
      },
      {
        name: 'dev-ranking-export-endpoint',
        configureServer(server) {
          const uploadsDir = resolve(currentDir, './uploads');
          if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
          }

          const upload = multer({
            dest: uploadsDir,
            limits: { fileSize: 100 * 1024 * 1024 }
          });

          server.middlewares.use('/api/export-ranking-video', (req, res, next) => {
            if (req.method !== 'POST') {
              return next();
            }

            // Use multer to handle multipart/form-data
            const uploadHandler = upload.array('videos', 10);
            uploadHandler(req as any, res as any, async (err: any) => {
              if (err) {
                console.error('Multer error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'File upload failed' }));
                return;
              }

              try {
                const files = (req as any).files;
                const config = JSON.parse((req as any).body.config);
                const uploadedFiles: string[] = [];

                console.log('📦 Received ranking video export request');
                console.log(`📹 Processing ${files.length} videos`);

                if (!files || files.length === 0) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'No video files uploaded' }));
                  return;
                }

                const { clipDurations, trimStarts, title, titlePosition, titleStyle, background, videoHeight, fps, quality, rankingGraphic, overlays } = config;

                console.log(`📹 Processing ${files.length} videos with quality: ${quality || '1080p'}`);

                const outputId = Buffer.from(`${Date.now()}-${Math.random()}`)
                  .toString('base64')
                  .replace(/[^a-z0-9]/gi, '')
                  .slice(0, 16);
                const outputPath = join(downloadsDir, `ranking_${outputId}.mp4`);

                let outputWidth: number, outputHeight: number;
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
                const inputs: string[] = [];

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

                  const RANKING_COLORS: Record<string, string> = {
                    number: '3b82f6',
                    badge: '8b5cf6',
                    medal: 'f59e0b',
                    trophy: '10b981',
                    custom: 'ec4899'
                  };

                  const color = RANKING_COLORS[rankingGraphic.style] || '3b82f6';
                  const size = Math.round(rankingGraphic.size * scaleFactor);
                  const padding = Math.round(size * 0.2);

                  let x: number, y: number;
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

                let crf: string, preset: string, bitrate: string;
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

                const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

                let stderr = '';
                ffmpegProcess.stderr.on('data', (chunk) => {
                  stderr += chunk.toString();
                });

                ffmpegProcess.on('error', (err) => {
                  console.error('❌ FFmpeg spawn error:', err);
                  uploadedFiles.forEach(f => {
                    try { unlinkSync(f); } catch (e) {}
                  });
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'FFmpeg processing failed to start' }));
                });

                ffmpegProcess.on('close', (code) => {
                  uploadedFiles.forEach(f => {
                    try { unlinkSync(f); } catch (e) {}
                  });

                  if (code !== 0) {
                    console.error('❌ FFmpeg exited with code', code);
                    console.error('FFmpeg stderr:', stderr);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Video processing failed', details: stderr }));
                    return;
                  }

                  console.log('✅ Video exported successfully:', outputPath);

                  const fileUrl = `/downloads/ranking_${outputId}.mp4`;
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ url: fileUrl }));
                });

              } catch (error) {
                console.error('❌ Export endpoint error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Unexpected server error', message: (error as Error).message }));
              }
            });
          });
        },
      },
      {
        name: 'dev-split-screen-export-endpoint',
        configureServer(server) {
          const uploadsDir = resolve(currentDir, './uploads');
          const upload = multer({
            dest: uploadsDir,
            limits: { fileSize: 100 * 1024 * 1024 }
          });

          server.middlewares.use('/api/export-split-screen-video', (req, res, next) => {
            if (req.method !== 'POST') return next();

            const uploadHandler = upload.fields([{ name: 'mainVideo', maxCount: 1 }, { name: 'backgroundVideo', maxCount: 1 }]);
            uploadHandler(req as any, res as any, async (err: any) => {
              if (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Upload error', message: err.message }));
                return;
              }

              const uploadedFiles: string[] = [];

              try {
                console.log('📦 Received split-screen video export request');

                const config = (req as any).body.config;
                if (!config) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing config parameter' }));
                  return;
                }

                const parsedConfig = JSON.parse(config);
                const {
                  splitVariant,
                  splitRatio,
                  subtitles,
                  mainVolume,
                  backgroundVolume,
                  durationSeconds,
                  fps
                } = parsedConfig;

                console.log('🔍 BACKEND RECEIVED CONFIG:');
                console.log('Full config:', JSON.stringify(parsedConfig, null, 2));
                if (subtitles?.enabled) {
                  console.log('📝 Subtitle Configuration:');
                  console.log('  - Enabled:', subtitles.enabled);
                  console.log('  - Position:', subtitles.position);
                  console.log('  - Custom Position:', subtitles.customPosition);
                  console.log('  - Size:', subtitles.size);
                  console.log('  - Template:', JSON.stringify(subtitles.template, null, 2));
                }

                const mainVideoFile = (req as any).files?.mainVideo?.[0];
                const backgroundVideoFile = (req as any).files?.backgroundVideo?.[0];

                if (!mainVideoFile || !backgroundVideoFile) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Both main and background videos are required' }));
                  return;
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

                  const resolveColor = (color: string): string | null => {
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

                console.log('🔧 FFmpeg Video Filter:');
                console.log(videoFilter);

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

                const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });

                let stderr = '';
                ffmpegProcess.stderr.on('data', (chunk) => {
                  stderr += chunk.toString();
                });

                ffmpegProcess.on('error', (err) => {
                  console.error('❌ FFmpeg spawn error:', err);
                  uploadedFiles.forEach(f => {
                    try { unlinkSync(f); } catch (e) {}
                  });
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'FFmpeg processing failed to start' }));
                });

                ffmpegProcess.on('close', (code) => {
                  uploadedFiles.forEach(f => {
                    try { unlinkSync(f); } catch (e) {}
                  });

                  if (code !== 0) {
                    console.error('❌ FFmpeg exited with code', code);
                    console.error('FFmpeg stderr:', stderr);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: 'Video processing failed', details: stderr }));
                    return;
                  }

                  console.log('✅ Video exported successfully:', outputPath);

                  const fileUrl = `/downloads/splitscreen_${outputId}.mp4`;
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ url: fileUrl }));
                });

              } catch (error) {
                console.error('❌ Export endpoint error:', error);
                uploadedFiles.forEach(f => {
                  try { unlinkSync(f); } catch (e) {}
                });
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Unexpected server error', message: (error as Error).message }));
              }
            });
          });
        },
      },
    ],
    server: {
      port: validPort,
      host: resolvedHost,
      headers: enableCoopHeaders ? {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      } : {},
      proxy: {
        '/media/soundhelix/': {
          target: soundhelixTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/media\/soundhelix\//, ''),
        },
      },
      fs: {
        // Allow serving files from the project root (default) and downloads directory in dev
        allow: [currentDir, downloadsDir],
      },
    },
    resolve: {
      alias: {
        '@': resolve(currentDir, './src'),
      },
    },
  };
});
