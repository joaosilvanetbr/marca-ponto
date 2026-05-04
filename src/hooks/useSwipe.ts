import { useRef, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }: SwipeOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    isHorizontal.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startX.current;
    const diffY = touch.clientY - startY.current;

    // Determina direção no primeiro movimento significativo
    if (isHorizontal.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      isHorizontal.current = Math.abs(diffX) > Math.abs(diffY);
    }

    // Previne scroll horizontal se for swipe horizontal
    if (isHorizontal.current === true) {
      e.preventDefault();
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - startX.current;
    if (Math.abs(diffX) < threshold) return;

    if (diffX < 0 && onSwipeLeft) {
      onSwipeLeft();
    } else if (diffX > 0 && onSwipeRight) {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
