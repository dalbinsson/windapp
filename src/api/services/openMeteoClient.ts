/**
 * Open-Meteo weather API client
 * Fetches HARMONIE, Nordic, and ECMWF forecasts
 */

import { config } from '../../config';
import { OpenMeteoResponse } from '../types';
import { ForecastPoint } from '../../domain/weather/models';

export class OpenMeteoClient {
  async fetchForecast(lat: number, lon: number): Promise<Record<string, ForecastPoint[]>> {
    const models = [
      { id: 'dmi_harmonie_arome_europe', label: 'DMI HARMONIE 2 km' },
      { id: 'metno_nordic', label: 'MET Nordic 1 km' },
      { id: 'ecmwf_ifs025', label: 'ECMWF IFS 0.25°' },
    ];

    const result: Record<string, ForecastPoint[]> = {};

    for (const model of models) {
      const params = new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        hourly: 'wind_speed_10m,wind_gusts_10m,wind_direction_10m',
        models: model.id,
        wind_speed_unit: 'ms',
        timezone: 'UTC',
        forecast_days: '10',
        past_days: '1',
      });

      const url = `${config.openMeteo.baseUrl}${config.openMeteo.forecast}?${params}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OpenMeteo error: ${response.statusText}`);

      const data = (await response.json()) as OpenMeteoResponse;
      const points = this.parseModel(data, model.id);
      result[model.label] = points;
    }

    return result;
  }

  private parseModel(data: OpenMeteoResponse, modelId: string): ForecastPoint[] {
    const h = data.hourly;
    const pick = (name: string) =>
      (h[`${name}_${modelId}`] as number[]) || (h[name] as number[]) || [];

    const times = (h.time || []) as string[];
    const speeds = pick('wind_speed_10m');
    const gusts = pick('wind_gusts_10m');
    const dirs = pick('wind_direction_10m');

    if (!speeds.length || speeds.every((x) => x == null)) {
      throw new Error('no data');
    }

    return times.map((time, i) => ({
      time: new Date(time + 'Z').getTime(),
      speed: speeds[i] ?? null,
      gust: gusts[i] ?? null,
      dir: Math.round(dirs[i]) ?? null,
      lull: null,
    }));
  }
}
