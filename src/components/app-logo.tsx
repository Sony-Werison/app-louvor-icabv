
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image 
        src="/logo.png" 
        alt="Logotipo ICABV" 
        width={32} 
        height={32}
      />
      <h1 className="text-lg font-headline font-bold text-foreground hidden sm:block">
        Louvor ICABV
      </h1>
    </div>
  );
}
