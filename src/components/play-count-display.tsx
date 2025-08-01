
'use client';

import { Flame, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

interface PlayCountDisplayProps {
  quarterly?: number;
  total?: number;
}

const getQuarterlyColor = (count: number) => {
  if (count > 4) return 'text-destructive';
  if (count > 2) return 'text-accent-foreground';
  return 'text-muted-foreground';
};

export function PlayCountDisplay({ quarterly = 0, total = 0 }: PlayCountDisplayProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      <Badge variant="outline" className={cn("flex items-center gap-1.5 border-none p-0 font-normal", getQuarterlyColor(quarterly))}>
        <Flame className="h-3.5 w-3.5" />
        <span className="font-semibold">{quarterly}</span>
        <span className="hidden sm:inline-block text-muted-foreground/80">no tri.</span>
      </Badge>
      <Badge variant="outline" className="flex items-center gap-1.5 border-none p-0 font-normal text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        <span className="font-semibold">{total}</span>
        <span className="hidden sm:inline-block text-muted-foreground/80">no total</span>
      </Badge>
    </div>
  );
}
