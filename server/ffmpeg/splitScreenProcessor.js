import { spawn } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';
import {
  getFontPath,
  escapeFFmpegText,
  hexToFFmpegColor,
  getQualitySettings,
  buildFFmpegArgs
} from './utils.js';

/**
 * Process split screen video with enhanced features
 */
export async function processSplitScreenVideo(req, res, options = {}) {
  const uploadedFiles = [];

  try {
    console.log('🎬 Enhanced Split Screen Processor Started');

    // Parse configuration
    const { config } = req.body;
    if (!config) {
      throw new Error('Missing config parameter');
    }

    const parsedConfig = JSON.parse(config);
    const {
      splitVariant = 'vertical',
      splitRatio = 0.5,
      subtitles,
      mainVolume = 1.0,
      backgroundVolume = 0.1,
      durationSeconds = 30,
      fps = 30,
      quality = '1080p',
      transitions,
      effects,
      overlays
    } = parsedConfig;

    // Get files from request
    const mainVideoFile = req.files?.mainVideo?.[0];
    const backgroundVideoFile = req.files?.backgroundVideo?.[0];

    if (!mainVideoFile || !backgroundVideoFile) {
      throw new Error('Both main and background videos are required');
    }

    uploadedFiles.push(mainVideoFile.path, backgroundVideoFile.path);
    console.log('📹 Processing split-screen with enhanced features');

    // Get quality settings
    const qualitySettings = getQualitySettings(quality);
    const { width: outputWidth, height: outputHeight, crf, preset, bitrate } = qualitySettings;

    // For split screen, we typically want portrait mode
    const finalWidth = outputWidth;
    const finalHeight = outputHeight;

    console.log(`📐 Output: ${finalWidth}x${finalHeight}`);

    // Prepare output
    const outputId = Buffer.from(`${Date.now()}-${Math.random()}`)
      .toString('base64')
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 16);
    const outputPath = join(options.downloadsDir || './downloads', `splitscreen_${outputId}.mp4`);

    // Build filter complex
    const filterComplex = [];

    // Step 1: Build split screen layout
    const splitFilter = buildSplitScreenFilter(
      splitVariant,
      splitRatio,
      finalWidth,
      finalHeight,
      transitions
    );
    filterComplex.push(...splitFilter.filters);
    let currentVideoStream = splitFilter.outputStream;

    // Step 2: Add effects if specified
    if (effects && effects.length > 0) {
      const effectFilters = buildEffectFilters(effects, finalWidth, finalHeight);
      if (effectFilters.length > 0) {
        filterComplex.push(`${currentVideoStream}${effectFilters.join(',')}[withEffects]`);
        currentVideoStream = '[withEffects]';
      }
    }

    // Step 3: Add subtitles with enhanced rendering
    if (subtitles?.enabled && subtitles.scriptText?.trim()) {
      const subtitleFilters = buildSubtitleFilters(
        subtitles,
        durationSeconds,
        finalWidth,
        finalHeight
      );
      if (subtitleFilters.length > 0) {
        filterComplex.push(`${currentVideoStream}${subtitleFilters.join(',')}[withSubtitles]`);
        currentVideoStream = '[withSubtitles]';
      }
    }

    // Step 4: Add overlays if specified
    if (overlays && overlays.length > 0) {
      const overlayFilters = buildSplitOverlayFilters(overlays, finalWidth, finalHeight);
      if (overlayFilters.length > 0) {
        filterComplex.push(`${currentVideoStream}${overlayFilters.join(',')}[withOverlays]`);
        currentVideoStream = '[withOverlays]';
      }
    }

    // Final formatting
    filterComplex.push(`${currentVideoStream}format=yuv420p[outv]`);

    // Step 5: Build audio filters
    const audioFilter = buildSplitAudioFilter(mainVolume, backgroundVolume);
    filterComplex.push(...audioFilter.filters);

    // Build complete filter complex
    const filterComplexStr = filterComplex.join(';');

    // Build FFmpeg command
    const inputs = [
      '-i', mainVideoFile.path,
      '-i', backgroundVideoFile.path
    ];

    const ffmpegArgs = buildFFmpegArgs(
      inputs,
      filterComplexStr,
      outputPath,
      '[outv]',
      audioFilter.outputStream,
      { preset, crf, bitrate, fps }
    );

    // Add duration limit
    const durationIndex = ffmpegArgs.indexOf('-y');
    ffmpegArgs.splice(durationIndex, 0, '-t', durationSeconds.toString());

    console.log('🚀 Starting FFmpeg processing...');

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
        const progress = Math.min(100, Math.round((currentTime / durationSeconds) * 100));

        if (progress > lastProgress) {
          console.log(`⏳ Progress: ${progress}%`);
          lastProgress = progress;

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
          console.log('✅ Split screen video exported successfully:', outputPath);
          resolve({
            url: `/downloads/splitscreen_${outputId}.mp4`,
            path: outputPath,
            duration: durationSeconds
          });
        }
      });
    });

  } catch (error) {
    console.error('❌ Split screen processor error:', error);
    cleanup(uploadedFiles);
    throw error;
  }
}

