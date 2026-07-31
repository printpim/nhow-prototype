// Domain types for LinenLoop hotel laundry workflow.

export type Role = 'guest' | 'reception' | 'laundry' | 'manager' | 'staff';

export type StaffRole = 'reception' | 'laundry';

export type ServiceType = 'wash' | 'dryclean';

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
  /** whether the laundry station washes this item (linen is handled separately) */
  washable: boolean;
}

export interface BagItem {
  itemId: string;
  qty: number;
  service: ServiceType;
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
  /** true when laundry confirmed counts that differ from the guest log */
  discrepancy?: boolean;
  /** guest has been notified of the discrepancy */
  discrepancyNotified?: boolean;
  note?: string;
  staffIds: {
    receivedBy?: string;
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

// ---------------------------------------------------------------------------
// Staff uniform laundry workflow (parallel to the guest workflow)
// ---------------------------------------------------------------------------

/** Discriminates guest vs. staff laundry orders. */
export type OrderType = 'GUEST' | 'STAFF';

/** Staff workflow status machine. */
export type StaffOrderStatus =
  | 'submitted_laundry'
  | 'in_washing'
  | 'in_storage'
  | 'collected';

/** Uniform item keys for staff orders. */
export type StaffItemKey =
  | 'trousers'
  | 'skirt'
  | 'blazer'
  | 'blouseShirt'
  | 'apron'
  | 'tShirt'
  | 'longSleeveTShirt'
  | 'sweater'
  | 'chefJacket'
  | 'chefTrouser';

export type StaffItems = Record<StaffItemKey, number>;

export interface StaffLaundryOrder {
  id: string;
  orderType: 'STAFF';
  staffName: string;
  department: string;
  dateTurnedIn: number;
  pickupSignatureUrl?: string;
  status: StaffOrderStatus;
  location: string;
  items: StaffItems;
  totalQuantity: number;
  collectedBy?: string;
  collectedAt?: number;
}

export interface AppData {
  bags: Bag[];
  rooms: Room[];
  staff: StaffAccount[];
  audit: AuditEntry[];
  staffOrders: StaffLaundryOrder[];
  version: number;
}
