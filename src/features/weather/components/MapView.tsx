import { useEffect, useRef, useState } from 'react';
import L, { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  CELL,
  REDUCED,
  GridSpec,
  Particle,
  WindData,
  WindField,
  WindGrid,
  gridForView,
  sampleGrid,
  sampleScreen,
} from '../utils';
import { PALETTE, PAL_CSS, VMAX, palIdx, paletteGradient } from '../utils/colorPalette';
import { MapDataCache, loadMapWindData } from '../utils/mapData';
import { config } from '@/config';

const LAT = config.location.lat;
const LON = config.location.lon;

export const MapView = () => {
  const mapRef = useRef<Map | null>(null);
  const dotRef = useRef<L.CircleMarker | null>(null);
  const pickRef = useRef<L.CircleMarker | null>(null);
  const [windData, setWindData] = useState<WindData | null>(null);
  const [windGrid, setWindGrid] = useState<WindGrid | null>(null);
  const [windField, setWindField] = useState<WindField | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [readout, setReadout] = useState('Tap the map to read the wind at a spot.');
  const [windWhen, setWindWhen] = useState('');

  const cacheRef = useRef(new MapDataCache());
  const rafRef = useRef<number>(0);
  const partsRef = useRef<Particle[]>([]);
  const sizeRef = useRef<[number, number]>([0, 0]);
  const reloadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modelRef = useRef('nordic');

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return;

    try {
      const m = L.map('map', {
        preferCanvas: true,
        zoomSnap: 0.25,
        minZoom: 3,
        maxZoom: 14,
        maxBounds: [[-85, -Infinity], [85, Infinity]],
        maxBoundsViscosity: 1,
      }).setView([LAT, LON], 9);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 14,
        attribution: '© OpenStreetMap contributors',
      }).addTo(m);

      // Draw center marker
      dotRef.current = L.circleMarker([LAT, LON], {
        radius: 6,
        color: '#ffffff',
        weight: 2,
        fillColor: '#e8590c',
        fillOpacity: 1,
        interactive: false,
      }).addTo(m);

      // Handle map clicks
      m.on('click', (e: L.LeafletMouseEvent) => onMapClick(e, m));

      // Handle pan/zoom
      m.on('movestart zoomstart', () => {
        const heat = document.getElementById('heat') as HTMLCanvasElement;
        const parts = document.getElementById('parts') as HTMLCanvasElement;
        if (heat) heat.style.opacity = '0';
        if (parts) parts.style.opacity = '0';
      });

      m.on('moveend zoomend resize', () => {
        sizeCanvases();
        rebuildField();
        const heat = document.getElementById('heat') as HTMLCanvasElement;
        const parts = document.getElementById('parts') as HTMLCanvasElement;
        if (heat) heat.style.opacity = '1';
        if (parts) parts.style.opacity = '1';
        scheduleReload();
      });

      mapRef.current = m;
      sizeCanvases();
      ensureFramed();
    } catch (error) {
      console.error('MapView init error:', error);
      setStatus('Failed to initialize map');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  function sizeCanvases() {
    const wrap = document.getElementById('mapwrap') as HTMLElement;
    if (!wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvasIds = ['heat', 'parts'];
    for (const id of canvasIds) {
      const c = document.getElementById(id) as HTMLCanvasElement;
      if (c) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
        const ctx = c.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }

    sizeRef.current = [w, h];
    const want = REDUCED ? 0 : Math.min(1600, Math.max(500, Math.round((w * h) / 300)));
    partsRef.current = Array.from({ length: want }, () => ({
      x: 0,
      y: 0,
      age: 1e9,
      life: 0,
    }));
  }

  function ensureFramed() {
    if (!mapRef.current) return;
    const gridSpec = {
      lat0: LAT - 8 / 110.574,
      lat1: LAT + 8 / 110.574,
      lon0: LON - 8 / (111.32 * Math.cos((LAT * Math.PI) / 180)),
      lon1: LON + 8 / (111.32 * Math.cos((LAT * Math.PI) / 180)),
      nx: 2,
      ny: 2,
      spacingKm: 0,
    };
    mapRef.current.invalidateSize();
    mapRef.current.fitBounds(
      [
        [gridSpec.lat0, gridSpec.lon0],
        [gridSpec.lat1, gridSpec.lon1],
      ],
      { padding: [6, 6], animate: false },
    );
  }

  function scheduleReload() {
    if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    reloadTimerRef.current = setTimeout(() => {
      if (!mapRef.current) return;
      const bounds = mapRef.current.getBounds();
      const spec = gridForView({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      loadMapData(spec);
    }, 1500);
  }

  async function loadMapData(gridSpec: GridSpec) {
    try {
      setStatus('Updating wind field…');
      const data = await loadMapWindData(gridSpec, modelRef.current, cacheRef.current);
      setWindData(data);

      const now = Date.now();
      let ti =
        data.times.findIndex(
          (t, i) => i >= data.first && t >= now - 1800e3,
        ) >= 0 && data.times.findIndex((t, i) => i >= data.first && t >= now - 1800e3) <= data.last
          ? data.times.findIndex((t, i) => i >= data.first && t >= now - 1800e3)
          : data.first;

      setCurrentTime(ti);
      setNote(`${data.label} · about ${data.g.spacingKm < 10 ? data.g.spacingKm.toFixed(1) : Math.round(data.g.spacingKm)} km between wind points`);
      setStatus('');
      setTime(ti, data);
    } catch (error) {
      console.error('Failed to load wind data:', error);
      setStatus(`Could not update the wind field (${error instanceof Error ? error.message : 'unknown error'})`);
    }
  }

  function setTime(ti: number, data: WindData) {
    if (!data) return;
    setCurrentTime(ti);

    const n = data.g.nx * data.g.ny;
    const gs = new Float32Array(n);
    const gu = new Float32Array(n);
    const gv = new Float32Array(n);

    for (let k = 0; k < n; k++) {
      const s = data.sp[k][ti];
      const dir = data.dr[k][ti];
      if (s == null || dir == null) {
        gs[k] = gu[k] = gv[k] = NaN;
        continue;
      }
      const r = (dir * Math.PI) / 180;
      gs[k] = s;
      gu[k] = -s * Math.sin(r);
      gv[k] = -s * Math.cos(r);
    }

    const newGrid = { gs, gu, gv };
    setWindGrid(newGrid);

    const hourFmt = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'UTC',
    });

    const isNow = Math.abs(data.times[ti] - Date.now()) < 30 * 60e3;
    setWindWhen(
      `${hourFmt.format(new Date(data.times[ti]))}${isNow ? ' (now)' : ''} · ${data.label}`,
    );

    rebuildField();
  }

  function rebuildField() {
    if (!mapRef.current || !windData || !windGrid) return;

    const [w, h] = sizeRef.current;
    if (!w || !h) return;

    const cols = Math.ceil(w / CELL) + 1;
    const rows = Math.ceil(h / CELL) + 1;
    const U = new Float32Array(cols * rows);
    const V = new Float32Array(cols * rows);
    const S = new Float32Array(cols * rows);

    const img = new ImageData(cols, rows);
    const alpha = 52; // dark theme

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ll = mapRef.current.containerPointToLatLng([c * CELL, r * CELL]);
        const sample = sampleGrid(ll.lat, ll.lng, windData, windGrid);
        const i = r * cols + c;

        if (!sample) {
          U[i] = V[i] = S[i] = NaN;
          continue;
        }

        U[i] = sample[0];
        V[i] = sample[1];
        S[i] = sample[2];

        const col = PALETTE[palIdx(sample[2])];
        img.data[i * 4] = col[0];
        img.data[i * 4 + 1] = col[1];
        img.data[i * 4 + 2] = col[2];
        img.data[i * 4 + 3] = alpha;
      }
    }

    setWindField({ cols, rows, U, V, S });

    const off = document.createElement('canvas');
    off.width = cols;
    off.height = rows;
    off.getContext('2d')?.putImageData(img, 0, 0);

    const hc = (document.getElementById('heat') as HTMLCanvasElement)?.getContext('2d');
    if (hc) {
      hc.clearRect(0, 0, w, h);
      hc.imageSmoothingEnabled = true;
      hc.imageSmoothingQuality = 'high';
      hc.drawImage(off, -CELL / 2, -CELL / 2, cols * CELL, rows * CELL);
    }

    const pc = (document.getElementById('parts') as HTMLCanvasElement)?.getContext('2d');
    if (pc) {
      pc.clearRect(0, 0, w, h);
    }
  }

  function respawn(p: Particle) {
    if (!windField) return;
    const [w, h] = sizeRef.current;
    for (let k = 0; k < 6; k++) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      if (sampleScreen(p.x, p.y, windField)) {
        p.age = 0;
        p.life = 40 + Math.random() * 80;
        return;
      }
    }
    p.age = p.life = 1e9;
  }

  function frame() {
    rafRef.current = requestAnimationFrame(frame);

    if (!windField || document.hidden || !partsRef.current.length) return;

    const [w, h] = sizeRef.current;
    const ctx = (document.getElementById('parts') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.7;
    ctx.lineCap = 'round';

    const K = 0.22;
    for (const p of partsRef.current) {
      if (p.age++ > p.life) {
        respawn(p);
        continue;
      }

      const s = sampleScreen(p.x, p.y, windField);
      if (!s) {
        respawn(p);
        continue;
      }

      const nx = p.x + s[0] * K;
      const ny = p.y - s[1] * K;

      ctx.strokeStyle = PAL_CSS[palIdx(s[2])];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      p.x = nx;
      p.y = ny;
    }
  }

  function startAnim() {
    if (!rafRef.current && !REDUCED) {
      rafRef.current = requestAnimationFrame(frame);
    }
  }

  function onMapClick(e: L.LeafletMouseEvent, m: Map) {
    const ll = e.latlng.wrap();
    if (pickRef.current) pickRef.current.remove();

    pickRef.current = L.circleMarker(ll, {
      radius: 6,
      color: '#ffffff',
      weight: 2,
      fillColor: '#000000',
      fillOpacity: 0.6,
      interactive: false,
    }).addTo(m);

    const lat = +ll.lat.toFixed(4);
    const lon = +ll.lng.toFixed(4);
    const sample = windData && windGrid ? sampleGrid(ll.lat, ll.lng, windData, windGrid) : null;

    let wind = `No wind data here · ${lat}, ${lon}`;
    if (sample) {
      const speed = sample[2];
      const dir = (Math.atan2(-sample[0], -sample[1]) * 180) / Math.PI + 180;
      wind = `<b>${Math.round(speed)} m/s</b> from ${Math.round(dir)}° · ${lat}, ${lon}`;
    }

    setReadout(`${wind}`);
  }

  // Handle time slider changes
  useEffect(() => {
    if (windData) {
      setTime(currentTime, windData);
      startAnim();
    }
  }, [currentTime, windData]);

  // Handle play button
  useEffect(() => {
    if (!isPlaying || !windData) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= windData.last) {
          setIsPlaying(false);
          return windData.last;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, windData]);

  // Render legend
  const renderLegend = () => {
    if (!windData) return;
    const ticks = [0, 5, 10, 15, 20, 25];
    return (
      <div
        className="legendbar"
        id="mapLegend"
        style={{
          background: paletteGradient(),
        }}
      >
        {ticks.map((v) => (
          <span
            key={v}
            style={{
              left: `${(Math.min(VMAX, v) / VMAX) * 100}%`,
            }}
          >
            {v}
          </span>
        ))}
        <span style={{ left: '100%', transform: 'translateX(-100%)', top: '-18px' }}>
          m/s
        </span>
      </div>
    );
  };

  return (
    <section id="viewMap">
      <div className="mapwrap" id="mapwrap">
        <div id="map"></div>
        <canvas id="heat"></canvas>
        <canvas id="parts"></canvas>
        <button
          className="fab"
          id="mapZoomIn"
          title="Back to your forecast spot"
          onClick={ensureFramed}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="3.5" />
            <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
          </svg>
        </button>
        {renderLegend()}
      </div>
      <div id="mapReadout">{readout}</div>
      <div className="when2" id="mapWhen">
        {windWhen}
      </div>
      <div className="timebox">
        <button id="mapPlay" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="timecol">
          {windData && (
            <input
              type="range"
              id="mapTime"
              min={windData.first}
              max={windData.last}
              value={currentTime}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
            />
          )}
          <div className="ticks" id="mapTicks"></div>
          <svg id="mapGraph"></svg>
        </div>
      </div>
      {status && <div className="msg">{status}</div>}
      {note && <div className="msg">{note}</div>}
    </section>
  );
};
