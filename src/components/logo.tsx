import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl shadow-lg shadow-primary/20">
        <BrainCircuit className="h-6 w-6 text-white" />
      </div>
      <span className="text-2xl font-headline font-black tracking-tighter text-foreground">
        SUVITTA<span className="text-primary italic">AI</span>
      </span>
    </div>
  );
}
