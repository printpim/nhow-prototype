import {
  Shirt,
  ParkingSquare,
  Brush,
  Hand,
  Footprints,
  Bath,
  BedDouble,
  Pill,
  Users,
  ClipboardList,
  PackageSearch,
  WashingMachine,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

const ITEM_ICONS: Record<string, LucideIcon> = {
  shirt: Shirt,
  pants: ParkingSquare,
  dress: Users,
  tshirt: Brush,
  underwear: Hand,
  socks: Footprints,
  towel: Bath,
  bedsheet: BedDouble,
  pillowcase: Pill,
  jacket: Shirt,
  'clipboard-list': ClipboardList,
  hand: Hand,
  'package-search': PackageSearch,
  'washing-machine': WashingMachine,
  sparkles: Sparkles,
  'check-circle': CheckCircle2,
};

export function ItemIcon({ id, className }: { id: string; className?: string }) {
  const Icon = ITEM_ICONS[id] ?? Shirt;
  return <Icon className={className} />;
}
