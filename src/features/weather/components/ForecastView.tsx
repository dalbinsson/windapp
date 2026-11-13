import { ForecastPoint, WeatherData } from '@/types';
import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';

interface ForecastViewProps {
  data: WeatherData | null;
  loading: boolean;
}

const COLORS: Record<string, string> = {
  'DMI HARMONIE 2 km': '#2a7de1',
  'MET Nordic 1 km': '#e8590c',
  'ECMWF IFS 0.25°': '#9c36b5',
  'SMHI SNOW': '#2f9e44',
  'MET Norway': '#0c8599',
};

const SHORT: Record<string, string> = {
  'DMI HARMONIE 2 km': 'DMI',
  'MET Nordic 1 km': 'Nordic',
  'ECMWF IFS 0.25°': 'ECMWF',
  'SMHI SNOW': 'SMHI',
  'MET Norway': 'MET NO',
};

const PAST_H = 5;
const SMOOTH_H = 1.6;
const TZ = 'Europe/Stockholm';

const colorOf = (n: string): string => COLORS[n] || '#888';
const dayFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const hourFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const hourOnly = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, hour: '2-digit', hour12: false });

function localHour(t: number): number {
  return parseInt(hourOnly.format(new Date(t)), 10) % 24;
}

function fmt(v: number | null | undefined, kn = false): string {
  if (v == null) return '–';
  return v.toFixed(kn ? 0 : 1);
}

