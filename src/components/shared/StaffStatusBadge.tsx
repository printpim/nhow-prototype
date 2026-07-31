import { cn } from '@/lib/utils';
import type { StaffOrderStatus } from '@/lib/types';
import { STAFF_STATUS_META } from '@/lib/status';

const toneClasses: Record<string, string> = {
  submitted: 'bg-status-submitted/10 text-status-submitted border-status-submitted/25',
  inwash: 'bg-status-inwash/12 text-status-inwash border-status-inwash/30',
  ready: 'bg-status-ready/12 text-status-ready border-status-ready/30',
  delivered: 'bg-status-delivered/12 text-status-delivered border-status-delivered/30',
};

const dotClasses: Record<string, string> = {
  submitted: 'bg-status-submitted',
  inwash: 'bg-status-inwash',
  ready: 'bg-status-ready',
  delivered: 'bg-status-delivered',
};

export function StaffStatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: StaffOrderStatus;
  className?: string;
  showDot?: boolean;
}) {
  const meta = STAFF_STATUS_META[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono-tag text-[10px] font-semibold uppercase tracking-[0.12em]',
        toneClasses[meta.tone],
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[meta.tone])} />}
      {meta.short}
    </span>
  );
}
