/**
 * Advanced Split Screen Effects
 * Dynamic layouts, transitions, and animations
 */

import { hexToFFmpegColor } from './utils.js';

/**
 * Build dynamic split screen animations
 */
export function buildDynamicSplitAnimation(type, duration, width, height) {
  const filters = [];

  switch (type) {
    case 'slide-reveal':
      // Main video slides in from left, background slides from right
      filters.push(
        `[0:v]scale=${width}:${height},` +
        `crop=iw/2:ih:0:0,` +
        `overlay=x='if(lt(t,1),-w/2+t*w/2,0)':y=0[left]`,

        `[1:v]scale=${width}:${height},` +
        `crop=iw/2:ih:iw/2:0,` +
        `overlay=x='if(lt(t,1),w-t*w/2,w/2)':y=0[right]`,

        `[left][right]overlay[animated]`
      );
      break;

    case 'zoom-split':
      // Videos zoom in from corners to split position
      filters.push(
        `[0:v]scale='${width}*if(lt(t,1),0.5+t*0.5,1)':` +
        `'${height}*if(lt(t,1),0.5+t*0.5,1)',` +
        `crop=${width}/2:${height}[left_zoom]`,

        `[1:v]scale='${width}*if(lt(t,1),0.5+t*0.5,1)':` +
        `'${height}*if(lt(t,1),0.5+t*0.5,1)',` +
        `crop=${width}/2:${height}[right_zoom]`,

        `[left_zoom][right_zoom]hstack[animated]`
      );
      break;

    case 'rotating-split':
      // Split line rotates to reveal both videos
      filters.push(
        `[0:v]rotate='if(lt(t,1),t*PI/4,PI/4)':c=none:ow=${width}:oh=${height}[rot_left]`,
        `[1:v]rotate='if(lt(t,1),-t*PI/4,-PI/4)':c=none:ow=${width}:oh=${height}[rot_right]`,
        `[rot_left][rot_right]blend=all_mode=overlay:all_opacity=0.5[animated]`
      );
      break;

    case 'wave-transition':
      // Wave effect transitioning between videos
      const waveExpr = `'if(lt(t,2),sin(t*PI*2)*50,0)'`;
      filters.push(
        `[0:v]scale=${width}:${height}[v0_scaled]`,
        `[1:v]scale=${width}:${height}[v1_scaled]`,
        `[v0_scaled]crop=${width}/2:${height}:0:0[left]`,
        `[v1_scaled]crop=${width}/2:${height}:${width}/2:0[right]`,
        `[left]overlay=x=${waveExpr}:y=0[left_wave]`,
        `[right]overlay=x='${width}/2+${waveExpr}':y=0[right_wave]`,
        `[left_wave][right_wave]overlay[animated]`
      );
      break;

    case 'dynamic-ratio':
      // Split ratio changes over time
      filters.push(
        `[0:v]scale=${width}:${height}[v0_full]`,
        `[1:v]scale=${width}:${height}[v1_full]`,
        `[v0_full]crop='if(lt(t,${duration/2}),` +
        `${width}*(0.3+t*0.4/${duration/2}),` +
        `${width}*0.7)':${height}:0:0[left_dynamic]`,
        `[v1_full]crop='if(lt(t,${duration/2}),` +
        `${width}*(0.7-t*0.4/${duration/2}),` +
        `${width}*0.3)':${height}:` +
        `'if(lt(t,${duration/2}),` +
        `${width}*(0.3+t*0.4/${duration/2}),` +
        `${width}*0.7)':0[right_dynamic]`,
        `[left_dynamic][right_dynamic]hstack[animated]`
      );
      break;

    default:
      // Simple fade-in split
      filters.push(
        `[0:v]scale=${width}/2:${height},fade=t=in:d=0.5[left_fade]`,
        `[1:v]scale=${width}/2:${height},fade=t=in:d=0.5[right_fade]`,
        `[left_fade][right_fade]hstack[animated]`
      );
  }

  return filters;
}

/**
 * Build picture-in-picture layouts
 */
export function buildPiPLayout(position, size, width, height) {
  const filters = [];

  // Calculate PiP dimensions
  const pipSize = Math.round(width * (size || 0.25));
  const padding = 20;

  let pipX, pipY;
  switch (position) {
    case 'top-left':
      pipX = padding;
      pipY = padding;
      break;
    case 'top-right':
      pipX = width - pipSize - padding;
      pipY = padding;
      break;
    case 'bottom-left':
      pipX = padding;
      pipY = height - pipSize - padding;
      break;
    case 'bottom-right':
    default:
      pipX = width - pipSize - padding;
      pipY = height - pipSize - padding;
      break;
  }

  // Main video as background
  filters.push(
    `[1:v]scale=${width}:${height}[bg]`,
    `[0:v]scale=${pipSize}:${pipSize}:force_original_aspect_ratio=decrease,` +
    `pad=${pipSize}:${pipSize}:(ow-iw)/2:(oh-ih)/2:color=black[pip]`,
    `[bg][pip]overlay=${pipX}:${pipY}[pip_layout]`
  );

  // Add border to PiP
  filters.push(
    `[pip_layout]drawbox=x=${pipX-2}:y=${pipY-2}:` +
    `w=${pipSize+4}:h=${pipSize+4}:` +
    `color=white:t=2[with_border]`
  );

  return { filters, outputStream: '[with_border]' };
}

/**
 * Build grid layout (2x2, 3x3, etc.)
 */
