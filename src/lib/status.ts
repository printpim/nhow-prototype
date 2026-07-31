import type { BagStatus, Role, StaffOrderStatus } from './types';

export interface StatusMeta {
  key: BagStatus;
  label: string;
  short: string;
  description: string;
  /** next action label surfaced on the responsible view */
  action: string;
  responsible: Role;
  /** tailwind color token from status ramp */
  tone: 'submitted' | 'pickup' | 'atlaundry' | 'inwash' | 'ready' | 'delivered';
  icon: string;
}

// Linear, strictly-ordered workflow.
// Reception collects the bag dropped off by the guest and sends it to laundry.
// Laundry verifies, washes, and delivers the clean bag back to the room.
export const STATUS_FLOW: BagStatus[] = [
  'submitted',
  'pickup',
  'at_laundry',
  'in_wash',
  'ready',
  'delivered',
];

export const STATUS_META: Record<BagStatus, StatusMeta> = {
  submitted: {
    key: 'submitted',
    label: 'Request Submitted',
    short: 'Submitted',
    description: 'Guest has logged their laundry and dropped the bag at reception.',
    action: 'Confirm Drop-off',
    responsible: 'guest',
    tone: 'submitted',
    icon: 'clipboard-list',
  },
  pickup: {
    key: 'pickup',
    label: 'At Reception',
    short: 'At Reception',
    description: 'Bag dropped at reception; awaiting check-in and transfer to the laundry.',
    action: 'Checked In & Sent to Laundry',
    responsible: 'reception',
    tone: 'pickup',
    icon: 'bell',
  },
  at_laundry: {
    key: 'at_laundry',
    label: 'At Laundry — Check-in',
    short: 'At Laundry',
    description: 'Bag arrived at the laundry station; items pending verification.',
    action: 'Verify Items & Start Wash',
    responsible: 'laundry',
    tone: 'atlaundry',
    icon: 'package-search',
  },
  in_wash: {
    key: 'in_wash',
    label: 'In Wash',
    short: 'In Wash',
    description: 'Items verified and currently being laundered.',
    action: 'Mark Wash Complete',
    responsible: 'laundry',
    tone: 'inwash',
    icon: 'washing-machine',
  },
  ready: {
    key: 'ready',
    label: 'Ready for Return',
    short: 'Ready',
    description: 'Clean and folded; awaiting delivery back to the room by laundry staff.',
    action: 'Mark Delivered to Room',
    responsible: 'laundry',
    tone: 'ready',
    icon: 'sparkles',
  },
  delivered: {
    key: 'delivered',
    label: 'Delivered',
    short: 'Delivered',
    description: 'Bag returned to the guest by laundry staff. Workflow complete.',
    action: '',
    responsible: 'laundry',
    tone: 'delivered',
    icon: 'check-circle',
  },
};

export function statusIndex(status: BagStatus): number {
  return STATUS_FLOW.indexOf(status);
}

export function nextStatus(status: BagStatus): BagStatus | null {
  const i = statusIndex(status);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

export function progressPct(status: BagStatus): number {
  const i = statusIndex(status);
  if (i < 0) return 0;
  return Math.round(((i + 1) / STATUS_FLOW.length) * 100);
}

export function isTerminal(status: BagStatus): boolean {
  return status === 'delivered';
}

export function turnaroundMs(b: { timeline: Record<BagStatus, number> }): number {
  const start = b.timeline.submitted;
  const end = b.timeline.delivered;
  if (!start || !end) return 0;
  return Math.max(0, end - start);
}

export function formatDuration(ms: number): string {
  if (!ms) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatTimeAgo(ts: number): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatTime(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(ts: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ROLES: { key: Role; label: string; description: string }[] = [
  { key: 'guest', label: 'Guest', description: 'Submit & track laundry' },
  { key: 'staff', label: 'Staff', description: 'Submit & collect uniform laundry' },
  { key: 'reception', label: 'Reception', description: 'Check in & send to laundry' },
  { key: 'laundry', label: 'Laundry', description: 'Verify, wash & deliver' },
  { key: 'manager', label: 'Manager', description: 'Analytics & ops' },
];

// ---------------------------------------------------------------------------
// Staff uniform laundry status flow
// ---------------------------------------------------------------------------

export const STAFF_STATUS_FLOW: StaffOrderStatus[] = [
  'submitted_laundry',
  'in_washing',
  'in_storage',
  'collected',
];

export interface StaffStatusMeta {
  key: StaffOrderStatus;
  label: string;
  short: string;
  description: string;
  action: string;
  tone: 'submitted' | 'inwash' | 'ready' | 'delivered';
}

export const STAFF_STATUS_META: Record<StaffOrderStatus, StaffStatusMeta> = {
  submitted_laundry: {
    key: 'submitted_laundry',
    label: 'Dropped at Laundry',
    short: 'Submitted',
    description: 'Uniform dropped directly at the laundry station.',
    action: 'Start Wash',
    tone: 'submitted',
  },
  in_washing: {
    key: 'in_washing',
    label: 'In Washing',
    short: 'In Wash',
    description: 'Uniform currently being laundered.',
    action: 'Store Uniform',
    tone: 'inwash',
  },
  in_storage: {
    key: 'in_storage',
    label: 'In Storage — Ready for Pickup',
    short: 'In Storage',
    description: 'Clean uniform tagged with name, awaiting collection.',
    action: 'Collect (Signature)',
    tone: 'ready',
  },
  collected: {
    key: 'collected',
    label: 'Collected',
    short: 'Collected',
    description: 'Uniform collected by the staff member with a digital signature.',
    action: '',
    tone: 'delivered',
  },
};

export function staffStatusIndex(status: StaffOrderStatus): number {
  return STAFF_STATUS_FLOW.indexOf(status);
}

export function nextStaffStatus(status: StaffOrderStatus): StaffOrderStatus | null {
  const i = staffStatusIndex(status);
  if (i < 0 || i >= STAFF_STATUS_FLOW.length - 1) return null;
  return STAFF_STATUS_FLOW[i + 1];
}

export function staffProgressPct(status: StaffOrderStatus): number {
  const i = staffStatusIndex(status);
  if (i < 0) return 0;
  return Math.round(((i + 1) / STAFF_STATUS_FLOW.length) * 100);
}

export function isStaffTerminal(status: StaffOrderStatus): boolean {
  return status === 'collected';
}
