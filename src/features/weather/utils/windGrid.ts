export const GRID_POINTS = 240;
export const GRID_CACHE_MS = 15 * 60 * 1000;
export const MAP_DAYS_MAX = 15;
export const PAST_H = 48;
export const REDUCED = false;
export const CELL = 12;

export interface GridSpec {
  lat0: number;
  lat1: number;
  lon0: number;
  lon1: number;
  nx: number;
  ny: number;
  spacingKm: number;
}

export interface WindData {
  times: number[];
  sp: number[][];
  dr: number[][];
  g: GridSpec;
  first: number;
  last: number;
  label: string;
}

export interface WindGrid {
  gs: Float32Array;
  gu: Float32Array;
  gv: Float32Array;
}

export interface WindField {
  cols: number;
  rows: number;
  U: Float32Array;
  V: Float32Array;
  S: Float32Array;
}

export interface Particle {
  x: number;
  y: number;
  age: number;
  life: number;
}

export function gridSpec(clat: number, clon: number, km: number): GridSpec {
  const dLat = (km / 2) / 110.574;
  const dLon = (km / 2) / (111.32 * Math.cos((clat * Math.PI) / 180));
  return {
    lat0: clat - dLat,
    lat1: clat + dLat,
    lon0: clon - dLon,
    lon1: clon + dLon,
    nx: 0,
    ny: 0,
    spacingKm: 0,
  };
}

export function gridForView(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): GridSpec {
  const b = {
    south: Math.max(-85, bounds.south - (bounds.north - bounds.south) * 0.25),
    north: Math.min(85, bounds.north + (bounds.north - bounds.south) * 0.25),
    west: Math.max(-180, bounds.west - (bounds.east - bounds.west) * 0.25),
    east: Math.min(180, bounds.east + (bounds.east - bounds.west) * 0.25),
  };

  const lat0 = b.south;
  const lat1 = b.north;
  const lon0 = b.west;
  const lon1 = b.east;

  const hKm = (lat1 - lat0) * 110.574;
  const wKm = (lon1 - lon0) * 111.32 * Math.cos(((lat0 + lat1) / 2 * Math.PI) / 180);

  const aspect = Math.max(0.2, Math.min(5, wKm / hKm));
  const ny = Math.max(4, Math.min(24, Math.round(Math.sqrt(GRID_POINTS / aspect))));
  const nx = Math.max(4, Math.min(24, Math.round(GRID_POINTS / ny)));

  const spacingKm = (wKm / (nx - 1) + hKm / (ny - 1)) / 2;

  return { lat0, lat1, lon0, lon1, nx, ny, spacingKm };
}

export function sampleGrid(
  lat: number,
  lon: number,
  data: WindData,
  grid: WindGrid,
): [number, number, number] | null {
  const g = data.g;
  const gr = grid;
  const nx = g.nx;
  const ny = g.ny;

  const fx = ((lon - g.lon0) / (g.lon1 - g.lon0)) * (nx - 1);
  const fy = ((lat - g.lat0) / (g.lat1 - g.lat0)) * (ny - 1);

  if (fx < 0 || fy < 0 || fx > nx - 1 || fy > ny - 1) return null;

  const x0 = Math.min(nx - 2, Math.floor(fx));
  const y0 = Math.min(ny - 2, Math.floor(fy));
  const tx = fx - x0;
  const ty = fy - y0;

  const idx = [y0 * nx + x0, y0 * nx + x0 + 1, (y0 + 1) * nx + x0, (y0 + 1) * nx + x0 + 1];
  const w = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty];

  let S = 0;
  let U = 0;
  let V = 0;
  let W = 0;

  for (let i = 0; i < 4; i++) {
    const s = gr.gs[idx[i]];
    if (Number.isNaN(s)) continue;
    S += s * w[i];
    U += gr.gu[idx[i]] * w[i];
    V += gr.gv[idx[i]] * w[i];
    W += w[i];
  }

  if (W < 0.5) return null;

  S /= W;
  U /= W;
  V /= W;

  const m = Math.hypot(U, V);
  if (m > 1e-6) {
    const norm = S / m;
    U = U * norm;
    V = V * norm;
  }

  return [U, V, S];
}

export function sampleScreen(
  x: number,
  y: number,
  field: WindField,
): [number, number, number] | null {
  if (!field) return null;

  const fx = x / CELL;
  const fy = y / CELL;
  const c0 = Math.floor(fx);
  const r0 = Math.floor(fy);

  if (c0 < 0 || r0 < 0 || c0 >= field.cols - 1 || r0 >= field.rows - 1) return null;

  const tx = fx - c0;
  const ty = fy - r0;
  const i00 = r0 * field.cols + c0;
  const i10 = i00 + 1;
  const i01 = i00 + field.cols;
  const i11 = i01 + 1;

  if (
    Number.isNaN(field.S[i00]) ||
    Number.isNaN(field.S[i10]) ||
    Number.isNaN(field.S[i01]) ||
    Number.isNaN(field.S[i11])
  )
    return null;

  const a = (1 - tx) * (1 - ty);
  const b = tx * (1 - ty);
  const c = (1 - tx) * ty;
  const d = tx * ty;

  const U = field.U[i00] * a + field.U[i10] * b + field.U[i01] * c + field.U[i11] * d;
  const V = field.V[i00] * a + field.V[i10] * b + field.V[i01] * c + field.V[i11] * d;
  const S = field.S[i00] * a + field.S[i10] * b + field.S[i01] * c + field.S[i11] * d;

  return [U, V, S];
}
