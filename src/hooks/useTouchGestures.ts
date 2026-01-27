import { useRef, useCallback, useEffect, useState } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface PinchState {
  initialDistance: number;
  currentDistance: number;
  scale: number;
  center: { x: number; y: number };
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  velocity: number;
}

interface UseTouchGesturesOptions {
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  onPinchStart?: () => void;
  onPinchEnd?: (finalScale: number) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  onDoubleTap?: (position: { x: number; y: number }) => void;
  onPan?: (delta: { x: number; y: number }, position: { x: number; y: number }) => void;
  onPanStart?: (position: { x: number; y: number }) => void;
  onPanEnd?: () => void;
  longPressDelay?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
  swipeVelocityThreshold?: number;
  disabled?: boolean;
}

interface UseTouchGesturesReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  isPinching: boolean;
  isPanning: boolean;
  isLongPressing: boolean;
  currentScale: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
}

const LONG_PRESS_DELAY_DEFAULT = 500;
const DOUBLE_TAP_DELAY_DEFAULT = 300;
const SWIPE_THRESHOLD_DEFAULT = 50;
const SWIPE_VELOCITY_THRESHOLD_DEFAULT = 0.5;
const DOUBLE_TAP_DISTANCE_THRESHOLD = 30;
const PAN_MOVEMENT_THRESHOLD = 10;

const getDistance = (touch1: { clientX: number; clientY: number }, touch2: { clientX: number; clientY: number }): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getCenter = (touch1: { clientX: number; clientY: number }, touch2: { clientX: number; clientY: number }): { x: number; y: number } => ({
  x: (touch1.clientX + touch2.clientX) / 2,
  y: (touch1.clientY + touch2.clientY) / 2,
});

