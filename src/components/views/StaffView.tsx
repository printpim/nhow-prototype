import { useMemo, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, ClipboardList, Shirt, Minus, Plus, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/lib/store';
import { STAFF_UNIFORM_ITEMS, EMPTY_STAFF_ITEMS, staffTotalQuantity } from '@/lib/items';
import { STAFF_STATUS_META, staffProgressPct, formatTimeAgo } from '@/lib/status';
import type { StaffItemKey, StaffItems, StaffLaundryOrder, StaffOrderStatus } from '@/lib/types';
import { StaffStatusBadge } from '@/components/shared/StaffStatusBadge';
import { toast } from 'sonner';

const DEPARTMENTS = ['Kitchen', 'Housekeeping', 'Front Office', 'F&B Service', 'Maintenance', 'Management'];

export function StaffView() {
  const { data, createStaffOrder, activeStaffOrderFor } = useStore();
  const [staffName, setStaffName] = useState('');
  const [department, setDepartment] = useState<string>('');
  const [items, setItems] = useState<StaffItems>({ ...EMPTY_STAFF_ITEMS });

  const total = useMemo(() => staffTotalQuantity(items), [items]);
  const activeOrder = activeStaffOrderFor(staffName.trim());

  const setQty = (key: StaffItemKey, qty: number) =>
    setItems((prev) => ({ ...prev, [key]: Math.max(0, Math.min(20, qty)) }));

  const submit = () => {
    if (!staffName.trim()) {
      toast.error('Name required', { description: 'Enter your name so we can tag your uniform.' });
      return;
    }
    if (!department) {
      toast.error('Department required', { description: 'Select your department.' });
      return;
    }
    if (total === 0) {
      toast.error('No items selected', { description: 'Add at least one uniform item to submit.' });
      return;
    }
    createStaffOrder(staffName.trim(), department, items);
    toast.success('Uniform logged', { description: `${total} items dropped at laundry. Track progress below.` });
    setItems({ ...EMPTY_STAFF_ITEMS });
  };

  const recent = data.staffOrders
    .filter((o) => o.staffName.toLowerCase() === staffName.trim().toLowerCase())
    .sort((a, b) => b.dateTurnedIn - a.dateTurnedIn)
    .slice(0, 3);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-20 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-mono-tag text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">nhow · staff</p>
            <h1 className="font-display text-lg font-bold uppercase leading-tight tracking-tight">Uniform Laundry</h1>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-glow">
            <Shirt className="h-5 w-5" />
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-5 px-4 py-5">
        {activeOrder ? (
          <StaffOrderTracker order={activeOrder} />
        ) : (
          <>
            <StaffHero />

            <Card className="overflow-hidden border-foreground/10 shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 font-display text-base font-bold uppercase tracking-tight">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Uniform intake
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="staffName" className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Staff name</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="staffName" className="pl-9" placeholder="Your name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">Items to wash</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                    {STAFF_UNIFORM_ITEMS.map((item) => {
                      const qty = items[item.key];
                      const active = qty > 0;
                      return (
                        <div
                          key={item.key}
                          className={`rounded-xl border px-3 py-2.5 transition ${active ? 'border-primary/40 bg-primary/[0.05]' : 'border-foreground/10 bg-card hover:bg-muted/40'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold leading-tight">{item.label}</span>
                            <div className="flex items-center gap-1.5">
                              <Button size="icon" variant="outline" className="h-7 w-7 rounded-full" onClick={() => setQty(item.key, qty - 1)} disabled={qty === 0}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center font-mono-tag text-sm font-bold tabular-nums">{qty}</span>
                              <Button size="icon" className="h-7 w-7 rounded-full" onClick={() => setQty(item.key, qty + 1)} disabled={qty >= 20}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {recent.length > 0 && (
              <section>
                <p className="mb-2 font-mono-tag text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Your recent orders</p>
                <div className="space-y-2">
                  {recent.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-foreground/10 bg-card px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <StaffStatusBadge status={o.status} />
                        <span className="text-muted-foreground">{o.totalQuantity} items · {o.department}</span>
                      </div>
                      <span className="font-mono-tag text-xs text-muted-foreground">{formatTimeAgo(o.dateTurnedIn)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {!activeOrder && (
        <div className="sticky bottom-3 z-10 px-4">
          <Button size="lg" className="w-full rounded-xl text-base shadow-glow" disabled={total === 0 || !staffName.trim() || !department} onClick={submit}>
            <CheckCircle2 className="h-4 w-4" />
            Drop at Laundry
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="mt-1.5 text-center font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">
            {total} item{total === 1 ? '' : 's'} · {total === 0 ? 'Add items to submit' : 'Ready to drop'}
          </p>
        </div>
      )}
    </div>
  );
}

function StaffHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#111111] p-5 text-white shadow-card">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/40 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-secondary/40 blur-[80px]" />
      <div className="relative">
        <p className="font-mono-tag text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">Staff portal</p>
        <h2 className="mt-1 font-display text-2xl font-bold uppercase leading-[1.05] tracking-tight">Uniform laundry,<br /><span className="text-brand-gradient">drop & collect.</span></h2>
        <p className="mt-2 max-w-sm text-sm text-white/70">
          Log your uniform items, drop them at the laundry station, and collect clean items with a digital signature.
        </p>
        <div className="mt-4 flex items-center gap-2 font-mono-tag text-[10px] uppercase tracking-wider text-white/50">
          <Sparkles className="h-3.5 w-3.5 text-neon-gold" />
          nhow Amsterdam RAI · Europaboulevard 2b
        </div>
      </div>
    </div>
  );
}

function StaffOrderTracker({ order }: { order: StaffLaundryOrder }) {
  const pct = staffProgressPct(order.status);
  const meta = STAFF_STATUS_META[order.status];
  const filledItems = Object.entries(order.items).filter(([, v]) => v > 0) as [StaffItemKey, number][];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-foreground/10 shadow-card">
        <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
          <div>
            <p className="font-mono-tag text-[10px] uppercase tracking-wider text-muted-foreground">Your uniform order</p>
            <p className="font-display text-lg font-bold uppercase leading-tight tracking-tight">{order.staffName}</p>
            <p className="font-mono-tag text-xs text-muted-foreground">{order.department} · {order.totalQuantity} items</p>
          </div>
          <StaffStatusBadge status={order.status} />
        </div>
        <CardContent className="p-4">
          <div className="mb-1 flex items-center justify-between font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-700 ease-out" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-4 space-y-2.5">
            {(['submitted_laundry', 'in_washing', 'in_storage', 'collected'] as StaffOrderStatus[]).map((s, i) => {
              const m = STAFF_STATUS_META[s];
              const reached = (['submitted_laundry', 'in_washing', 'in_storage', 'collected'] as StaffOrderStatus[]).indexOf(order.status) >= i;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${reached ? 'bg-brand-gradient text-white' : 'bg-muted text-muted-foreground'}`}>
                    {reached ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${reached ? '' : 'text-muted-foreground'}`}>{m.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {order.status === 'in_storage' && (
            <div className="mt-4 rounded-xl border border-status-ready/30 bg-status-ready/[0.06] p-3">
              <div className="flex items-start gap-2.5">
                <Hanger className="mt-0.5 h-4 w-4 text-status-ready" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-status-ready">Ready for pickup</p>
                  <p className="text-xs text-muted-foreground">Your clean uniform is tagged with your name. Visit the laundry station and sign to collect.</p>
                </div>
              </div>
            </div>
          )}

          {order.status === 'collected' && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-status-delivered/30 bg-status-delivered/10 p-3 text-sm font-semibold text-status-delivered">
              <CheckCircle2 className="h-4 w-4" />
              Collected. Thank you for using nhow staff laundry.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-foreground/10 shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="font-mono-tag text-xs font-semibold uppercase tracking-wider">In this order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0">
          {filledItems.map(([key, qty]) => {
            const label = STAFF_UNIFORM_ITEMS.find((i) => i.key === key)?.label ?? key;
            return (
              <div key={key} className="flex items-center justify-between py-1 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono-tag font-bold tabular-nums">×{qty}</span>
              </div>
            );
          })}
          <Separator className="my-2" />
          <p className="font-mono-tag text-[11px] uppercase tracking-wider text-muted-foreground">
            Dropped {formatTimeAgo(order.dateTurnedIn)} · {meta.label}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
