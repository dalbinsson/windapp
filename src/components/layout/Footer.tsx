export const Footer = () => {
  return (
    <footer className="credits">
      <b>Data and credits.</b>
      Forecasts:{' '}
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
        Weather data by Open-Meteo.com
      </a>{' '}
      (DMI HARMONIE, MET Nordic and ECMWF IFS,{' '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
        CC BY 4.0
      </a>
      ),
      <a
        href="https://www.smhi.se/en/services/open-data/conditions-of-use-1.33347"
        target="_blank"
        rel="noreferrer"
      >
        SMHI open data
      </a>{' '}
      (CC BY 4.0) and
      <a href="https://developer.yr.no/doc/License/" target="_blank" rel="noreferrer">
        MET Norway
      </a>{' '}
      (CC BY 4.0). Values are processed: lines are smoothed, the map wind is interpolated between model
      grid points, and heights are 10 m. Map:{' '}
      <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
        OpenFreeMap
      </a>{' '}
      © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
        OpenMapTiles
      </a>
      , data from{' '}
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        OpenStreetMap contributors
      </a>
      . Place names:{' '}
      <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">
        Photon
      </a>{' '}
      / OpenStreetMap. A hobby project. Do not rely on it for safety decisions at sea.
    </footer>
  );
};
