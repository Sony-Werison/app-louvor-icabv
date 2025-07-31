import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Music className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-headline font-bold text-primary-foreground">
        Louvor ICABV
      </h1>
    </div>
  );
}
