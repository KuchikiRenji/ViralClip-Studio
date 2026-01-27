/**
 * FFmpeg Filter Builders
 * Modular functions to build FFmpeg filter chains
 */

/**
 * Build caption filters for videos
 */
export function buildCaptionFilters(videos, clipDurations, outputWidth, outputHeight) {
  const filters = [];
  let accumulatedTime = 0;

  videos.forEach((video, index) => {
    const duration = clipDurations?.[index] || 5;

    if (video.caption?.enabled && video.caption?.text) {
      const { caption } = video;
      const startTime = accumulatedTime;
      const endTime = accumulatedTime + duration;

      // Calculate position
      let yPos;
      switch (caption.position) {
        case 'top':
          yPos = Math.round(outputHeight * 0.1);
          break;
        case 'middle':
          yPos = Math.round(outputHeight * 0.5);
          break;
        case 'bottom':
          yPos = Math.round(outputHeight * 0.85);
          break;
        default:
          yPos = Math.round(outputHeight * 0.85);
      }

      // Build caption text filter
      const fontSize = Math.round((caption.format?.fontSize || 20) * (outputWidth / 1080));
      const fontColor = (caption.format?.color || '#FFFFFF').replace('#', '0x');
      const bgColor = (caption.format?.backgroundColor || '#000000').replace('#', '0x');
      const bgOpacity = Math.round((caption.format?.backgroundOpacity || 0.7) * 255).toString(16).padStart(2, '0');

      // Escape text for FFmpeg
      const escapedText = caption.text
        .replace(/'/g, "\\'")
        .replace(/:/g, "\\:")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");

      // Build drawtext filter with background box
      let captionFilter = `drawbox=x=(w-text_w)/2-10:y=${yPos - fontSize - 10}:w=text_w+20:h=text_h+20:` +
        `color=${bgColor}${bgOpacity}:t=fill:enable='between(t,${startTime},${endTime})',` +
        `drawtext=text='${escapedText}':` +
        `fontsize=${fontSize}:` +
        `fontcolor=${fontColor}:` +
        `x=(w-text_w)/2:` +
        `y=${yPos - fontSize / 2}`;

      // Add bold/italic if specified
      if (caption.format?.bold) {
        captionFilter += ':font=Arial Bold';
      }
      if (caption.format?.italic) {
        captionFilter += ':font=Arial Italic';
      }

      // Add animation if specified
      if (caption.animation === 'fade') {
        // Fade in for 0.5s, fade out for 0.5s
        const fadeInEnd = startTime + 0.5;
        const fadeOutStart = endTime - 0.5;
        captionFilter += `:alpha='if(lt(t,${startTime}),0,if(lt(t,${fadeInEnd}),(t-${startTime})/0.5,if(lt(t,${fadeOutStart}),1,(${endTime}-t)/0.5)))'`;
      } else if (caption.animation === 'slide-up') {
        // Slide up from bottom
        captionFilter = captionFilter.replace(`y=${yPos - fontSize / 2}`,
          `y='if(lt(t-${startTime},0.5),${outputHeight}-(t-${startTime})*${outputHeight * 2},${yPos - fontSize / 2})'`);
      }

      captionFilter += `:enable='between(t,${startTime},${endTime})'`;
      filters.push(captionFilter);
    }

    accumulatedTime += duration;
  });

  return filters;
}

/**
 * Build overlay filters
 */
export function buildOverlayFilters(overlays, outputWidth, outputHeight, totalDuration) {
  const filters = [];

  if (!overlays || overlays.length === 0) return filters;

  overlays.forEach((overlay) => {
    if (!overlay.enabled) return;

    const x = Math.round((overlay.position?.x || 50) / 100 * outputWidth);
    const y = Math.round((overlay.position?.y || 50) / 100 * outputHeight);
    const startTime = overlay.visibility?.start || 0;
    const endTime = overlay.visibility?.end || totalDuration;

    switch (overlay.type) {
      case 'text': {
        const fontSize = Math.round((overlay.style?.fontSize || 24) * (outputWidth / 1080));
        const color = (overlay.style?.color || '#FFFFFF').replace('#', '0x');
        const escapedText = (overlay.content || '')
          .replace(/'/g, "\\'")
          .replace(/:/g, "\\:")
          .replace(/\[/g, "\\[")
          .replace(/\]/g, "\\]");

        filters.push(
          `drawtext=text='${escapedText}':` +
          `x=${x}:y=${y}:` +
          `fontsize=${fontSize}:` +
          `fontcolor=${color}:` +
          `enable='between(t,${startTime},${endTime})'`
        );
        break;
      }

      case 'watermark':
      case 'logo': {
        // These would require image inputs - handled separately
        // For now, add a placeholder text
        filters.push(
          `drawtext=text='[${overlay.type}]':` +
          `x=${x}:y=${y}:` +
          `fontsize=20:` +
          `fontcolor=0xFFFFFF80:` +
          `enable='between(t,${startTime},${endTime})'`
        );
        break;
      }

      case 'lower-third': {
        const barHeight = 80;
        const barY = outputHeight - 150;
        const bgColor = (overlay.style?.backgroundColor || '#000000').replace('#', '0x') + '80';
        const textColor = (overlay.style?.color || '#FFFFFF').replace('#', '0x');

        // Background bar
        filters.push(
          `drawbox=x=0:y=${barY}:w=${outputWidth}:h=${barHeight}:` +
          `color=${bgColor}:t=fill:` +
          `enable='between(t,${startTime},${endTime})'`
        );

        // Title text
        if (overlay.content) {
          const escapedTitle = overlay.content
            .replace(/'/g, "\\'")
            .replace(/:/g, "\\:")
            .replace(/\[/g, "\\[")
            .replace(/\]/g, "\\]");

          filters.push(
            `drawtext=text='${escapedTitle}':` +
            `x=50:y=${barY + 20}:` +
            `fontsize=28:` +
            `fontcolor=${textColor}:` +
            `font=Arial Bold:` +
            `enable='between(t,${startTime},${endTime})'`
          );
        }
        break;
      }

      case 'progress-bar': {
        const barHeight = 6;
        const barY = outputHeight - 20;
        const barColor = (overlay.style?.color || '#00FF00').replace('#', '0x');

        // Dynamic progress bar that grows over time
        filters.push(
          `drawbox=x=0:y=${barY}:` +
          `w='t/${totalDuration}*${outputWidth}':` +
          `h=${barHeight}:` +
          `color=${barColor}:t=fill`
        );
        break;
      }
    }
  });

  return filters;
}

/**
 * Build advanced transition filters
 */
export function buildAdvancedTransitionFilter(type, duration, index, prevDuration) {
  const offset = prevDuration - duration;

  switch (type) {
    case 'zoom-in':
      // Custom zoom effect using scale and fade
      return {
        custom: true,
        filter: `scale=2*iw:2*ih,zoompan=z='1+on/${duration}/4':d=1:s=hd1080,fade=t=in:d=${duration}`
      };

    case 'zoom-out':
      // Reverse zoom effect
      return {
        custom: true,
        filter: `scale=2*iw:2*ih,zoompan=z='2-on/${duration}/4':d=1:s=hd1080,fade=t=in:d=${duration}`
      };

    case 'blur':
      // Blur transition using boxblur
      return {
        custom: true,
        filter: `boxblur=luma_radius='10*(1-t/${duration})':enable='lt(t,${duration})'`
      };

    case 'glitch':
      // Glitch effect with chromatic aberration and displacement
      return {
        custom: true,
        filter: `rgbashift=rh=5*sin(t*10):gh=5*cos(t*10):bh=5*sin(t*5):enable='lt(t,${duration})'`
      };

    case 'rotate':
      // 3D rotation effect
      return {
        custom: true,
        filter: `rotate=a='t/${duration}*PI':c=none:ow=iw:oh=ih`
      };

    case 'cube':
      // Pseudo-3D cube transition (simplified)
      return {
        custom: true,
        filter: `perspective=x0=0:y0=0:x1=iw:y1=0:x2=iw:y2=ih:x3=0:y3=ih:` +
                `x0s='t/${duration}*iw':y0s=0:x1s='iw-t/${duration}*iw':y1s=0:` +
                `x2s='iw-t/${duration}*iw':y2s=ih:x3s='t/${duration}*iw':y3s=ih:` +
                `sense=destination:enable='lt(t,${duration})'`
      };

    default:
      // Use standard xfade for unsupported transitions
      return {
        custom: false,
        type: 'fade',
        duration,
        offset
      };
  }
}

/**
 * Build audio mixing filters with ducking
 */
export function buildAudioFilters(musicIndex, videoCount, clipDurations, backgroundMusic) {
  const filters = [];
  const totalDuration = clipDurations.reduce((sum, d) => sum + (d || 5), 0);
  const musicVolume = (backgroundMusic?.volume || 50) / 100;

  // Process background music
  if (musicIndex >= 0 && backgroundMusic) {
    // Adjust music volume
    let musicFilter = `[${musicIndex}:a]volume=${musicVolume}`;

    // Apply fade in
    if (backgroundMusic.fadeIn) {
      musicFilter += ',afade=t=in:st=0:d=2';
    }

    // Apply fade out
    if (backgroundMusic.fadeOut) {
      musicFilter += `,afade=t=out:st=${totalDuration - 2}:d=2`;
    }

    // Loop the music for the entire duration
    musicFilter += ',aloop=loop=-1:size=2e+09[music]';
    filters.push(musicFilter);

    // For now, skip video audio extraction to avoid complexity
    // Just use background music if provided
    // TODO: Implement proper audio detection and mixing in future

    // Return just the music stream
    return { filters, outputStream: '[music]' };
  }

  // No audio at all
  return { filters: [], outputStream: null };

  /* Future implementation for video audio mixing:

    if (false && videoAudioStreams.length > 0) {
      // Concatenate all video audio
      filters.push(
        `${videoAudioStreams.join('')}concat=n=${videoCount}:v=0:a=1[videoAudio]`
      );

      // Apply ducking if enabled
      if (backgroundMusic.ducking) {
        const duckingAmount = (backgroundMusic.duckingAmount || 50) / 100;

        // Use sidechain compression to duck music when video audio is present
        filters.push(
          `[music][videoAudio]sidechaincompress=` +
          `threshold=0.1:` +
          `ratio=${2 + duckingAmount * 8}:` +
          `attack=10:` +
          `release=100:` +
          `detection=peak[duckedMusic]`,

          // Mix the ducked music with video audio
          `[videoAudio][duckedMusic]amix=inputs=2:duration=first:dropout_transition=2[finalAudio]`
        );

        return { filters, outputStream: '[finalAudio]' };
      } else {
        // Simple mix without ducking
        filters.push(
          `[videoAudio][music]amix=inputs=2:duration=first:dropout_transition=2[finalAudio]`
        );

        return { filters, outputStream: '[finalAudio]' };
      }
    } else {
      // Only background music, no video audio
      return { filters, outputStream: '[music]' };
    }
  }

  // No audio at all
  return { filters, outputStream: null };
  */
}

/**
 * Build complete transition chain with advanced effects
 */
export function buildTransitionChain(videoStreams, transitionSettings, clipDurations) {
  if (!transitionSettings || transitionSettings.type === 'none' || videoStreams.length < 2) {
    // Simple concatenation
    return {
      filters: [`${videoStreams.join('')}concat=n=${videoStreams.length}:v=1:a=0[concatenated]`],
      outputStream: '[concatenated]'
    };
  }

  const filters = [];
  let currentStream = videoStreams[0];

  for (let i = 1; i < videoStreams.length; i++) {
    const prevDuration = clipDurations?.[i - 1] || 5;
    const transition = buildAdvancedTransitionFilter(
      transitionSettings.type,
      transitionSettings.duration,
      i,
      prevDuration
    );

    if (transition.custom) {
      // Apply custom transition effect
      filters.push(
        `${currentStream}${transition.filter}[trans${i}a]`,
        `${videoStreams[i]}${transition.filter}[trans${i}b]`,
        `[trans${i}a][trans${i}b]overlay=enable='between(t,${prevDuration - transitionSettings.duration},${prevDuration})'[xfade${i}]`
      );
    } else {
      // Use standard xfade
      filters.push(
        `${currentStream}${videoStreams[i]}xfade=transition=${transition.type}:` +
        `duration=${transition.duration}:offset=${transition.offset}[xfade${i}]`
      );
    }

    currentStream = `[xfade${i}]`;
  }

  return {
    filters,
    outputStream: currentStream
  };
}