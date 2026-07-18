import { cn } from '@/lib/utils';
import type { BagStatus } from '@/lib/types';
import { STATUS_META } from '@/lib/status';

const toneClasses: Record<string, string> = {
  submitted: 'bg-status-submitted/12 text-status-submitted border-status-submitted/25',
  pickup: 'bg-status-pickup/15 text-status-pickup border-status-pickup/30',
  atlaundry: 'bg-status-atlaundry/15 text-status-atlaundry border-status-atlaundry/30',
  inwash: 'bg-status-inwash/15 text-status-inwash border-status-inwash/30',
  ready: 'bg-status-ready/15 text-status-ready border-status-ready/30',
  delivered: 'bg-status-delivered/15 text-status-delivered border-status-delivered/30',
};

const dotClasses: Record<string, string> = {
  submitted: 'bg-status-submitted',
  pickup: 'bg-status-pickup',
  atlaundry: 'bg-status-atlaundry',
  inwash: 'bg-status-inwash',
  ready: 'bg-status-ready',
  delivered: 'bg-status-delivered',
};

export function StatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: BagStatus;
  className?: string;
  showDot?: boolean;
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        toneClasses[meta.tone],
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[meta.tone])} />}
      {meta.short}
    </span>
  );
}

export function StatusDot({ status, className }: { status: BagStatus; className?: string }) {
  return <span className={cn('h-2 w-2 rounded-full', dotClasses[STATUS_META[status].tone], className)} />;
}
