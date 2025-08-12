import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  maxPullDistance?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  maxPullDistance = 120,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshed, setIsRefreshed] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only handle touch start if we're at the top of the scroll
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow pulling down
    if (deltaY > 0) {
      e.preventDefault();
      
      const newPullDistance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(newPullDistance);
      
      if (newPullDistance > threshold) {
        setIsPulling(true);
      } else {
        setIsPulling(false);
      }
    }
  }, [threshold, maxPullDistance, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (isPulling && pullDistance > threshold) {
      // Trigger refresh
      setIsRefreshing(true);
      setIsRefreshed(false);
      
      try {
        await onRefresh();
        setIsRefreshed(true);
        
        // Show success state briefly
        setTimeout(() => {
          setIsRefreshed(false);
          setPullDistance(0);
          setIsRefreshing(false);
        }, 1000);
      } catch {
        // Reset on error
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      // Reset if not pulled enough
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isPulling, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const getRefreshIcon = () => {
    if (isRefreshed) {
      return <Check className="h-6 w-6 text-green-500" />;
    }
    
    if (isRefreshing) {
      return <RotateCcw className="h-6 w-6 animate-spin text-primary" />;
    }
    
    return <RotateCcw className="h-6 w-6 text-muted-foreground" />;
  };

  const getRefreshText = () => {
    if (isRefreshed) {
      return 'Refreshed!';
    }
    
    if (isRefreshing) {
      return 'Refreshing...';
    }
    
    if (isPulling) {
      return 'Release to refresh';
    }
    
    return 'Pull to refresh';
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-center transition-all duration-200 ease-out",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          transform: `translateY(${Math.min(pullDistance, maxPullDistance)}px)`,
        }}
      >
        <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg border">
          {getRefreshIcon()}
        </div>
        <span className="text-sm text-muted-foreground mt-2 font-medium">
          {getRefreshText()}
        </span>
      </div>

      {/* Content container */}
      <div
        ref={containerRef}
        className="h-full overflow-auto"
        style={{
          transform: `translateY(${Math.min(pullDistance, maxPullDistance)}px)`,
          transition: isRefreshing ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
