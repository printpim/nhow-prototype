import { useMemo } from 'react';

// Deterministic faux-QR rendered as SVG. Visually scans as a QR code
// (finder patterns + module grid) without an external dependency.
// Not a real scannable code — it's a simulated identifier for the room link.
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function modulesFor(payload: string, size: number): boolean[] {
  const total = size * size;
  const cells: boolean[] = new Array(total).fill(false);
  let seed = hash(payload);
  for (let i = 0; i < total; i++) {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    cells[i] = (seed & 1) === 1;
  }
  return cells;
}

function isFinderArea(r: number, c: number, size: number): boolean {
  const inBox = (r0: number, c0: number) =>
    r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
  return inBox(0, 0) || inBox(0, size - 7) || inBox(size - 7, 0);
}

export function QrCode({
  value,
  size = 168,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const grid = 25;
  const cells = useMemo(() => modulesFor(value, grid), [value]);
  const cell = size / grid;

  const finder = (r0: number, c0: number) => (
    <g key={`f-${r0}-${c0}`}>
      <rect x={c0 * cell} y={r0 * cell} width={cell * 7} height={cell * 7} rx={cell * 1.4} fill="currentColor" />
      <rect x={(c0 + 1) * cell} y={(r0 + 1) * cell} width={cell * 5} height={cell * 5} rx={cell} fill="white" />
      <rect x={(c0 + 2) * cell} y={(r0 + 2) * cell} width={cell * 3} height={cell * 3} rx={cell * 0.7} fill="currentColor" />
    </g>
  );

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width={size} height={size} rx={size * 0.06} fill="white" />
      {cells.map((on, i) => {
        if (!on) return null;
        const r = Math.floor(i / grid);
        const c = i % grid;
        if (isFinderArea(r, c, grid)) return null;
        return <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} rx={cell * 0.18} fill="currentColor" />;
      })}
      {finder(0, 0)}
      {finder(0, grid - 7)}
      {finder(grid - 7, 0)}
    </svg>
  );
}
