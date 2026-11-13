function MapView() {
  return (
    <section id="viewMap">
      <div className="mapwrap" id="mapwrap">
        <div id="map" style={{ width: '100%', height: '100%' }}></div>
        <canvas id="heat"></canvas>
        <canvas id="parts"></canvas>
        <button className="fab" id="mapZoomIn" aria-label="Back to forecast spot" title="Back to your forecast spot">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
          </svg>
        </button>
        <div className="legendbar" id="mapLegend"></div>
      </div>
      <div id="mapReadout">Tap the map to read the wind at a spot.</div>
      <div className="when2" id="mapWhen"></div>
      <div className="timebox">
        <button id="mapPlay" aria-label="Play">
          ▶
        </button>
        <div className="timecol">
          <input type="range" id="mapTime" min="0" max="0" value="0" aria-label="Forecast time" />
          <div className="ticks" id="mapTicks"></div>
          <svg id="mapGraph" role="img" aria-label="Wind speed forecast for the selected spot"></svg>
        </div>
      </div>
    </section>
  );
}

export default MapView;
