/**
 * Application configuration
 */

export const config = {
  // API endpoints
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com/v1',
    forecast: '/forecast',
  },
  smhi: {
    baseUrl: 'https://opendata-download-stac.smhi.se/api/v1',
    forecast: '/collections/sea_wave_models-gfs-025-1h-seastate/items',
  },
  metNo: {
    baseUrl: 'https://api.met.no/weatherapi/complete',
    forecast: '/2.0',
  },

  // Defaults
  location: {
    lat: 57.325,
    lon: 12.105,
    name: 'Åsa',
  },

  // Time
  timezone: 'Europe/Stockholm',
  pastHours: 5,

  // UI
  defaultHorizon: 120, // hours
  defaultTableStep: 3, // hours
  defaultUnits: 'ms', // m/s or kn
};

export type Config = typeof config;
