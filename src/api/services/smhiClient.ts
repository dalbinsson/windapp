/**
 * SMHI snow forecast API client
 */

import { SMHIResponse } from '../types';
import { ForecastPoint } from '../../domain/weather/models';

export class SMHIClient {
  async fetchForecast(lat: number, lon: number): Promise<ForecastPoint[]> {
    const url =
      'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/' +
      `lon/${lon.toFixed(4)}/lat/${lat.toFixed(4)}/data.json?parameters=wind_speed,wind_speed_of_gust,wind_from_direction`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`SMHI error: ${response.statusText}`);

    const data = (await response.json()) as SMHIResponse;
    return this.parseForecasts(data);
  }

  private parseForecasts(data: SMHIResponse): ForecastPoint[] {
    const points: ForecastPoint[] = [];
    const timeSeries = data.timeSeries || [];

    for (const ts of timeSeries) {
      points.push({
        time: new Date(ts.time).getTime(),
        speed: ts.data.wind_speed ?? null,
        gust: ts.data.wind_speed_of_gust ?? null,
        dir: ts.data.wind_from_direction ?? null,
        lull: null,
      });
    }

    return points;
  }
}
