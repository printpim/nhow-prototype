import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, DoorOpen, Shirt, Info, Minus, PackageSearch, Plus, WashingMachine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useStore } from '@/lib/store';
import type { Bag, StaffLaundryOrder } from '@/lib/types';
import { ITEM_MAP, totalItemCount, SERVICE_LABEL, STAFF_UNIFORM_ITEMS } from '@/lib/items';
import { formatTimeAgo } from '@/lib/status';
import { ItemIcon } from '@/components/shared/ItemIcon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StaffStatusBadge } from '@/components/shared/StaffStatusBadge';
import { SignaturePad } from '@/components/shared/SignaturePad';
import { StaffHeader } from './ReceptionView';
import { toast } from 'sonner';

export function LaundryView() {
  const { data, advance, currentStaff, advanceStaffOrder } = useStore();
  const [tab, setTab] = useState<'checkin' | 'wash' | 'storage' | 'delivery'>('checkin');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collectOrder, setCollectOrder] = useState<StaffLaundryOrder | null>(null);

  const checkinBags = useMemo(
    () => data.bags.filter((b) => b.status === 'at_laundry' && !b.verified).sort((a, b) => a.timeline.at_laundry - b.timeline.at_laundry),
    [data.bags],
  );
  // Combine guest in_wash bags and staff in_washing orders into one queue.
  const washBags = useMemo(
    () => data.bags.filter((b) => b.status === 'in_wash').sort((a, b) => a.timeline.in_wash - b.timeline.in_wash),
    [data.bags],
  );
  const washStaff = useMemo(
    () => data.staffOrders.filter((o) => o.status === 'in_washing').sort((a, b) => a.dateTurnedIn - b.dateTurnedIn),
    [data.staffOrders],
  );
  const storageStaff = useMemo(
    () => data.staffOrders.filter((o) => o.status === 'in_storage').sort((a, b) => b.dateTurnedIn - a.dateTurnedIn),
    [data.staffOrders],
  );
  const deliveryBags = useMemo(
    () => data.bags.filter((b) => b.status === 'ready').sort((a, b) => b.timeline.ready - a.timeline.ready),
    [data.bags],
  );

  const activeBag = data.bags.find((b) => b.id === activeId) ?? null;
  const washCount = washBags.length + washStaff.length;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col md:max-w-3xl">
      <StaffHeader
        title="Laundry Station"
        subtitle="Verify, wash & store guest and staff laundry."
        staffName={currentStaff?.name ?? 'Laundry'}
      />

      <div className="px-4 pb-4 pt-4">
        <div className="grid grid-cols-4 gap-2.5">
          <SummaryTile icon={<PackageSearch className="h-4 w-4" />} label="Check-in" count={checkinBags.length} tone="atlaundry" />
          <SummaryTile icon={<WashingMachine className="h-4 w-4" />} label="In wash" count={washCount} tone="inwash" />
          <SummaryTile icon={<Shirt className="h-4 w-4" />} label="Storage" count={storageStaff.length} tone="ready" />
          <SummaryTile icon={<DoorOpen className="h-4 w-4" />} label="Deliver" count={deliveryBags.length} tone="ready" />
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'checkin' | 'wash' | 'storage' | 'delivery')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checkin" className="gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" /> Check-in
              {checkinBags.length > 0 && <span className="ml-1 rounded-full bg-status-atlaundry/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-atlaundry">{checkinBags.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="wash" className="gap-1.5">
              <WashingMachine className="h-3.5 w-3.5" /> Wash
              {washCount > 0 && <span className="ml-1 rounded-full bg-status-inwash/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-inwash">{washCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-1.5">
              <Shirt className="h-3.5 w-3.5" /> Storage
              {storageStaff.length > 0 && <span className="ml-1 rounded-full bg-status-ready/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-ready">{storageStaff.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-1.5">
              <DoorOpen className="h-3.5 w-3.5" /> Deliver
              {deliveryBags.length > 0 && <span className="ml-1 rounded-full bg-status-ready/20 px-1.5 font-mono-tag text-[10px] font-bold text-status-ready">{deliveryBags.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkin" className="mt-4">
            {checkinBags.length === 0 ? (
              <EmptyStateCard icon={<CheckCircle2 className="h-7 w-7" />} title="Check-in queue clear" subtitle="Incoming guest bags will appear here for item verification." />
            ) : (
              <ScrollArea className="h-[calc(100vh-360px)] pr-3">
                <div className="space-y-3 pr-2">
                  {checkinBags.map((bag) => (
                    <CheckinCard key={bag.id} bag={bag} onOpen={() => setActiveId(bag.id)} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="wash" className="mt-4">
            {washCount === 0 ? (
              <EmptyStateCard icon={<WashingMachine className="h-7 w-7" />} title="No machines running" subtitle="Verified guest bags and staff uniforms in wash appear here." />
            ) : (
              <ScrollArea className="h-[calc(100vh-360px)] pr-3">
                <div className="space-y-3 pr-2">
                  {washBags.map((bag) => (
                    <WashCard key={bag.id} bag={bag} onComplete={() => { advance(bag.id); toast.success('Wash complete', { description: `Room ${bag.roomNumber} marked ready for return.` }); }} />
                  ))}
                  {washStaff.map((order) => (
                    <StaffWashCard key={order.id} order={order} onComplete={() => { advanceStaffOrder(order.id); toast.success('Wash complete', { description: `${order.staffName}'s uniform moved to storage.` }); }} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="storage" className="mt-4">
            {storageStaff.length === 0 ? (
              <EmptyStateCard icon={<Shirt className="h-7 w-7" />} title="Storage empty" subtitle="Clean staff uniforms awaiting collection appear here." />
            ) : (
              <ScrollArea className="h-[calc(100vh-360px)] pr-3">
                <div className="space-y-3 pr-2">
                  {storageStaff.map((order) => (
                    <StaffStorageCard key={order.id} order={order} onCollect={() => setCollectOrder(order)} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="mt-4">
            {deliveryBags.length === 0 ? (
              <EmptyStateCard icon={<DoorOpen className="h-7 w-7" />} title="Nothing to deliver" subtitle="Clean guest laundry awaiting return to rooms will appear here." />
            ) : (
              <ScrollArea className="h-[calc(100vh-360px)] pr-3">
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
      <CollectDialog order={collectOrder} onClose={() => setCollectOrder(null)} />
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
      <CardContent className="flex items-center gap-2 p-3">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${toneCls}`}>{icon}</div>
        <div className="leading-tight">
          <p className="font-display text-xl font-bold tabular-nums">{count}</p>
          <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
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

function OrderTag({ type, label }: { type: 'GUEST' | 'STAFF'; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono-tag text-[10px] font-bold uppercase tracking-wider ${type === 'GUEST' ? 'bg-status-pickup/15 text-status-pickup' : 'bg-secondary/15 text-secondary'}`}>
      {type === 'GUEST' ? <Bell className="h-3 w-3" /> : <Shirt className="h-3 w-3" />}
      {type} · {label}
    </span>
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

function StaffItemChips({ order }: { order: StaffLaundryOrder }) {
  const filled = Object.entries(order.items).filter(([, v]) => v > 0);
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {filled.map(([key, qty]) => {
        const label = STAFF_UNIFORM_ITEMS.find((i) => i.key === key)?.label ?? key;
        return (
          <span key={key} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono-tag text-[10px] font-medium uppercase tracking-wider">
            <Shirt className="h-3 w-3 text-muted-foreground" />
            {label} ×{qty}
          </span>
        );
      })}
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
              <OrderTag type="GUEST" label={`Room ${bag.roomNumber}`} />
              <StatusBadge status={bag.status} />
            </div>
            <p className="mt-1 font-mono-tag text-xs text-muted-foreground">{bag.guestName} · {count} items · arrived {formatTimeAgo(bag.timeline.at_laundry)}</p>
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
              <OrderTag type="GUEST" label={`Room ${bag.roomNumber}`} />
              <StatusBadge status={bag.status} />
            </div>
            <p className="mt-1 font-mono-tag text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
            <p className="mt-1 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-status-inwash">
              <WashingMachine className="h-3 w-3" /> In wash since {formatTimeAgo(bag.timeline.in_wash)}
            </p>
          </div>
        </div>
        <Button className="mt-3 w-full bg-status-ready text-white hover:bg-status-ready/90" size="lg" onClick={onComplete}>
          <CheckCircle2 className="h-4 w-4" /> Ready for Delivery
        </Button>
      </CardContent>
    </Card>
  );
}

function StaffWashCard({ order, onComplete }: { order: StaffLaundryOrder; onComplete: () => void }) {
  return (
    <Card className="border-secondary/30 bg-secondary/[0.04] shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <OrderTag type="STAFF" label={order.department} />
              <StaffStatusBadge status={order.status} />
            </div>
            <p className="mt-1 font-mono-tag text-xs text-muted-foreground">{order.staffName} · {order.totalQuantity} items</p>
            <p className="mt-1 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-secondary">
              <WashingMachine className="h-3 w-3" /> In wash since {formatTimeAgo(order.dateTurnedIn)}
            </p>
          </div>
        </div>
        <StaffItemChips order={order} />
        <Button className="mt-3 w-full bg-secondary text-white hover:bg-secondary/90" size="lg" onClick={onComplete}>
          <Shirt className="h-4 w-4" /> Store Uniform
        </Button>
      </CardContent>
    </Card>
  );
}

function StaffStorageCard({ order, onCollect }: { order: StaffLaundryOrder; onCollect: () => void }) {
  return (
    <Card className="border-status-ready/30 bg-status-ready/[0.04] shadow-card transition hover:shadow-glow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <OrderTag type="STAFF" label={order.department} />
              <StaffStatusBadge status={order.status} />
            </div>
            <p className="mt-1 font-mono-tag text-xs text-muted-foreground">{order.staffName} · {order.totalQuantity} items</p>
            <p className="mt-1 flex items-center gap-1 font-mono-tag text-[10px] uppercase tracking-wider text-status-ready">
              <Shirt className="h-3 w-3" /> Tagged & ready for pickup
            </p>
          </div>
        </div>
        <StaffItemChips order={order} />
        <Button className="mt-3 w-full bg-status-ready text-white hover:bg-status-ready/90" size="lg" onClick={onCollect}>
          <Shirt className="h-4 w-4" /> Collect (Signature)
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
              <OrderTag type="GUEST" label={`Room ${bag.roomNumber}`} />
              <StatusBadge status={bag.status} />
            </div>
            <p className="mt-1 font-mono-tag text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
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

function CollectDialog({ order, onClose }: { order: StaffLaundryOrder | null; onClose: () => void }) {
  const { collectStaffOrder } = useStore();
  const [signature, setSignature] = useState<string | null>(null);
  const [collectorName, setCollectorName] = useState('');

  const open = !!order;

  useEffect(() => {
    if (order) {
      setSignature(null);
      setCollectorName(order.staffName);
    }
  }, [order?.id]);

  const confirm = () => {
    if (!order || !signature) return;
    const name = collectorName.trim() || order.staffName;
    collectStaffOrder(order.id, signature, name);
    toast.success('Uniform collected', { description: `${name}'s uniform marked collected with signature.` });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display uppercase tracking-tight">
            <Shirt className="h-4 w-4 text-status-ready" /> Collect uniform · {order?.staffName}
          </DialogTitle>
          <DialogDescription>
            {order?.department} · {order?.totalQuantity} items. The staff member signs below to confirm collection.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="space-y-3">
            <StaffItemChips order={order} />
            <div className="space-y-1.5">
              <label className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Collecting as</label>
              <Input value={collectorName} onChange={(e) => setCollectorName(e.target.value)} placeholder="Staff member name" />
            </div>
            <SignaturePad onChange={setSignature} />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={confirm} disabled={!signature} className="bg-status-ready text-white hover:bg-status-ready/90">
            <CheckCircle2 className="h-4 w-4" /> Confirm Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
