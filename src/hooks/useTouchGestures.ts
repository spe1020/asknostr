import { useRef, useCallback, useEffect } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  preventDefault?: boolean;
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export function useTouchGestures(options: TouchGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onLongPress,
    onPinchIn,
    onPinchOut,
    swipeThreshold = 50,
    longPressDelay = 500,
    preventDefault = true,
  } = options;

  const touchStartRef = useRef<TouchPoint | null>(null);
  const touchEndRef = useRef<TouchPoint | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    // Handle long press
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
      }, longPressDelay);
    }

    // Handle pinch gestures
    if (e.touches.length === 2 && (onPinchIn || onPinchOut)) {
      initialDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, [onLongPress, longPressDelay, onPinchIn, onPinchOut, getDistance, preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    // Handle pinch gestures
    if (e.touches.length === 2 && initialDistanceRef.current && (onPinchIn || onPinchOut)) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;

      if (scale < 0.8 && onPinchIn) {
        onPinchIn(scale);
      } else if (scale > 1.2 && onPinchOut) {
        onPinchOut(scale);
      }
    }

    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [onPinchIn, onPinchOut, getDistance, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }

    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Reset long press flag
    isLongPressRef.current = false;

    // Reset pinch distance
    initialDistanceRef.current = null;

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
    };

    // Calculate swipe direction
    const start = touchStartRef.current;
    const end = touchEndRef.current;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const deltaTime = end.timestamp - start.timestamp;

    // Only process swipes that are fast enough and long enough
    if (deltaTime < 300 && Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > swipeThreshold && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < -swipeThreshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > swipeThreshold && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < -swipeThreshold && onSwipeUp) {
          onSwipeUp();
        }
      }
    }

    // Reset touch points
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    swipeThreshold,
    preventDefault,
  ]);

  const attachGestures = useCallback((element: HTMLElement) => {
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  const cleanup = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    attachGestures,
    cleanup,
    isLongPress: isLongPressRef.current,
  };
}
