import type { LaundryItemDef } from './types';

// Catalog of launderable items the guest can request.
export const LAUNDRY_ITEMS: LaundryItemDef[] = [
  { id: 'shirt', label: 'Shirts', icon: 'shirt', weight: 1 },
  { id: 'pants', label: 'Pants / Trousers', icon: 'pants', weight: 1.2 },
  { id: 'dress', label: 'Dresses', icon: 'dress', weight: 1.4 },
  { id: 'tshirt', label: 'T-Shirts', icon: 'tshirt', weight: 0.8 },
  { id: 'underwear', label: 'Underwear', icon: 'underwear', weight: 0.3 },
  { id: 'socks', label: 'Socks', icon: 'socks', weight: 0.2 },
  { id: 'towel', label: 'Towels', icon: 'towel', weight: 1.5 },
  { id: 'bedsheet', label: 'Bed Sheets', icon: 'bedsheet', weight: 2.5 },
  { id: 'pillowcase', label: 'Pillowcases', icon: 'pillowcase', weight: 0.8 },
  { id: 'jacket', label: 'Jackets / Blazers', icon: 'jacket', weight: 2.2 },
];

export const ITEM_MAP: Record<string, LaundryItemDef> = Object.fromEntries(
  LAUNDRY_ITEMS.map((i) => [i.id, i]),
);

export function itemLabel(id: string): string {
  return ITEM_MAP[id]?.label ?? id;
}

export function totalItemCount(items: { itemId: string; qty: number }[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function bagWeight(items: { itemId: string; qty: number }[]): number {
  return items.reduce((sum, i) => sum + i.qty * (ITEM_MAP[i.itemId]?.weight ?? 1), 0);
}
