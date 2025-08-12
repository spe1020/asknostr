import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size]
        )}
        style={{
          animation: 'spin 1s linear infinite'
        }}
      />
    </div>
  );
}

export function LoadingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-current animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
      <div className="h-2 w-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
      <div className="h-2 w-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
    </div>
  );
}
