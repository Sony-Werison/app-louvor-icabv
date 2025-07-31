import { cn } from '@/lib/utils';
import * as React from 'react';

export const Header = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      'sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-16 sm:px-6',
      className
    )}
    {...props}
  />
));
Header.displayName = 'Header';
