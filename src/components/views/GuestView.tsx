import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Clock, Droplets, Hand, Info, Minus, Plus, Shirt, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { LAUNDRY_ITEMS, ITEM_MAP, SERVICE_LABEL, totalItemCount } from '@/lib/items';
import type { BagItem, ServiceType } from '@/lib/types';
import { ItemIcon } from '@/components/shared/ItemIcon';
import { StatusStepper } from '@/components/shared/StatusStepper';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatTime, formatTimeAgo, progressPct } from '@/lib/status';
import { toast } from 'sonner';

export function GuestView({ roomNumber }: { roomNumber: string }) {
  const { data, activeBagForRoom, createBag, bagsForRoom } = useStore();
  const room = data.rooms.find((r) => r.number === roomNumber);
  const activeBag = activeBagForRoom(roomNumber);
  const history = bagsForRoom(roomNumber)
    .filter((b) => b.status === 'delivered')
    .sort((a, b) => b.timeline.delivered - a.timeline.delivered)
    .slice(0, 3);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [services, setServices] = useState<Record<string, ServiceType>>({});
  const [guestName, setGuestName] = useState(room?.guestName ?? '');
  const [note, setNote] = useState('');

  const totalItems = useMemo(() => Object.values(quantities).reduce((a, b) => a + b, 0), [quantities]);
  const hasActive = !!activeBag;

  const setQty = (id: string, qty: number) =>
    setQuantities((q) => ({ ...q, [id]: Math.max(0, Math.min(20, qty)) }));

  const setService = (id: string, svc: ServiceType) =>
    setServices((s) => ({ ...s, [id]: svc }));

  const submit = () => {
    const items: BagItem[] = LAUNDRY_ITEMS.filter((i) => (quantities[i.id] ?? 0) > 0).map((i) => ({
      itemId: i.id,
      qty: quantities[i.id],
      service: services[i.id] ?? 'wash',
    }));
    if (items.length === 0) {
      toast.error('Add at least one item', { description: 'Select the items you are putting in your laundry bag.' });
      return;
    }
    const name = guestName.trim() || room?.guestName || `Room ${roomNumber}`;
    createBag(roomNumber, items, name, note.trim() || undefined);
    setQuantities({});
    setServices({});
    setNote('');
    toast.success('Laundry logged', {
      description: `${items.reduce((a, b) => a + b.qty, 0)} items logged. Drop your bag at reception to start the process.`,
    });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      {/* Guest header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">LinenLoop</p>
            <h1 className="font-display text-lg font-semibold leading-tight">Laundry Service</h1>
          </div>
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-right shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Your Room</p>
            <p className="font-display text-base font-semibold leading-none">#{roomNumber}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 py-5">
        {hasActive ? (
          <ActiveTracker roomNumber={roomNumber} />
        ) : (
          <>
            <Hero roomNumber={roomNumber} guestName={guestName} setGuestName={setGuestName} />
            <Card className="overflow-hidden border-border/70 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    What are you washing?
                  </CardTitle>
                  {totalItems > 0 && (
                    <span className="rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {totalItems} item{totalItems === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {LAUNDRY_ITEMS.map((item) => {
                  const qty = quantities[item.id] ?? 0;
                  const svc = services[item.id] ?? 'wash';
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-3 py-2.5 transition ${
                        qty > 0 ? 'border-primary/30 bg-primary/[0.04]' : 'border-border/60 bg-card hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`grid h-9 w-9 place-items-center rounded-lg ${qty > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <ItemIcon id={item.id} className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">{item.label}</p>
                          {!item.washable && (
                            <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Info className="h-3 w-3" /> Linen — handled by linen service
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setQty(item.id, qty - 1)}
                            disabled={qty === 0}
                            aria-label={`Decrease ${item.label}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => setQty(item.id, qty + 1)}
                            disabled={qty >= 20}
                            aria-label={`Increase ${item.label}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {qty > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 pl-12">
                          <ServiceToggle
                            value={svc}
                            onChange={(v) => setService(item.id, v)}
                            disabled={!item.washable && false}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                <Separator className="my-3" />
                <div className="space-y-1.5">
                  <Label htmlFor="note" className="text-xs text-muted-foreground">
                    Special instructions <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <Input
                    id="note"
                    placeholder="Stain notes, preferred folding, fragrance-free, etc."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={140}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="sticky bottom-3 z-10">
              <Button
                size="lg"
                className="w-full rounded-xl text-base shadow-card transition active:scale-[0.98]"
                disabled={totalItems === 0}
                onClick={submit}
              >
                <Hand className="h-4 w-4" />
                Drop Off at Reception
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
                Log your items, then drop the bag at reception. Track every step below.
              </p>
            </div>

            {history.length > 0 && (
              <section className="pt-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recent history</p>
                <div className="space-y-2">
                  {history.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-status-ready" />
                        <span>{totalItemCount(b.items)} items</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(b.timeline.delivered)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ServiceToggle({ value, onChange, disabled }: { value: ServiceType; onChange: (v: ServiceType) => void; disabled?: boolean }) {
  const opts: { key: ServiceType; label: string; icon: typeof Shirt }[] = [
    { key: 'wash', label: 'Wash', icon: Droplets },
    { key: 'dryclean', label: 'Dry clean', icon: Shirt },
  ];
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            disabled={disabled}
            onClick={() => onChange(o.key)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <o.icon className="h-3 w-3" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Hero({
  roomNumber,
  guestName,
  setGuestName,
}: {
  roomNumber: string;
  guestName: string;
  setGuestName: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-card">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground/70">Welcome</p>
      <h2 className="mt-1 font-display text-2xl font-semibold leading-tight">Laundry, made effortless.</h2>
      <p className="mt-1.5 text-sm text-primary-foreground/80">
        Log what is in your laundry bag, drop it at reception, and we will handle washing and return — track every step in real time.
      </p>
      <div className="mt-4">
        <label className="text-[11px] uppercase tracking-wide text-primary-foreground/70">Guest name</label>
        <Input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Your name"
          className="mt-1 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50"
        />
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-primary-foreground/70">
        <Sparkles className="h-3.5 w-3.5" />
        Room #{roomNumber} · QR-verified request
      </div>
    </div>
  );
}

function ActiveTracker({ roomNumber }: { roomNumber: string }) {
  const { activeBagForRoom, advance } = useStore();
  const bag = activeBagForRoom(roomNumber)!;
  const pct = progressPct(bag.status);
  const isSubmitted = bag.status === 'submitted';
  const hasDiscrepancy = bag.discrepancy && bag.discrepancyNotified;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-border/70 shadow-soft">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Your laundry bag</p>
            <p className="font-display text-lg font-semibold leading-tight">Room #{bag.roomNumber}</p>
          </div>
          <StatusBadge status={bag.status} />
        </div>
        <CardContent className="p-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-5">
            <StatusStepper current={bag.status} timestamps={bag.timeline} orientation="vertical" />
          </div>

          {isSubmitted && (
            <div className="mt-4 rounded-xl border border-status-pickup/30 bg-status-pickup/10 p-3">
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 text-status-pickup" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-status-pickup">Drop off at reception</p>
                  <p className="text-xs text-muted-foreground">Take your bag to the reception desk and let them know it is ready.</p>
                </div>
              </div>
              <Button
                className="mt-3 w-full bg-status-pickup text-white hover:bg-status-pickup/90"
                onClick={() => {
                  advance(bag.id);
                  toast.success('Logged at reception', { description: 'Reception has been notified your bag is on its way.' });
                }}
              >
                <Hand className="h-4 w-4" /> I have dropped it at reception
              </Button>
            </div>
          )}

          {hasDiscrepancy && (
            <div className="mt-4 rounded-xl border border-status-atlaundry/30 bg-status-atlaundry/10 p-3">
              <div className="flex items-start gap-2.5">
                <Info className="mt-0.5 h-4 w-4 text-status-atlaundry" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-status-atlaundry">Item count updated</p>
                  <p className="text-xs text-muted-foreground">
                    The laundry team counted different quantities than you logged. The verified counts below will be used for your payment receipt.
                  </p>
                </div>
              </div>
              <div className="mt-2.5 space-y-1 rounded-lg bg-background/60 p-2.5">
                {bag.items.map((i) => {
                  const verified = bag.verifiedItems[i.itemId] ?? 0;
                  const mismatch = verified !== i.qty;
                  return (
                    <div key={i.itemId} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{ITEM_MAP[i.itemId]?.label ?? i.itemId}</span>
                      <span className={mismatch ? 'font-semibold text-status-atlaundry' : 'tabular-nums'}>
                        {mismatch ? (
                          <>
                            <span className="line-through text-muted-foreground">{i.qty}</span>
                            <span className="mx-1">→</span>
                            {verified}
                          </>
                        ) : (
                          `×${verified}`
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {bag.status === 'delivered' && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-status-ready/30 bg-status-ready/10 p-3 text-sm text-status-ready">
              <CheckCircle2 className="h-4 w-4" />
              Delivered to your room. Thank you for using LinenLoop.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-soft">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">In this bag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          {bag.items.map((i) => (
            <div key={i.itemId} className="flex items-center justify-between py-1 text-sm">
              <span className="text-muted-foreground">
                {ITEM_MAP[i.itemId]?.label ?? i.itemId}
                <span className="ml-1.5 text-[11px] text-muted-foreground/70">· {SERVICE_LABEL[i.service]}</span>
              </span>
              <span className="font-medium tabular-nums">×{i.qty}</span>
            </div>
          ))}
          {bag.note && (
            <p className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs italic text-muted-foreground">“{bag.note}”</p>
          )}
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground">
            Requested {formatTime(bag.timeline.submitted)} · {formatTimeAgo(bag.createdAt)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
