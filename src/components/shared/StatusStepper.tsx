import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BagStatus } from '@/lib/types';
import { STATUS_FLOW, STATUS_META } from '@/lib/status';

const dotTone: Record<string, string> = {
  submitted: 'bg-status-submitted',
  pickup: 'bg-status-pickup',
  atlaundry: 'bg-status-atlaundry',
  inwash: 'bg-status-inwash',
  ready: 'bg-status-ready',
  delivered: 'bg-status-delivered',
};

const ringTone: Record<string, string> = {
  submitted: 'ring-status-submitted/30 text-status-submitted',
  pickup: 'ring-status-pickup/30 text-status-pickup',
  atlaundry: 'ring-status-atlaundry/30 text-status-atlaundry',
  inwash: 'ring-status-inwash/30 text-status-inwash',
  ready: 'ring-status-ready/30 text-status-ready',
  delivered: 'ring-status-delivered/30 text-status-delivered',
};

export function StatusStepper({
  current,
  timestamps,
  orientation = 'vertical',
  className,
}: {
  current: BagStatus;
  timestamps?: Partial<Record<BagStatus, number>>;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}) {
  const currentIndex = STATUS_FLOW.indexOf(current);

  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-start justify-between">
          {STATUS_FLOW.map((s, i) => {
            const meta = STATUS_META[s];
            const done = i < currentIndex;
            const active = i === currentIndex;
            const upcoming = i > currentIndex;
            return (
              <div key={s} className="flex flex-1 flex-col items-center text-center">
                <div className="relative flex w-full items-center">
                  {i > 0 && (
                    <div
                      className={cn(
                        'absolute right-1/2 top-3 h-0.5 w-full',
                        i <= currentIndex ? 'bg-brand-gradient' : 'bg-border',
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'relative z-10 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                      done ? 'bg-brand-gradient text-white ring-primary/30' :
                      active && cn('bg-background', ringTone[meta.tone]),
                      upcoming && 'bg-background text-muted-foreground ring-border',
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </div>
                </div>
                <span
                  className={cn(
                    'mt-2 text-[11px] font-medium leading-tight',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {meta.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <ol className={cn('space-y-1', className)}>
      {STATUS_FLOW.map((s, i) => {
        const meta = STATUS_META[s];
        const done = i < currentIndex;
        const active = i === currentIndex;
        const upcoming = i > currentIndex;
        const ts = timestamps?.[s];
        return (
          <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
            {i < STATUS_FLOW.length - 1 && (
              <div
                className={cn(
                  'absolute left-[11px] top-7 h-[calc(100%-12px)] w-0.5',
                  done ? 'bg-brand-gradient' : 'bg-border',
                )}
              />
            )}
            <div
              className={cn(
                'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition-all',
                done && 'bg-brand-gradient text-white ring-primary/30',
                active && cn('bg-background', ringTone[meta.tone]),
                upcoming && 'bg-background text-muted-foreground ring-border',
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <span className={cn('h-2 w-2 rounded-full', active ? dotTone[meta.tone] : 'bg-muted-foreground/40')} />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-sm font-semibold', active ? 'text-foreground' : done ? 'text-foreground/80' : 'text-muted-foreground')}>
                  {meta.label}
                </span>
                {ts ? (
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : null}
              </div>
              <p className={cn('text-xs leading-snug', active ? 'text-muted-foreground' : 'text-muted-foreground/70')}>
                {meta.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
