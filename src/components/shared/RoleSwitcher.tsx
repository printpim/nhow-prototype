import { Bell, WashingMachine, BarChart3, UserRound, ChevronDown, Hotel, Shirt } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';
import { useStore } from '@/lib/store';

const ROLE_ICONS: Record<Role, typeof Hotel> = {
  guest: UserRound,
  staff: Shirt,
  reception: Bell,
  laundry: WashingMachine,
  manager: BarChart3,
};

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-glow">
        <Hotel className="h-5 w-5" strokeWidth={2.4} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[15px] font-bold uppercase tracking-tight">nhow<span className="text-brand-gradient">.</span>laundry</div>
          <div className="font-mono-tag text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Linen Ops · v2</div>
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
          'flex items-center gap-2 rounded-lg border border-foreground/10 bg-card px-3 py-1.5 text-xs font-semibold shadow-sm transition',
          'hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5 rounded-md bg-brand-gradient px-2 py-0.5 text-white">
          <CurrentIcon className="h-3.5 w-3.5" />
          <span className="capitalize">{role}</span>
        </span>
        <span className="hidden text-muted-foreground sm:inline">view</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-foreground/10 bg-popover p-1.5 shadow-card animate-fade-up"
        >
          <p className="px-2.5 py-1.5 font-mono-tag text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Switch role view
          </p>
          {(['guest', 'staff', 'reception', 'laundry', 'manager'] as Role[]).map((r) => {
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
                <span className="flex-1 font-semibold capitalize">{r}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
