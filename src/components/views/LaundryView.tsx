import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, DoorOpen, Info, Minus, PackageSearch, Plus, WashingMachine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/lib/store';
import type { Bag } from '@/lib/types';
import { ITEM_MAP, totalItemCount, SERVICE_LABEL } from '@/lib/items';
import { formatTimeAgo } from '@/lib/status';
import { ItemIcon } from '@/components/shared/ItemIcon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StaffHeader } from './ReceptionView';
import { toast } from 'sonner';

export function LaundryView() {
  const { data, advance, currentStaff } = useStore();
  const [tab, setTab] = useState<'checkin' | 'wash' | 'delivery'>('checkin');
  const [activeId, setActiveId] = useState<string | null>(null);

  const checkinBags = useMemo(
    () => data.bags.filter((b) => b.status === 'at_laundry' && !b.verified).sort((a, b) => a.timeline.at_laundry - b.timeline.at_laundry),
    [data.bags],
  );
  const washBags = useMemo(
    () => data.bags.filter((b) => b.status === 'in_wash').sort((a, b) => a.timeline.in_wash - b.timeline.in_wash),
    [data.bags],
  );
  const deliveryBags = useMemo(
    () => data.bags.filter((b) => b.status === 'ready').sort((a, b) => b.timeline.ready - a.timeline.ready),
    [data.bags],
  );

  const activeBag = data.bags.find((b) => b.id === activeId) ?? null;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col md:max-w-3xl">
      <StaffHeader
        title="Laundry Station"
        subtitle="Verify incoming bags, process the wash, and deliver clean laundry to rooms."
        staffName={currentStaff?.name ?? 'Laundry'}
      />

      <div className="px-4 pb-4 pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          <SummaryTile icon={<PackageSearch className="h-4 w-4" />} label="Check-in" count={checkinBags.length} tone="atlaundry" />
          <SummaryTile icon={<WashingMachine className="h-4 w-4" />} label="In wash" count={washBags.length} tone="inwash" />
          <SummaryTile icon={<DoorOpen className="h-4 w-4" />} label="Deliver" count={deliveryBags.length} tone="ready" />
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'checkin' | 'wash' | 'delivery')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checkin" className="gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" /> Check-in
              {checkinBags.length > 0 && <span className="ml-1 rounded-full bg-status-atlaundry/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-atlaundry">{checkinBags.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="wash" className="gap-1.5">
              <WashingMachine className="h-3.5 w-3.5" /> In Wash
              {washBags.length > 0 && <span className="ml-1 rounded-full bg-status-inwash/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-inwash">{washBags.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1.5">
              <DoorOpen className="h-3.5 w-3.5" /> Deliver
              {deliveryBags.length > 0 && <span className="ml-1 rounded-full bg-status-ready/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-ready">{deliveryBags.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="mt-4">
            {checkinBags.length === 0 ? (
              <EmptyStateCard icon={<CheckCircle2 className="h-7 w-7" />} title="Check-in queue clear" subtitle="Incoming bags will appear here for item verification." />
            ) : (
              <ScrollArea className="h-[calc(100vh-340px)] pr-3">
                <div className="space-y-3 pr-2">
                  {checkinBags.map((bag) => (
                    <CheckinCard key={bag.id} bag={bag} onOpen={() => setActiveId(bag.id)} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="wash" className="mt-4">
            {washBags.length === 0 ? (
              <EmptyStateCard icon={<WashingMachine className="h-7 w-7" />} title="No machines running" subtitle="Verified bags start their wash cycle here." />
            ) : (
              <ScrollArea className="h-[calc(100vh-340px)] pr-3">
                <div className="space-y-3 pr-2">
                  {washBags.map((bag) => (
                    <WashCard key={bag.id} bag={bag} onComplete={() => { advance(bag.id); toast.success('Wash complete', { description: `Room ${bag.roomNumber} marked ready for return.` }); }} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            {deliveryBags.length === 0 ? (
              <EmptyStateCard icon={<DoorOpen className="h-7 w-7" />} title="Nothing to deliver" subtitle="Clean, folded laundry awaiting return to rooms will appear here." />
            ) : (
              <ScrollArea className="h-[calc(100vh-340px)] pr-3">
                <div className="space-y-3 pr-2">
                  {deliveryBags.map((bag) => (
                    <DeliveryCard key={bag.id} bag={bag} onDeliver={() => { advance(bag.id); toast.success('Delivered to room', { description: `Room ${bag.roomNumber} — laundry returned to guest.` }); }} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CheckinDialog bag={activeBag} onClose={() => setActiveId(null)} />
    </div>
  );
}

function SummaryTile({ icon, label, count, tone }: { icon: React.ReactNode; label: string; count: number; tone: 'atlaundry' | 'inwash' | 'ready' }) {
  const toneCls = {
    atlaundry: 'text-status-atlaundry bg-status-atlaundry/10',
    inwash: 'text-status-inwash bg-status-inwash/10',
    ready: 'text-status-ready bg-status-ready/10',
  }[tone];
  return (
    <Card className="border-foreground/10 shadow-card">
      <CardContent className="flex items-center gap-2.5 p-3.5">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${toneCls}`}>{icon}</div>
        <div className="leading-tight">
          <p className="font-display text-2xl font-bold tabular-nums">{count}</p>
          <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foreground/15 bg-muted/20 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ItemChips({ bag }: { bag: Bag }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {bag.items.map((i) => (
        <span key={i.itemId} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono-tag text-[10px] font-medium uppercase tracking-wider">
          <ItemIcon id={i.itemId} className="h-3 w-3 text-muted-foreground" />
          {ITEM_MAP[i.itemId]?.label ?? i.itemId} ×{i.qty}
          <span className="text-muted-foreground/70">· {SERVICE_LABEL[i.service]}</span>
        </span>
      ))}
    </div>
  );
}

function CheckinCard({ bag, onOpen }: { bag: Bag; onOpen: () => void }) {
  const count = totalItemCount(bag.items);
  return (
    <Card className="border-foreground/10 shadow-card transition hover:shadow-glow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-bold uppercase leading-tight tracking-tight">Room {bag.roomNumber}</p>
              <StatusBadge status={bag.status} />
            </div>
            <p className="font-mono-tag text-xs text-muted-foreground">{bag.guestName} · {count} items · arrived {formatTimeAgo(bag.timeline.at_laundry)}</p>
          </div>
        </div>
        <ItemChips bag={bag} />
        <Button className="mt-3 w-full" size="lg" onClick={onOpen}>
          <PackageSearch className="h-4 w-4" /> Open check-in checklist
        </Button>
      </CardContent>
    </Card>
  );
}

function WashCard({ bag, onComplete }: { bag: Bag; onComplete: () => void }) {
  const count = totalItemCount(bag.items);
  return (
    <Card className="border-status-inwash/30 bg-status-inwash/[0.04] shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-bold uppercase leading-tight tracking-tight">Room {bag.roomNumber}</p>
              <StatusBadge status={bag.status} />
            </div>
            <p className="font-mono-tag text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
            <p className="mt-1 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-status-inwash">
              <WashingMachine className="h-3 w-3" /> In wash since {formatTimeAgo(bag.timeline.in_wash)}
            </p>
          </div>
        </div>
        <Button className="mt-3 w-full bg-status-ready text-white hover:bg-status-ready/90" size="lg" onClick={onComplete}>
          <CheckCircle2 className="h-4 w-4" /> Mark Wash Complete
        </Button>
      </CardContent>
    </Card>
  );
}

function DeliveryCard({ bag, onDeliver }: { bag: Bag; onDeliver: () => void }) {
  const count = totalItemCount(bag.items);
  return (
    <Card className="border-status-ready/30 bg-status-ready/[0.04] shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-bold uppercase leading-tight tracking-tight">Room {bag.roomNumber}</p>
              <StatusBadge status={bag.status} />
            </div>
            <p className="font-mono-tag text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
            <p className="mt-1 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-status-ready">
              <Bell className="h-3 w-3" /> Ready since {formatTimeAgo(bag.timeline.ready)}
            </p>
          </div>
        </div>
        <Button className="mt-3 w-full bg-status-ready text-white hover:bg-status-ready/90" size="lg" onClick={onDeliver}>
          <DoorOpen className="h-4 w-4" /> Mark Delivered to Room
        </Button>
      </CardContent>
    </Card>
  );
}

function CheckinDialog({ bag, onClose }: { bag: Bag | null; onClose: () => void }) {
  const { verifyItems, advance, notifyDiscrepancy } = useStore();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const open = !!bag;
  const bagItems = bag?.items ?? [];

  useEffect(() => {
    if (!bag) return;
    const c: Record<string, number> = {};
    bag.items.forEach((i) => (c[i.itemId] = 0));
    setCounts(c);
  }, [bag?.id]);

  const allMatch = bag ? bagItems.every((i) => (counts[i.itemId] ?? 0) === i.qty) : false;
  const anyChecked = bag ? bagItems.some((i) => (counts[i.itemId] ?? 0) > 0) : false;
  const hasDiscrepancy = bag ? !allMatch && anyChecked : false;

  const setQty = (id: string, qty: number) =>
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(20, qty)) }));

  const confirm = () => {
    if (!bag) return;
    const discrepancy = !allMatch && anyChecked;
    verifyItems(bag.id, counts);
    advance(bag.id);
    if (discrepancy) {
      notifyDiscrepancy(bag.id);
      toast.warning('Items verified with discrepancy', {
        description: `Room ${bag.roomNumber}: guest has been notified. Verified counts will be used for the payment receipt.`,
      });
    } else {
      toast.success('Items verified', { description: `Room ${bag.roomNumber} moved into wash.` });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display uppercase tracking-tight">
            <PackageSearch className="h-4 w-4 text-primary" /> Check-in · Room {bag?.roomNumber}
          </DialogTitle>
          <DialogDescription>Count each item as you check it. Counts that differ from the guest log will be flagged and used for the payment receipt.</DialogDescription>
        </DialogHeader>

        {bag && (
          <div className="space-y-2.5">
            {bagItems.map((i) => {
              const expected = i.qty;
              const actual = counts[i.itemId] ?? 0;
              const match = actual === expected;
              const washable = ITEM_MAP[i.itemId]?.washable ?? true;
              return (
                <div key={i.itemId} className={`rounded-xl border p-3 transition ${match ? 'border-status-delivered/40 bg-status-delivered/[0.05]' : 'border-foreground/10 bg-card'}`}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <ItemIcon id={i.itemId} className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold leading-tight">{ITEM_MAP[i.itemId]?.label ?? i.itemId}</p>
                      <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
                        Guest logged: {expected} · {SERVICE_LABEL[i.service]}
                      </p>
                      {!washable && (
                        <p className="mt-0.5 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
                          <Info className="h-3 w-3" /> Linen — handled by linen service, not washed here
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => setQty(i.itemId, actual - 1)} disabled={actual === 0}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center font-mono-tag text-sm font-bold tabular-nums">{actual}</span>
                      <Button size="icon" className="h-7 w-7 rounded-full" onClick={() => setQty(i.itemId, actual + 1)} disabled={actual >= 20}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {match && <CheckCircle2 className="h-4 w-4 text-status-delivered" />}
                  </div>
                </div>
              );
            })}

            {hasDiscrepancy && (
              <div className="flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary/10 p-2.5 text-xs text-secondary">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Counts differ from the guest log.</p>
                  <p className="text-secondary/80">You can still verify and start the wash. The guest will be notified, and your verified counts will be used for the payment receipt.</p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={!anyChecked}>
            <CheckCircle2 className="h-4 w-4" /> Verify & Start Wash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
