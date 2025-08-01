import { cn } from '@/lib/utils';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="bg-primary text-primary-foreground p-2 rounded-full flex items-center justify-center h-10 w-10">
        <span className="text-xs font-bold">ICABV</span>
      </div>
      <h1 className="text-lg font-headline font-bold text-primary-foreground">
        Louvor ICABV
      </h1>
    </div>
  );
}
