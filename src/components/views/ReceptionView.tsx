import { useMemo } from 'react';
import { Bell, CheckCircle2, Clock, MapPin, PackageCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import type { Bag } from '@/lib/types';
import { formatTimeAgo } from '@/lib/status';
import { totalItemCount, SERVICE_LABEL } from '@/lib/items';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ItemIcon } from '@/components/shared/ItemIcon';
import { toast } from 'sonner';

export function ReceptionView() {
  const { data, advance, currentStaff } = useStore();

  const pending = useMemo(
    () => data.bags.filter((b) => b.status === 'pickup').sort((x, y) => x.timeline.pickup - y.timeline.pickup),
    [data.bags],
  );

  const handleSend = (bag: Bag) => {
    advance(bag.id);
    toast.success('Sent to laundry', { description: `Room ${bag.roomNumber} bag checked in and transferred to the laundry.` });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col md:max-w-3xl">
      <StaffHeader
        title="Reception"
        subtitle="Check in bags dropped by guests and send them to the laundry."
        staffName={currentStaff?.name ?? 'Reception'}
      />

      <div className="px-4 pb-4 pt-4">
        <SummaryTile icon={<Bell className="h-4 w-4" />} label="Bags awaiting check-in" count={pending.length} />
      </div>

      <div className="flex-1 px-4 pb-6">
        {pending.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="h-7 w-7" />} title="Nothing to check in" subtitle="Bags guests drop at reception will appear here." />
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)] pr-3">
            <div className="space-y-3 pr-2">
              {pending.map((bag) => (
                <BagCard key={bag.id} bag={bag} onSend={() => handleSend(bag)} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export function StaffHeader({ title, subtitle, staffName }: { title: string; subtitle: string; staffName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-mono-tag text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">nhow · ops</p>
          <h1 className="font-display text-lg font-bold uppercase leading-tight tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-card px-2.5 py-1.5 text-xs shadow-sm">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-brand-gradient text-white">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold">{staffName}</p>
            <p className="font-mono-tag text-[9px] uppercase tracking-wider text-muted-foreground">On shift</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SummaryTile({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  return (
    <Card className="border-foreground/10 shadow-card">
      <CardContent className="flex items-center gap-3 p-3.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="leading-tight">
          <p className="font-display text-2xl font-bold tabular-nums">{count}</p>
          <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BagCard({ bag, onSend }: { bag: Bag; onSend: () => void }) {
  const room = useStore().data.rooms.find((r) => r.number === bag.roomNumber);
  const count = totalItemCount(bag.items);
  return (
    <Card className="border-foreground/10 shadow-card transition hover:shadow-glow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-base font-bold uppercase leading-tight tracking-tight">Room {bag.roomNumber}</p>
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono-tag text-xs text-muted-foreground">Floor {room?.floor ?? '—'}</span>
              </div>
              <p className="text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
              <p className="mt-1 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" /> Dropped off {formatTimeAgo(bag.timeline.pickup)}
              </p>
            </div>
          </div>
          <StatusBadge status={bag.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bag.items.map((i) => (
            <span key={i.itemId} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono-tag text-[10px] font-medium uppercase tracking-wider">
              <ItemIcon id={i.itemId} className="h-3 w-3 text-muted-foreground" />
              {i.itemId.replace(/_/g, ' ')} ×{i.qty}
              <span className="text-muted-foreground/70">· {SERVICE_LABEL[i.service]}</span>
            </span>
          ))}
        </div>
        <Button className="mt-3 w-full" size="lg" onClick={onSend}>
          <PackageCheck className="h-4 w-4" /> Check In & Send to Laundry
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 bg-muted/20 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
