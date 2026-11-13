/**
 * Main weather API orchestrator
 * Coordinates fetching from multiple sources and combines results
 */

import { WeatherData, ForecastSeries } from '../../domain/weather/models';
import { OpenMeteoClient } from './openMeteoClient';
import { SMHIClient } from './smhiClient';
import { MetNoClient } from './metNoClient';
import { MockWeatherClient } from './mockWeatherClient';

export class WeatherService {
  private openMeteo = new OpenMeteoClient();
  private smhi = new SMHIClient();
  private metNo = new MetNoClient();
  private mock = new MockWeatherClient();
  private useMockMode = false;

  setMockMode(enabled: boolean) {
    this.useMockMode = enabled;
  }

  async fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
    if (this.useMockMode) {
      const forecasts = this.mock.generateAllForecasts(lat, lon);
      return {
        series: Object.entries(forecasts).reduce(
          (acc, [name, points]) => {
            acc[name] = { name, points };
            return acc;
          },
          {} as Record<string, ForecastSeries>
        ),
        errors: {},
        timestamp: Date.now(),
      };
    }

    const results: Record<string, ForecastSeries> = {};
    const errors: Record<string, string> = {};

    // Fetch from all sources in parallel
    const outcomes = await Promise.allSettled([
      this.openMeteo.fetchForecast(lat, lon),
      this.smhi.fetchForecast(lat, lon),
      this.metNo.fetchForecast(lat, lon),
    ]);

    // Process Open-Meteo results (3 models)
    if (outcomes[0].status === 'fulfilled') {
      Object.entries(outcomes[0].value).forEach(([name, points]) => {
        results[name] = { name, points };
      });
    } else {
      errors['Open-Meteo'] = String(outcomes[0].reason);
    }

    // Process SMHI results
    if (outcomes[1].status === 'fulfilled') {
      results['SMHI SNOW'] = { name: 'SMHI SNOW', points: outcomes[1].value };
    } else {
      errors['SMHI'] = String(outcomes[1].reason);
    }

    // Process MET Norway results
    if (outcomes[2].status === 'fulfilled') {
      results['MET Norway'] = { name: 'MET Norway', points: outcomes[2].value };
    } else {
      errors['MET Norway'] = String(outcomes[2].reason);
    }

    return {
      series: results,
      errors,
      timestamp: Date.now(),
    };
  }
}

// Export singleton
export const weatherService = new WeatherService();
