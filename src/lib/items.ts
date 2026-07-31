import type { LaundryItemDef, ServiceType, StaffItemKey } from './types';

// Catalog of launderable items the guest can request.
// Linen items (bed sheets, towels, pillowcases) are handled by the linen
// service — the laundry station does NOT wash them.
export const LAUNDRY_ITEMS: LaundryItemDef[] = [
  { id: 'shirt', label: 'Shirts', icon: 'shirt', weight: 1, washable: true },
  { id: 'pants', label: 'Pants / Trousers', icon: 'pants', weight: 1.2, washable: true },
  { id: 'dress', label: 'Dresses', icon: 'dress', weight: 1.4, washable: true },
  { id: 'tshirt', label: 'T-Shirts', icon: 'tshirt', weight: 0.8, washable: true },
  { id: 'underwear', label: 'Underwear', icon: 'underwear', weight: 0.3, washable: true },
  { id: 'socks', label: 'Socks', icon: 'socks', weight: 0.2, washable: true },
  { id: 'towel', label: 'Towels', icon: 'towel', weight: 1.5, washable: false },
  { id: 'bedsheet', label: 'Bed Sheets', icon: 'bedsheet', weight: 2.5, washable: false },
  { id: 'pillowcase', label: 'Pillowcases', icon: 'pillowcase', weight: 0.8, washable: false },
  { id: 'jacket', label: 'Jackets / Blazers', icon: 'jacket', weight: 2.2, washable: true },
];

export const ITEM_MAP: Record<string, LaundryItemDef> = Object.fromEntries(
  LAUNDRY_ITEMS.map((i) => [i.id, i]),
);

export const WASHABLE_ITEMS = LAUNDRY_ITEMS.filter((i) => i.washable);
export const LINEN_ITEMS = LAUNDRY_ITEMS.filter((i) => !i.washable);

export function itemLabel(id: string): string {
  return ITEM_MAP[id]?.label ?? id;
}

export function isWashable(id: string): boolean {
  return ITEM_MAP[id]?.washable ?? true;
}

export function totalItemCount(items: { itemId: string; qty: number }[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function bagWeight(items: { itemId: string; qty: number }[]): number {
  return items.reduce((sum, i) => sum + i.qty * (ITEM_MAP[i.itemId]?.weight ?? 1), 0);
}

export const SERVICE_LABEL: Record<ServiceType, string> = {
  wash: 'Wash',
  dryclean: 'Dry clean',
};

// ---------------------------------------------------------------------------
// Staff uniform laundry items
// ---------------------------------------------------------------------------

export const STAFF_UNIFORM_ITEMS: { key: StaffItemKey; label: string; icon: string }[] = [
  { key: 'trousers', label: 'Trousers', icon: 'pants' },
  { key: 'skirt', label: 'Skirt', icon: 'dress' },
  { key: 'blazer', label: 'Blazer', icon: 'jacket' },
  { key: 'blouseShirt', label: 'Blouse / Shirt', icon: 'shirt' },
  { key: 'apron', label: 'Apron', icon: 'shirt' },
  { key: 'tShirt', label: 'T-Shirt', icon: 'tshirt' },
  { key: 'longSleeveTShirt', label: 'Long-Sleeve T-Shirt', icon: 'shirt' },
  { key: 'sweater', label: 'Sweater', icon: 'shirt' },
  { key: 'chefJacket', label: 'Chef Jacket', icon: 'jacket' },
  { key: 'chefTrouser', label: 'Chef Trouser', icon: 'pants' },
];

export const EMPTY_STAFF_ITEMS: Record<StaffItemKey, number> = {
  trousers: 0,
  skirt: 0,
  blazer: 0,
  blouseShirt: 0,
  apron: 0,
  tShirt: 0,
  longSleeveTShirt: 0,
  sweater: 0,
  chefJacket: 0,
  chefTrouser: 0,
};

export function staffTotalQuantity(items: Record<StaffItemKey, number>): number {
  return (Object.values(items) as number[]).reduce((a, b) => a + b, 0);
}
