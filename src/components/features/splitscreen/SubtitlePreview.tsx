import { CSSProperties, useMemo } from 'react';
import { Ban } from 'lucide-react';
import type { SubtitleTemplate } from './types';

// Helper to resolve CSS variables to actual values
const resolveCSSVar = (value: string): string => {
  if (typeof window === 'undefined') return value;
  const root = getComputedStyle(document.documentElement);
  const match = value.match(/var\((--[^)]+)\)/);
  if (!match) return value;
  const resolved = root.getPropertyValue(match[1]).trim();
  return resolved || value;
};

// Helper to resolve color-mix functions
const resolveColorMix = (value: string): string => {
  if (!value.includes('color-mix')) return value;
  
  // Parse color-mix(in srgb, var(--color-background-primary) 85%, transparent)
  const match = value.match(/color-mix\(in\s+srgb,\s*var\((--[^)]+)\)\s+(\d+)%,\s*transparent\)/);
  if (match) {
    const [, varName, percentage] = match;
    const baseColor = resolveCSSVar(`var(${varName})`);
    
    // Convert hex to rgba if needed
    if (baseColor.startsWith('#')) {
      const hex = baseColor.replace('#', '');
      // Handle both 3-digit and 6-digit hex
      let r: number, g: number, b: number;
      if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
      } else {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
      }
      const opacity = parseInt(percentage) / 100;
      // For stroke visibility, ensure it's at least 0.7 opacity for visibility
      const finalOpacity = Math.max(0.7, Math.min(1, opacity));
      return `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
    }
    
    // If already rgba, adjust opacity
    const rgbaMatch = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const [, r, g, b, a = '1'] = rgbaMatch;
      const opacity = (parseInt(percentage) / 100) * parseFloat(a);
      // For stroke visibility, ensure it's at least 0.7 opacity
      const finalOpacity = Math.max(0.7, Math.min(1, opacity));
      return `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
    }
    
    // If we got a color but couldn't parse it, try to use it directly with opacity
    if (baseColor && baseColor !== value) {
      // Fallback: use a dark semi-transparent color for stroke
      return 'rgba(0, 0, 0, 0.7)';
    }
  }
  
  // Fallback for other color-mix formats - use a visible dark stroke
  return 'rgba(0, 0, 0, 0.7)';
};

