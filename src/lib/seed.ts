import type { AppData, Bag, BagItem, BagStatus, Room, ServiceType, StaffAccount, StaffLaundryOrder } from './types';
import { EMPTY_STAFF_ITEMS } from './items';

export const STAFF_LOCATION = 'nhow Amsterdam RAI, Europaboulevard 2b, 1078 RV AMSTERDAM';

const ROOM_NUMBERS = [
  '101', '102', '103', '104', '105', '106',
  '201', '202', '203', '204', '205', '206',
  '301', '302', '303', '304', '305',
];

const GUEST_NAMES = [
  'A. Whitfield', 'M. Okafor', 'J. Nakamura', 'S. Petrova', 'D. Marchetti',
  'L. Hernandez', 'R. Goldsmith', 'K. Andersson', 'T. Beaumont', 'E. Carrington',
  'N. Vasquez', 'H. Lindqvist', 'Y. Tanaka', 'C. Dubois', 'F. Ahmadi',
  'G. Romano', 'B. Sullivan', 'V. Korhonen',
];

const STAFF_SEED: Omit<StaffAccount, 'createdAt'>[] = [
  { id: 'st-maria', name: 'Maria Santos', role: 'reception', email: 'maria.santos@hotel.io', phone: '+1 202 555 0142', active: true },
  { id: 'st-liang', name: 'Liang Wei', role: 'reception', email: 'liang.wei@hotel.io', phone: '+1 202 555 0188', active: true },
  { id: 'st-priya', name: 'Priya Nair', role: 'reception', email: 'priya.nair@hotel.io', phone: '+1 202 555 0173', active: true },
  { id: 'st-omar', name: 'Omar Haddad', role: 'laundry', email: 'omar.haddad@hotel.io', phone: '+1 202 555 0119', active: true },
  { id: 'st-greta', name: 'Greta Lindholm', role: 'laundry', email: 'greta.lindholm@hotel.io', phone: '+1 202 555 0156', active: true },
  { id: 'st-devon', name: 'Devon Booker', role: 'laundry', email: 'devon.booker@hotel.io', phone: '+1 202 555 0167', active: false },
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function rand(seed: number, max: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

function daysAgo(d: number): number {
  return Date.now() - d * 86400000;
}

function buildTimeline(startTs: number, status: BagStatus): Record<BagStatus, number> {
  // Spread realistic delays across stages.
  const gaps: Record<BagStatus, number> = {
    submitted: 0,
    pickup: 25 * 60000,
    at_laundry: 50 * 60000,
    in_wash: 80 * 60000,
    ready: 200 * 60000,
    delivered: 230 * 60000,
  };
  const order: BagStatus[] = ['submitted', 'pickup', 'at_laundry', 'in_wash', 'ready', 'delivered'];
  const reachedIdx = order.indexOf(status);
  const tl = {} as Record<BagStatus, number>;
  order.forEach((s, idx) => {
    if (idx <= reachedIdx) tl[s] = startTs + gaps[s];
    else tl[s] = 0;
  });
  return tl;
}

function buildBag(
  i: number,
  room: Room,
  status: BagStatus,
  startTs: number,
  staff: StaffAccount[],
): Bag {
  const itemPool = ['shirt', 'pants', 'dress', 'tshirt', 'underwear', 'socks', 'towel', 'bedsheet', 'pillowcase', 'jacket'];
  const count = 1 + rand(i + 3, 4);
  const items: BagItem[] = Array.from({ length: count }, (_, k) => {
    const id = pick(itemPool, i + k * 3);
    const svc: ServiceType = id === 'jacket' || id === 'dress' ? (rand(i + k, 2) ? 'dryclean' : 'wash') : 'wash';
    return { itemId: id, qty: 1 + rand(i + k + 7, 4), service: svc };
  });

  const receptionStaff = staff.filter((s) => s.role === 'reception');
  const laundryStaff = staff.filter((s) => s.role === 'laundry');
  const timeline = buildTimeline(startTs, status);

  const verified = ['in_wash', 'ready', 'delivered'].includes(status);
  return {
    id: `bag-${1000 + i}`,
    roomNumber: room.number,
    guestName: room.guestName,
    items,
    status,
    createdAt: startTs,
    timeline,
    verifiedItems: verified ? Object.fromEntries(items.map((it) => [it.itemId, it.qty])) : {},
    verified,
    staffIds: {
      receivedBy: status !== 'submitted' && status !== 'pickup' ? pick(receptionStaff, i).id : undefined,
      verifiedBy: verified ? pick(laundryStaff, i).id : undefined,
      washedBy: ['ready', 'delivered'].includes(status) ? pick(laundryStaff, i + 2).id : undefined,
      deliveredBy: status === 'delivered' ? pick(laundryStaff, i + 1).id : undefined,
    },
  };
}

export function buildSeedData(): AppData {
  const rooms: Room[] = ROOM_NUMBERS.map((num, i) => {
    const floor = Number(num[0]);
    const statusRoll = rand(i + 11, 10);
    return {
      number: num,
      floor,
      guestName: pick(GUEST_NAMES, i),
      checkout: new Date(daysAgo(-1 - rand(i, 5))).toISOString().slice(0, 10),
      status: statusRoll < 6 ? 'occupied' : statusRoll < 9 ? 'checkout' : 'idle',
    };
  });

  const staff: StaffAccount[] = STAFF_SEED.map((s, i) => ({
    ...s,
    createdAt: daysAgo(20 - i),
  }));

  // Build a history of completed bags + active ones.
  const bags: Bag[] = [];

  // 6 completed bags across the past 6 days for analytics
  const completedStatuses: BagStatus[] = ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered'];
  completedStatuses.forEach((st, i) => {
    const room = rooms[i * 2 + 1];
    bags.push(buildBag(100 + i, room, st, daysAgo(6 - i) - 200 * 60000, staff));
  });

  // Active pipeline across current statuses
  const active: { status: BagStatus; roomIdx: number; offsetMin: number }[] = [
    { status: 'submitted', roomIdx: 2, offsetMin: 8 },
    { status: 'pickup', roomIdx: 5, offsetMin: 22 },
    { status: 'pickup', roomIdx: 8, offsetMin: 14 },
    { status: 'at_laundry', roomIdx: 11, offsetMin: 40 },
    { status: 'in_wash', roomIdx: 3, offsetMin: 95 },
    { status: 'ready', roomIdx: 6, offsetMin: 210 },
    { status: 'ready', roomIdx: 14, offsetMin: 175 },
  ];
  active.forEach((a, i) => {
    const room = rooms[a.roomIdx];
    bags.push(buildBag(200 + i, room, a.status, Date.now() - a.offsetMin * 60000, staff));
  });

  // Mock staff uniform laundry orders across different states.
  const staffOrders: StaffLaundryOrder[] = [
    {
      id: 'staff-1001',
      orderType: 'STAFF',
      staffName: 'Marco Bianchi',
      department: 'Kitchen',
      dateTurnedIn: Date.now() - 95 * 60000,
      status: 'in_washing',
      location: STAFF_LOCATION,
      items: { ...EMPTY_STAFF_ITEMS, chefJacket: 3, chefTrouser: 3, apron: 2, tShirt: 2 },
      totalQuantity: 10,
    },
    {
      id: 'staff-1002',
      orderType: 'STAFF',
      staffName: 'Sofia Ramos',
      department: 'Housekeeping',
      dateTurnedIn: Date.now() - 240 * 60000,
      status: 'in_storage',
      location: STAFF_LOCATION,
      items: { ...EMPTY_STAFF_ITEMS, blouseShirt: 4, trousers: 3, sweater: 1 },
      totalQuantity: 8,
    },
    {
      id: 'staff-1003',
      orderType: 'STAFF',
      staffName: 'Jamal Edwards',
      department: 'Front Office',
      dateTurnedIn: Date.now() - 320 * 60000,
      status: 'in_storage',
      location: STAFF_LOCATION,
      items: { ...EMPTY_STAFF_ITEMS, blazer: 2, blouseShirt: 3, trousers: 2, longSleeveTShirt: 2 },
      totalQuantity: 9,
    },
  ];

  return {
    bags,
    rooms,
    staff,
    audit: [],
    staffOrders,
    version: 2,
  };
}
