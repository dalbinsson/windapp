/**
 * Domain models for weather forecasting
 * These are the core business entities, independent of any API or UI framework
 */

export interface ForecastPoint {
  time: number; // milliseconds
  speed: number | null; // m/s
  gust: number | null; // m/s
  dir: number | null; // degrees
  lull: number | null; // m/s
}

export interface ForecastSeries {
  name: string;
  points: ForecastPoint[];
  color?: string;
}

export interface WeatherData {
  series: Record<string, ForecastSeries>;
  errors: Record<string, string>;
  timestamp?: number;
}

export interface Location {
  lat: number;
  lon: number;
  name?: string;
}

export const DEFAULT_LOCATION: Location = {
  lat: 57.325,
  lon: 12.105,
  name: 'Åsa',
};