/**
 * Build split screen layout filter
 */
function buildSplitScreenFilter(variant, ratio, width, height, transitions) {
  const filters = [];
  const clampedRatio = Math.max(0.1, Math.min(0.9, ratio));

  if (variant === 'vertical') {
    // Vertical split (side by side)
    const splitX = Math.round(width * clampedRatio);
    const leftWidth = splitX;
    const rightWidth = width - splitX;

    // Scale and crop videos to fit their respective areas
    filters.push(
      `[0:v]scale=${leftWidth}:${height}:force_original_aspect_ratio=increase:flags=lanczos,` +
      `crop=${leftWidth}:${height},` +
      `setsar=1[main_scaled]`
    );

    filters.push(
      `[1:v]scale=${rightWidth}:${height}:force_original_aspect_ratio=increase:flags=lanczos,` +
      `crop=${rightWidth}:${height},` +
      `setsar=1[bg_scaled]`
    );

    // Apply transition if specified
    if (transitions?.enabled) {
      filters.push(
        `[main_scaled]fade=t=in:d=0.5[main_fade]`,
        `[bg_scaled]fade=t=in:d=0.5[bg_fade]`,
        `[main_fade][bg_fade]hstack=inputs=2[split]`
      );
    } else {
      filters.push(`[main_scaled][bg_scaled]hstack=inputs=2[split]`);
    }

  } else {
    // Horizontal split (top and bottom)
    const splitY = Math.round(height * clampedRatio);
    const topHeight = splitY;
    const bottomHeight = height - splitY;

    filters.push(
      `[0:v]scale=${width}:${topHeight}:force_original_aspect_ratio=increase:flags=lanczos,` +
      `crop=${width}:${topHeight},` +
      `setsar=1[main_scaled]`
    );

    filters.push(
      `[1:v]scale=${width}:${bottomHeight}:force_original_aspect_ratio=increase:flags=lanczos,` +
      `crop=${width}:${bottomHeight},` +
      `setsar=1[bg_scaled]`
    );

    // Apply transition if specified
    if (transitions?.enabled) {
      filters.push(
        `[main_scaled]fade=t=in:d=0.5[main_fade]`,
        `[bg_scaled]fade=t=in:d=0.5[bg_fade]`,
        `[main_fade][bg_fade]vstack=inputs=2[split]`
      );
    } else {
      filters.push(`[main_scaled][bg_scaled]vstack=inputs=2[split]`);
    }
  }

  // Add divider line if specified
  if (transitions?.divider) {
    const dividerColor = hexToFFmpegColor(transitions.dividerColor || '#FFFFFF');
    const dividerWidth = transitions.dividerWidth || 2;

    if (variant === 'vertical') {
      const dividerX = Math.round(width * clampedRatio) - dividerWidth / 2;
      filters.push(
        `[split]drawbox=x=${dividerX}:y=0:w=${dividerWidth}:h=${height}:` +
        `color=${dividerColor}:t=fill[split_with_divider]`
      );
      return { filters, outputStream: '[split_with_divider]' };
    } else {
      const dividerY = Math.round(height * clampedRatio) - dividerWidth / 2;
      filters.push(
        `[split]drawbox=x=0:y=${dividerY}:w=${width}:h=${dividerWidth}:` +
        `color=${dividerColor}:t=fill[split_with_divider]`
      );
      return { filters, outputStream: '[split_with_divider]' };
    }
  }

  return { filters, outputStream: '[split]' };
}

/**
 * Build subtitle filters with enhanced rendering
 */
