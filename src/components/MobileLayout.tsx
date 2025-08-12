import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  spacing?: 'none' | 'small' | 'medium' | 'large';
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export function MobileLayout({
  children,
  className,
  padding = 'medium',
  spacing = 'medium',
  maxWidth = 'lg',
}: MobileLayoutProps) {

  const paddingClasses = {
    none: '',
    small: 'p-2',
    medium: 'px-4 py-6',
    large: 'px-6 py-8',
  };

  const spacingClasses = {
    none: 'space-y-0',
    small: 'space-y-3',
    medium: 'space-y-6',
    large: 'space-y-8',
  };

  const maxWidthClasses = {
    none: '',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto",
          maxWidthClasses[maxWidth],
          paddingClasses[padding],
          spacingClasses[spacing]
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'medium' | 'large';
  interactive?: boolean;
  onClick?: () => void;
}

export function MobileCard({
  children,
  className,
  padding = 'medium',
  interactive = false,
  onClick,
}: MobileCardProps) {
  const isMobile = useIsMobile();

  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-lg shadow-sm",
        paddingClasses[padding],
        interactive && isMobile && "active:scale-[0.98] transition-transform duration-100",
        interactive && "cursor-pointer hover:shadow-md hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface MobileGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3;
  gap?: 'none' | 'small' | 'medium' | 'large';
}

export function MobileGrid({
  children,
  className,
  cols = 1,
  gap = 'medium',
}: MobileGridProps) {
  const isMobile = useIsMobile();

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  const gapClasses = {
    none: 'gap-0',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6',
  };

  return (
    <div
      className={cn(
        "grid",
        gridCols[cols],
        gapClasses[gap],
        isMobile && "gap-3", // Smaller gaps on mobile
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileStackProps {
  children: ReactNode;
  className?: string;
  spacing?: 'none' | 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export function MobileStack({
  children,
  className,
  spacing = 'medium',
  align = 'start',
  justify = 'start',
}: MobileStackProps) {
  const isMobile = useIsMobile();

  const spacingClasses = {
    none: 'space-y-0',
    small: 'space-y-2',
    medium: 'space-y-4',
    large: 'space-y-6',
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={cn(
        "flex flex-col",
        spacingClasses[spacing],
        alignClasses[align],
        justifyClasses[justify],
        isMobile && "space-y-3", // Smaller spacing on mobile
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileButtonProps {
  children: ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function MobileButton({
  children,
  className,
  size = 'medium',
  variant = 'primary',
  fullWidth = false,
  onClick,
  disabled = false,
}: MobileButtonProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    small: 'h-10 px-3 text-sm',
    medium: 'h-12 px-4 text-base',
    large: 'h-14 px-6 text-lg',
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        isMobile && "active:scale-[0.98] transition-transform duration-100",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
