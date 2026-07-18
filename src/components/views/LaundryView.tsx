import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PackageSearch, WashingMachine, Minus, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useStore } from '@/lib/store';
import type { Bag } from '@/lib/types';
import { ITEM_MAP, totalItemCount } from '@/lib/items';
import { formatTimeAgo } from '@/lib/status';
import { ItemIcon } from '@/components/shared/ItemIcon';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { StaffHeader } from './HousekeepingView';
import { toast } from 'sonner';

export function LaundryView() {
  const { data, advance, currentStaff } = useStore();
  const [tab, setTab] = useState<'checkin' | 'wash'>('checkin');
  const [activeId, setActiveId] = useState<string | null>(null);

  const checkinBags = useMemo(
    () => data.bags.filter((b) => b.status === 'at_laundry' && !b.verified).sort((a, b) => a.timeline.at_laundry - b.timeline.at_laundry),
    [data.bags],
  );
  const washBags = useMemo(
    () => data.bags.filter((b) => b.status === 'in_wash').sort((a, b) => a.timeline.in_wash - b.timeline.in_wash),
    [data.bags],
  );

  const activeBag = data.bags.find((b) => b.id === activeId) ?? null;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col md:max-w-3xl">
      <StaffHeader
        title="Laundry Station"
        subtitle="Verify incoming bags, then process through the wash cycle."
        staffName={currentStaff?.name ?? 'Laundry'}
      />

      <div className="px-4 pb-4 pt-4">
        <div className="grid grid-cols-2 gap-2.5">
          <SummaryTile icon={<PackageSearch className="h-4 w-4" />} label="Awaiting check-in" count={checkinBags.length} tone="atlaundry" />
          <SummaryTile icon={<WashingMachine className="h-4 w-4" />} label="In wash" count={washBags.length} tone="inwash" />
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'checkin' | 'wash')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="checkin" className="gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" /> Check-in
              {checkinBags.length > 0 && <span className="ml-1 rounded-full bg-status-atlaundry/20 px-1.5 text-[10px] font-bold text-status-atlaundry">{checkinBags.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="wash" className="gap-1.5">
              <WashingMachine className="h-3.5 w-3.5" /> In Wash
              {washBags.length > 0 && <span className="ml-1 rounded-full bg-status-inwash/20 px-1.5 text-[10px] font-bold text-status-inwash">{washBags.length}</span>}
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
        </Tabs>
      </div>

      <CheckinDialog bag={activeBag} onClose={() => setActiveId(null)} />
    </div>
  );
}

function SummaryTile({ icon, label, count, tone }: { icon: React.ReactNode; label: string; count: number; tone: 'atlaundry' | 'inwash' }) {
  const toneCls = tone === 'atlaundry' ? 'text-status-atlaundry bg-status-atlaundry/10' : 'text-status-inwash bg-status-inwash/10';
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

function EmptyStateCard({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function CheckinCard({ bag, onOpen }: { bag: Bag; onOpen: () => void }) {
  const count = totalItemCount(bag.items);
  return (
    <Card className="border-border/70 shadow-soft transition hover:shadow-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-semibold leading-tight">Room {bag.roomNumber}</p>
              <StatusBadge status={bag.status} />
            </div>
            <p className="text-xs text-muted-foreground">{bag.guestName} · {count} items · arrived {formatTimeAgo(bag.timeline.at_laundry)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bag.items.map((i) => (
            <span key={i.itemId} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
              <ItemIcon id={i.itemId} className="h-3 w-3 text-muted-foreground" />
              {ITEM_MAP[i.itemId]?.label ?? i.itemId} ×{i.qty}
            </span>
          ))}
        </div>
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
    <Card className="border-status-inwash/30 bg-status-inwash/[0.03] shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-display text-base font-semibold leading-tight">Room {bag.roomNumber}</p>
              <StatusBadge status={bag.status} />
            </div>
            <p className="text-xs text-muted-foreground">{bag.guestName} · {count} items</p>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-status-inwash">
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

function CheckinDialog({ bag, onClose }: { bag: Bag | null; onClose: () => void }) {
  const { verifyItems, advance } = useStore();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const open = !!bag;
  const bagItems = bag?.items ?? [];

  // Reset verification counts whenever a different bag is opened.
  useEffect(() => {
    if (!bag) return;
    const c: Record<string, number> = {};
    bag.items.forEach((i) => (c[i.itemId] = 0));
    setCounts(c);
  }, [bag?.id]);

  const allMatch = bag ? bagItems.every((i) => (counts[i.itemId] ?? 0) === i.qty) : false;
  const anyChecked = bag ? bagItems.some((i) => (counts[i.itemId] ?? 0) > 0) : false;

  const setQty = (id: string, qty: number) =>
    setCounts((c) => ({ ...c, [id]: Math.max(0, Math.min(20, qty)) }));

  const confirm = () => {
    if (!bag) return;
    verifyItems(bag.id, counts);
    advance(bag.id);
    toast.success('Items verified', { description: `Room ${bag.roomNumber} moved into wash.` });
    onClose();
  };

  const close = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageSearch className="h-4 w-4 text-primary" /> Check-in · Room {bag?.roomNumber}
          </DialogTitle>
          <DialogDescription>Confirm each item matches what the guest logged before starting the wash.</DialogDescription>
        </DialogHeader>

        {bag && (
          <div className="space-y-2.5">
            {bagItems.map((i) => {
              const expected = i.qty;
              const actual = counts[i.itemId] ?? 0;
              const match = actual === expected;
              return (
                <div key={i.itemId} className={`rounded-xl border p-3 transition ${match ? 'border-status-ready/40 bg-status-ready/[0.05]' : 'border-border bg-card'}`}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground">
                      <ItemIcon id={i.itemId} className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{ITEM_MAP[i.itemId]?.label ?? i.itemId}</p>
                      <p className="text-xs text-muted-foreground">Guest logged: {expected}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => setQty(i.itemId, actual - 1)} disabled={actual === 0}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">{actual}</span>
                      <Button size="icon" className="h-7 w-7 rounded-full" onClick={() => setQty(i.itemId, actual + 1)} disabled={actual >= 20}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    {match && <CheckCircle2 className="h-4 w-4 text-status-ready" />}
                  </div>
                </div>
              );
            })}

            {anyChecked && !allMatch && (
              <div className="flex items-center gap-2 rounded-lg border border-status-atlaundry/30 bg-status-atlaundry/10 p-2.5 text-xs text-status-atlaundry">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Counts do not match the guest log. Adjust before confirming, or flag a discrepancy.
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={confirm} disabled={!allMatch}>
            <CheckCircle2 className="h-4 w-4" /> Verify & Start Wash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
