import { useState, useCallback, useRef, useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { DESIGN_TOKENS } from '../../../constants/designTokens';

interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
}

interface CanvasElement {
  id: string;
  type: 'video' | 'image' | 'text' | 'shape';
  src?: string;
  content?: string;
  transform: Transform;
  isLocked: boolean;
  isVisible: boolean;
  zIndex: number;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  };
}

interface VideoCanvasProps {
  width: number;
  height: number;
  elements: CanvasElement[];
  selectedElementId: string | null;
  backgroundColor: string;
  backgroundImage?: string;
  showGrid: boolean;
  showGuides: boolean;
  onElementsChange: (elements: CanvasElement[]) => void;
  onSelectElement: (id: string | null) => void;
  currentTime: number;
  isPlaying: boolean;
}

type DragMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-e' | 'resize-w' | 'rotate';

const HANDLE_SIZE = 10;
const ROTATION_HANDLE_OFFSET = 30;
const SNAP_THRESHOLD = 5;

export const VideoCanvas = ({
  width,
  height,
  elements,
  selectedElementId,
  backgroundColor,
  backgroundImage,
  showGrid,
  showGuides,
  onElementsChange,
  onSelectElement,
  currentTime,
  isPlaying,
}: VideoCanvasProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalTransform, setOriginalTransform] = useState<Transform | null>(null);
  const [guides, setGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const selectedElement = elements.find(e => e.id === selectedElementId);

  const getSnapPoints = useCallback((excludeId: string): { x: number[]; y: number[] } => {
    const points = {
      x: [0, width / 2, width],
      y: [0, height / 2, height],
    };
    
    elements
      .filter(e => e.id !== excludeId && e.isVisible)
      .forEach(e => {
        const { x, y, width: w, height: h } = e.transform;
        points.x.push(x, x + w / 2, x + w);
        points.y.push(y, y + h / 2, y + h);
      });
    
    return points;
  }, [elements, width, height]);

  const snapValue = useCallback((value: number, snapPoints: number[]): { value: number; snapped: boolean } => {
    for (const point of snapPoints) {
      if (Math.abs(value - point) < SNAP_THRESHOLD) {
        return { value: point, snapped: true };
      }
    }
    return { value, snapped: false };
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === canvasRef.current) {
      onSelectElement(null);
    }
  }, [onSelectElement]);

  const handleElementClick = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find(el => el.id === elementId);
    if (element?.isLocked) return;
    onSelectElement(elementId);
  }, [elements, onSelectElement]);

  const getClientCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  }, []);

  const handleDragStart = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    elementId: string,
    mode: DragMode
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || element.isLocked) return;
    
    const coords = getClientCoordinates(e);
    setIsDragging(true);
    setDragMode(mode);
    setDragStart(coords);
    setOriginalTransform({ ...element.transform });
    onSelectElement(elementId);
  }, [elements, onSelectElement, getClientCoordinates]);

  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !dragMode || !originalTransform || !selectedElementId) return;
    
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;
    
    const coords = getClientCoordinates(e);
    const deltaX = coords.x - dragStart.x;
    const deltaY = coords.y - dragStart.y;
    
    let newTransform = { ...originalTransform };
    const snapPoints = showGuides ? getSnapPoints(selectedElementId) : { x: [], y: [] };
    const activeGuides: { x: number[]; y: number[] } = { x: [], y: [] };
    
    switch (dragMode) {
      case 'move': {
        let newX = originalTransform.x + deltaX;
        let newY = originalTransform.y + deltaY;
        
        if (showGuides) {
          const snapX = snapValue(newX, snapPoints.x);
          const snapXCenter = snapValue(newX + newTransform.width / 2, snapPoints.x);
          const snapXRight = snapValue(newX + newTransform.width, snapPoints.x);
          
          if (snapX.snapped) {
            newX = snapX.value;
            activeGuides.x.push(snapX.value);
          } else if (snapXCenter.snapped) {
            newX = snapXCenter.value - newTransform.width / 2;
            activeGuides.x.push(snapXCenter.value);
          } else if (snapXRight.snapped) {
            newX = snapXRight.value - newTransform.width;
            activeGuides.x.push(snapXRight.value);
          }
          
          const snapY = snapValue(newY, snapPoints.y);
          const snapYCenter = snapValue(newY + newTransform.height / 2, snapPoints.y);
          const snapYBottom = snapValue(newY + newTransform.height, snapPoints.y);
          
          if (snapY.snapped) {
            newY = snapY.value;
            activeGuides.y.push(snapY.value);
          } else if (snapYCenter.snapped) {
            newY = snapYCenter.value - newTransform.height / 2;
            activeGuides.y.push(snapYCenter.value);
          } else if (snapYBottom.snapped) {
            newY = snapYBottom.value - newTransform.height;
            activeGuides.y.push(snapYBottom.value);
          }
        }
        
        newTransform.x = newX;
        newTransform.y = newY;
        break;
      }
      
      case 'resize-se': {
        newTransform.width = Math.max(20, originalTransform.width + deltaX);
        newTransform.height = Math.max(20, originalTransform.height + deltaY);
        break;
      }
      
      case 'resize-sw': {
        const newWidth = Math.max(20, originalTransform.width - deltaX);
        newTransform.x = originalTransform.x + originalTransform.width - newWidth;
        newTransform.width = newWidth;
        newTransform.height = Math.max(20, originalTransform.height + deltaY);
        break;
      }
      
      case 'resize-ne': {
        newTransform.width = Math.max(20, originalTransform.width + deltaX);
        const newHeight = Math.max(20, originalTransform.height - deltaY);
        newTransform.y = originalTransform.y + originalTransform.height - newHeight;
        newTransform.height = newHeight;
        break;
      }
      
      case 'resize-nw': {
        const newWidth = Math.max(20, originalTransform.width - deltaX);
        const newHeight = Math.max(20, originalTransform.height - deltaY);
        newTransform.x = originalTransform.x + originalTransform.width - newWidth;
        newTransform.y = originalTransform.y + originalTransform.height - newHeight;
        newTransform.width = newWidth;
        newTransform.height = newHeight;
        break;
      }
      
      case 'resize-n': {
        const newHeight = Math.max(20, originalTransform.height - deltaY);
        newTransform.y = originalTransform.y + originalTransform.height - newHeight;
        newTransform.height = newHeight;
        break;
      }
      
      case 'resize-s': {
        newTransform.height = Math.max(20, originalTransform.height + deltaY);
        break;
      }
      
      case 'resize-e': {
        newTransform.width = Math.max(20, originalTransform.width + deltaX);
        break;
      }
      
      case 'resize-w': {
        const newWidth = Math.max(20, originalTransform.width - deltaX);
        newTransform.x = originalTransform.x + originalTransform.width - newWidth;
        newTransform.width = newWidth;
        break;
      }
      
      case 'rotate': {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) break;
        
        const centerX = rect.left + originalTransform.x + originalTransform.width / 2;
        const centerY = rect.top + originalTransform.y + originalTransform.height / 2;
        
        const coords = getClientCoordinates(e);
        const angle = Math.atan2(coords.y - centerY, coords.x - centerX);
        const startAngle = Math.atan2(dragStart.y - centerY, dragStart.x - centerX);
        
        let rotation = ((angle - startAngle) * 180) / Math.PI + originalTransform.rotation;
        
        if (e.shiftKey) {
          rotation = Math.round(rotation / 15) * 15;
        }
        
        newTransform.rotation = rotation;
        break;
      }
    }
    
    setGuides(activeGuides);
    
    onElementsChange(elements.map(el => 
      el.id === selectedElementId ? { ...el, transform: newTransform } : el
    ));
  }, [isDragging, dragMode, originalTransform, selectedElementId, dragStart, elements, showGuides, getSnapPoints, snapValue, onElementsChange, getClientCoordinates]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragMode(null);
    setOriginalTransform(null);
    setGuides({ x: [], y: [] });
  }, []);

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        handleDrag(e);
      };
      const handleTouchEnd = () => handleDragEnd();
      
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      const element = elements.find(e => e.id === id);
      if (!element || element.type !== 'video') return;
      
      if (isPlaying) {
        video.play();
      } else {
        video.pause();
        video.currentTime = currentTime;
      }
    });
  }, [isPlaying, currentTime, elements]);

  const renderElement = (element: CanvasElement) => {
    const { transform, style } = element;
    const isSelected = selectedElementId === element.id;
    
    const elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: transform.x,
      top: transform.y,
      width: transform.width,
      height: transform.height,
      transform: `rotate(${transform.rotation}deg) scale(${transform.scale})`,
      opacity: transform.opacity,
      transformOrigin: 'center center',
      cursor: element.isLocked ? 'not-allowed' : 'move',
      pointerEvents: element.isVisible ? 'auto' : 'none',
      visibility: element.isVisible ? 'visible' : 'hidden',
    };
    
    return (
      <div
        key={element.id}
        style={{ ...elementStyle, zIndex: element.zIndex }}
        onClick={(e) => handleElementClick(e, element.id)}
        onMouseDown={(e) => handleDragStart(e, element.id, 'move')}
        onTouchStart={(e) => handleDragStart(e, element.id, 'move')}
      >
        {element.type === 'video' && element.src && (
          <video
            ref={(ref) => {
              if (ref) {
                videoRefs.current.set(element.id, ref);
              } else {
                videoRefs.current.delete(element.id);
              }
            }}
            src={element.src}
            className="w-full h-full object-cover rounded"
            muted
            loop
            playsInline
            preload="none"
          />
        )}
        
        {element.type === 'image' && element.src && (
          <img
            src={element.src}
            alt=""
            className="w-full h-full object-cover rounded"
            draggable={false}
          />
        )}
        
        {element.type === 'text' && (
          <div
            className="w-full h-full flex items-center justify-center p-2 overflow-hidden"
            style={{
              fontFamily: style?.fontFamily || 'Inter',
              fontSize: style?.fontSize || 24,
              fontWeight: style?.fontWeight || 400,
              color: style?.color || DESIGN_TOKENS.colors.editor.text.default,
              backgroundColor: style?.backgroundColor || DESIGN_TOKENS.colors.editor.text.bg,
              borderRadius: style?.borderRadius || 0,
              border: style?.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || DESIGN_TOKENS.colors.editor.text.default}` : 'none',
            }}
          >
            {element.content}
          </div>
        )}
        
        {element.type === 'shape' && (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: style?.backgroundColor || DESIGN_TOKENS.colors.editor.canvas.defaultBg,
              borderRadius: style?.borderRadius || 0,
              border: style?.borderWidth ? `${style.borderWidth}px solid ${style.borderColor || DESIGN_TOKENS.colors.editor.text.default}` : 'none',
            }}
          />
        )}
        
        {isSelected && !element.isLocked && (
          <>
            <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none rounded" />
            
            {(['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'] as const).map((position) => {
              const positionStyles: Record<string, React.CSSProperties> = {
                nw: { top: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nwse-resize' },
                ne: { top: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nesw-resize' },
                sw: { bottom: -HANDLE_SIZE / 2, left: -HANDLE_SIZE / 2, cursor: 'nesw-resize' },
                se: { bottom: -HANDLE_SIZE / 2, right: -HANDLE_SIZE / 2, cursor: 'nwse-resize' },
                n: { top: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2, cursor: 'ns-resize' },
                s: { bottom: -HANDLE_SIZE / 2, left: '50%', marginLeft: -HANDLE_SIZE / 2, cursor: 'ns-resize' },
                e: { right: -HANDLE_SIZE / 2, top: '50%', marginTop: -HANDLE_SIZE / 2, cursor: 'ew-resize' },
                w: { left: -HANDLE_SIZE / 2, top: '50%', marginTop: -HANDLE_SIZE / 2, cursor: 'ew-resize' },
              };
              
              return (
                <div
                  key={position}
                  className="absolute w-10 h-10 bg-white/20 border-2 border-blue-500 rounded-sm touch-target"
                  style={{
                    ...positionStyles[position],
                    marginLeft: positionStyles[position].marginLeft ? `calc(${positionStyles[position].marginLeft} - 18.75px)` : undefined,
                    marginTop: positionStyles[position].marginTop ? `calc(${positionStyles[position].marginTop} - 18.75px)` : undefined,
                  }}
                  onMouseDown={(e) => handleDragStart(e, element.id, `resize-${position}` as DragMode)}
                  onTouchStart={(e) => handleDragStart(e, element.id, `resize-${position}` as DragMode)}
                />
              );
            })}
            
            <div
              className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white/20 border-2 border-blue-500 rounded-full cursor-grab flex items-center justify-center touch-target"
              style={{ top: `calc(-${ROTATION_HANDLE_OFFSET}px - 16px)` }}
              onMouseDown={(e) => handleDragStart(e, element.id, 'rotate')}
              onTouchStart={(e) => handleDragStart(e, element.id, 'rotate')}
            >
              <RotateCw size={16} className="text-blue-500" />
            </div>
            <div
              className="absolute left-1/2 w-px h-5 bg-blue-500"
              style={{ top: -ROTATION_HANDLE_OFFSET + 16, transform: 'translateX(-50%)' }}
            />
          </>
        )}
        
        {element.isLocked && isSelected && (
          <div className="absolute inset-0 border-2 border-amber-500 border-dashed pointer-events-none rounded" />
        )}
      </div>
    );
  };

  return (
    <div className="relative select-none">
      <div
        ref={canvasRef}
        className="relative overflow-hidden rounded-xl shadow-2xl"
        style={{
          width,
          height,
          backgroundColor,
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={handleCanvasClick}
      >
        {showGrid && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={width}
            height={height}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="4,4" />
          </svg>
        )}
        
        {showGuides && (
          <svg className="absolute inset-0 pointer-events-none z-50" width={width} height={height}>
            {guides.x.map((x, i) => (
              <line key={`x-${i}`} x1={x} y1="0" x2={x} y2={height} stroke={DESIGN_TOKENS.colors.editor.canvas.guide} strokeWidth="1" />
            ))}
            {guides.y.map((y, i) => (
              <line key={`y-${i}`} x1="0" y1={y} x2={width} y2={y} stroke={DESIGN_TOKENS.colors.editor.canvas.guide} strokeWidth="1" />
            ))}
          </svg>
        )}
        
        {[...elements]
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(renderElement)}
      </div>
      
      {selectedElement && (
        <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-2 py-1">
            <span className="text-[10px] text-zinc-400">X:</span>
            <span className="text-[10px] text-white font-mono w-10">{Math.round(selectedElement.transform.x)}</span>
            <span className="text-[10px] text-zinc-400 ml-2">Y:</span>
            <span className="text-[10px] text-white font-mono w-10">{Math.round(selectedElement.transform.y)}</span>
            <span className="text-[10px] text-zinc-400 ml-2">W:</span>
            <span className="text-[10px] text-white font-mono w-10">{Math.round(selectedElement.transform.width)}</span>
            <span className="text-[10px] text-zinc-400 ml-2">H:</span>
            <span className="text-[10px] text-white font-mono w-10">{Math.round(selectedElement.transform.height)}</span>
            <span className="text-[10px] text-zinc-400 ml-2">R:</span>
            <span className="text-[10px] text-white font-mono w-10">{Math.round(selectedElement.transform.rotation)}°</span>
          </div>
        </div>
      )}
    </div>
  );
};


