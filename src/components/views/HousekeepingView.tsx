import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, BedDouble, CheckCircle2, Clock, DoorOpen, MapPin, PackageCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import type { Bag } from '@/lib/types';
import { formatTimeAgo } from '@/lib/status';
import { totalItemCount } from '@/lib/items';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { toast } from 'sonner';

export function HousekeepingView() {
  const { data, advance, currentStaff } = useStore();
  const [tab, setTab] = useState<'pickup' | 'delivery'>('pickup');

  const pickups = useMemo(
    () => data.bags.filter((b) => b.status === 'pickup').sort((x, y) => x.timeline.pickup - y.timeline.pickup),
    [data.bags],
  );
  const deliveries = useMemo(
    () => data.bags.filter((b) => b.status === 'ready').sort((x, y) => y.timeline.ready - x.timeline.ready),
    [data.bags],
  );

  const handlePickup = (bag: Bag) => {
    advance(bag.id);
    toast.success('Bag collected', { description: `Room ${bag.roomNumber} marked as picked up & dropped at laundry.` });
  };
  const handleDeliver = (bag: Bag) => {
    advance(bag.id);
    toast.success('Delivered to room', { description: `Room ${bag.roomNumber} — laundry returned to guest.` });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col md:max-w-3xl">
      <StaffHeader
        title="Housekeeping"
        subtitle="Collect bags from rooms, return clean laundry to guests."
        staffName={currentStaff?.name ?? 'Housekeeping'}
      />

      <div className="px-4 pb-4 pt-4">
        <div className="grid grid-cols-2 gap-2.5">
          <SummaryTile
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            label="Pickups"
            count={pickups.length}
            tone="pickup"
          />
          <SummaryTile
            icon={<ArrowDownToLine className="h-4 w-4" />}
            label="Deliveries"
            count={deliveries.length}
            tone="ready"
          />
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'pickup' | 'delivery')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pickup" className="gap-1.5">
              <ArrowUpFromLine className="h-3.5 w-3.5" /> Pickups
              {pickups.length > 0 && <span className="ml-1 rounded-full bg-status-pickup/20 px-1.5 text-[10px] font-bold text-status-pickup">{pickups.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1.5">
              <ArrowDownToLine className="h-3.5 w-3.5" /> Deliveries
              {deliveries.length > 0 && <span className="ml-1 rounded-full bg-status-ready/20 px-1.5 text-[10px] font-bold text-status-ready">{deliveries.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pickup" className="mt-4">
            {pickups.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="h-7 w-7" />} title="No pickups pending" subtitle="All requested bags have been collected." />
            ) : (
              <ScrollArea className="h-[calc(100vh-340px)] pr-3">
                <div className="space-y-3 pr-2">
                  {pickups.map((bag) => (
                    <BagCard
                      key={bag.id}
                      bag={bag}
                      primaryAction={{
                        label: 'Picked Up & Dropped at Laundry',
                        icon: <PackageCheck className="h-4 w-4" />,
                        onClick: () => handlePickup(bag),
                      }}
                      showAge
                      ageFrom="pickup"
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            {deliveries.length === 0 ? (
              <EmptyState icon={<CheckCircle2 className="h-7 w-7" />} title="Nothing to deliver" subtitle="Clean laundry will appear here when it is ready." />
            ) : (
              <ScrollArea className="h-[calc(100vh-340px)] pr-3">
                <div className="space-y-3 pr-2">
                  {deliveries.map((bag) => (
                    <BagCard
                      key={bag.id}
                      bag={bag}
                      primaryAction={{
                        label: 'Mark Delivered to Room',
                        icon: <DoorOpen className="h-4 w-4" />,
                        onClick: () => handleDeliver(bag),
                      }}
                      showAge
                      ageFrom="ready"
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function StaffHeader({ title, subtitle, staffName }: { title: string; subtitle: string; staffName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">LinenLoop</p>
          <h1 className="font-display text-lg font-semibold leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="leading-tight">
            <p className="font-medium">{staffName}</p>
            <p className="text-[10px] text-muted-foreground">On shift</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SummaryTile({ icon, label, count, tone }: { icon: React.ReactNode; label: string; count: number; tone: 'pickup' | 'ready' }) {
  const toneCls = tone === 'pickup' ? 'text-status-pickup bg-status-pickup/10' : 'text-status-ready bg-status-ready/10';
  return (
    <Card className="border-border/70 shadow-soft">
      <CardContent className="flex items-center gap-3 p-3.5">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${toneCls}`}>{icon}</div>
        <div className="leading-tight">
          <p className="font-display text-2xl font-semibold tabular-nums">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function BagCard({
  bag,
  primaryAction,
  showAge,
  ageFrom,
}: {
  bag: Bag;
  primaryAction: { label: string; icon: React.ReactNode; onClick: () => void };
  showAge?: boolean;
  ageFrom?: 'pickup' | 'ready' | 'at_laundry' | 'in_wash';
}) {
  const room = useStore().data.rooms.find((r) => r.number === bag.roomNumber);
  const count = totalItemCount(bag.items);
  const ageTs = ageFrom ? bag.timeline[ageFrom] : bag.createdAt;
  return (
    <Card className="border-border/70 shadow-soft transition hover:shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-display text-base font-semibold leading-tight">Room {bag.roomNumber}</p>
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Floor {room?.floor ?? '—'}</span>
              </div>
              <p className="text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
              {showAge && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> Waiting {formatTimeAgo(ageTs)}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={bag.status} />
        </div>
        <Button className="mt-3 w-full" size="lg" onClick={primaryAction.onClick}>
          {primaryAction.icon}
          {primaryAction.label}
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
