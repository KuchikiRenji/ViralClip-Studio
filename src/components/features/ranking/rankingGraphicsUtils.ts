import { RankingGraphic, RankingStyle } from './types';

const RANKING_STYLE_COLORS: Record<RankingStyle, string> = {
  number: '#3b82f6',
  badge: '#8b5cf6',
  medal: '#f59e0b',
  trophy: '#10b981',
  custom: '#ec4899',
};

/**
 * Get position coordinates for ranking graphic
 */
export function getRankingPosition(
  position: RankingGraphic['position'],
  containerWidth: number,
  containerHeight: number,
  size: number
): { x: number; y: number } {
  const padding = size * 0.2;
  
  switch (position) {
    case 'top-left':
      return { x: padding, y: padding };
    case 'top-right':
      return { x: containerWidth - size - padding, y: padding };
    case 'bottom-left':
      return { x: padding, y: containerHeight - size - padding };
    case 'bottom-right':
      return { x: containerWidth - size - padding, y: containerHeight - size - padding };
    case 'center':
      return { x: (containerWidth - size) / 2, y: (containerHeight - size) / 2 };
    default:
      return { x: padding, y: padding };
  }
}

/**
 * Render ranking graphic on canvas
 */
export function renderRankingOnCanvas(
  ctx: CanvasRenderingContext2D,
  rank: number,
  graphic: RankingGraphic,
  containerWidth: number,
  containerHeight: number
): void {
  const { style, position, size, animation } = graphic;
  const color = RANKING_STYLE_COLORS[style];
  const { x, y } = getRankingPosition(position, containerWidth, containerHeight, size);
  
  ctx.save();
  
  // Add animation effect if enabled (pulse)
  // Use videoTimeSeconds for consistent animation timing during export
  let currentSize = size;
  if (animation) {
    // Use provided video time or fallback to Date.now() for preview
    const videoTime = (graphic as any).__videoTimeSeconds ?? (Date.now() / 1000);
    const pulsePhase = (videoTime * 2) % 2; // 2 second cycle
    const pulseAmount = Math.sin(pulsePhase * Math.PI) * 0.05;
    currentSize = size * (1 + pulseAmount);
  }
  
  const radius = currentSize / 2;
  const centerX = x + currentSize / 2;
  const centerY = y + currentSize / 2;
  
  // Draw background based on style
  switch (style) {
    case 'number': {
      // Circular background with gradient
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColorBrightness(color, -20));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      // Draw number
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${currentSize * 0.6}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rank.toString(), centerX, centerY);
      break;
    }
    
    case 'badge': {
      // Circular badge with border
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.8, adjustColorBrightness(color, -15));
      gradient.addColorStop(1, adjustColorBrightness(color, -30));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = currentSize * 0.08;
      ctx.stroke();
      
      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${currentSize * 0.5}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.fillText(rank.toString(), centerX, centerY);
      break;
    }
    
    case 'medal': {
      // Star/medal shape
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColorBrightness(color, -25));
      ctx.fillStyle = gradient;
      drawStar(ctx, centerX, centerY, 5, radius * 0.6, radius * 0.9);
      ctx.fill();
      
      // Number in center
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${currentSize * 0.4}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.fillText(rank.toString(), centerX, centerY);
      break;
    }
    
    case 'trophy': {
      // Trophy shape (simplified)
      const gradient = ctx.createLinearGradient(x, y, x + currentSize, y + currentSize);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColorBrightness(color, -20));
      ctx.fillStyle = gradient;
      
      // Trophy base
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + radius * 0.3, radius * 0.8, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Trophy top (cup shape)
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.4, centerY - radius * 0.3);
      ctx.lineTo(centerX - radius * 0.6, centerY + radius * 0.2);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius * 0.2);
      ctx.lineTo(centerX + radius * 0.4, centerY - radius * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${currentSize * 0.35}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.fillText(rank.toString(), centerX, centerY + radius * 0.1);
      break;
    }
    
    case 'custom': {
      // Custom design - pink crown-like shape
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustColorBrightness(color, -25));
      ctx.fillStyle = gradient;
      
      // Crown base
      ctx.beginPath();
      ctx.moveTo(centerX - radius * 0.6, centerY + radius * 0.2);
      ctx.lineTo(centerX - radius * 0.4, centerY - radius * 0.3);
      ctx.lineTo(centerX, centerY - radius * 0.5);
      ctx.lineTo(centerX + radius * 0.4, centerY - radius * 0.3);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius * 0.2);
      ctx.lineTo(centerX + radius * 0.6, centerY + radius * 0.4);
      ctx.lineTo(centerX - radius * 0.6, centerY + radius * 0.4);
      ctx.closePath();
      ctx.fill();
      
      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${currentSize * 0.35}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.fillText(rank.toString(), centerX, centerY);
      break;
    }
  }
  
  ctx.restore();
}

/**
 * Helper function to adjust color brightness
 */
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/**
 * Draw a star shape
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): void {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    const x = cx + Math.cos(rot) * outerRadius;
    const y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;
    
    const xInner = cx + Math.cos(rot) * innerRadius;
    const yInner = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(xInner, yInner);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

