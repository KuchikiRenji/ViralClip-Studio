import { useEffect, useRef, useCallback, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnap?: number;
  showHandle?: boolean;
  showCloseButton?: boolean;
  className?: string;
  maxHeight?: string;
}

const DRAG_THRESHOLD = 50;
const VELOCITY_THRESHOLD = 0.5;

export const BottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  className = '',
  maxHeight = '90vh',
}: BottomSheetProps) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  const currentHeight = `${snapPoints[currentSnapIndex] * 100}vh`;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentSnapIndex(initialSnap);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSnap]);

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
    setDragCurrentY(clientY);
    setDragStartTime(Date.now());
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    setDragCurrentY(clientY);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;

    const dragDistance = dragCurrentY - dragStartY;
    const dragDuration = Date.now() - dragStartTime;
    const velocity = Math.abs(dragDistance) / dragDuration;

    setIsDragging(false);

    if (dragDistance > DRAG_THRESHOLD || (velocity > VELOCITY_THRESHOLD && dragDistance > 0)) {
      if (currentSnapIndex > 0) {
        setCurrentSnapIndex(currentSnapIndex - 1);
      } else {
        onClose();
      }
    } else if (dragDistance < -DRAG_THRESHOLD || (velocity > VELOCITY_THRESHOLD && dragDistance < 0)) {
      if (currentSnapIndex < snapPoints.length - 1) {
        setCurrentSnapIndex(currentSnapIndex + 1);
      }
    }
  }, [isDragging, dragCurrentY, dragStartY, dragStartTime, currentSnapIndex, snapPoints.length, onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    handleDragMove(e.clientY);
  }, [handleDragMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    handleDragEnd();
  }, [handleDragEnd]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dragOffset = isDragging ? Math.max(0, dragCurrentY - dragStartY) : 0;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${className}`}
        style={{
          height: currentHeight,
          maxHeight,
          transform: `translateY(${dragOffset}px)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
      >
        {showHandle && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
          </div>
        )}

        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            {title && (
              <h2 id="bottom-sheet-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors touch-target"
                aria-label="Close"
                type="button"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar"
          style={{ maxHeight: `calc(${currentHeight} - 80px)` }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