function buildSubtitleFilters(subtitles, duration, width, height) {
  const filters = [];
  const scriptText = subtitles.scriptText.trim();
  const words = scriptText.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

  if (words.length === 0) return filters;

  const TARGET_WORDS_PER_SECOND = 1.5;
  const maxWordsPerSubtitle = 3;
  const wordDuration = 1 / TARGET_WORDS_PER_SECOND;

  // Parse template style
  const template = subtitles.template || {};

  // Calculate font size - match frontend's fontSize * 0.6 scaling
  const subtitleSize = subtitles.size || 48;
  const fontSize = Math.round(subtitleSize * 0.6 * (width / 1080));

  // Parse font properties
  const fontFamily = template.fontFamily || 'Arial';
  const isItalic = template.style === 'italic';
  const isBold = template.weight === 'bold' || template.weight === 'black';
  const fontPath = getFontPath(fontFamily, isBold, isItalic);

  // Calculate position - match frontend positioning exactly
  let xExpression, yPosition;

  if (subtitles.position === 'custom' && subtitles.customPosition) {
    // Custom position with centering (like frontend's translate(-50%, -50%))
    const xPercent = subtitles.customPosition.x / 100;
    const yPercent = subtitles.customPosition.y / 100;
    xExpression = `(${width * xPercent}-text_w/2)`;
    yPosition = Math.round(height * yPercent - fontSize/2);
  } else {
    // Standard positions with horizontal centering
    xExpression = '(w-text_w)/2';

    if (subtitles.position === 'top') {
      yPosition = Math.round(height * 0.1);
    } else if (subtitles.position === 'center' || subtitles.position === 'middle') {
      yPosition = Math.round(height * 0.5 - fontSize/2);
    } else {
      // Default to bottom
      yPosition = Math.round(height * 0.85);
    }
  }

  // Resolve colors
  const textColor = resolveSubtitleColor(template.color) || '#FFFFFF';
  const strokeColor = resolveSubtitleColor(template.strokeColor) || '#000000';
  const bgColor = resolveSubtitleColor(template.bgColor);

  const strokeWidth = template.strokeWidth || 2;

  // Build subtitle chunks
  let currentTime = 0;
  let i = 0;

  while (i < words.length && currentTime < duration) {
    const chunk = [];
    for (let j = 0; j < maxWordsPerSubtitle && i < words.length; j++) {
      chunk.push(words[i++]);
    }

    if (chunk.length > 0) {
      const text = escapeFFmpegText(chunk.join(' '));
      const startTime = currentTime;
      const endTime = Math.min(currentTime + chunk.length * wordDuration, duration);

      // Build drawtext filter for this chunk
      const drawtextOptions = [
        `text='${text}'`,
        `fontfile='${fontPath}'`,
        `fontsize=${fontSize}`,
        `fontcolor=${hexToFFmpegColor(textColor)}`,
        `x=${xExpression}`,
        `y=${yPosition}`,
        `enable='between(t,${startTime},${endTime})'`
      ];

      // Add text transform if specified
      if (template.transform === 'uppercase') {
        drawtextOptions[0] = `text='${text.toUpperCase()}'`;
      } else if (template.transform === 'lowercase') {
        drawtextOptions[0] = `text='${text.toLowerCase()}'`;
      }

      // Add background box if specified
      if (bgColor && bgColor !== 'transparent') {
        drawtextOptions.push(
          `box=1`,
          `boxcolor=${hexToFFmpegColor(bgColor, 0.8)}`,
          `boxborderw=15`
        );
      }

      // Add stroke if specified
      if (strokeWidth > 0 && strokeColor) {
        drawtextOptions.push(
          `borderw=${strokeWidth}`,
          `bordercolor=${hexToFFmpegColor(strokeColor)}`
        );
      }

      // Add animation if specified
      if (template.animation === 'fade') {
        // Add fade in/out effect
        const fadeIn = 0.2;
        const fadeOut = 0.2;
        drawtextOptions.push(
          `alpha='if(lt(t,${startTime + fadeIn}),(t-${startTime})/${fadeIn},` +
          `if(lt(t,${endTime - fadeOut}),1,(${endTime}-t)/${fadeOut}))'`
        );
      } else if (template.animation === 'slide') {
        // Slide up animation - update the y position index dynamically
        const yOptionIndex = drawtextOptions.findIndex(opt => opt.startsWith('y='));
        if (yOptionIndex !== -1) {
          drawtextOptions[yOptionIndex] = `y='if(lt(t-${startTime},0.3),${height}-(t-${startTime})*${height * 3},${yPosition})'`;
        }
      }

      filters.push(`drawtext=${drawtextOptions.join(':')}`);

      currentTime = endTime;
    }
  }

  return filters;
}

/**
 * Resolve subtitle colors from CSS variables
 */
