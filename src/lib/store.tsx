import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppData, Bag, BagItem, BagStatus, Role, StaffAccount } from './types';
import { buildSeedData } from './seed';
import { nextStatus, STATUS_META } from './status';

const STORAGE_KEY = 'linenloop.data.v1';
const ROLE_KEY = 'linenloop.role.v1';
const STAFF_SELF_KEY = 'linenloop.staffself.v1';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && Array.isArray(parsed.bags) && Array.isArray(parsed.rooms)) {
        return parsed;
      }
    }
  } catch {
    /* ignore corrupt state */
  }
  const seed = buildSeedData();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    /* ignore quota */
  }
  return seed;
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

export function bagRoomUrl(roomNumber: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('room', roomNumber);
  return `${url.pathname}?${url.searchParams.toString()}#/guest`;
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

interface StoreValue {
  data: AppData;
  role: Role;
  setRole: (r: Role) => void;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  currentStaff: StaffAccount | undefined;
  createBag: (roomNumber: string, items: BagItem[], guestName: string, note?: string) => Bag;
  advance: (bagId: string) => void;
  setBagStatus: (bagId: string, status: BagStatus) => void;
  verifyItems: (bagId: string, verified: Record<string, number>) => void;
  resetAll: () => void;
  addStaff: (s: Omit<StaffAccount, 'id' | 'createdAt'>) => void;
  updateStaff: (id: string, patch: Partial<StaffAccount>) => void;
  toggleStaffActive: (id: string) => void;
  removeStaff: (id: string) => void;
  bagsByStatus: (status: BagStatus) => Bag[];
  bagsForRoom: (roomNumber: string) => Bag[];
  activeBagForRoom: (roomNumber: string) => Bag | undefined;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => load());
  const [role, setRoleState] = useState<Role>(() => {
    const r = localStorage.getItem(ROLE_KEY) as Role | null;
    return r ?? 'manager';
  });
  const [currentStaffId, setCurrentStaffIdState] = useState<string>(() => {
    return localStorage.getItem(STAFF_SELF_KEY) ?? 'st-maria';
  });

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    save(data);
  }, [data]);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem(ROLE_KEY, r);
  }, []);

  const setCurrentStaffId = useCallback((id: string) => {
    setCurrentStaffIdState(id);
    localStorage.setItem(STAFF_SELF_KEY, id);
  }, []);

  const staffName = (id?: string) =>
    data.staff.find((s) => s.id === id)?.name ?? 'Staff';

  const pushAudit = useCallback((d: AppData, entry: Omit<AppData['audit'][number], 'id' | 'at'>): AppData => {
    const audit = [
      { ...entry, id: uid('aud'), at: Date.now() },
      ...d.audit,
    ].slice(0, 200);
    return { ...d, audit };
  }, []);

  const createBag = useCallback<StoreValue['createBag']>((roomNumber, items, guestName, note) => {
    const now = Date.now();
    const bag: Bag = {
      id: uid('bag'),
      roomNumber,
      guestName,
      items,
      status: 'submitted',
      createdAt: now,
      timeline: {
        submitted: now,
        pickup: 0,
        at_laundry: 0,
        in_wash: 0,
        ready: 0,
        delivered: 0,
      },
      verifiedItems: {},
      verified: false,
      note,
      staffIds: {},
    };
    setData((d) => pushAudit({ ...d, bags: [bag, ...d.bags] }, {
      bagId: bag.id,
      roomNumber,
      action: 'Request submitted',
      staffName: guestName,
    }));
    return bag;
  }, [pushAudit]);

  const stampTimeline = (bag: Bag, status: BagStatus): Bag => ({
    ...bag,
    status,
    timeline: { ...bag.timeline, [status]: Date.now() },
  });

  const setBagStatus = useCallback<StoreValue['setBagStatus']>((bagId, status) => {
    setData((d) => {
      const bag = d.bags.find((b) => b.id === bagId);
      if (!bag) return d;
      const meta = STATUS_META[status];
      const updater = (b: Bag): Bag => {
        const next = stampTimeline(b, status);
        const staffIds = { ...b.staffIds };
        if (status === 'pickup' || status === 'delivered') staffIds.deliveredBy = currentStaffId;
        if (status === 'pickup') staffIds.pickedUpBy = currentStaffId;
        if (status === 'delivered') staffIds.deliveredBy = currentStaffId;
        return { ...next, staffIds };
      };
      const bags = d.bags.map((b) => (b.id === bagId ? updater(b) : b));
      const actor =
        status === 'submitted' ? bag.guestName :
        status === 'delivered' ? staffName(bag.staffIds.deliveredBy ?? currentStaffId) :
        staffName(currentStaffId);
      return pushAudit({ ...d, bags }, {
        bagId,
        roomNumber: bag.roomNumber,
        action: meta.label,
        staffName: actor,
      });
    });
  }, [currentStaffId, pushAudit]);

  const advance = useCallback<StoreValue['advance']>((bagId) => {
    setData((d) => {
      const bag = d.bags.find((b) => b.id === bagId);
      if (!bag) return d;
      const nxt = nextStatus(bag.status);
      if (!nxt) return d;
      const meta = STATUS_META[nxt];
      const updated = stampTimeline(bag, nxt);
      const staffIds = { ...updated.staffIds };
      if (nxt === 'pickup') staffIds.pickedUpBy = currentStaffId;
      if (nxt === 'at_laundry') staffIds.pickedUpBy = staffIds.pickedUpBy ?? currentStaffId;
      if (nxt === 'in_wash') staffIds.verifiedBy = currentStaffId;
      if (nxt === 'ready') staffIds.washedBy = currentStaffId;
      if (nxt === 'delivered') staffIds.deliveredBy = currentStaffId;
      const bags = d.bags.map((b) => (b.id === bagId ? { ...updated, staffIds } : b));
      const actor = nxt === 'delivered' ? staffName(currentStaffId) : staffName(currentStaffId);
      return pushAudit({ ...d, bags }, {
        bagId,
        roomNumber: bag.roomNumber,
        action: meta.label,
        staffName: actor,
      });
    });
  }, [currentStaffId, pushAudit]);

  const verifyItems = useCallback<StoreValue['verifyItems']>((bagId, verified) => {
    setData((d) => {
      const bag = d.bags.find((b) => b.id === bagId);
      if (!bag) return d;
      const bags = d.bags.map((b) =>
        b.id === bagId ? { ...b, verifiedItems: verified, verified: true } : b,
      );
      return pushAudit({ ...d, bags }, {
        bagId,
        roomNumber: bag.roomNumber,
        action: 'Items verified',
        staffName: staffName(currentStaffId),
      });
    });
  }, [currentStaffId, pushAudit]);

  const resetAll = useCallback(() => {
    const seed = buildSeedData();
    setData(seed);
    save(seed);
  }, []);

  const addStaff = useCallback<StoreValue['addStaff']>((s) => {
    setData((d) => ({
      ...d,
      staff: [...d.staff, { ...s, id: uid('st'), createdAt: Date.now() }],
    }));
  }, []);

  const updateStaff = useCallback<StoreValue['updateStaff']>((id, patch) => {
    setData((d) => ({
      ...d,
      staff: d.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  }, []);

  const toggleStaffActive = useCallback<StoreValue['toggleStaffActive']>((id) => {
    setData((d) => ({
      ...d,
      staff: d.staff.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    }));
  }, []);

  const removeStaff = useCallback<StoreValue['removeStaff']>((id) => {
    setData((d) => ({ ...d, staff: d.staff.filter((s) => s.id !== id) }));
  }, []);

  const bagsByStatus = useCallback((status: BagStatus) => data.bags.filter((b) => b.status === status), [data.bags]);
  const bagsForRoom = useCallback((roomNumber: string) => data.bags.filter((b) => b.roomNumber === roomNumber), [data.bags]);
  const activeBagForRoom = useCallback(
    (roomNumber: string) => data.bags.find((b) => b.roomNumber === roomNumber && b.status !== 'delivered'),
    [data.bags],
  );

  const currentStaff = useMemo(() => data.staff.find((s) => s.id === currentStaffId), [data.staff, currentStaffId]);

  const value: StoreValue = {
    data,
    role,
    setRole,
    currentStaffId,
    setCurrentStaffId,
    currentStaff,
    createBag,
    advance,
    setBagStatus,
    verifyItems,
    resetAll,
    addStaff,
    updateStaff,
    toggleStaffActive,
    removeStaff,
    bagsByStatus,
    bagsForRoom,
    activeBagForRoom,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
