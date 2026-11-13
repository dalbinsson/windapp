export const VMAX = 28;

export const STOPS: Array<[number, string]> = [
  [0, '#3a5fcd'],
  [3, '#2aa6d9'],
  [6, '#2fbf8f'],
  [9, '#9ad14b'],
  [12, '#f2d03b'],
  [15, '#f59a2e'],
  [18, '#ee5a36'],
  [22, '#d6336c'],
  [28, '#8e3bb8'],
];

function hexToRgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function createPalette(): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i <= VMAX * 2; i++) {
    const s = i / 2;
    let k = 0;
    while (k < STOPS.length - 2 && s > STOPS[k + 1][0]) k++;

    const [s0, c0] = STOPS[k];
    const [s1, c1] = STOPS[k + 1];
    const f = Math.min(1, Math.max(0, (s - s0) / (s1 - s0)));

    const a = hexToRgb(c0);
    const b = hexToRgb(c1);

    out.push([
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ]);
  }
  return out;
}

export const PALETTE = createPalette();

export function palIdx(s: number): number {
  return Math.min(VMAX * 2, Math.max(0, Math.round(s * 2)));
}

export const PAL_CSS = PALETTE.map((c) => `rgb(${c[0]},${c[1]},${c[2]})`);

export function paletteGradient(): string {
  const stops = STOPS.map(([s, c]) => `${c} ${(s / VMAX * 100).toFixed(1)}%`).join(', ');
  return `linear-gradient(to right, ${stops})`;
}