// Main color resolver
const resolveColor = (value: string): string => {
  if (!value || value === 'transparent') return 'transparent';
  if (value.includes('color-mix')) return resolveColorMix(value);
  if (value.startsWith('var(')) return resolveCSSVar(value);
  return value;
};
interface SubtitlePreviewProps {
  template: SubtitleTemplate;
}
const getTextStyle = (template: SubtitleTemplate): CSSProperties => {
  const fontWeight = template.weight === 'black' ? 900 : template.weight === 'bold' ? 700 : 400;
  
  // Resolve colors for preview
  const resolvedColor = template.color === 'gradient' || template.color === 'split' 
    ? template.color 
    : resolveColor(template.color);
  const resolvedStrokeColor = resolveColor(template.strokeColor);
  const resolvedBgColor = resolveColor(template.bgColor);
  const resolvedFontFamily = template.fontFamily.startsWith('var(') 
    ? resolveCSSVar(template.fontFamily) 
    : template.fontFamily;
  
  if (template.color === 'gradient') {
    const accent = resolveColor('var(--color-brand-accent)');
    const secondary = resolveColor('var(--color-brand-secondary)');
    return {
      fontFamily: resolvedFontFamily,
      fontStyle: template.style,
      fontWeight,
      textTransform: template.transform,
      background: `linear-gradient(90deg, ${accent}, ${secondary})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: '14px',
      textShadow: template.strokeWidth > 0 ? `0 0 ${template.strokeWidth}px ${resolvedStrokeColor}` : 'none',
      // Explicitly don't set backgroundColor when using background
    };
  }
  if (template.color === 'split') {
    const primary = resolveColor('var(--color-text-primary)');
    const brandPrimary = resolveColor('var(--color-brand-primary)');
    return {
      fontFamily: resolvedFontFamily,
      fontStyle: template.style,
      fontWeight,
      textTransform: template.transform,
      background: `linear-gradient(90deg, ${primary} 60%, ${brandPrimary} 60%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontSize: '14px',
      // Explicitly don't set backgroundColor when using background
    };
  }
  // Create stroke shadow with multiple layers for better visibility
  const strokeShadow = (() => {
    if (template.strokeWidth <= 0 || !resolvedStrokeColor || resolvedStrokeColor === 'transparent') {
      return 'none';
    }
    
    const strokeSize = template.strokeWidth;
    const layers: string[] = [];
    
    // Add shadows in a circular pattern for smoother stroke
    for (let i = -strokeSize; i <= strokeSize; i++) {
      for (let j = -strokeSize; j <= strokeSize; j++) {
        const distance = Math.sqrt(i * i + j * j);
        if (distance <= strokeSize && distance > 0) {
          layers.push(`${i}px ${j}px 0 ${resolvedStrokeColor}`);
        }
      }
    }
    
    // Fallback to simple 4-directional stroke
    if (layers.length === 0) {
      return `
        -${strokeSize}px -${strokeSize}px 0 ${resolvedStrokeColor},
        ${strokeSize}px -${strokeSize}px 0 ${resolvedStrokeColor},
        -${strokeSize}px ${strokeSize}px 0 ${resolvedStrokeColor},
        ${strokeSize}px ${strokeSize}px 0 ${resolvedStrokeColor}
      `;
    }
    
    return layers.join(', ');
  })();
  
  // For non-gradient templates, use backgroundColor (never background)
  const style: CSSProperties = {
    fontFamily: resolvedFontFamily,
    color: resolvedColor,
    fontStyle: template.style,
    fontWeight,
    textTransform: template.transform,
    textShadow: strokeShadow,
    fontSize: '14px',
  };
  
  // Only set backgroundColor if not transparent (never set background)
  if (resolvedBgColor !== 'transparent') {
    style.backgroundColor = resolvedBgColor;
    style.padding = '2px 6px';
  }
  
  return style;
};
export const SubtitlePreview = ({ template }: SubtitlePreviewProps) => {
  if (template.id === 'none') {
    return <Ban className="w-6 h-6 text-zinc-500" />;
  }
  return <span style={getTextStyle(template)}>{template.name}</span>;
};
interface SubtitleDisplayProps {
  template: SubtitleTemplate;
  position: 'top' | 'center' | 'bottom' | 'custom';
  fontSize: number;
  text?: string;
  customPosition?: { x: number; y: number };
}
export const SubtitleDisplay = ({
  template,
  position,
  fontSize,
  text = 'THE QUICK',
  customPosition,
}: SubtitleDisplayProps) => {
  // Resolve all colors and values
  const resolvedColor = useMemo(() => {
    if (template.color === 'gradient' || template.color === 'split') {
      return template.color; // Special case, handled separately
    }
    return resolveColor(template.color);
  }, [template.color]);
  
  const resolvedStrokeColor = useMemo(() => {
    return resolveColor(template.strokeColor);
  }, [template.strokeColor]);
  
  const resolvedBgColor = useMemo(() => {
    return resolveColor(template.bgColor);
  }, [template.bgColor]);
  
  const resolvedFontFamily = useMemo(() => {
    if (template.fontFamily.startsWith('var(')) {
      return resolveCSSVar(template.fontFamily);
    }
    return template.fontFamily;
  }, [template.fontFamily]);
  
  // Resolve gradient colors
  const gradientBg = useMemo(() => {
    if (template.color === 'gradient') {
      const accent = resolveColor('var(--color-brand-accent)');
      const secondary = resolveColor('var(--color-brand-secondary)');
      return `linear-gradient(90deg, ${accent}, ${secondary})`;
    }
    if (template.color === 'split') {
      const primary = resolveColor('var(--color-text-primary)');
      const brandPrimary = resolveColor('var(--color-brand-primary)');
      return `linear-gradient(90deg, ${primary} 60%, ${brandPrimary} 60%)`;
    }
    return undefined;
  }, [template.color]);
  
  const fontWeight = template.weight === 'black' ? 900 : template.weight === 'bold' ? 700 : 400;
  const isGradient = template.color === 'gradient' || template.color === 'split';
  
  // Create stroke using textShadow - use multiple layers for better visibility
  const strokeShadow = useMemo(() => {
    if (template.strokeWidth <= 0 || !resolvedStrokeColor || resolvedStrokeColor === 'transparent') {
      return 'none';
    }
    
    // For stroke width 2, create a more visible stroke with multiple shadow layers
    const strokeSize = template.strokeWidth;
    const layers: string[] = [];
    
    // Add shadows in a circular pattern for smoother stroke
    for (let i = -strokeSize; i <= strokeSize; i++) {
      for (let j = -strokeSize; j <= strokeSize; j++) {
        const distance = Math.sqrt(i * i + j * j);
        if (distance <= strokeSize && distance > 0) {
          layers.push(`${i}px ${j}px 0 ${resolvedStrokeColor}`);
        }
      }
    }
    
    // Fallback to simple 4-directional stroke if calculation fails
    if (layers.length === 0) {
      return `
        -${strokeSize}px -${strokeSize}px 0 ${resolvedStrokeColor},
        ${strokeSize}px -${strokeSize}px 0 ${resolvedStrokeColor},
        -${strokeSize}px ${strokeSize}px 0 ${resolvedStrokeColor},
        ${strokeSize}px ${strokeSize}px 0 ${resolvedStrokeColor}
      `;
    }
    
    return layers.join(', ');
  }, [template.strokeWidth, resolvedStrokeColor]);
  const positionStyle = useMemo(() => {
    if (position === 'custom' && customPosition) {
      return {
        position: 'absolute' as const,
        left: `${customPosition.x}%`,
        top: `${customPosition.y}%`,
        transform: 'translate(-50%, -50%)',
      };
    }
    return undefined;
  }, [position, customPosition]);
  
  const positionClass = position === 'custom'
    ? undefined
    : position === 'top' 
    ? 'top-4' 
    : position === 'center' 
    ? 'top-1/2 -translate-y-1/2' 
    : 'bottom-16';
  
  const hasBackground = resolvedBgColor && resolvedBgColor !== 'transparent';
  
  // Build style object without conflicting properties
  // Never mix 'background' (shorthand) and 'backgroundColor' (non-shorthand)
  const textStyle = useMemo(() => {
    const style: React.CSSProperties = {
      fontFamily: resolvedFontFamily,
      fontStyle: template.style,
      fontWeight,
      textTransform: template.transform,
      fontSize: `${fontSize * 0.6}px`,
      textShadow: strokeShadow,
    };
    
    // Handle gradient colors (use background for gradient)
    if (isGradient && gradientBg) {
      // For gradients, use background (shorthand) - never set backgroundColor
      style.background = gradientBg;
      style.WebkitBackgroundClip = 'text';
      style.WebkitTextFillColor = 'transparent';
      // Explicitly don't set backgroundColor when using background
    } else {
      // For non-gradient, use color property for text color
      style.color = resolvedColor;
      
      // Handle background color (only if not gradient and has background)
      // Use backgroundColor (non-shorthand) - never set background
      if (hasBackground) {
        style.backgroundColor = resolvedBgColor;
        style.padding = '4px 12px';
        style.borderRadius = '6px';
      }
    }
    
    return style;
  }, [
    resolvedFontFamily,
    template.style,
    fontWeight,
    template.transform,
    fontSize,
    strokeShadow,
    isGradient,
    gradientBg,
    resolvedColor,
    hasBackground,
    resolvedBgColor,
  ]);
  
  return (
    <div 
      className={`absolute left-0 right-0 flex justify-center px-4 ${positionClass || ''}`}
      style={positionStyle}
    >
      <span style={textStyle}>
        {text}
      </span>
    </div>
  );
};







