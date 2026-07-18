import { Hotel, Shirt, WashingMachine, BarChart3, UserRound, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';
import { useStore } from '@/lib/store';

const ROLE_ICONS: Record<Role, typeof Hotel> = {
  guest: UserRound,
  housekeeping: Shirt,
  laundry: WashingMachine,
  manager: BarChart3,
};

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Hotel className="h-5 w-5" strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold tracking-tight">LinenLoop</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Laundry Ops</div>
        </div>
      )}
    </div>
  );
}

export function RoleSwitcher() {
  const { role, setRole } = useStore();
  const [open, setOpen] = useState(false);

  const CurrentIcon = ROLE_ICONS[role];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-sm transition',
          'hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 rounded-md bg-primary/8 px-2 py-0.5 text-primary">
          <CurrentIcon className="h-3.5 w-3.5" />
          <span className="capitalize">{role}</span>
        </span>
        <span className="hidden text-muted-foreground sm:inline">view</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-card animate-fade-up"
        >
          <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Switch role view
          </p>
          {(['guest', 'housekeeping', 'laundry', 'manager'] as Role[]).map((r) => {
            const Icon = ROLE_ICONS[r];
            const active = r === role;
            return (
              <button
                key={r}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setRole(r);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition',
                  active ? 'bg-primary/8 text-primary' : 'hover:bg-muted',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 capitalize font-medium">{r}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
