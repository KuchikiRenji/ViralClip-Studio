import { TransitionSettings, TransitionType } from './types';

/**
 * Apply easing function to a progress value (0-1)
 */
export function applyEasing(progress: number, timingFunction: TransitionSettings['timingFunction']): number {
  // Clamp progress to 0-1
  const t = Math.max(0, Math.min(1, progress));
  
  switch (timingFunction) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'bounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        const t1 = t - 1.5 / 2.75;
        return 7.5625 * t1 * t1 + 0.75;
      } else if (t < 2.5 / 2.75) {
        const t2 = t - 2.25 / 2.75;
        return 7.5625 * t2 * t2 + 0.9375;
      } else {
        const t3 = t - 2.625 / 2.75;
        return 7.5625 * t3 * t3 + 0.984375;
      }
    default:
      return t;
  }
}

/**
 * Calculate transition progress between two videos
 * @param currentTime Current time in seconds
 * @param transitionStart Start time of transition (end of previous video)
 * @param transitionDuration Duration of transition in seconds
 * @returns Progress from 0 (start) to 1 (end)
 */
export function getTransitionProgress(
  currentTime: number,
  transitionStart: number,
  transitionDuration: number
): number {
  if (transitionDuration === 0) return 1;
  const elapsed = currentTime - transitionStart;
  return Math.max(0, Math.min(1, elapsed / transitionDuration));
}

/**
 * Check if we're currently in a transition period
 */
export function isInTransition(
  currentTime: number,
  videoEndTime: number,
  transitionDuration: number
): boolean {
  return currentTime >= videoEndTime && currentTime < videoEndTime + transitionDuration;
}

/**
 * Calculate opacity values for fade transition
 */
export function getFadeOpacity(
  progress: number,
  fromVideo: boolean
): number {
  if (fromVideo) {
    return 1 - progress;
  } else {
    return progress;
  }
}

/**
 * Calculate transform values for slide/wipe transitions
 */
export function getSlideTransform(
  progress: number,
  direction: 'left' | 'right' | 'up' | 'down',
  fromVideo: boolean
): { translateX: number; translateY: number } {
  const eased = fromVideo ? progress : 1 - progress;
  let translateX = 0;
  let translateY = 0;
  
  switch (direction) {
    case 'left':
      translateX = fromVideo ? -eased * 100 : (1 - eased) * 100;
      break;
    case 'right':
      translateX = fromVideo ? eased * 100 : -(1 - eased) * 100;
      break;
    case 'up':
      translateY = fromVideo ? -eased * 100 : (1 - eased) * 100;
      break;
    case 'down':
      translateY = fromVideo ? eased * 100 : -(1 - eased) * 100;
      break;
  }
  
  return { translateX, translateY };
}

/**
 * Calculate clip path for wipe transitions
 */
export function getWipeClipPath(
  progress: number,
  direction: 'left' | 'right' | 'up' | 'down',
  width: number,
  height: number,
  fromVideo: boolean
): string {
  const eased = fromVideo ? progress : 1 - progress;
  
  switch (direction) {
    case 'left':
      const leftProgress = eased;
      return `inset(0 ${(1 - leftProgress) * 100}% 0 0)`;
    case 'right':
      const rightProgress = eased;
      return `inset(0 0 0 ${(1 - rightProgress) * 100}%)`;
    case 'up':
      const upProgress = eased;
      return `inset(${(1 - upProgress) * 100}% 0 0 0)`;
    case 'down':
      const downProgress = eased;
      return `inset(0 0 ${(1 - downProgress) * 100}% 0)`;
    default:
      return 'inset(0)';
  }
}

/**
 * Calculate scale for zoom transitions
 */
export function getZoomScale(
  progress: number,
  type: 'in' | 'out',
  fromVideo: boolean
): number {
  if (type === 'in') {
    return fromVideo ? 1 : 1 + (1 - progress);
  } else {
    return fromVideo ? 1 + progress : 1;
  }
}

/**
 * Calculate blur amount for blur transition
 */
export function getBlurAmount(
  progress: number,
  fromVideo: boolean
): number {
  if (fromVideo) {
    return progress * 10;
  } else {
    return (1 - progress) * 10;
  }
}

