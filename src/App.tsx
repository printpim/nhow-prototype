import { useEffect, useMemo, useState } from 'react';
import { Building2, Link2, QrCode as QrIcon, RotateCcw, X } from 'lucide-react';
import { StoreProvider, useStore } from '@/lib/store';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brand, RoleSwitcher } from '@/components/shared/RoleSwitcher';
import { GuestView } from '@/components/views/GuestView';
import { ReceptionView } from '@/components/views/ReceptionView';
import { LaundryView } from '@/components/views/LaundryView';
import { ManagerView } from '@/components/views/ManagerView';
import { StaffView } from '@/components/views/StaffView';

function getRoomParam(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get('room');
}

function Shell() {
  const { role, data, resetAll } = useStore();
  const [roomParam, setRoomParam] = useState<string | null>(() => getRoomParam());
  const [roomInput, setRoomInput] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    const onPop = () => setRoomParam(getRoomParam());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const effectiveRole = roomParam ? 'guest' : role;

  const validRoom = useMemo(
    () => (roomParam ? data.rooms.some((r) => r.number === roomParam) : false),
    [roomParam, data.rooms],
  );

  const openRoom = () => {
    const num = roomInput.trim();
    if (!data.rooms.some((r) => r.number === num)) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', num);
    window.history.pushState({}, '', url.toString());
    setRoomParam(num);
    setPickerOpen(false);
    setRoomInput('');
  };

  const exitGuest = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.toString());
    setRoomParam(null);
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-24 top-1/3 h-[380px] w-[380px] rounded-full bg-secondary/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[320px] w-[320px] rounded-full bg-accent/15 blur-[120px]" />
      </div>

      {/* Top bar */}
      {!roomParam && (
        <header className="sticky top-0 z-40 w-full border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5">
            <Brand compact={false} />
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPickerOpen(true)}>
                <QrIcon className="h-3.5 w-3.5" /> Open room
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setResetOpen(true)}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
              <RoleSwitcher />
            </div>
          </div>
        </header>
      )}

      {roomParam && (
        <div className="flex items-center justify-between gap-2 border-b border-status-inwash/20 bg-status-inwash/[0.06] px-4 py-1.5 text-xs">
          <span className="flex items-center gap-1.5 font-mono-tag uppercase tracking-wider text-status-inwash">
            <Link2 className="h-3.5 w-3.5" /> Guest session · Room {roomParam}
          </span>
          <button onClick={exitGuest} className="flex items-center gap-1 font-medium text-foreground/70 hover:text-foreground">
            Exit <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {effectiveRole === 'guest' && roomParam && validRoom && <GuestView roomNumber={roomParam} />}
      {effectiveRole === 'guest' && roomParam && !validRoom && (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Building2 className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">Room not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We could not find room <span className="font-semibold">#{roomParam}</span>. Scan a valid room QR code or open a room below.
          </p>
          <Button className="mt-4" onClick={() => setPickerOpen(true)}>
            <QrIcon className="h-4 w-4" /> Open a room
          </Button>
        </div>
      )}
      {effectiveRole === 'guest' && !roomParam && (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <QrIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight">Guest laundry access</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Guests reach this view by scanning the QR code in their room. Pick a room to preview the guest experience.
          </p>
          <Button className="mt-4" size="lg" onClick={() => setPickerOpen(true)}>
            <QrIcon className="h-4 w-4" /> Open a room
          </Button>
        </div>
      )}

      {effectiveRole === 'reception' && <ReceptionView />}
      {effectiveRole === 'staff' && <StaffView />}
      {effectiveRole === 'laundry' && <LaundryView />}
      {effectiveRole === 'manager' && <ManagerView />}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrIcon className="h-4 w-4 text-primary" /> Open a guest room</DialogTitle>
            <DialogDescription>Simulates scanning a room-specific QR code. Enter any room number to preview the guest view.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="e.g. 104"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && openRoom()}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {data.rooms.slice(0, 8).map((r) => (
                <button
                  key={r.number}
                  onClick={() => setRoomInput(r.number)}
                  className="rounded-md border border-foreground/10 bg-card px-2.5 py-1 font-mono-tag text-xs font-medium hover:border-primary hover:text-primary"
                >
                  {r.number}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button>
            <Button onClick={openRoom} disabled={!roomInput.trim()}>Open guest view</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset all data?</DialogTitle>
            <DialogDescription>This restores the original mock rooms, bags, and staff, discarding any workflow changes you made in this browser.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Keep current</Button>
            <Button variant="destructive" onClick={() => { resetAll(); setResetOpen(false); }}>
              <RotateCcw className="h-4 w-4" /> Reset to mock data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
      <Toaster position="top-center" richColors closeButton />
    </StoreProvider>
  );
}
