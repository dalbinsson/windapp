import { WeatherData, ForecastSeries, ForecastPoint } from '../types';

const DEFAULT_LAT = 57.325;
const DEFAULT_LON = 12.105;

let MOCK = false;

interface RawForecastData {
  time: string[];
  speed: (number | null)[];
  gust: (number | null)[];
  dir: (number | null)[];
  lull?: (number | null)[];
}

interface MockedTimeSeries {
  time: string;
  data: {
    wind_speed?: number;
    wind_speed_of_gust?: number;
    wind_from_direction?: number;
    instant?: {
      details?: {
        wind_speed?: number;
        wind_speed_of_gust?: number;
        wind_from_direction?: number;
        wind_speed_percentile_10?: number;
      };
    };
  };
}

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    [key: string]: string[] | number[];
  };
}

interface SMHIResponse {
  timeSeries?: MockedTimeSeries[];
}

interface MetNoResponse {
  properties: {
    timeseries: MockedTimeSeries[];
  };
}

export function setMockMode(enabled: boolean) {
  MOCK = enabled;
}

function mockSeries(
  model: string,
  lat: number,
  lon: number,
  n = 240,
  back = 0
): RawForecastData {
  const t0 = Math.floor(Date.now() / 3600e3) * 3600e3;
  const seed = (model.length * 1.7) % 3;
  const time: string[] = [];
  const speed: number[] = [];
  const gust: number[] = [];
  const dir: number[] = [];
  const lull: number[] = [];

  for (let ii = 0; ii < n; ii++) {
    const i = ii - back;
    time.push(new Date(t0 + i * 3600e3).toISOString());

    const geo = Math.sin(lat * 13 + lon * 7) * 0.8 + (lat - 57.3) * 1.5;
    const front =
      9 * Math.exp(-(((i - 34) / 9) ** 2)) +
      26 * Math.exp(-(((i - 62) / 7) ** 2)) +
      12 * Math.exp(-(((i - 120) / 12) ** 2));

    const v = Math.max(
      0.3,
      4.5 +
        2.5 * Math.sin(i / 7 + seed) +
        front +
        geo +
        seed * 0.4 +
        0.9 * Math.sin(i * 2.3 + seed * 5) +
        0.6 * Math.sin(i * 4.1)
    );

    speed.push(parseFloat(v.toFixed(1)));
    gust.push(parseFloat((v * (1.3 + 0.1 * Math.sin(i / 3))).toFixed(1)));
    lull.push(parseFloat((v * 0.7).toFixed(1)));
    dir.push(Math.round((210 + i * 1.5 + 40 * Math.sin(i / 20) + lon * 5 + seed * 10) % 360));
  }

  return { time, speed, gust, dir, lull };
}

async function getJson(url: string): Promise<OpenMeteoResponse | SMHIResponse | MetNoResponse> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return mockJsonResponse(url) as OpenMeteoResponse | SMHIResponse | MetNoResponse;
  }

  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<OpenMeteoResponse | SMHIResponse | MetNoResponse>;
}

function mockJsonResponse(url: string): Record<string, unknown> {
  const u = new URL(url);
  const q = u.searchParams;
  const lat = parseFloat(q.get('latitude') || String(DEFAULT_LAT));
  const lon = parseFloat(q.get('longitude') || String(DEFAULT_LON));

  if (u.host.includes('open-meteo')) {
    const id = q.get('models') || 'dmi_harmonie_arome_europe';
    const m = mockSeries(id, lat, lon, 240, 0);
    return {
      hourly: {
        time: m.time.map((t) => t.slice(0, 16)),
        [`wind_speed_10m_${id}`]: m.speed,
        [`wind_gusts_10m_${id}`]: m.gust,
        [`wind_direction_10m_${id}`]: m.dir,
      },
    };
  }

  if (u.host.includes('smhi')) {
    const m = mockSeries('SMHI', lat, lon, 160);
    return {
      timeSeries: m.time.map((t, i) => ({
        time: t,
        data: {
          wind_speed: m.speed[i],
          wind_speed_of_gust: m.gust[i],
          wind_from_direction: m.dir[i],
        },
      })),
    };
  }

  const m = mockSeries('MET Norway', lat, lon, 200);
  return {
    properties: {
      timeseries: m.time.map((t, i) => ({
        time: t,
        data: {
          instant: {
            details: {
              wind_speed: m.speed[i],
              wind_speed_of_gust: m.gust[i],
              wind_from_direction: m.dir[i],
              wind_speed_percentile_10: m.lull?.[i],
            },
          },
        },
      })),
    },
  };
}