export function buildGridLayout(gridSize, videos, width, height) {
  const filters = [];
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);

  // Scale each video to cell size
  for (let i = 0; i < Math.min(videos, gridSize * gridSize); i++) {
    filters.push(
      `[${i}:v]scale=${cellWidth}:${cellHeight}:` +
      `force_original_aspect_ratio=increase,` +
      `crop=${cellWidth}:${cellHeight}[cell${i}]`
    );
  }

  // Create rows
  const rows = [];
  for (let row = 0; row < gridSize; row++) {
    const rowCells = [];
    for (let col = 0; col < gridSize; col++) {
      const index = row * gridSize + col;
      if (index < videos) {
        rowCells.push(`[cell${index}]`);
      } else {
        // Create black cell for empty spots
        filters.push(
          `color=c=black:s=${cellWidth}x${cellHeight}[empty${index}]`
        );
        rowCells.push(`[empty${index}]`);
      }
    }

    if (rowCells.length > 1) {
      filters.push(
        `${rowCells.join('')}hstack=inputs=${gridSize}[row${row}]`
      );
      rows.push(`[row${row}]`);
    } else {
      rows.push(rowCells[0]);
    }
  }

  // Stack rows vertically
  if (rows.length > 1) {
    filters.push(
      `${rows.join('')}vstack=inputs=${gridSize}[grid]`
    );
  }

  return { filters, outputStream: '[grid]' };
}

/**
 * Build cinematic bars (letterbox)
 */
export function buildCinematicBars(height, barSize = 0.1) {
  const filters = [];
  const barHeight = Math.round(height * barSize);

  filters.push(
    `drawbox=x=0:y=0:w=iw:h=${barHeight}:color=black:t=fill`,
    `drawbox=x=0:y=${height - barHeight}:w=iw:h=${barHeight}:color=black:t=fill`
  );

  return filters;
}

/**
 * Build split screen with blur transition zone
 */
export function buildBlurredSplit(variant, ratio, width, height, blurSize = 20) {
  const filters = [];

  if (variant === 'vertical') {
    const splitX = Math.round(width * ratio);
    const blurZoneStart = splitX - blurSize;
    const blurZoneEnd = splitX + blurSize;

    filters.push(
      // Left video
      `[0:v]scale=${width}:${height},crop=${splitX}:${height}:0:0[left]`,

      // Right video
      `[1:v]scale=${width}:${height},crop=${width - splitX}:${height}:${splitX}:0[right]`,

      // Blur zone
      `[0:v]scale=${width}:${height},` +
      `crop=${blurSize * 2}:${height}:${blurZoneStart}:0,` +
      `boxblur=10[blur_left]`,

      `[1:v]scale=${width}:${height},` +
      `crop=${blurSize * 2}:${height}:${blurZoneStart}:0,` +
      `boxblur=10[blur_right]`,

      `[blur_left][blur_right]blend=all_mode=overlay:all_opacity=0.5[blur_zone]`,

      // Combine all
      `[left][blur_zone]overlay=${blurZoneStart}:0[with_blur]`,
      `[with_blur][right]overlay=${splitX}:0[blurred_split]`
    );
  }

  return { filters, outputStream: '[blurred_split]' };
}

/**
 * Build diagonal split
 */
export function buildDiagonalSplit(angle, width, height) {
  const filters = [];
  const radians = (angle * Math.PI) / 180;

  // Create diagonal mask
  filters.push(
    `[0:v]scale=${width}:${height}[v0_scaled]`,
    `[1:v]scale=${width}:${height}[v1_scaled]`,

    // Create gradient mask for diagonal split
    `color=c=white:s=${width}x${height},` +
    `geq='lum=if(gt(X*tan(${radians}),Y),255,0)'[mask]`,

    // Apply mask
    `[v1_scaled][v0_scaled][mask]maskedmerge[diagonal]`
  );

  return { filters, outputStream: '[diagonal]' };
}

/**
 * Build creative split shapes
 */
export function buildCreativeSplit(shape, width, height) {
  const filters = [];

  switch (shape) {
    case 'circle':
      // Circular reveal in center
      filters.push(
        `[0:v]scale=${width}:${height}[bg]`,
        `[1:v]scale=${width}:${height}[fg]`,
        `color=c=white:s=${width}x${height},` +
        `geq='lum=if(lt(sqrt((X-${width/2})^2+(Y-${height/2})^2),${Math.min(width, height)/3}),255,0)'[mask]`,
        `[fg][bg][mask]maskedmerge[circle_split]`
      );
      break;

    case 'hexagon':
      // Hexagonal split
      filters.push(
        `[0:v]scale=${width}:${height}[bg]`,
        `[1:v]scale=${width}:${height}[fg]`,
        // Simplified hexagon using multiple conditions
        `color=c=white:s=${width}x${height},` +
        `geq='lum=if(lt(abs(X-${width/2}),${width/4})*lt(abs(Y-${height/2}),${height/3}),255,0)'[mask]`,
        `[fg][bg][mask]maskedmerge[hex_split]`
      );
      break;

    case 'puzzle':
      // Puzzle piece effect
      filters.push(
        `[0:v]scale=${width}:${height}[bg]`,
        `[1:v]scale=${width}:${height}[fg]`,
        // Create wavy split line
        `color=c=white:s=${width}x${height},` +
        `geq='lum=if(gt(X,${width/2}+sin(Y*0.02)*50),255,0)'[mask]`,
        `[fg][bg][mask]maskedmerge[puzzle_split]`
      );
      break;

    default:
      // Standard vertical split
      filters.push(
        `[0:v]scale=${width/2}:${height}[left]`,
        `[1:v]scale=${width/2}:${height}[right]`,
        `[left][right]hstack[standard_split]`
      );
  }

  return filters;
}