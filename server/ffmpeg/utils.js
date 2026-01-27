import { platform } from 'node:os';

/**
 * Get font file path based on OS and style
 */
export function getFontPath(family = 'Arial', bold = false, italic = false) {
  const os = platform();

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
    },
    'Roboto': {
      regular: os === 'win32' ? 'C:/Windows/Fonts/Roboto-Regular.ttf' :
               os === 'darwin' ? '/System/Library/Fonts/Supplemental/Roboto-Regular.ttf' :
               '/usr/share/fonts/truetype/roboto/Roboto-Regular.ttf',
      bold: os === 'win32' ? 'C:/Windows/Fonts/Roboto-Bold.ttf' :
            os === 'darwin' ? '/System/Library/Fonts/Supplemental/Roboto-Bold.ttf' :
            '/usr/share/fonts/truetype/roboto/Roboto-Bold.ttf'
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
}

/**
 * Escape text for FFmpeg filters
 */
export function escapeFFmpegText(text) {
  if (!text) return '';
  return text
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/**
 * Convert hex color to FFmpeg format with alpha support
 */
export function hexToFFmpegColor(hex, alpha = 1) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const a = Math.round(alpha * 255);

  // FFmpeg uses BGR format
  const bgr = ((b << 16) | (g << 8) | r).toString(16).padStart(6, '0');
  const alphaHex = a.toString(16).padStart(2, '0');

  return `0x${bgr}${alphaHex}`;
}

/**
 * Calculate title position for accurate rendering
 */
export function calculateTitlePosition(titlePosition, titleStyle, outputWidth, outputHeight) {
  // Frontend uses percentage-based positioning with translate(-50%, 0)
  const x = (titlePosition.x / 100) * outputWidth;
  const y = (titlePosition.y / 100) * outputHeight;

  // Frontend scales font by 0.6 for preview
  const fontSize = Math.round((titleStyle.fontSize || 24) * (outputWidth / 1080) * 0.6);

  // Center text horizontally
  const xExpression = `(${x}-text_w/2)`;

  return {
    x: xExpression,
    y: Math.round(y),
    fontSize
  };
}

/**
 * Calculate ranking graphic position
 */
export function calculateRankingPosition(position, size, outputWidth, outputHeight) {
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

/**
 * Parse video metadata for proper processing
 */
export function parseVideoMetadata(videos) {
  return videos.map((video, index) => {
    const metadata = {
      index,
      hasFile: !!video.file,
      hasLink: !!video.link,
      duration: video.clipDuration || 5,
      trimStart: video.trimStart || 0,
      trimEnd: video.trimEnd || null,
      caption: video.caption || null
    };

    // Calculate actual duration considering trim
    if (metadata.trimEnd) {
      metadata.actualDuration = metadata.trimEnd - metadata.trimStart;
    } else {
      metadata.actualDuration = metadata.duration;
    }

    return metadata;
  });
}

/**
 * Build FFmpeg command arguments
 */
export function buildFFmpegArgs(inputs, filterComplex, outputPath, videoStream, audioStream, options = {}) {
  const args = [
    ...inputs,
    '-filter_complex', filterComplex
  ];

  // Map video stream
  if (videoStream) {
    args.push('-map', videoStream);
  }

  // Map audio stream if available
  if (audioStream) {
    args.push('-map', audioStream);
    args.push('-c:a', 'aac', '-b:a', '192k');
  }

  // Video encoding settings
  args.push(
    '-c:v', 'libx264',
    '-preset', options.preset || 'medium',
    '-crf', options.crf || '18',
    '-b:v', options.bitrate || '8M',
    '-maxrate', options.bitrate || '8M',
    '-bufsize', `${parseInt(options.bitrate || '8') * 2}M`,
    '-r', (options.fps || 30).toString(),
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-y',
    outputPath
  );

  return args;
}

/**
 * Get quality settings based on export quality
 */
export function getQualitySettings(quality) {
  switch (quality) {
    case '720p':
      return {
        width: 720,
        height: 1280,
        crf: '23',
        preset: 'fast',
        bitrate: '3M'
      };
    case '4k':
      return {
        width: 2160,
        height: 3840,
        crf: '15',
        preset: 'slow',
        bitrate: '20M'
      };
    default: // 1080p
      return {
        width: 1080,
        height: 1920,
        crf: '18',
        preset: 'medium',
        bitrate: '8M'
      };
  }
}