async function omModel(id: string, label: string, lat: number, lon: number) {
  const j = (await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m&models=${id}` +
      `&wind_speed_unit=ms&timezone=UTC&forecast_days=10&past_days=1`
  )) as OpenMeteoResponse;

  const h = j.hourly;
  const pick = (name: string) => h[`${name}_${id}`] as (string | number)[] || h[name] as (string | number)[] || [];
  const speed = pick('wind_speed_10m') as number[];

  if (!speed.length || speed.every((x: number | null) => x == null)) {
    throw new Error('no data');
  }

  return {
    [label]: {
      time: h.time.map((t: string) => (t.endsWith('Z') ? t : t + 'Z')),
      speed,
      gust: pick('wind_gusts_10m'),
      dir: pick('wind_direction_10m'),
    },
  };
}

async function fetchSMHI(lat: number, lon: number) {
  const j = (await getJson(
    `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/` +
      `lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json?parameters=wind_speed,wind_speed_of_gust,wind_from_direction`
  )) as SMHIResponse;

  const ts = j.timeSeries || [];
  return {
    'SMHI SNOW': {
      time: ts.map((e: MockedTimeSeries) => e.time),
      speed: ts.map((e: MockedTimeSeries) => e.data.wind_speed),
      gust: ts.map((e: MockedTimeSeries) => e.data.wind_speed_of_gust),
      dir: ts.map((e: MockedTimeSeries) => e.data.wind_from_direction),
    },
  };
}

async function fetchMetNo(lat: number, lon: number) {
  const j = (await getJson(
    `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`
  )) as MetNoResponse;

  const ts = j.properties.timeseries;
  const d = (e: MockedTimeSeries) => e.data.instant?.details || {};

  return {
    'MET Norway': {
      time: ts.map((e: MockedTimeSeries) => e.time),
      speed: ts.map((e: MockedTimeSeries) => d(e)?.wind_speed),
      gust: ts.map((e: MockedTimeSeries) => d(e)?.wind_speed_of_gust),
      dir: ts.map((e: MockedTimeSeries) => d(e)?.wind_from_direction),
      lull: ts.map((e: MockedTimeSeries) => d(e)?.wind_speed_percentile_10),
    },
  };
}

async function buildForecastData(lat: number, lon: number) {
  const jobs: [string, () => Promise<Record<string, unknown>>][] = [
    ['DMI HARMONIE', () => omModel('dmi_harmonie_arome_europe', 'DMI HARMONIE 2 km', lat, lon)],
    ['MET Nordic', () => omModel('metno_nordic', 'MET Nordic 1 km', lat, lon)],
    ['ECMWF IFS', () => omModel('ecmwf_ifs025', 'ECMWF IFS 0.25°', lat, lon)],
    ['SMHI', () => fetchSMHI(lat, lon)],
    ['MET Norway', () => fetchMetNo(lat, lon)],
  ];

  const results = await Promise.allSettled(jobs.map(([, f]) => f()));
  const sources: Record<string, RawForecastData> = {};
  const errors: Record<string, string> = {};

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      Object.assign(sources, result.value);
    } else {
      const error = result.reason as Error;
      errors[jobs[i][0]] = error.message || String(result.reason);
    }
  });

  return { sources, errors };
}

const modelColors: Record<string, string> = {
  'DMI HARMONIE 2 km': '#ff6b6b',
  'MET Nordic 1 km': '#4ecdc4',
  'ECMWF IFS 0.25°': '#ffe66d',
  'SMHI SNOW': '#95e1d3',
  'MET Norway': '#c44569',
};

function parseForecasts(
  rawData: Record<string, RawForecastData>
): Record<string, ForecastSeries> {
  const result: Record<string, ForecastSeries> = {};

  for (const [modelName, data] of Object.entries(rawData)) {
    const points: ForecastPoint[] = [];

    for (let i = 0; i < data.time.length; i++) {
      const timeStr = data.time[i];
      const time = new Date(timeStr).getTime();

      points.push({
        time,
        speed: data.speed[i] ?? 0,
        gust: data.gust[i] ?? 0,
        dir: data.dir[i] ?? 0,
        lull: data.lull?.[i] ?? undefined,
      });
    }

    result[modelName] = {
      name: modelName,
      points,
      color: modelColors[modelName] || '#999',
    };
  }

  return result;
}

export async function fetchWeatherData(
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON
): Promise<WeatherData> {
  const { sources, errors } = await buildForecastData(lat, lon);

  if (!Object.keys(sources).length) {
    throw new Error('No forecast sources available');
  }

  return {
    series: parseForecasts(sources),
    errors,
    location: { lat, lon },
    loadedAt: Date.now(),
  };
}