function runs<T extends { t: number }>(pts: T[], ok: (p: T) => boolean): T[][] {
  const out: T[][] = [];
  let cur: T[] = [];
  for (const p of pts) {
    if (ok(p)) cur.push(p);
    else { if (cur.length) out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  return out;
}

function smoothPath(P: [number, number][], cont = false): string {
  const n = P.length;
  const f = (v: number) => v.toFixed(1);
  if (!n) return '';
  let d = `${cont ? 'L' : 'M'}${f(P[0][0])},${f(P[0][1])}`;
  if (n < 3) {
    for (let i = 1; i < n; i++) d += `L${f(P[i][0])},${f(P[i][1])}`;
    return d;
  }
  const dx: number[] = [], sl: number[] = [], m: number[] = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = P[i + 1][0] - P[i][0] || 1e-6;
    sl[i] = (P[i + 1][1] - P[i][1]) / dx[i];
  }
  m[0] = sl[0];
  m[n - 1] = sl[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (sl[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / sl[i], b = m[i + 1] / sl[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * sl[i]; m[i + 1] = t * b * sl[i]; }
  }
  for (let i = 0; i < n - 1; i++) {
    const w = dx[i] / 3;
    d += `C${f(P[i][0] + w)},${f(P[i][1] + m[i] * w)} ${f(P[i + 1][0] - w)},${f(P[i + 1][1] - m[i + 1] * w)} ${f(P[i + 1][0])},${f(P[i + 1][1])}`;
  }
  return d;
}

interface ProcessedPoint {
  t: number;
  speed: number | null;
  gust: number | null;
  dir: number | null;
  lull: number | null;
  sm?: number | null;
}

function lowpass(seg: ProcessedPoint[], key: 'speed' | 'gust' | 'lull', sigmaH: number): (number | null)[] {
  const sg = sigmaH * 3600e3;
  return seg.map((p, i) => {
    if (p[key] == null) return null;
    let S = 0, W = 0;
    for (let j = i; j >= 0 && p.t - seg[j].t <= 3 * sg; j--) {
      const q = seg[j];
      if (q[key] == null) continue;
      const w = Math.exp(-0.5 * ((p.t - q.t) / sg) ** 2);
      S += (q[key] as number) * w;
      W += w;
    }
    for (let j = i + 1; j < seg.length && seg[j].t - p.t <= 3 * sg; j++) {
      const q = seg[j];
      if (q[key] == null) continue;
      const w = Math.exp(-0.5 * ((q.t - p.t) / sg) ** 2);
      S += (q[key] as number) * w;
      W += w;
    }
    return W ? S / W : (p[key] as number);
  });
}

export const ForecastView = ({ data, loading }: ForecastViewProps) => {
  const chartRef = useRef<SVGSVGElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);

  const { settings } = useAppStore();
  const unit = settings.units;
  const horizon = settings.horizon;
  const step = settings.tableStep;
  const hidden = settings.hiddenForecasts;

  useEffect(() => {
    // All hook calls happen unconditionally, conditions check happen inside useEffect
    if (!data || !Object.keys(data.series).length || !chartRef.current || !tableRef.current) {
      return;
    }

    const conv = (v: number | null | undefined) => {
      if (v == null) return null;
      return unit === 'kn' ? v * 1.94384 : v;
    };

    try {
      const now = Date.now();
      const seriesWindow: Record<string, ProcessedPoint[]> = {};

      for (const n of Object.keys(data.series)) {
        const s = data.series[n];
        seriesWindow[n] = s.points
          .map((p: ForecastPoint) => ({
            t: p.time,
            speed: conv(p.speed),
            gust: conv(p.gust),
            dir: p.dir,
            lull: conv(p.lull),
          }))
          .filter((p: ProcessedPoint) => p.t >= now - (PAST_H + 0.5) * 3600e3 && p.t <= now + horizon * 3600e3);
      }

      const allNames = Object.keys(seriesWindow);
      const names = allNames.filter((n) => !hidden.has(n));

      if (!names.length) {
        if (chartRef.current) chartRef.current.innerHTML = '';
        if (tableRef.current) tableRef.current.innerHTML = '';
        if (readoutRef.current) readoutRef.current.innerHTML = '';
        return;
      }

      // Chart rendering
      const svg = chartRef.current;
      const w = Math.max(300, Math.round(svg.getBoundingClientRect().width || 860));
      const narrow = w < 560;
      const fs = narrow ? 13 : 12;
      const lw = narrow ? 3 : 2.5;
      const L = narrow ? 32 : 38, R = 10, T = 12, B = 32;
      const h = w >= 820 ? 420 : narrow ? 330 : 360;

      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

      const t0 = now - PAST_H * 3600e3;
      const t1 = now + horizon * 3600e3;
      const values = names.flatMap((n) => seriesWindow[n].flatMap((p) => [p.speed, p.gust]).filter((v) => v != null)).filter((v) => v != null) as number[];
      const mx = Math.max(...values, 0);
      const gridStep = unit === 'kn' ? (mx <= 30 ? 5 : 10) : mx <= 14 ? 2 : 5;
      const rows = Math.max(1, Math.ceil((names.length * (narrow ? 104 : 170)) / Math.max(120, w - L - 28)));
      const free = Math.min(0.5, (26 + rows * 22) / (h - T - B));
      const vmax = Math.ceil((mx / (1 - free)) / gridStep) * gridStep;

      const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (w - L - R);
      const y = (v: number) => h - B - (v / vmax) * (h - T - B);

      let g = `<rect width="${w}" height="${h}" fill="var(--bg)"/>`;

      for (let v = 0; v <= vmax; v += gridStep) {
        g += `<line x1="${L}" x2="${w - R}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" opacity="0.12"/>`;
        g += `<text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="${fs}" fill="currentColor" opacity="0.75">${v}</text>`;
      }

      let every = horizon <= 48 ? 6 : horizon <= 96 ? 12 : 24;
      const minPx = narrow ? 62 : 70;
      while ((w - L - R) / (horizon / every) < (every >= 24 ? minPx : 34)) every *= 2;

      const firstHour = Math.ceil(t0 / 3600e3) * 3600e3;
      let dayIdx = 0;
      for (let t = firstHour; t <= t1; t += 3600e3) {
        const hr = localHour(t);
        if (hr === 0) dayIdx++;
        const show = every >= 24 ? hr === 0 && (dayIdx - 1) % (every / 24) === 0 : hr % every === 0;
        if (!show) continue;
        g += `<line x1="${x(t)}" x2="${x(t)}" y1="${T}" y2="${h - B}" stroke="currentColor" opacity="${hr === 0 ? 0.3 : 0.1}"/>`;
        const label = hr === 0 || every >= 24 ? dayFmt.format(new Date(t)) : String(hr).padStart(2, '0');
        g += `<text x="${x(t)}" y="${h - 10}" text-anchor="middle" font-size="${fs}" fill="currentColor" opacity="0.75">${label}</text>`;
      }

      const nowT = Date.now();
      g += `<rect x="${L}" y="${T}" width="${Math.max(0, x(nowT) - L)}" height="${h - B - T}" fill="currentColor" opacity="0.06"/>`;
      g += `<line x1="${x(nowT)}" x2="${x(nowT)}" y1="${T}" y2="${h - B}" stroke="currentColor" stroke-dasharray="3 3" opacity="0.5"/>`;

      for (const n of names) {
        for (const seg of runs(seriesWindow[n], (p) => p.speed != null && p.gust != null)) {
          const sp = lowpass(seg, 'speed', SMOOTH_H);
          const gu = lowpass(seg, 'gust', SMOOTH_H);
          const lu = lowpass(seg, 'lull', SMOOTH_H);
          const top = seg.map((p: ProcessedPoint, i: number) => [x(p.t), y(Math.max(gu[i] ?? 0, sp[i] ?? 0))] as [number, number]);
          const bot = seg.map((p: ProcessedPoint, i: number) => [x(p.t), y(p.lull != null && lu[i] != null ? Math.min(lu[i], sp[i] ?? 0) : sp[i] ?? 0)] as [number, number]).reverse();
          g += `<path d="${smoothPath(top)}${smoothPath(bot, true)}Z" fill="${colorOf(n)}" fill-opacity="0.16" stroke="none"/>`;
        }
      }

      for (const n of names) {
        for (const seg of runs(seriesWindow[n], (p) => p.speed != null)) {
          const sp = lowpass(seg, 'speed', SMOOTH_H);
          seg.forEach((p, i) => { p.sm = sp[i]; });
          const d = smoothPath(seg.map((p: ProcessedPoint, i: number) => [x(p.t), y(sp[i] ?? 0)] as [number, number]));
          g += `<path d="${d}" fill="none" stroke="${colorOf(n)}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"/>`;
        }
      }

      g += '<g id="hover" pointer-events="none"></g>';
      svg.innerHTML = g;
      svg.style.color = getComputedStyle(document.body).color;

      // Hover
      const nearest = (pts: ProcessedPoint[], t: number, tol: number): ProcessedPoint | null => {
        let best: ProcessedPoint | null = null;
        for (const p of pts) {
          if (p.speed != null && Math.abs(p.t - t) <= tol && (!best || Math.abs(p.t - t) < Math.abs(best.t - t))) best = p;
        }
        return best;
      };

      const showAt = (t: number | null) => {
        if (t == null || t < t0 || t > t1) t = Math.round(Date.now() / 3600e3) * 3600e3;
        const hg = document.getElementById('hover');
        if (!hg) return;
        let g = `<line x1="${x(t)}" x2="${x(t)}" y1="${T}" y2="${h - B}" stroke="currentColor" stroke-width="1.5" opacity="0.65"/>`;
        let items = '';
        for (const n of names) {
          const p = nearest(seriesWindow[n], t, 90 * 60e3);
          const c = colorOf(n);
          if (!p) { items += `<span class="it" style="--c:${c}"><i></i>${SHORT[n] || n} <b>–</b></span>`; continue; }
          g += `<circle cx="${x(p.t).toFixed(1)}" cy="${((p.sm != null ? p.sm : p.speed) ?? 0).toFixed(1)}" r="${lw + 1.5}" fill="${c}" style="stroke:var(--card)" stroke-width="2"/>`;
          const arrow = p.dir == null ? '' : `<span class="arrow" style="transform:rotate(${p.dir + 180}deg)">↑</span> `;
          const range = w < 560 || p.gust == null ? '' : p.lull != null ? `${fmt(p.lull, unit === 'kn')}–${fmt(p.gust, unit === 'kn')}` : `gust ${fmt(p.gust, unit === 'kn')}`;
          items += `<span class="it" style="--c:${c}"><i></i>${SHORT[n] || n} <b>${arrow}${fmt(p.speed, unit === 'kn')}</b>${range ? `<small>${range}</small>` : ''}</span>`;
        }
        const isNow = Math.abs(t - Date.now()) < 30 * 60e3;
        hg.innerHTML = g;
        if (readoutRef.current) readoutRef.current.innerHTML = `<div class="when"><b>${hourFmt.format(new Date(t))}</b>${isNow ? ' · now' : ''} · ${unit === 'kn' ? 'kn' : 'm/s'}</div><div class="items">${items}</div>`;
      };

      const tFromEvent = (e: PointerEvent) => {
        const r = svg.getBoundingClientRect();
        const px = ((e.clientX - r.left) * w) / r.width;
        const f = Math.min(1, Math.max(0, (px - L) / (w - L - R)));
        return Math.round((t0 + f * (t1 - t0)) / 3600e3) * 3600e3;
      };

      const handlePointerMove = (e: PointerEvent) => showAt(tFromEvent(e));
      const handlePointerLeave = (e: PointerEvent) => { if (e.pointerType === 'mouse') showAt(null); };

      svg.addEventListener('pointermove', handlePointerMove);
      svg.addEventListener('pointerdown', handlePointerMove);
      svg.addEventListener('pointerleave', handlePointerLeave);
      showAt(null);

      // Table
      const tol = step >= 3 ? 90 * 60e3 : 30 * 60e3;
      const unitLabel = unit === 'kn' ? 'kn' : 'm/s';
      let html = `<tr><th>${unitLabel}</th>` + names.map((n) => `<th style="color:${colorOf(n)}">${SHORT[n] || n}</th>`).join('') + '</tr>';
      const start = Math.ceil((now - PAST_H * 3600e3) / 3600e3) * 3600e3;
      for (let t = start; t <= now + horizon * 3600e3; t += step * 3600e3) {
        let cells = '', any = false;
        for (const n of names) {
          let best: ProcessedPoint | null = null;
          for (const p of seriesWindow[n]) {
            if (p.speed != null && Math.abs(p.t - t) <= tol && (!best || Math.abs(p.t - t) < Math.abs(best.t - t))) best = p;
          }
          if (!best) { cells += '<td><span class="none">–</span></td>'; continue; }
          any = true;
          const arrow = best.dir == null ? '' : `<span class="arrow" style="transform:rotate(${best.dir + 180}deg)">↑</span> `;
          const range = best.lull != null ? `${fmt(best.lull, unit === 'kn')}–${fmt(best.gust, unit === 'kn')}` : fmt(best.gust, unit === 'kn');
          cells += `<td><div class="v">${arrow}${fmt(best.speed, unit === 'kn')}</div><div class="r">${range}</div></td>`;
        }
        if (any) html += `<tr${t < Date.now() - 1800e3 ? ' class="past"' : ''}><td class="t"><b>${timeFmt.format(new Date(t))}</b><small>${dayFmt.format(new Date(t))}</small></td>${cells}</tr>`;
      }
      tableRef.current.innerHTML = html;

      return () => {
        svg.removeEventListener('pointermove', handlePointerMove);
        svg.removeEventListener('pointerdown', handlePointerMove);
        svg.removeEventListener('pointerleave', handlePointerLeave);
      };
    } catch (err) {
      console.error('Error rendering forecast:', err);
    }
  }, [data, unit, horizon, step, hidden]);

  if (loading) {
    return <section id="viewForecast"><div style={{ padding: '20px', textAlign: 'center', color: 'var(--mute)' }}>Loading...</div></section>;
  }

  if (!data || !Object.keys(data.series).length) {
    return <section id="viewForecast"><div style={{ padding: '20px', color: '#c0392b' }}>No data</div></section>;
  }

  return (
    <section id="viewForecast">
      <div className="chartwrap">
        <svg ref={chartRef} id="chart" style={{ width: '100%', minHeight: '300px' }} />
        <div ref={readoutRef} className="readout" id="readout" aria-live="polite" />
      </div>
      {Object.keys(data.errors).length > 0 && (
        <div className="err" id="errs">
           {Object.entries(data.errors).map(([model, error]: [string, unknown]) => <div key={model}>{model}: {String(error)}</div>)}
        </div>
      )}
      <div className="tablewrap">
        <table ref={tableRef} id="tbl"><tbody></tbody></table>
      </div>
    </section>
  );
};
