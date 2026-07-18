// Domain types for LinenLoop hotel laundry workflow.

export type Role = 'guest' | 'housekeeping' | 'laundry' | 'manager';

export type StaffRole = 'housekeeping' | 'laundry';

export type BagStatus =
  | 'submitted'
  | 'pickup'
  | 'at_laundry'
  | 'in_wash'
  | 'ready'
  | 'delivered';

export interface LaundryItemDef {
  id: string;
  label: string;
  /** soft icon key resolved in the UI */
  icon: string;
  /** est. processing weight factor for stats */
  weight: number;
}

export interface BagItem {
  itemId: string;
  qty: number;
}

export interface Bag {
  id: string;
  roomNumber: string;
  guestName: string;
  items: BagItem[];
  status: BagStatus;
  createdAt: number;
  /** status -> epoch ms for turnaround calc */
  timeline: Record<BagStatus, number>;
  /** per-item qty confirmed by laundry staff during check-in */
  verifiedItems: Record<string, number>;
  verified: boolean;
  note?: string;
  staffIds: {
    pickedUpBy?: string;
    verifiedBy?: string;
    washedBy?: string;
    deliveredBy?: string;
  };
}

export interface Room {
  number: string;
  floor: number;
  guestName: string;
  checkout: string; // ISO date
  status: 'idle' | 'occupied' | 'checkout';
}

export interface StaffAccount {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone?: string;
  active: boolean;
  createdAt: number;
}

export interface AuditEntry {
  id: string;
  bagId: string;
  roomNumber: string;
  action: string;
  staffName: string;
  at: number;
}

export interface AppData {
  bags: Bag[];
  rooms: Room[];
  staff: StaffAccount[];
  audit: AuditEntry[];
  version: number;
}
