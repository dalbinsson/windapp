/**
 * MET Norway forecast API client
 */

import { MetNoResponse } from '../types';
import { ForecastPoint } from '../../domain/weather/models';

export class MetNoClient {
  async fetchForecast(lat: number, lon: number): Promise<ForecastPoint[]> {
    const params = new URLSearchParams({
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
    });

    const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?${params}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'windapp (https://github.com/dalbinsson/windapp)' },
    });

    if (!response.ok) throw new Error(`MET Norway error: ${response.statusText}`);

    const data = (await response.json()) as MetNoResponse;
    return this.parseForecasts(data);
  }

  private parseForecasts(data: MetNoResponse): ForecastPoint[] {
    const points: ForecastPoint[] = [];
    const timeSeries = data.properties.timeseries || [];

    for (const ts of timeSeries) {
      const details = ts.data.instant?.details;
      if (!details) continue;
      points.push({
        time: new Date(ts.time).getTime(),
        speed: details.wind_speed ?? null,
        gust: details.wind_speed_of_gust ?? null,
        dir: details.wind_from_direction ?? null,
        lull: details.wind_speed_percentile_10 ?? null,
      });
    }

    return points;
  }
}