function resolveSubtitleColor(color) {
  if (!color || color === 'transparent') return null;

  // Handle special gradient cases
  if (color === 'gradient' || color === 'split') {
    // For gradient text, we'll use white as fallback
    return '#FFFFFF';
  }

  // Map CSS variables to actual colors
  const colorMap = {
    'var(--color-text-primary)': '#FFFFFF',
    'var(--color-text-secondary)': '#A0A0A0',
    'var(--color-text-accent)': '#3B82F6',
    'var(--color-text-highlight)': '#FFD700',
    'var(--color-primary)': '#3B82F6',
    'var(--color-secondary)': '#8B5CF6',
    'var(--color-accent)': '#EC4899',
    'var(--color-brand-primary)': '#3B82F6',
    'var(--color-brand-secondary)': '#8B5CF6',
    'var(--color-brand-accent)': '#EC4899',
    'var(--color-background-primary)': '#000000',
    'var(--color-background-secondary)': '#1A1A1A'
  };

  // Check if it's a CSS variable
  for (const [varName, actualColor] of Object.entries(colorMap)) {
    if (color.includes(varName)) {
      return actualColor;
    }
  }

  // Handle color-mix function (used for stroke colors)
  if (color.includes('color-mix')) {
    // Extract the base color and opacity
    const match = color.match(/var\((--[^)]+)\)\s+(\d+)%/);
    if (match) {
      const varName = `var(${match[1]})`;
      const baseColor = colorMap[varName] || '#000000';
      // For stroke, we typically want good visibility, so use the base color
      return baseColor;
    }
    // Fallback to semi-transparent black for stroke
    return '#000000';
  }

  // Handle rgba format
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const [, r, g, b] = match;
      // Convert to hex
      const toHex = (n) => parseInt(n).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  }

  // Return as-is if it's already a hex color
  return color;
}

/**
 * Build effect filters
 */
function buildEffectFilters(effects, width, height) {
  const filters = [];

  effects.forEach(effect => {
    switch (effect.type) {
      case 'blur':
        filters.push(`boxblur=${effect.strength || 5}`);
        break;
      case 'sharpen':
        filters.push(`unsharp=5:5:${effect.strength || 1.0}:5:5:0.0`);
        break;
      case 'brightness':
        filters.push(`eq=brightness=${effect.value || 0}:saturation=1`);
        break;
      case 'contrast':
        filters.push(`eq=contrast=${effect.value || 1}:brightness=0:saturation=1`);
        break;
      case 'vignette':
        filters.push(`vignette=PI/4`);
        break;
    }
  });

  return filters;
}

/**
 * Build overlay filters for split screen
 */
function buildSplitOverlayFilters(overlays, width, height) {
  const filters = [];

  overlays.forEach(overlay => {
    if (!overlay.enabled) return;

    const x = Math.round((overlay.position?.x || 50) / 100 * width);
    const y = Math.round((overlay.position?.y || 50) / 100 * height);

    switch (overlay.type) {
      case 'watermark':
        filters.push(
          `drawtext=text='${escapeFFmpegText(overlay.text || 'WATERMARK')}':` +
          `x=${x}:y=${y}:` +
          `fontsize=24:` +
          `fontcolor=0xFFFFFF80:` +
          `font=Arial`
        );
        break;

      case 'timer':
        filters.push(
          `drawtext=text='%{pts\\:gmtime\\:0\\:%M\\\\\\:%S}':` +
          `x=${x}:y=${y}:` +
          `fontsize=36:` +
          `fontcolor=white:` +
          `box=1:boxcolor=0x00000080:boxborderw=5`
        );
        break;

      case 'frame':
        const frameColor = hexToFFmpegColor(overlay.color || '#FFFFFF');
        const frameWidth = overlay.width || 4;
        filters.push(
          `drawbox=x=${frameWidth}:y=${frameWidth}:` +
          `w=${width - frameWidth * 2}:h=${height - frameWidth * 2}:` +
          `color=${frameColor}:t=${frameWidth}`
        );
        break;
    }
  });

  return filters;
}

/**
 * Build audio filter for split screen
 */
function buildSplitAudioFilter(mainVolume, backgroundVolume) {
  const filters = [];

  if (backgroundVolume > 0) {
    // Mix both audio tracks
    filters.push(
      `[0:a]volume=${mainVolume}[a0]`,
      `[1:a]volume=${backgroundVolume}[a1]`,
      `[a0][a1]amix=inputs=2:duration=longest:dropout_transition=2[aout]`
    );
    return { filters, outputStream: '[aout]' };
  } else {
    // Only main audio
    if (mainVolume !== 1) {
      filters.push(`[0:a]volume=${mainVolume}[aout]`);
      return { filters, outputStream: '[aout]' };
    }
    return { filters: [], outputStream: '0:a' };
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