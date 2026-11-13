/**
 * API response types (internal to the API layer)
 * These model the shape of external API responses
 */

export interface RawForecastData {
  time: string[];
  speed: (number | null)[];
  gust: (number | null)[];
  dir: (number | null)[];
  lull?: (number | null)[];
}

export interface OpenMeteoResponse {
  hourly: {
    time: string[];
    [key: string]: string[] | number[];
  };
}

export interface SMHITimeSeries {
  time: string;
  data: {
    wind_speed?: number;
    wind_speed_of_gust?: number;
    wind_from_direction?: number;
  };
}

export interface SMHIResponse {
  timeSeries?: SMHITimeSeries[];
}

export interface MetNoTimeSeries {
  time: string;
  data: {
    instant?: {
      details?: {
        wind_speed?: number;
        wind_speed_of_gust?: number;
        wind_from_direction?: number;
        wind_speed_percentile_10?: number;
      };
    };
  };
}

export interface MetNoResponse {
  properties: {
    timeseries: MetNoTimeSeries[];
  };
}
