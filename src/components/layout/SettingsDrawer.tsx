import { useAppStore } from '@/stores/appStore';

export const SettingsDrawer = () => {
  const { drawerOpen, setDrawerOpen, settings, updateSettings, mockMode, setMockMode, data } = useAppStore();

  const handleMockModeToggle = () => {
    setMockMode(!mockMode);
  };

  const handleForecastToggle = (name: string) => {
    const newHidden = new Set(settings.hiddenForecasts);

    if (newHidden.has(name)) {
      newHidden.delete(name);
    } else {
      const visibleCount = (data?.series ? Object.keys(data.series).length : 0) - newHidden.size;
      if (visibleCount > 1) {
        newHidden.add(name);
      }
    }

    updateSettings({ hiddenForecasts: newHidden });
  };

  return (
    <>
      <div
        className={`scrim ${drawerOpen ? 'open' : ''}`}
        id="scrim"
        onClick={() => setDrawerOpen(false)}
      ></div>
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`} id="drawer" aria-label="Settings">
        <div className="dhead">
          <h2>Settings</h2>
          <button
            className="icon"
            id="drawerClose"
            aria-label="Close settings"
            onClick={() => setDrawerOpen(false)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <h3>API Mode</h3>
        <label className="field">
          <span>Mock Data</span>
          <input
            type="checkbox"
            checked={mockMode}
            onChange={handleMockModeToggle}
            style={{ cursor: 'pointer' }}
          />
        </label>
        <p className="msg">
          {mockMode
            ? 'Using simulated data for testing'
            : 'Using live data from weather APIs'}
        </p>

        <h3>Units</h3>
        <span className="seg">
          <button
            id="bKn"
            className={settings.units === 'kn' ? 'on' : ''}
            onClick={() => updateSettings({ units: 'kn' })}
          >
            kn
          </button>
          <button
            id="bMs"
            className={settings.units === 'ms' ? 'on' : ''}
            onClick={() => updateSettings({ units: 'ms' })}
          >
            m/s
          </button>
        </span>

        <div id="secForecast">
          <h3>Forecasts on the chart</h3>
          <div id="legend">
            {data?.series && Object.entries(data.series).map(([name]) => {
              const isHidden = settings.hiddenForecasts.has(name);
              const COLORS: Record<string, string> = {
                'DMI HARMONIE 2 km': '#2a7de1',
                'MET Nordic 1 km': '#e8590c',
                'ECMWF IFS 0.25°': '#9c36b5',
                'SMHI SNOW': '#2f9e44',
                'MET Norway': '#0c8599',
              };
              const color = COLORS[name] || '#888';

              return (
                <button
                  key={name}
                  className="mrow"
                  style={{
                    '--c': color,
                  } as React.CSSProperties}
                  aria-pressed={!isHidden}
                  onClick={() => handleForecastToggle(name)}
                >
                  <i className="sw"></i>
                  <span className="mn">{name}</span>
                  <span className="tog"></span>
                </button>
              );
            })}
          </div>

          <h3>Chart and table</h3>
          <label className="field">
            Horizon
            <select
              id="selHorizon"
              value={settings.horizon}
              onChange={(e) =>
                updateSettings({ horizon: parseInt(e.target.value, 10) as 24 | 48 | 72 | 120 | 168 | 240 })
              }
            >
              <option value="24">24 h</option>
              <option value="48">48 h</option>
              <option value="72">3 days</option>
              <option value="120">5 days</option>
              <option value="168">7 days</option>
              <option value="240">10 days</option>
            </select>
          </label>
          <label className="field">
            Table step
            <select
              id="selStep"
              value={settings.tableStep}
              onChange={(e) =>
                updateSettings({ tableStep: parseInt(e.target.value, 10) as 1 | 3 | 6 | 12 })
              }
            >
              <option value="1">1 h</option>
              <option value="3">3 h</option>
              <option value="6">6 h</option>
              <option value="12">12 h</option>
            </select>
          </label>
        </div>

        <div id="secMap" hidden>
          <h3>Map</h3>
          <label className="field">
            Wind model
            <select
              id="mapModel"
              value={settings.mapModel}
              onChange={(e) =>
                updateSettings({ mapModel: e.target.value as 'dmi' | 'nordic' | 'ecmwf' })
              }
            >
              <option value="dmi">DMI HARMONIE 2 km</option>
              <option value="nordic">MET Nordic 1 km</option>
              <option value="ecmwf">ECMWF IFS 0.25°</option>
            </select>
          </label>
          <label className="field">
            Basemap
            <select
              id="mapBase"
              value={settings.mapBase}
              onChange={(e) =>
                updateSettings({ mapBase: e.target.value as 'dark' | 'light' | 'carto' })
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="carto" id="optCarto" hidden>
                Dark (CARTO key)
              </option>
            </select>
          </label>
        </div>
      </aside>
    </>
  );
};