/**
 * Apply transition effects to canvas rendering context
 */
export function applyTransitionToCanvas(
  ctx: CanvasRenderingContext2D,
  transitionType: TransitionType,
  progress: number,
  width: number,
  height: number,
  videoAreaX: number,
  videoAreaY: number,
  videoAreaWidth: number,
  videoAreaHeight: number
): void {
  const easedProgress = progress;
  
  ctx.save();
  
  switch (transitionType) {
    case 'fade':
      // Opacity is handled by globalAlpha in rendering
      break;
      
    case 'wipe-left':
    case 'wipe-right':
    case 'wipe-up':
    case 'wipe-down': {
      const direction = transitionType.split('-')[1] as 'left' | 'right' | 'up' | 'down';
      // Progress: 0 = fully hidden, 1 = fully visible
      // For "from" video: progress increases = less visible (clip more)
      // For "to" video: progress increases = more visible (clip less)
      const clipProgress = easedProgress; // This will be 1-progress for "from", progress for "to"
      
      if (direction === 'left') {
        ctx.beginPath();
        ctx.rect(videoAreaX + clipProgress * videoAreaWidth, videoAreaY, (1 - clipProgress) * videoAreaWidth, videoAreaHeight);
        ctx.clip();
      } else if (direction === 'right') {
        ctx.beginPath();
        ctx.rect(videoAreaX, videoAreaY, clipProgress * videoAreaWidth, videoAreaHeight);
        ctx.clip();
      } else if (direction === 'up') {
        ctx.beginPath();
        ctx.rect(videoAreaX, videoAreaY + clipProgress * videoAreaHeight, videoAreaWidth, (1 - clipProgress) * videoAreaHeight);
        ctx.clip();
      } else if (direction === 'down') {
        ctx.beginPath();
        ctx.rect(videoAreaX, videoAreaY, videoAreaWidth, clipProgress * videoAreaHeight);
        ctx.clip();
      }
      break;
    }
    
    case 'slide-left':
    case 'slide-right':
    case 'slide-up':
    case 'slide-down': {
      const direction = transitionType.split('-')[1] as 'left' | 'right' | 'up' | 'down';
      const { translateX, translateY } = getSlideTransform(easedProgress, direction, false);
      ctx.translate(translateX * videoAreaWidth / 100, translateY * videoAreaHeight / 100);
      break;
    }
    
    case 'zoom-in':
    case 'zoom-out': {
      const type = transitionType.split('-')[1] as 'in' | 'out';
      const scale = getZoomScale(easedProgress, type, false);
      const centerX = videoAreaX + videoAreaWidth / 2;
      const centerY = videoAreaY + videoAreaHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);
      break;
    }
    
    case 'blur':
      // Blur requires filter API which isn't directly available in canvas
      // We'll simulate with opacity and scaling
      ctx.globalAlpha = 0.5 + (1 - easedProgress) * 0.5;
      break;
      
    case 'glitch':
      // Glitch effect - offset and jitter
      const jitter = Math.sin(easedProgress * Math.PI * 10) * (1 - easedProgress) * 2;
      ctx.translate(jitter, 0);
      ctx.globalAlpha = 1 - easedProgress * 0.3;
      break;
      
    case 'rotate': {
      const angle = easedProgress * Math.PI * 2;
      const centerX = videoAreaX + videoAreaWidth / 2;
      const centerY = videoAreaY + videoAreaHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.translate(-centerX, -centerY);
      break;
    }
    
    case 'cube':
      // 3D cube effect - simulate with perspective scaling
      const cubeScale = 1 - Math.sin(easedProgress * Math.PI) * 0.3;
      const centerX = videoAreaX + videoAreaWidth / 2;
      const centerY = videoAreaY + videoAreaHeight / 2;
      ctx.translate(centerX, centerY);
      ctx.scale(cubeScale, 1);
      ctx.translate(-centerX, -centerY);
      ctx.globalAlpha = Math.sin(easedProgress * Math.PI);
      break;
      
    case 'none':
    default:
      // No transition
      break;
  }
}

