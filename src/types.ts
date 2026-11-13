// Re-export domain models from domain layer
export type { WeatherData, ForecastPoint, ForecastSeries, Location } from './domain/weather/models';

// Re-export config
export { config } from './config';

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
