import { GRID_CACHE_MS, MAP_DAYS_MAX, PAST_H, GridSpec, WindData } from './windGrid';

export interface MapModel {
  id: string;
  label: string;
  days: number;
}

export const MAP_MODELS: Record<string, MapModel> = {
  dmi: { id: 'dmi_harmonie_arome_europe', label: 'DMI HARMONIE 2 km', days: 3 },
  nordic: { id: 'metno_nordic', label: 'MET Nordic 1 km', days: 3 },
  ecmwf: { id: 'ecmwf_ifs025', label: 'ECMWF IFS 0.25°', days: 7 },
};

export class MapDataCache {
  private cache = new Map<string, { t: number; j: any }>();

  get(key: string) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.t < GRID_CACHE_MS) {
      return entry.j;
    }
    return null;
  }

  set(key: string, data: any) {
    this.cache.set(key, { t: Date.now(), j: data });
    // Keep only 6 most recent entries
    if (this.cache.size > 6) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

async function getJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.status === 429 ? '429' : `HTTP ${response.status}`);
  }
  return response.json();
}

export async function loadMapWindData(
  gridSpec: GridSpec,
  model: string,
  cache: MapDataCache,
): Promise<WindData> {
  const cfg = MAP_MODELS[model];
  if (!cfg) {
    throw new Error(`Unknown wind model: ${model}`);
  }

  const lats: string[] = [];
  const lons: string[] = [];

  for (let iy = 0; iy < gridSpec.ny; iy++) {
    for (let ix = 0; ix < gridSpec.nx; ix++) {
      lats.push(
        (
          gridSpec.lat0 +
          ((gridSpec.lat1 - gridSpec.lat0) * iy) / (gridSpec.ny - 1)
        ).toFixed(3),
      );
      lons.push(
        (
          gridSpec.lon0 +
          ((gridSpec.lon1 - gridSpec.lon0) * ix) / (gridSpec.nx - 1)
        ).toFixed(3),
      );
    }
  }

  const cacheKey = `${cfg.id}|${gridSpec.nx}x${gridSpec.ny}|${lats[0]}|${lats[lats.length - 1]}|${lons[0]}|${lons[lons.length - 1]}`;
  let data = cache.get(cacheKey);

  if (!data) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(',')}&longitude=${lons.join(',')}` +
      `&hourly=wind_speed_10m,wind_direction_10m&models=${cfg.id}&wind_speed_unit=ms&timezone=UTC&forecast_days=${Math.min(cfg.days, MAP_DAYS_MAX)}&past_days=1`;

    data = await getJson(url);
    cache.set(cacheKey, data);
  }

  const arr = Array.isArray(data) ? data : [data];
  if (arr.length !== gridSpec.nx * gridSpec.ny) {
    throw new Error('unexpected response');
  }

  const pick = (h: any, name: string) =>
    h[`${name}_${cfg.id}`] || h[name] || [];

  const times = arr[0].hourly.time.map(
    (t: string) => new Date(t + 'Z').getTime(),
  );

  const sp = arr.map((a: any) => pick(a.hourly, 'wind_speed_10m'));
  const dr = arr.map((a: any) => pick(a.hourly, 'wind_direction_10m'));

  const ok = times.map(
    (_: number, i: number) =>
      sp.filter((s: number[]) => s[i] != null).length > sp.length / 4,
  );

  const now = Date.now();
  const first = times.findIndex(
    (t: number, i: number) => ok[i] && t >= now - PAST_H * 3600e3,
  );
  const last = ok.lastIndexOf(true);

  if (first < 0 || last < first) {
    throw new Error('this model has no data here');
  }

  return { times, sp, dr, g: gridSpec, first, last, label: cfg.label };
}
