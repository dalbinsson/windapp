/**
 * Mock weather data generator for testing
 */

import { ForecastPoint } from '../../domain/weather/models';

export class MockWeatherClient {
  generateForecast(
    model: string,
    lat: number,
    lon: number,
    n = 240,
    back = 0
  ): ForecastPoint[] {
    const t0 = Math.floor(Date.now() / 3600e3) * 3600e3;
    const seed = (model.length * 1.7) % 3;
    const points: ForecastPoint[] = [];

    for (let ii = 0; ii < n; ii++) {
      const i = ii - back;
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

      points.push({
        time: t0 + i * 3600e3,
        speed: +v.toFixed(1),
        gust: +(v * (1.3 + 0.1 * Math.sin(i / 3))).toFixed(1),
        dir: Math.round((210 + i * 1.5 + 40 * Math.sin(i / 20) + lon * 5 + seed * 10) % 360),
        lull: +(v * 0.7).toFixed(1),
      });
    }

    return points;
  }

  generateAllForecasts(lat: number, lon: number): Record<string, ForecastPoint[]> {
    return {
      'DMI HARMONIE 2 km': this.generateForecast('DMI HARMONIE 2 km', lat, lon),
      'MET Nordic 1 km': this.generateForecast('MET Nordic 1 km', lat, lon),
      'ECMWF IFS 0.25°': this.generateForecast('ECMWF IFS 0.25°', lat, lon),
      'SMHI SNOW': this.generateForecast('SMHI SNOW', lat, lon),
      'MET Norway': this.generateForecast('MET Norway', lat, lon),
    };
  }
}
