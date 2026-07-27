import { useMemo, useState } from 'react';
import {
  BarChart3,
  BedDouble,
  Bell,
  CheckCircle2,
  Download,
  Layers,
  Plus,
  QrCode as QrIcon,
  Shirt,
  Timer,
  Trash2,
  UserCog,
  Users,
  WashingMachine,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStore, bagRoomUrl } from '@/lib/store';
import type { BagStatus } from '@/lib/types';
import { ITEM_MAP, totalItemCount } from '@/lib/items';
import { STATUS_FLOW, STATUS_META, formatDuration, turnaroundMs, formatDateTime } from '@/lib/status';
import { QrCode } from '@/components/shared/QrCode';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Brand } from '@/components/shared/RoleSwitcher';
import { toast } from 'sonner';

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ManagerView() {
  const { data } = useStore();
  const [tab, setTab] = useState<'overview' | 'rooms' | 'staff'>('overview');

  const delivered = data.bags.filter((b) => b.status === 'delivered');
  const active = data.bags.filter((b) => b.status !== 'delivered');
  const discrepancies = data.bags.filter((b) => b.discrepancy).length;

  const avgTurnaround = useMemo(() => {
    const times = delivered.map((b) => turnaroundMs(b)).filter(Boolean);
    if (!times.length) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }, [delivered]);

  const busiestDays = useMemo(() => {
    const map: Record<string, number> = {};
    data.bags.forEach((b) => {
      const d = new Date(b.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      map[d] = (map[d] ?? 0) + 1;
    });
    const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return order.map((d) => ({ day: d, bags: map[d] ?? 0 }));
  }, [data.bags]);

  const itemMix = useMemo(() => {
    const map: Record<string, number> = {};
    data.bags.forEach((b) => b.items.forEach((i) => (map[i.itemId] = (map[i.itemId] ?? 0) + i.qty)));
    return Object.entries(map)
      .map(([id, qty]) => ({ id, name: ITEM_MAP[id]?.label ?? id, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [data.bags]);

  const throughput = useMemo(() => {
    const map: Record<string, number> = {};
    data.bags.forEach((b) => {
      const d = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      map[d] = (map[d] ?? 0) + 1;
    });
    return Object.entries(map)
      .map(([date, bags]) => ({ date, bags }))
      .slice(-7);
  }, [data.bags]);

  const pipeline = useMemo(() => {
    return STATUS_FLOW.map((s) => ({ status: s, count: data.bags.filter((b) => b.status === s).length }));
  }, [data.bags]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Brand />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Manager Dashboard
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold">Operations Overview</h1>
            <p className="text-sm text-muted-foreground">Real-time laundry workflow, turnaround, and floor status.</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'overview' | 'rooms' | 'staff')}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
            <TabsTrigger value="rooms" className="gap-1.5"><BedDouble className="h-3.5 w-3.5" /> Rooms & QR</TabsTrigger>
            <TabsTrigger value="staff" className="gap-1.5"><UserCog className="h-3.5 w-3.5" /> Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 space-y-5">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Bags processed" value={delivered.length.toString()} sub={`${data.bags.length} total`} tone="ready" />
              <Kpi icon={<Timer className="h-4 w-4" />} label="Avg turnaround" value={formatDuration(avgTurnaround)} sub="submit → delivered" tone="inwash" />
              <Kpi icon={<Layers className="h-4 w-4" />} label="Active in pipeline" value={active.length.toString()} sub={`${pipeline.filter((p) => p.count).length} stages live`} tone="atlaundry" />
              <Kpi icon={<Shirt className="h-4 w-4" />} label="Items washed" value={delivered.reduce((a, b) => a + totalItemCount(b.items), 0).toString()} sub="across all bags" tone="pickup" />
            </div>

            {discrepancies > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-status-atlaundry/30 bg-status-atlaundry/10 px-4 py-2.5 text-sm text-status-atlaundry">
                <Bell className="h-4 w-4 shrink-0" />
                <span><span className="font-semibold">{discrepancies}</span> bag{discrepancies === 1 ? '' : 's'} flagged with an item count discrepancy — verified counts will be used for the payment receipt.</span>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/70 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Throughput</CardTitle>
                  <CardDescription>Bags submitted per day (last 7)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={throughput} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="throughputFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="bags" stroke={CHART_COLORS[1]} strokeWidth={2} fill="url(#throughputFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pipeline by stage</CardTitle>
                  <CardDescription>Current bags per status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {pipeline.map((p) => {
                      const meta = STATUS_META[p.status];
                      const max = Math.max(1, ...pipeline.map((x) => x.count));
                      return (
                        <div key={p.status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className={`h-2 w-2 rounded-full bg-status-${meta.tone}`} />
                              {meta.short}
                            </span>
                            <span className="tabular-nums text-muted-foreground">{p.count}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div className={`h-full rounded-full bg-status-${meta.tone} transition-all`} style={{ width: `${(p.count / max) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/70 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Busiest days</CardTitle>
                  <CardDescription>Bags by weekday</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={busiestDays} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="bags" radius={[4, 4, 0, 0]} fill={CHART_COLORS[0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Most common items</CardTitle>
                  <CardDescription>Top item types washed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ResponsiveContainer width="55%" height={200}>
                      <PieChart>
                        <Pie data={itemMix} dataKey="qty" nameKey="name" innerRadius={42} outerRadius={78} paddingAngle={2}>
                          {itemMix.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="flex-1 space-y-1.5 text-xs">
                      {itemMix.map((it, i) => (
                        <li key={it.id} className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="flex-1 truncate text-muted-foreground">{it.name}</span>
                          <span className="font-medium tabular-nums">{it.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 shadow-soft">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent activity</CardTitle>
                  <CardDescription>Latest workflow events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5">
                    {data.audit.slice(0, 6).map((a) => (
                      <li key={a.id} className="flex items-start gap-2.5 text-xs">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        <div className="flex-1">
                          <p className="font-medium">{a.action} · Room {a.roomNumber}</p>
                          <p className="text-muted-foreground">{a.staffName} · {formatDateTime(a.at)}</p>
                        </div>
                      </li>
                    ))}
                    {data.audit.length === 0 && <li className="text-xs text-muted-foreground">No events yet.</li>}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="rooms" className="mt-5">
            <RoomsPanel />
          </TabsContent>

          <TabsContent value="staff" className="mt-5">
            <StaffPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 10,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
  boxShadow: '0 8px 24px hsl(215 35% 12% / 0.08)',
};

function Kpi({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone: 'ready' | 'inwash' | 'atlaundry' | 'pickup' }) {
  const toneCls = {
    ready: 'text-status-ready bg-status-ready/10',
    inwash: 'text-status-inwash bg-status-inwash/10',
    atlaundry: 'text-status-atlaundry bg-status-atlaundry/10',
    pickup: 'text-status-pickup bg-status-pickup/10',
  }[tone];
  return (
    <Card className="border-border/70 shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneCls}`}>{icon}</span>
        </div>
        <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function RoomsPanel() {
  const { data, activeBagForRoom, bagsForRoom } = useStore();
  const [qrRoom, setQrRoom] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const rooms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.rooms.filter((r) => !q || r.number.includes(q) || r.guestName.toLowerCase().includes(q));
  }, [data.rooms, query]);

  const roomStatus = (roomNumber: string): BagStatus | 'idle' => {
    const active = activeBagForRoom(roomNumber);
    return active ? active.status : 'idle';
  };

  const roomUrl = qrRoom ? bagRoomUrl(qrRoom) : '';

  return (
    <Card className="border-border/70 shadow-soft">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Room & QR Management</CardTitle>
          <CardDescription>{data.rooms.length} rooms across the property</CardDescription>
        </div>
        <Input
          placeholder="Search room or guest…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-56"
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Room</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Checkout</TableHead>
              <TableHead>Laundry status</TableHead>
              <TableHead>Bags</TableHead>
              <TableHead className="text-right">QR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.map((r) => {
              const status = roomStatus(r.number);
              const count = bagsForRoom(r.number).length;
              return (
                <TableRow key={r.number}>
                  <TableCell className="font-semibold">#{r.number}</TableCell>
                  <TableCell>{r.floor}</TableCell>
                  <TableCell className="text-muted-foreground">{r.guestName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.checkout}</TableCell>
                  <TableCell>
                    {status === 'idle' ? (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground">Idle</Badge>
                    ) : (
                      <StatusBadge status={status} />
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{count}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setQrRoom(r.number)}>
                      <QrIcon className="h-3.5 w-3.5" /> Generate
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={!!qrRoom} onOpenChange={(o) => !o && setQrRoom(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrIcon className="h-4 w-4 text-primary" /> Room {qrRoom} QR code</DialogTitle>
            <DialogDescription>Guests scan this to open the laundry request page for their room.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="rounded-2xl border border-border bg-white p-3 text-primary shadow-soft">
              <QrCode value={roomUrl} size={180} />
            </div>
            <div className="w-full break-all rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">{roomUrl}</div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setQrRoom(null)}>Close</Button>
            <Button onClick={() => { navigator.clipboard?.writeText(roomUrl); toast.success('Link copied', { description: `Room ${qrRoom} link is on your clipboard.` }); }}>
              <Download className="h-4 w-4" /> Copy link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function StaffPanel() {
  const { data, addStaff, toggleStaffActive, removeStaff, currentStaffId, setCurrentStaffId } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'reception' | 'laundry'>('reception');

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    addStaff({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role, active: true });
    toast.success('Staff member added', { description: `${name} added as ${role}.` });
    setName(''); setEmail(''); setPhone(''); setRole('reception');
    setOpen(false);
  };

  return (
    <Card className="border-border/70 shadow-soft">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Staff Management</CardTitle>
          <CardDescription>{data.staff.length} accounts · {data.staff.filter((s) => s.active).length} active</CardDescription>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add staff</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${s.role === 'reception' ? 'bg-status-pickup/15 text-status-pickup' : 'bg-status-inwash/15 text-status-inwash'}`}>
                      {s.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <div>{s.name}</div>
                      {currentStaffId === s.id && <div className="text-[10px] font-medium text-primary">Signed in as</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize gap-1.5">
                    {s.role === 'reception' ? <Bell className="h-3 w-3" /> : <WashingMachine className="h-3 w-3" />}
                    {s.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div>{s.email}</div>
                  {s.phone && <div>{s.phone}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={s.active ? 'default' : 'secondary'} className={s.active ? 'bg-status-ready/15 text-status-ready border-status-ready/30' : ''}>
                    {s.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setCurrentStaffId(s.id)} disabled={currentStaffId === s.id}>
                      <Users className="h-3.5 w-3.5" /> Sign in as
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleStaffActive(s.id)}>
                      {s.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => removeStaff(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
            <DialogDescription>Create a mock account for reception or laundry staff.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@hotel.io" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone <span className="text-muted-foreground/60">(optional)</span></Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 202 555 0100" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'reception' | 'laundry')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reception">Reception</SelectItem>
                  <SelectItem value="laundry">Laundry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}><Plus className="h-4 w-4" /> Add member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