export const useTouchGestures = (options: UseTouchGesturesOptions = {}): UseTouchGesturesReturn => {
  const {
    onPinch,
    onPinchStart,
    onPinchEnd,
    onSwipe,
    onLongPress,
    onDoubleTap,
    onPan,
    onPanStart,
    onPanEnd,
    longPressDelay = LONG_PRESS_DELAY_DEFAULT,
    doubleTapDelay = DOUBLE_TAP_DELAY_DEFAULT,
    swipeThreshold = SWIPE_THRESHOLD_DEFAULT,
    swipeVelocityThreshold = SWIPE_VELOCITY_THRESHOLD_DEFAULT,
    disabled = false,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [currentScale, setCurrentScale] = useState(1);

  const pinchStateRef = useRef<PinchState | null>(null);
  const swipeStateRef = useRef<SwipeState | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<TouchPoint | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number } | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touches = e.touches;

    if (touches.length === 2) {
      clearLongPressTimer();
      const distance = getDistance(touches[0], touches[1]);
      const center = getCenter(touches[0], touches[1]);
      
      pinchStateRef.current = {
        initialDistance: distance,
        currentDistance: distance,
        scale: 1,
        center,
      };
      
      setIsPinching(true);
      onPinchStart?.();
    } else if (touches.length === 1) {
      const touch = touches[0];
      const now = Date.now();
      const position = { x: touch.clientX, y: touch.clientY };

      if (lastTapRef.current && now - lastTapRef.current.timestamp < doubleTapDelay) {
        const dx = Math.abs(touch.clientX - lastTapRef.current.x);
        const dy = Math.abs(touch.clientY - lastTapRef.current.y);
        if (dx < DOUBLE_TAP_DISTANCE_THRESHOLD && dy < DOUBLE_TAP_DISTANCE_THRESHOLD) {
          onDoubleTap?.(position);
          lastTapRef.current = null;
          return;
        }
      }

      lastTapRef.current = { x: touch.clientX, y: touch.clientY, timestamp: now };
      lastPositionRef.current = position;

      swipeStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        direction: null,
        velocity: 0,
      };

      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        onLongPress?.(position);
      }, longPressDelay);

      setIsPanning(true);
      onPanStart?.(position);
    }
  }, [disabled, doubleTapDelay, longPressDelay, onDoubleTap, onLongPress, onPanStart, onPinchStart, clearLongPressTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    const touches = e.touches;

    if (touches.length === 2 && pinchStateRef.current) {
      clearLongPressTimer();
      const distance = getDistance(touches[0], touches[1]);
      const center = getCenter(touches[0], touches[1]);
      const scale = distance / pinchStateRef.current.initialDistance;
      
      pinchStateRef.current.currentDistance = distance;
      pinchStateRef.current.scale = scale;
      pinchStateRef.current.center = center;
      
      setCurrentScale(scale);
      onPinch?.(scale, center);
    } else if (touches.length === 1 && swipeStateRef.current) {
      const touch = touches[0];
      const dx = touch.clientX - swipeStateRef.current.startX;
      const dy = touch.clientY - swipeStateRef.current.startY;

      if (Math.abs(dx) > PAN_MOVEMENT_THRESHOLD || Math.abs(dy) > PAN_MOVEMENT_THRESHOLD) {
        clearLongPressTimer();
        setIsLongPressing(false);
      }

      swipeStateRef.current.currentX = touch.clientX;
      swipeStateRef.current.currentY = touch.clientY;

      if (Math.abs(dx) > Math.abs(dy)) {
        swipeStateRef.current.direction = dx > 0 ? 'right' : 'left';
      } else {
        swipeStateRef.current.direction = dy > 0 ? 'down' : 'up';
      }

      const position = { x: touch.clientX, y: touch.clientY };
      const delta = {
        x: lastPositionRef.current ? touch.clientX - lastPositionRef.current.x : 0,
        y: lastPositionRef.current ? touch.clientY - lastPositionRef.current.y : 0,
      };
      lastPositionRef.current = position;

      onPan?.(delta, position);
    }
  }, [disabled, onPan, onPinch, clearLongPressTimer]);

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    if (disabled) return;

    clearLongPressTimer();

    if (isPinching && pinchStateRef.current) {
      onPinchEnd?.(pinchStateRef.current.scale);
      pinchStateRef.current = null;
      setIsPinching(false);
    }

    if (swipeStateRef.current) {
      const { startX, startY, currentX, currentY, direction } = swipeStateRef.current;
      const dx = currentX - startX;
      const dy = currentY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - (lastTapRef.current?.timestamp || Date.now());
      const velocity = distance / duration;

      if (distance > swipeThreshold && velocity > swipeVelocityThreshold && direction) {
        onSwipe?.(direction, velocity);
      }

      swipeStateRef.current = null;
    }

    setIsPanning(false);
    setIsLongPressing(false);
    lastPositionRef.current = null;
    onPanEnd?.();
  }, [disabled, isPinching, onPinchEnd, onSwipe, onPanEnd, swipeThreshold, swipeVelocityThreshold, clearLongPressTimer]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'touch') return;
    
    const position = { x: e.clientX, y: e.clientY };
    lastPositionRef.current = position;
    setIsPanning(true);
    onPanStart?.(position);
  }, [disabled, onPanStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'touch' || !isPanning) return;

    const position = { x: e.clientX, y: e.clientY };
    const delta = {
      x: lastPositionRef.current ? e.clientX - lastPositionRef.current.x : 0,
      y: lastPositionRef.current ? e.clientY - lastPositionRef.current.y : 0,
    };
    lastPositionRef.current = position;

    onPan?.(delta, position);
  }, [disabled, isPanning, onPan]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (disabled || e.pointerType === 'touch') return;

    setIsPanning(false);
    lastPositionRef.current = null;
    onPanEnd?.();
  }, [disabled, onPanEnd]);

  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return {
    ref,
    isPinching,
    isPanning,
    isLongPressing,
    currentScale,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
    },
  };
};

export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches
      );
    };

    checkTouch();
    window.addEventListener('touchstart', () => setIsTouch(true), { once: true });
  }, []);

  return isTouch;
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

export const useIsMobile = (): boolean => useMediaQuery('(max-width: 767px)');
export const useIsTablet = (): boolean => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');