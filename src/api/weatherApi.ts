/**
 * Public API for weather data fetching
 * This is the interface used by the application
 */

import { WeatherData } from '../domain/weather/models';
import { weatherService } from './services/weatherService';

/**
 * Set whether to use mock data for testing
 */
export function setMockMode(enabled: boolean) {
  weatherService.setMockMode(enabled);
}

/**
 * Fetch weather forecast data for a location
 */
export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  try {
    return await weatherService.fetchWeatherData(lat, lon);
  } catch (error) {
    console.error('Weather data fetch error:', error);
    return {
      series: {},
      errors: {
        'All Services': error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}
