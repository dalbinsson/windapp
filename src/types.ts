export interface ForecastPoint {
  time: number;
  speed: number;
  gust: number;
  dir: number;
  lull?: number;
}

export interface ForecastSeries {
  name: string;
  points: ForecastPoint[];
  color: string;
}

export interface WeatherData {
  series: Record<string, ForecastSeries>;
  errors: Record<string, string>;
  location: {
    lat: number;
    lon: number;
    name?: string;
  };
  loadedAt: number;
}

export type Units = 'ms' | 'kn';

export interface Settings {
  units: Units;
  horizon: 24 | 48 | 72 | 120 | 168 | 240;
  tableStep: 1 | 3 | 6 | 12;
  hiddenForecasts: Set<string>;
  mapModel: 'dmi' | 'nordic' | 'ecmwf';
  mapBase: 'dark' | 'light' | 'carto';
  cartoKey?: string;
}
