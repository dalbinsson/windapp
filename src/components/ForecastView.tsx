import { WeatherData } from '../types';

interface ForecastViewProps {
  data: WeatherData | null;
  loading: boolean;
}

function ForecastView({ data, loading }: ForecastViewProps) {
  if (loading) {
    return (
      <section id="viewForecast">
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mute)' }}>
          Loading forecast data...
        </div>
      </section>
    );
  }

  if (!data || !Object.keys(data.series).length) {
    return (
      <section id="viewForecast">
        <div style={{ padding: '20px', color: '#c0392b' }}>
          No forecast data available. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section id="viewForecast">
      <div className="chartwrap">
        <svg id="chart" viewBox="0 0 860 340" role="img" aria-label="Wind forecast chart">
          {/* Chart will be rendered here */}
        </svg>
        <div className="readout" id="readout" aria-live="polite"></div>
      </div>
      
      {Object.keys(data.errors).length > 0 && (
        <div className="err" id="errs">
          {Object.entries(data.errors).map(([model, error]) => (
            <div key={model}>{model}: {error}</div>
          ))}
        </div>
      )}

      <div className="tablewrap">
        <table id="tbl">
          <thead>
            <tr>
              <th>Time</th>
              {Object.entries(data.series).map(([name]) => (
                <th key={name}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Table rows will be generated from data */}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ForecastView;
