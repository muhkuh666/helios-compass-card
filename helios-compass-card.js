/**
 * Helios Compass – PV-Sonnenkompass-Karte für Home Assistant
 * Helios Compass Card: Sonnenrichtung × Leistungsklassen über dem Luftbild des Hauses.
 *
 * Installation: siehe README.md
 */
const CARD_VERSION = '1.6.0';

const DIRS = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const dir16 = (az) => DIRS[Math.round((((az % 360) + 360) % 360) / 22.5) % 16];

const RANGES = {
  '1h': { label: '1 Std.', hours: 1, step: 60 },
  '8h': { label: '8 Std.', hours: 8, step: 300 },
  '12h': { label: '12 Std.', hours: 12, step: 300 },
  '24h': { label: '24 Std.', hours: 24, step: 300 },
  '7d': { label: '7 Tage', hours: 168, step: 3600, stats: true },
  '14d': { label: '14 Tage', hours: 336, step: 3600, stats: true },
  '30d': { label: '30 Tage', hours: 720, step: 3600, stats: true },
  '1y': { label: '1 Jahr', hours: 8760, step: 3600, stats: true },
  summer: { label: 'Sommer', hours: 8760, step: 3600, stats: true, months: [4, 5, 6, 7, 8, 9], compare: 'winter', desc: 'Apr–Sep' },
  winter: { label: 'Winter', hours: 8760, step: 3600, stats: true, months: [10, 11, 12, 1, 2, 3], compare: 'summer', desc: 'Okt–Mär' },
};

const METRICS = {
  time: { label: 'Zeit', legend: 'Zeitanteil je Leistungsklasse (Sonnenzeit)' },
  energy: { label: 'Ertrag', legend: 'Ertragsanteil je Leistungsklasse' },
  avg_power: { label: 'Ø Leistung', legend: 'Zeitanteil je Leistungsklasse (Sonnenzeit)' },
  shading: { label: 'Schatten', legend: 'Zeitanteil je Leistungsklasse (Sonnenzeit)' },
};

const SUN_PATHS = {
  today: { label: 'Heute', color: '#ff9800', dash: '' },
  summer: { label: '21.6.', color: '#eab308', dash: '4 3' },
  winter: { label: '21.12.', color: '#60a5fa', dash: '4 3' },
};

const DEFAULT_COLORS = ['#1e40af', '#2563eb', '#38bdf8', '#2dd4bf', '#22c55e', '#a3e635', '#facc15', '#f97316', '#dc2626'];

const DEFAULTS = {
  title: 'Helios Compass Card',
  sun_entity: 'sun.sun',
  max_power: 8000,
  metric: 'time', // 'time' | 'energy' | 'avg_power' | 'shading'
  show_metric_switch: true,
  show_stats: true,
  sectors: 36,
  sector_opacity: 0.8,
  ranges: ['1h', '8h', '12h', '24h', '7d', '14d', '30d', '1y', 'summer', 'winter'],
  default_range: '8h',
  image: null,
  image_scale: 0.8,
  image_rotation: 0,
  image_offset_x: 0, // % des Kompassradius, + = nach rechts (Osten)
  image_offset_y: 0, // % des Kompassradius, + = nach oben (Norden)
  image_clip: false, // Bild rund auf den Kompass zuschneiden
  image_opacity: 1,
  stats_type: 'mean', // 'mean' | 'max'
  refresh_interval: 300, // Sekunden
  show_legend: true,
  legend_label: 'PV-Leistung',
  modules: [],
  show_total: null, // null = automatisch bei mehreren Anlagen
  show_sun_paths: true,
  sun_paths: ['today', 'summer', 'winter'],
  elevation_bands: 9, // Verschattungskarte: Anzahl Höhenringe (9 = 10°)
  season_overlay: true, // Sommer/Winter: andere Jahreszeit als Umriss
  kwp: null,
  total_name: 'Gesamt',
};

const defaultCorners = () => ({
  top_left: { type: 'source' },
  top_right: { type: 'azimuth', name: 'Sonnenazimut' },
  bottom_left: { type: 'elevation', name: 'Sonnenhöhe' },
  bottom_right: null,
});

/* ---------- Sonnenstand (nach SunCalc) ---------- */
function sunPosition(date, lat, lon) {
  const rad = Math.PI / 180;
  const d = date.valueOf() / 86400000 - 0.5 + 2440588 - 2451545;
  const M = rad * (357.5291 + 0.98560028 * d);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + rad * 102.9372 + Math.PI;
  const e = rad * 23.4397;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ra = Math.atan2(Math.sin(L) * Math.cos(e), Math.cos(L));
  const phi = rad * lat;
  const H = rad * (280.16 + 360.9856235 * d) + rad * lon - ra;
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  return { azimuth: (az / rad + 540) % 360, elevation: alt / rad };
}

/* ---------- Hilfsfunktionen ---------- */
function makeStops(stops, max) {
  if (!Array.isArray(stops) || !stops.length) {
    stops = DEFAULT_COLORS.map((color, i) => ({ value: (max / (DEFAULT_COLORS.length - 1)) * i, color }));
  }
  return stops.map((x) => ({ value: Number(x.value) || 0, color: x.color || '#888' })).sort((a, b) => a.value - b.value);
}
const validModule = (m) => m && isFinite(Number(m.azimuth));

function resample(raw, start, end, stepSec) {
  const pts = raw.filter((p) => !isNaN(p.t)).sort((a, b) => a.t - b.t);
  const out = [];
  if (!pts.length) return out;
  let i = 0;
  let cur = NaN;
  for (let t = start; t <= end; t += stepSec * 1000) {
    while (i < pts.length && pts[i].t <= t) { cur = pts[i].v; i++; }
    if (isFinite(cur)) out.push({ t, v: cur });
  }
  return out;
}

function niceStep(max) {
  if (!(max > 0)) return 1;
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw) return m * mag;
  return 10 * mag;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtNum = (v, dec = 0) => Number(v).toLocaleString('de-DE', { maximumFractionDigits: dec, minimumFractionDigits: 0 });
const fmtSpec = (v) => fmtNum(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
const fmtPct = (v) => fmtNum(v, v >= 10 ? 0 : 1);
const fmtPower = (w) => (Math.abs(w) >= 1000 ? `${fmtNum(w / 1000, Math.abs(w) >= 10000 ? 1 : 2)} kW` : `${fmtNum(w)} W`);
const fmtEnergy = (wh) => (wh >= 1000 ? `${fmtNum(wh / 1000, wh >= 100000 ? 0 : wh >= 10000 ? 1 : 2)} kWh` : `${fmtNum(wh)} Wh`);

class HeliosCompassCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._series = [];
    this._data = {};
    this._peak = null;
    this._token = 0;
  }

  static getConfigElement() { return document.createElement('helios-compass-card-editor'); }

  static getStubConfig(hass) {
    const pv = Object.keys(hass?.states || {}).find((id) => id.startsWith('sensor.')
      && ['W', 'kW'].includes(hass.states[id].attributes.unit_of_measurement));
    return { power_entity: pv || 'sensor.pv_leistung', max_power: 8000 };
  }

  setConfig(config) {
    const hasSources = Array.isArray(config?.sources) && config.sources.some((x) => x && x.entity);
    if (!config || (!config.power_entity && !hasSources)) {
      throw new Error('Bitte "power_entity" oder "sources" angeben (z. B. sensor.pv_leistung).');
    }
    const c = { ...DEFAULTS, ...config };
    c.ranges = (Array.isArray(c.ranges) ? c.ranges : DEFAULTS.ranges).filter((r) => RANGES[r]);
    if (!c.ranges.length) c.ranges = DEFAULTS.ranges;
    if (!METRICS[c.metric]) c.metric = 'time';
    c.max_power = Number(c.max_power) || 8000;
    c.sectors = Math.max(4, Math.min(180, Math.round(Number(c.sectors) || 36)));
    const globalModules = Array.isArray(c.modules) ? c.modules.filter(validModule) : [];
    const kwpOf = (mods) => mods.reduce((a, m) => a + (Number(m.kwp) || 0), 0);
    c.elevation_bands = Math.max(3, Math.min(30, Math.round(Number(c.elevation_bands) || 9)));
    c.sun_paths = Array.isArray(c.sun_paths) ? c.sun_paths.filter((k) => SUN_PATHS[k]) : DEFAULTS.sun_paths;
    const raw = hasSources ? config.sources.filter((x) => x && x.entity) : [{ entity: config.power_entity }];
    c.sources = raw.map((x) => {
      const max = Number(x.max_power) || c.max_power;
      const ownMods = Array.isArray(x.modules) ? x.modules.filter(validModule) : [];
      const kwp = Number(x.kwp) || (hasSources ? kwpOf(ownMods) : 0) || (!hasSources ? Number(config.kwp) || kwpOf(globalModules) : 0);
      return {
        kwp,
        id: x.entity,
        entities: [x.entity],
        name: x.name || '',
        max_power: max,
        color_stops: makeStops(Array.isArray(x.color_stops) ? x.color_stops : (x.max_power ? null : config.color_stops), max),
        modules: [...globalModules, ...ownMods],
        legend_label: x.legend_label,
      };
    });
    c.show_total = (config.show_total ?? true) !== false && c.sources.length > 1;
    if (c.show_total) {
      const sum = c.sources.reduce((acc, x) => acc + x.max_power, 0);
      const seg = sum / (DEFAULT_COLORS.length - 1);
      const mag = 10 ** Math.floor(Math.log10(seg));
      const nice = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7.5, 8, 10].find((k) => k * mag >= seg - 1e-9) * mag;
      const max = Number(c.total_max_power) || nice * (DEFAULT_COLORS.length - 1);
      c.sources.push({
        id: '__total',
        total: true,
        entities: c.sources.flatMap((x) => x.entities),
        name: c.total_name || 'Gesamt',
        max_power: max,
        color_stops: makeStops(c.total_color_stops, max),
        modules: [...new Set(c.sources.flatMap((x) => x.modules))],
        kwp: c.sources.every((x) => x.kwp > 0) ? c.sources.reduce((a, x) => a + x.kwp, 0) : 0,
      });
    }
    c.power_entity = c.sources[0].entities[0];
    c.corners = { ...defaultCorners(), ...(config.corners || {}) };
    // Alte Konfigurationen: Ecke oben links war fest auf den ersten Sensor gestellt
    // (z. B. {entity: sensor.bkw, name: 'BKW-Leistung'}). Bei mehreren Anlagen soll sie der Auswahl folgen.
    const tl = c.corners.top_left;
    if (c.sources.length > 1 && tl && tl.entity && tl.follow !== false) {
      const src = c.sources.find((x) => !x.total && x.entities[0] === tl.entity);
      const autoNames = [undefined, '', 'PV-Leistung', ...c.sources.map((x) => (x.name ? `${x.name}-Leistung` : null))];
      if (src && autoNames.includes(tl.name)) c.corners.top_left = { type: 'source' };
    }
    this._config = c;
    this._range = c.ranges.includes(this._load('range')) ? this._load('range') : (c.ranges.includes(c.default_range) ? c.default_range : c.ranges[0]);
    this._metric = c.show_metric_switch && METRICS[this._load('metric')] ? this._load('metric') : c.metric;
    const wanted = this._load('source') || (c.default_source === 'total' ? '__total' : c.default_source);
    this._sourceId = c.sources.some((x) => x.id === wanted) ? wanted : c.sources[0].id;
    this._built = false;
    this._lastFetch = 0;
    this._series = [];
    this._data = {};
    this._peak = null;
    if (this._hass) { this._build(); this._update(true); this._fetch(); }
  }

  _src() { return this._config.sources.find((x) => x.id === this._sourceId) || this._config.sources[0]; }

  _livePower(src = this._src()) {
    return src.entities.reduce((acc, e) => acc + (parseFloat(this._hass.states[e]?.state) || 0) * this._factor(e), 0);
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._build();
    this._update(first);
    if (Date.now() - this._lastFetch > this._config.refresh_interval * 1000) this._fetch();
  }

  getCardSize() { return 10; }

  getGridOptions() { return { columns: 6, min_columns: 4, rows: 'auto' }; }

  connectedCallback() {
    if (this._hass && this._config && Date.now() - this._lastFetch > this._config.refresh_interval * 1000) this._fetch();
  }

  _key(k) { return `helios-compass:${this._config.power_entity}:${k}`; }

  _load(k) { try { return localStorage.getItem(this._key(k)); } catch (e) { return null; } }

  _save(k, v) { try { localStorage.setItem(this._key(k), v); } catch (e) { /* ignorieren */ } }

  /* ---------- Daten ---------- */
  _location() {
    const c = this._hass.config || {};
    return { lat: Number(this._config.latitude ?? c.latitude ?? 51), lon: Number(this._config.longitude ?? c.longitude ?? 10) };
  }

  _sunNow() {
    const s = this._hass.states[this._config.sun_entity];
    if (s && s.attributes.azimuth !== undefined && s.attributes.elevation !== undefined) {
      return { azimuth: Number(s.attributes.azimuth), elevation: Number(s.attributes.elevation) };
    }
    const { lat, lon } = this._location();
    return sunPosition(new Date(), lat, lon);
  }

  _factor(entityId) {
    if (this._config.unit_factor) return Number(this._config.unit_factor);
    const u = this._hass.states[entityId]?.attributes.unit_of_measurement;
    if (u === 'kW') return 1000;
    if (u === 'MW') return 1e6;
    return 1;
  }

  async _fetch() {
    if (!this._hass) return;
    this._lastFetch = Date.now();
    const token = ++this._token;
    const r = RANGES[this._range];
    const end = Date.now();
    const start = end - r.hours * 3600e3;
    const ids = [...new Set(this._config.sources.flatMap((x) => x.entities))];
    const key = `${r.stats ? 's' : 'h'}${r.hours}`;
    const cache = this._cache;
    if (cache && cache.key === key && Date.now() - cache.time < this._config.refresh_interval * 1000) {
      this._data = cache.data;
      this._error = null;
      this._composeSeries();
      this._renderPlot();
      return;
    }
    const data = {};
    let error = null;
    try {
      if (r.stats) {
        const res = await this._hass.callWS({
          type: 'recorder/statistics_during_period',
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          statistic_ids: ids,
          period: 'hour',
          types: ['mean', 'max'],
        });
        ids.forEach((id) => {
          let peak = null;
          const series = (res?.[id] || []).map((st) => {
            const t = (typeof st.start === 'number' ? st.start : Date.parse(st.start)) + 1800e3;
            const mean = Number(st.mean);
            const max = Number(st.max ?? st.mean);
            if (isFinite(max) && (!peak || max > peak.v)) peak = { v: max, t };
            return { t, v: this._config.stats_type === 'max' ? max : mean, vmax: isFinite(max) ? max : mean, dt: 3600 };
          });
          if (series.length) data[id] = { series, peak };
        });
      }
      const missing = ids.filter((id) => !data[id]);
      if (missing.length) {
        const res = await this._hass.callWS({
          type: 'history/history_during_period',
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          entity_ids: missing,
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        });
        missing.forEach((id) => {
          let peak = null;
          const raw = (res?.[id] || []).map((st) => ({
            t: st.lu !== undefined ? st.lu * 1000 : Date.parse(st.last_updated || st.last_changed),
            v: parseFloat(st.s ?? st.state),
          }));
          raw.forEach((p) => { if (isFinite(p.v) && p.t >= start && (!peak || p.v > peak.v)) peak = { ...p }; });
          data[id] = { series: resample(raw, start, end, r.step).map((p) => ({ ...p, vmax: p.v, dt: r.step })), peak };
        });
      }
    } catch (e) {
      console.warn('helios-compass-card: Verlauf konnte nicht geladen werden', e);
      error = e?.message || String(e);
    }
    if (token !== this._token) return; // veraltete Antwort
    Object.entries(data).forEach(([id, d]) => {
      const f = this._factor(id);
      d.series = d.series.filter((p) => isFinite(p.v)).map((p) => ({ ...p, v: Math.max(0, p.v * f), vmax: Math.max(0, (p.vmax ?? p.v) * f) }));
      if (d.peak) d.peak = { ...d.peak, v: d.peak.v * f };
    });
    this._data = data;
    this._error = error;
    if (!error) this._cache = { key, time: Date.now(), data };
    this._composeSeries();
    this._renderPlot();
  }

  /** Zeitreihe einer Anlage (bzw. Summe), optional auf Monate gefiltert */
  _rawSeries(src, months) {
    const lists = src.entities.map((e) => this._data[e]).filter(Boolean);
    let series = [];
    let peak = null;
    if (lists.length === 1) {
      ({ series, peak } = lists[0]);
    } else if (lists.length > 1) {
      const m = new Map();
      lists.forEach((l) => l.series.forEach((p) => {
        const o = m.get(p.t) || { t: p.t, v: 0, vmax: 0, dt: p.dt };
        o.v += p.v;
        o.vmax += p.vmax ?? p.v;
        m.set(p.t, o);
      }));
      series = [...m.values()].sort((x, y) => x.t - y.t);
      peak = null;
    }
    if (months) series = series.filter((p) => months.includes(new Date(p.t).getMonth() + 1));
    if (months || lists.length > 1 || !peak) {
      peak = null;
      series.forEach((p) => { const v = p.vmax ?? p.v; if (!peak || v > peak.v) peak = { v, t: p.t }; });
    }
    return { series, peak };
  }

  _energyOf(series) { return series.reduce((a, p) => a + (p.v * p.dt) / 3600, 0); }

  /** Zeitreihe der aktiven Anlage (bzw. Summe aller Anlagen) zusammensetzen */
  _composeSeries() {
    const src = this._src();
    const r = RANGES[this._range];
    const { lat, lon } = this._location();
    const withSun = (list) => list.map((p) => ({ ...p, ...sunPosition(new Date(p.t), lat, lon) }));
    const { series, peak } = this._rawSeries(src, r.months);
    this._series = withSun(series);
    this._peak = peak ? { ...peak, ...sunPosition(new Date(peak.t), lat, lon) } : null;
    this._compare = r.compare && this._config.season_overlay
      ? withSun(this._rawSeries(src, RANGES[r.compare].months).series) : null;
  }

  _bin(v) {
    let idx = 0;
    this._src().color_stops.forEach((st, i) => { if (v >= st.value) idx = i; });
    return idx;
  }

  /* ---------- Aufbau ---------- */
  _build() {
    const c = this._config;
    const corner = (pos) => (c.corners[pos] ? `<div class="corner ${pos}" data-pos="${pos}"><div class="lbl"></div><div class="val"></div></div>` : '');
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { padding: 12px 14px 12px; overflow:hidden; height:100%; box-sizing:border-box; }
        .top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:4px 8px; margin-bottom:2px; }
        .title { font-size: 1.25em; color: var(--primary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .metrics { display:flex; border:1px solid var(--divider-color, #ccc); border-radius:14px; overflow:hidden; flex-shrink:0; }
        .metrics button { font: inherit; font-size:.72em; padding:3px 8px; border:0; background:transparent; cursor:pointer;
                 color: var(--secondary-text-color); }
        .metrics button + button { border-left:1px solid var(--divider-color, #ccc); }
        .metrics button.active, .sources button.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
        .sources { display:inline-flex; flex-wrap:wrap; border:1px solid var(--divider-color, #ccc); border-radius:14px; overflow:hidden; margin:2px 0 4px; }
        .sources button { font: inherit; font-size:.78em; padding:3px 10px; border:0; background:transparent; cursor:pointer;
                 color: var(--primary-text-color); }
        .sources button + button { border-left:1px solid var(--divider-color, #ccc); }
        .plot { position:relative; width:100%; max-width:420px; margin:0 auto; aspect-ratio: 1 / 1.02; }
        svg.rose { position:absolute; inset:0; width:100%; height:100%; overflow:visible; }
        .corner { position:absolute; line-height:1.15; cursor:pointer; z-index:2; }
        .corner .lbl { font-size: .85em; color: var(--primary-text-color); }
        .corner .val { font-size: 1.75em; color: var(--primary-text-color); font-weight: 400; }
        .top_left { top:0; left:0; } .top_right { top:0; right:0; text-align:right; }
        .bottom_left { bottom:0; left:0; } .bottom_right { bottom:0; right:0; text-align:right; }
        .bottom_left .lbl, .bottom_right .lbl { order:2; }
        .bottom_left, .bottom_right { display:flex; flex-direction:column; }
        .legend { margin-top: 6px; }
        .legend .head { display:flex; justify-content:space-between; font-size:.75em; }
        .legend .head .l { color:#22a06b; } .legend .head .r { color:#d4a400; }
        .bar { position:relative; display:flex; height:14px; gap:1px; }
        .bar span { flex:1; font-size:10px; line-height:14px; text-align:center; color:#fff; text-shadow:0 0 2px rgba(0,0,0,.7);
                 box-sizing:border-box; border-radius:2px; }
        .bar span.now { outline:2px solid var(--primary-text-color, #000); outline-offset:-2px; }
        .ticks { position:relative; height:14px; font-size:10px; color: var(--secondary-text-color); }
        .ticks span { position:absolute; transform:translateX(-50%); top:2px; }
        .ticks span:first-child { transform:none; } .ticks span:last-child { transform:translateX(-100%); }
        .stats { display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-top:8px; }
        .stat { background: var(--secondary-background-color, rgba(127,127,127,.08)); border-radius:8px; padding:5px 7px; min-width:0; }
        .stat .k { font-size:.68em; color: var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .stat .v { font-size:1.05em; color: var(--primary-text-color); white-space:nowrap; }
        .stat .s { font-size:.68em; color: var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .buttons { display:flex; gap:6px; justify-content:center; margin-top:10px; flex-wrap:wrap; }
        .buttons button { flex:1; min-width:44px; max-width:72px; font: inherit; font-size:.76em; padding:5px 2px; border-radius:6px; white-space:nowrap;
                 border:1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
                 color: var(--primary-text-color); cursor:pointer; box-shadow: 0 1px 2px rgba(0,0,0,.15); }
        .buttons button.active { color:#e53935; border-color:#e53935; }
        .err { font-size:.75em; color: var(--error-color, #db4437); text-align:center; }
        .wedge { transition: opacity .2s; } .wedge:hover { opacity:1 !important; }
        .buttons.many button { flex: 1 0 calc(20% - 6px); max-width:none; }
        .note { font-size:.72em; color: var(--secondary-text-color); text-align:center; margin-top:4px; min-height:0; }
        .note:empty { display:none; }
        .yield { font-size:.75em; color: var(--secondary-text-color); margin-top:6px; text-align:center; }
        .yield:empty { display:none; }
        .yield b { color: var(--primary-text-color); font-weight:500; }
      </style>
      <ha-card>
        ${c.title || c.show_metric_switch ? `<div class="top">
          <div class="title">${esc(c.title || '')}</div>
          ${c.show_metric_switch ? `<div class="metrics">${Object.entries(METRICS).map(([k, m]) => `<button data-m="${k}">${m.label}</button>`).join('')}</div>` : ''}
        </div>` : ''}
        ${c.sources.length > 1 ? `<div class="sources">${c.sources.map((x) => `<button data-src="${esc(x.id)}">${esc(x.name || this._hass?.states[x.entities[0]]?.attributes.friendly_name || x.entities[0])}</button>`).join('')}</div>` : ''}
        <div class="plot">
          <svg class="rose" viewBox="-160 -160 320 320" preserveAspectRatio="xMidYMid meet">
            <g class="static"></g><g class="trace"></g><g class="paths"></g><g class="modules"></g><g class="sun"></g>
          </svg>
          ${corner('top_left')}${corner('top_right')}${corner('bottom_left')}${corner('bottom_right')}
        </div>
        <div class="note"></div>
        ${c.show_legend ? `<div class="legend">${this._legendHtml()}</div>` : ''}
        ${c.show_stats ? `<div class="stats">
          <div class="stat" data-s="energy"><div class="k">Ertrag</div><div class="v">–</div><div class="s">&nbsp;</div></div>
          <div class="stat" data-s="peak"><div class="k">Spitze</div><div class="v">–</div><div class="s">&nbsp;</div></div>
          <div class="stat" data-s="best"><div class="k">Beste Richtung</div><div class="v">–</div><div class="s">&nbsp;</div></div>
        </div><div class="yield"></div>` : ''}
        <div class="buttons${c.ranges.length > 6 ? ' many' : ''}">${c.ranges.map((r) => `<button data-r="${r}">${RANGES[r].label}</button>`).join('')}</div>
        <div class="err"></div>
      </ha-card>`;

    this.shadowRoot.querySelectorAll('.buttons button').forEach((b) => b.addEventListener('click', () => {
      this._range = b.dataset.r;
      this._save('range', this._range);
      this._markButtons();
      this._series = [];
      this._data = {};
      this._peak = null;
      this._renderPlot();
      this._fetch();
    }));
    this.shadowRoot.querySelectorAll('.sources button').forEach((b) => b.addEventListener('click', () => {
      this._sourceId = b.dataset.src;
      this._save('source', this._sourceId);
      this._markButtons();
      this._switchSource();
    }));
    this.shadowRoot.querySelectorAll('.metrics button').forEach((b) => b.addEventListener('click', () => {
      this._metric = b.dataset.m;
      this._save('metric', this._metric);
      this._markButtons();
      this._renderPlot();
    }));
    this.shadowRoot.querySelectorAll('.corner').forEach((el) => el.addEventListener('click', () => {
      const cfg = c.corners[el.dataset.pos];
      const entityId = cfg?.entity || (cfg?.type === 'source' ? this._src().entities[0] : cfg?.type ? c.sun_entity : null);
      if (!entityId) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
    }));
    this._renderStatic();
    this._renderModules();
    this._renderSunPaths();
    this._markButtons();
    this._built = true;
  }

  _markButtons() {
    this.shadowRoot.querySelectorAll('.buttons button').forEach((b) => b.classList.toggle('active', b.dataset.r === this._range));
    this.shadowRoot.querySelectorAll('.metrics button').forEach((b) => b.classList.toggle('active', b.dataset.m === this._metric));
    this.shadowRoot.querySelectorAll('.sources button').forEach((b) => b.classList.toggle('active', b.dataset.src === this._sourceId));
  }

  _legendHtml() {
    const src = this._src();
    const stops = src.color_stops;
    const unit = src.max_power >= 20000 ? 'kW' : 'W';
    const tick = (v) => (unit === 'kW' ? fmtNum(v / 1000, 1) : Math.round(v));
    const label = src.legend_label || (this._config.sources.length > 1 && src.name ? `${src.name}-Leistung` : this._config.legend_label);
    return `<div class="head"><span class="l">${esc(label)}</span><span class="r">${unit}</span></div>
      <div class="bar">${stops.map((st, i) => `<span data-i="${i}" style="background:${st.color}"></span>`).join('')}</div>
      <div class="ticks">${stops.map((st, i) => `<span style="left:${(i / Math.max(1, stops.length - 1)) * 100}%">${tick(st.value)}</span>`).join('')}</div>`;
  }

  _switchSource() {
    const lg = this.shadowRoot.querySelector('.legend');
    if (lg) lg.innerHTML = this._legendHtml();
    this._renderModules();
    this._composeSeries();
    this._renderPlot();
    this._update(true);
  }

  _R() { return 108; }

  _xy(az, r) {
    const a = (az * Math.PI) / 180;
    return [r * Math.sin(a), -r * Math.cos(a)];
  }

  _renderStatic() {
    const c = this._config;
    const R = this._R();
    let s = '';
    if (c.image) {
      const size = 2 * R * Number(c.image_scale || 0.8);
      const dx = ((Number(c.image_offset_x) || 0) / 100) * R;
      const dy = (-(Number(c.image_offset_y) || 0) / 100) * R;
      const rot = Number(c.image_rotation) || 0;
      if (c.image_clip) s += `<defs><clipPath id="hc-clip"><circle r="${R}"/></clipPath></defs>`;
      s += `<g ${c.image_clip ? 'clip-path="url(#hc-clip)"' : ''}><image href="${esc(c.image)}" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}"
              preserveAspectRatio="xMidYMid meet" opacity="${Number(c.image_opacity ?? 1)}"
              transform="translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${rot})"/></g>`;
    }
    const line = 'rgba(46,160,120,.55)';
    for (let i = 0; i < 16; i++) {
      const [x, y] = this._xy(i * 22.5, R);
      s += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${line}" stroke-width="0.6"/>`;
    }
    s += `<circle r="${R}" fill="none" stroke="${line}" stroke-width="1"/>`;
    DIRS.forEach((d, i) => {
      const main = i % 4 === 0;
      const mid = i % 2 === 0 && !main;
      const [x, y] = this._xy(i * 22.5, R + (main ? 22 : 16));
      const fill = main ? '#f5b400' : mid ? '#2fa3c4' : 'var(--secondary-text-color, #999)';
      const size = main ? 15 : mid ? 10 : 7;
      s += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" text-anchor="middle"
              dominant-baseline="central" font-family="inherit">${d}</text>`;
    });
    this.shadowRoot.querySelector('g.static').innerHTML = s;
  }

  _renderModules() {
    const R = this._R();
    let s = '';
    this._src().modules.forEach((m) => {
      const az = Number(m.azimuth);
      const col = m.color || '#ff9800';
      const len = R * 0.9;
      const [x, y] = this._xy(az, len);
      const [h1x, h1y] = this._xy(az - 3.2, len - 9);
      const [h2x, h2y] = this._xy(az + 3.2, len - 9);
      const [lx, ly] = this._xy(az, len - 18);
      const tilt = m.tilt !== undefined && m.tilt !== null && m.tilt !== '' ? ` · ${Math.round(Number(m.tilt))}°` : '';
      const kwp = m.kwp ? ` · ${fmtNum(Number(m.kwp), 2)} kWp` : '';
      const label = `${m.name || dir16(az)}${tilt}`;
      s += `<g class="module"><title>${esc(m.name || 'Modulfeld')}: Azimut ${Math.round(az)}° (${dir16(az)})${esc(tilt)}${esc(kwp)}</title>
        <line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${esc(col)}" stroke-width="1.8" stroke-dasharray="5 3"
              stroke-linecap="round" filter="drop-shadow(0 0 1px rgba(0,0,0,.6))"/>
        <polygon points="${x.toFixed(1)},${y.toFixed(1)} ${h1x.toFixed(1)},${h1y.toFixed(1)} ${h2x.toFixed(1)},${h2y.toFixed(1)}" fill="${esc(col)}"/>
        <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="7.5" font-weight="600" fill="${esc(col)}" stroke="rgba(0,0,0,.7)" stroke-width="2"
              paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${esc(label)}</text></g>`;
    });
    this.shadowRoot.querySelector('g.modules').innerHTML = s;
  }

  /* ---------- Sonnenbahnen ---------- */
  _sunDay(date) {
    const { lat, lon } = this._location();
    const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime();
    const step = 5 * 60e3;
    const pts = [];
    for (let t = d0; t <= d0 + 86400e3; t += step) pts.push({ t, ...sunPosition(new Date(t), lat, lon) });
    const cross = (a, b) => {
      const tt = a.t + ((0 - a.elevation) / (b.elevation - a.elevation)) * (b.t - a.t);
      return { t: tt, ...sunPosition(new Date(tt), lat, lon) };
    };
    let rise = null;
    let set = null;
    let top = null;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i - 1].elevation < 0 && pts[i].elevation >= 0 && !rise) rise = cross(pts[i - 1], pts[i]);
      if (pts[i - 1].elevation >= 0 && pts[i].elevation < 0) set = cross(pts[i - 1], pts[i]);
      if (!top || pts[i].elevation > top.elevation) top = pts[i];
    }
    return { pts, rise, set, top };
  }

  _renderSunPaths() {
    const c = this._config;
    const g = this.shadowRoot.querySelector('g.paths');
    if (!g) return;
    if (!c.show_sun_paths || !c.sun_paths.length) { g.innerHTML = ''; return; }
    const R = this._R();
    const rEl = (e) => (1 - Math.max(0, e) / 90) * R;
    const now = new Date();
    const dates = { today: now, summer: new Date(now.getFullYear(), 5, 21), winter: new Date(now.getFullYear(), 11, 21) };
    const fmtT = (t) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    const P = (pt) => this._xy(pt.azimuth, rEl(pt.elevation)).map((v) => v.toFixed(1)).join(',');
    let svg = '';
    // Reihenfolge: Sommer, Winter unten, Heute oben
    ['summer', 'winter', 'today'].filter((k) => c.sun_paths.includes(k)).forEach((k) => {
      const def = SUN_PATHS[k];
      const day = this._sunDay(dates[k]);
      const up = day.pts.filter((p) => p.elevation >= 0);
      if (!up.length && !day.rise) return;
      const line = [day.rise, ...up, day.set].filter(Boolean);
      const title = `Sonnenbahn ${k === 'today' ? 'heute' : `am ${def.label}`}`
        + (day.rise ? `\nAufgang ${fmtT(day.rise.t)} (${dir16(day.rise.azimuth)} ${Math.round(day.rise.azimuth)}°)` : '')
        + (day.set ? `\nUntergang ${fmtT(day.set.t)} (${dir16(day.set.azimuth)} ${Math.round(day.set.azimuth)}°)` : '')
        + `\nMittagshöhe ${Math.round(day.top.elevation)}° um ${fmtT(day.top.t)}`
        + '\nAbstand zur Mitte = Sonnenhöhe (Rand = Horizont)';
      svg += `<g class="sunpath"><title>${title}</title>
        <polyline points="${line.map(P).join(' ')}" fill="none" stroke="${def.color}" stroke-width="${k === 'today' ? 1.8 : 1.3}"
          stroke-dasharray="${def.dash}" stroke-linecap="round" stroke-linejoin="round" opacity=".95"
          filter="drop-shadow(0 0 1px rgba(0,0,0,.5))"/>`;
      if (k === 'today') {
        // Stundenpunkte, Beschriftung alle 3 Stunden
        up.filter((p) => new Date(p.t).getMinutes() === 0).forEach((p) => {
          const [x, y] = this._xy(p.azimuth, rEl(p.elevation));
          const h = new Date(p.t).getHours();
          svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.5" fill="${def.color}" stroke="#fff" stroke-width=".5"/>`;
          if (h % 3 === 0) {
            svg += `<text x="${x.toFixed(1)}" y="${(y - 4.5).toFixed(1)}" font-size="6.5" fill="${def.color}" stroke="rgba(0,0,0,.7)" stroke-width="1.8"
                      paint-order="stroke" text-anchor="middle">${h}</text>`;
          }
        });
        [['rise', '↑'], ['set', '↓']].forEach(([key, arrow]) => {
          const p = day[key];
          if (!p) return;
          const [x, y] = this._xy(p.azimuth, R);
          const [lx, ly] = this._xy(p.azimuth, R - 11);
          svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${def.color}" stroke="#fff" stroke-width="1"/>
            <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="7" font-weight="600" fill="${def.color}" stroke="rgba(0,0,0,.75)" stroke-width="2"
              paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${arrow}${fmtT(p.t)}</text>`;
        });
      } else {
        const [x, y] = this._xy(day.top.azimuth, rEl(day.top.elevation));
        svg += `<text x="${x.toFixed(1)}" y="${(y + (k === 'summer' ? -4 : 8)).toFixed(1)}" font-size="6.5" fill="${def.color}" stroke="rgba(0,0,0,.7)"
                  stroke-width="1.8" paint-order="stroke" text-anchor="middle">${def.label}</text>`;
      }
      svg += '</g>';
    });
    g.innerHTML = svg;
    this._pathsDay = now.toDateString();
  }

  /* ---------- Auswertung ---------- */
  _aggregate(series = this._series) {
    const c = this._config;
    const stops = this._src().color_stops;
    const nb = c.elevation_bands;
    const n = c.sectors;
    const width = 360 / n;
    const mk = () => Array.from({ length: n }, () => new Array(stops.length).fill(0));
    const agg = { n, width, time: mk(), energy: mk(), sumV: new Array(n).fill(0), cnt: new Array(n).fill(0),
      timeBins: new Array(stops.length).fill(0), energyBins: new Array(stops.length).fill(0),
      totalTime: 0, totalEnergySun: 0, totalEnergy: 0, nb, cells: new Map() };
    series.forEach((p) => {
      const wh = (p.v * p.dt) / 3600;
      agg.totalEnergy += wh;
      if (p.elevation <= 0) return;
      const sec = Math.floor(((p.azimuth + width / 2) % 360) / width) % n;
      const b = this._bin(p.v);
      agg.time[sec][b] += 1;
      agg.energy[sec][b] += wh;
      agg.timeBins[b] += 1;
      agg.energyBins[b] += wh;
      agg.sumV[sec] += p.v;
      agg.cnt[sec] += 1;
      agg.totalTime += 1;
      agg.totalEnergySun += wh;
      const band = Math.min(nb - 1, Math.floor(p.elevation / (90 / nb)));
      const key = sec * nb + band;
      const cell = agg.cells.get(key) || { sec, band, sum: 0, cnt: 0, hours: 0 };
      cell.sum += p.v;
      cell.cnt += 1;
      cell.hours += p.dt / 3600;
      agg.cells.set(key, cell);
    });
    return agg;
  }

  _renderPlot() {
    if (!this._built) return;
    const c = this._config;
    const R = this._R();
    const stops = this._src().color_stops;
    const agg = this._aggregate();
    const metric = this._metric;
    const { n, width } = agg;

    const arcPath = (a0, a1, r0, r1) => {
      const f = (v) => v.toFixed(2);
      const [x0, y0] = this._xy(a0, r1);
      const [x1, y1] = this._xy(a1, r1);
      const [x2, y2] = this._xy(a1, r0);
      const [x3, y3] = this._xy(a0, r0);
      if (r0 < 0.01) return `M0,0 L${f(x0)},${f(y0)} A${f(r1)},${f(r1)} 0 0 1 ${f(x1)},${f(y1)} Z`;
      return `M${f(x3)},${f(y3)} L${f(x0)},${f(y0)} A${f(r1)},${f(r1)} 0 0 1 ${f(x1)},${f(y1)} L${f(x2)},${f(y2)} A${f(r0)},${f(r0)} 0 0 0 ${f(x3)},${f(y3)} Z`;
    };
    const labelSvg = (x, y, lbl) => (c.image
      ? `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="7" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width="1.8"
                    paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${lbl}</text>`
      : `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="7" fill="var(--secondary-text-color, #777)"
                    stroke="var(--card-background-color, #fff)" stroke-width="2.2" paint-order="stroke"
                    text-anchor="middle" dominant-baseline="middle">${lbl}</text>`);
    const r = RANGES[this._range];
    const note = this.shadowRoot.querySelector('.note');
    if (note) note.textContent = '';

    if (metric === 'shading') {
      // Verschattungskarte: Richtung × Sonnenhöhe, Farbe = Ø Leistung
      const nb = agg.nb;
      const bandDeg = 90 / nb;
      const rEl = (e) => (1 - e / 90) * R;
      const line = 'rgba(46,160,120,.55)';
      let svg = '';
      [30, 60].forEach((e) => {
        svg += `<circle r="${rEl(e).toFixed(1)}" fill="none" stroke="${line}" stroke-width=".6"/>`;
        const [x, y] = this._xy(135, rEl(e));
        svg += labelSvg(x, y, `${e}°`);
      });
      const gapS = Math.min(0.8, width * 0.08);
      agg.cells.forEach((cell) => {
        const center = cell.sec * width;
        const avg = cell.sum / cell.cnt;
        const e0 = cell.band * bandDeg;
        const e1 = e0 + bandDeg;
        svg += `<path class="wedge" d="${arcPath(center - width / 2 + gapS / 2, center + width / 2 - gapS / 2, rEl(e1) + 0.3, rEl(e0) - 0.3)}"
                   fill="${stops[this._bin(avg)].color}" opacity="${c.sector_opacity}">
                   <title>Richtung ${Math.round(center)}° (${dir16(center)}), Sonnenhöhe ${fmtNum(e0, 1)}–${fmtNum(e1, 1)}°
Ø ${fmtPower(avg)} · ${fmtNum(cell.hours, cell.hours < 10 ? 1 : 0)} Std. Sonne</title></path>`;
      });
      this.shadowRoot.querySelector('g.trace').innerHTML = svg;
      if (note) note.textContent = agg.totalTime ? 'Schatten: Abstand zur Mitte = Sonnenhöhe (Rand = Horizont), Farbe = Ø Leistung' : '';
      this._legendShares(agg, 'time');
      this._renderStats(agg);
      this._renderError(agg);
      return;
    }

    // Werte je Sektor (gestapelt) bestimmen
    let stacks; // stacks[sec] = [{bin, value}]
    let unit;
    let tip;
    if (metric === 'avg_power') {
      unit = 'W';
      stacks = agg.cnt.map((k, sec) => {
        if (!k) return [];
        const avg = agg.sumV[sec] / k;
        return [{ bin: this._bin(avg), value: avg }];
      });
      tip = (sec, part) => `Ø ${fmtPower(part.value)} bei Sonne aus dieser Richtung (${fmtPct((agg.cnt[sec] / Math.max(1, agg.totalTime)) * 100)} % der Sonnenzeit)`;
    } else {
      unit = '%';
      const mat = metric === 'energy' ? agg.energy : agg.time;
      const tot = metric === 'energy' ? agg.totalEnergySun : agg.totalTime;
      stacks = mat.map((row) => row.map((v, bin) => ({ bin, value: tot ? (v / tot) * 100 : 0 })).filter((x) => x.value > 0));
      tip = (sec, part) => `${this._binLabel(part.bin)}: ${fmtPct(part.value)} % ${metric === 'energy' ? 'des Ertrags' : 'der Sonnenzeit'}`;
    }
    const sectorTotals = stacks.map((st) => st.reduce((a, b) => a + b.value, 0));
    // Vergleich Sommer/Winter: andere Jahreszeit als Umriss
    let compareTotals = null;
    if (this._compare && this._compare.length) {
      const ca = this._aggregate(this._compare);
      if (metric === 'avg_power') compareTotals = ca.cnt.map((k, i) => (k ? ca.sumV[i] / k : 0));
      else {
        const mat = metric === 'energy' ? ca.energy : ca.time;
        const tot = metric === 'energy' ? ca.totalEnergySun : ca.totalTime;
        compareTotals = mat.map((row) => (tot ? (row.reduce((a, b) => a + b, 0) / tot) * 100 : 0));
      }
    }
    const maxVal = Math.max(0, ...sectorTotals, ...(compareTotals || []));

    // Ringskala
    const step = niceStep(maxVal);
    const rings = Math.max(1, Math.ceil(maxVal / step - 1e-9));
    const scaleMax = rings * step;
    const rOf = (v) => (v / scaleMax) * R;
    const line = 'rgba(46,160,120,.55)';
    let ringSvg = '';
    for (let i = 1; i <= rings; i++) {
      const rr = (i / rings) * R;
      if (i < rings) ringSvg += `<circle r="${rr.toFixed(1)}" fill="none" stroke="${line}" stroke-width=".6"/>`;
      const [x, y] = this._xy(135, rr);
      const val = i * step;
      const lbl = unit === '%' ? `${fmtNum(val, 1)}%` : fmtPower(val).replace(' ', '');
      ringSvg += labelSvg(x, y, lbl);
    }

    const gap = Math.min(1.2, width * 0.12);
    let wedges = '';
    stacks.forEach((parts, sec) => {
      const center = sec * width;
      const a0 = center - width / 2 + gap / 2;
      const a1 = center + width / 2 - gap / 2;
      const head = `Richtung ${Math.round(center)}° (${dir16(center)})`
        + (unit === '%' ? `: ${fmtPct(sectorTotals[sec])} % ${metric === 'energy' ? 'des Ertrags' : 'der Sonnenzeit'}` : '');
      let acc = 0;
      parts.forEach((part) => {
        const r0 = rOf(acc);
        acc += part.value;
        const r1 = rOf(acc);
        wedges += `<path class="wedge" d="${arcPath(a0, a1, r0, r1)}" fill="${stops[part.bin].color}" opacity="${c.sector_opacity}"
                     stroke="rgba(255,255,255,.35)" stroke-width=".3"><title>${head}\n${tip(sec, part)}</title></path>`;
      });
    });
    let outline = '';
    if (compareTotals) {
      const other = RANGES[r.compare];
      compareTotals.forEach((v, sec) => {
        if (!(v > 0)) return;
        const center = sec * width;
        const rr = rOf(v);
        const [x0, y0] = this._xy(center - width / 2, rr);
        const [x1, y1] = this._xy(center + width / 2, rr);
        outline += `<path d="M${x0.toFixed(2)},${y0.toFixed(2)} A${rr.toFixed(2)},${rr.toFixed(2)} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}"
                      fill="none" stroke="var(--primary-text-color, #222)" stroke-width="1.6" stroke-dasharray="3 2" opacity=".85">
                      <title>${other.label} (${other.desc}), Richtung ${Math.round(center)}° (${dir16(center)}): ${unit === '%' ? `${fmtPct(v)} %` : fmtPower(v)}</title></path>`;
      });
      if (note) note.textContent = `Farbig: ${r.label} (${r.desc}) · gestrichelt: ${other.label} (${other.desc}) zum Vergleich`;
    }
    this.shadowRoot.querySelector('g.trace').innerHTML = ringSvg + wedges + outline;

    this._legendShares(agg, metric);
    this._renderStats(agg);
    this._renderError(agg);
  }

  _legendShares(agg, metric) {
    const legBins = metric === 'energy' ? agg.energyBins : agg.timeBins;
    const legTot = metric === 'energy' ? agg.totalEnergySun : agg.totalTime;
    this.shadowRoot.querySelectorAll('.bar span').forEach((el) => {
      const b = Number(el.dataset.i);
      const v = legTot ? (legBins[b] / legTot) * 100 : 0;
      el.textContent = legBins[b] ? `${Math.round(v)}%` : '';
      el.title = `${this._binLabel(b)}: ${fmtPct(v)} % ${metric === 'energy' ? 'des Ertrags' : 'der Sonnenzeit'}`;
    });
    const head = this.shadowRoot.querySelector('.legend .head .l');
    if (head) head.title = METRICS[metric]?.legend || '';
  }

  _renderError(agg) {
    const err = this.shadowRoot.querySelector('.err');
    if (err) {
      err.textContent = this._error ? `Verlauf: ${this._error}`
        : (this._series.length && !agg.totalTime ? 'Im gewählten Zeitraum stand die Sonne nicht über dem Horizont.' : '');
    }
  }

  _binLabel(b) {
    const stops = this._src().color_stops;
    return stops[b + 1] ? `${fmtPower(stops[b].value)}–${fmtPower(stops[b + 1].value)}` : `ab ${fmtPower(stops[b].value)}`;
  }

  _renderStats(agg) {
    const root = this.shadowRoot;
    if (!root.querySelector('.stats')) return;
    const set = (k, v, s) => {
      const el = root.querySelector(`.stat[data-s="${k}"]`);
      el.querySelector('.v').textContent = v;
      el.querySelector('.s').textContent = s || ' ';
    };
    const r = RANGES[this._range];
    const hasData = this._series.length > 0;
    const src = this._src();
    const period = r.months ? `${r.desc}, letzte 12 Mon.` : `letzte ${r.label}`;
    const spec = src.kwp > 0 && hasData ? `${fmtSpec(agg.totalEnergy / 1000 / src.kwp)} kWh/kWp` : '';
    set('energy', hasData ? fmtEnergy(agg.totalEnergy) : '–', hasData ? (spec || period) : '');
    root.querySelector('.stat[data-s="energy"]').title = hasData ? `${fmtEnergy(agg.totalEnergy)} ${period}${spec ? ` · ${spec}` : ''}` : '';
    // Vergleich der Anlagen: spezifischer Ertrag
    const yieldEl = root.querySelector('.yield');
    if (yieldEl) {
      const withKwp = this._config.sources.filter((x) => x.kwp > 0);
      if (withKwp.length > 1 && hasData) {
        yieldEl.innerHTML = `Spezifischer Ertrag (${esc(r.months ? r.desc : r.label)}): ${withKwp.map((x) => {
          const e = this._energyOf(this._rawSeries(x, r.months).series);
          return `${esc(x.name || x.entities[0])} <b>${fmtSpec(e / 1000 / x.kwp)}</b>`;
        }).join(' · ')} kWh/kWp`;
      } else yieldEl.innerHTML = '';
    }
    if (this._peak && this._peak.v > 0) {
      const d = new Date(this._peak.t);
      const when = r.hours > 24
        ? `${d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`
        : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      set('peak', fmtPower(this._peak.v), `${when} · ${dir16(this._peak.azimuth)}`);
    } else set('peak', '–');
    // beste Richtung: Sektor mit dem meisten Ertrag
    const secEnergy = agg.energy.map((row) => row.reduce((a, b) => a + b, 0));
    let best = -1;
    secEnergy.forEach((v, i) => { if (v > 0 && (best < 0 || v > secEnergy[best])) best = i; });
    if (best >= 0 && agg.totalEnergySun > 0) {
      const center = best * agg.width;
      set('best', `${dir16(center)} (${Math.round(center)}°)`, `${fmtPct((secEnergy[best] / agg.totalEnergySun) * 100)} % des Ertrags`);
    } else set('best', '–');
  }

  /* ---------- Live-Werte ---------- */
  _cornerValue(cfg, sun) {
    if (!cfg) return '';
    if (cfg.type === 'azimuth') return `${Math.round(sun.azimuth)}°`;
    if (cfg.type === 'elevation') return `${Math.round(sun.elevation)}°`;
    if (cfg.type === 'source') {
      const p = this._livePower();
      return p >= 1000 ? `${fmtNum(p / 1000, p >= 10000 ? 1 : 2)}kW` : `${fmtNum(p)}W`;
    }
    const st = this._hass.states[cfg.entity];
    if (!st) return '–';
    const n = parseFloat(st.state);
    if (!isFinite(n)) return st.state;
    const unit = cfg.unit ?? st.attributes.unit_of_measurement ?? '';
    if (unit === 'W' && Math.abs(n) >= 1000) return `${fmtNum(n / 1000, Math.abs(n) >= 10000 ? 1 : 2)}kW`;
    const dec = cfg.decimals ?? (Math.abs(n) >= 100 || unit === 'W' ? 0 : 1);
    return `${fmtNum(n, dec)}${unit}`;
  }

  _update(force) {
    const c = this._config;
    const sun = this._sunNow();
    const src = this._src();
    const power = this._livePower(src);
    const sig = `${this._sourceId}|${sun.azimuth.toFixed(1)}|${sun.elevation.toFixed(1)}|${power}|`
      + Object.values(c.corners).map((x) => (x?.entity ? this._hass.states[x.entity]?.state : '')).join('|');
    if (!force && sig === this._sig) return;
    this._sig = sig;

    this.shadowRoot.querySelectorAll('.corner').forEach((el) => {
      const cfg = c.corners[el.dataset.pos];
      let lbl = cfg?.name;
      if (lbl === undefined || lbl === null) {
        if (cfg?.type === 'source') lbl = c.sources.length > 1 && src.name ? `${src.name}-Leistung` : 'PV-Leistung';
        else lbl = cfg?.entity ? this._hass.states[cfg.entity]?.attributes.friendly_name : '';
      }
      el.querySelector('.lbl').textContent = lbl ?? '';
      el.querySelector('.val').textContent = this._cornerValue(cfg, sun);
    });

    const R = this._R();
    const col = sun.elevation > 0 ? '#f57c00' : '#9e9e9e';
    const a = sun.azimuth;
    const [tx, ty] = this._xy(a, R + 3);
    const [l1x, l1y] = this._xy(a - 4, R + 13);
    const [l2x, l2y] = this._xy(a + 4, R + 13);
    let sunSvg = `<polygon points="${tx.toFixed(1)},${ty.toFixed(1)} ${l1x.toFixed(1)},${l1y.toFixed(1)} ${l2x.toFixed(1)},${l2y.toFixed(1)}" fill="${col}">
      <title>Sonne: Azimut ${a.toFixed(0)}°, Höhe ${sun.elevation.toFixed(0)}°</title></polygon>`;
    if (c.show_sun_paths && sun.elevation > 0) {
      const [sx, sy] = this._xy(a, (1 - sun.elevation / 90) * R);
      sunSvg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" fill="#ffc107" stroke="#fff" stroke-width="1.5"
        filter="drop-shadow(0 0 3px rgba(255,170,0,.9))"><title>Sonne jetzt: Azimut ${a.toFixed(0)}°, Höhe ${sun.elevation.toFixed(0)}°</title></circle>`;
    }
    this.shadowRoot.querySelector('g.sun').innerHTML = sunSvg;
    if (this._pathsDay && this._pathsDay !== new Date().toDateString()) this._renderSunPaths();

    const nowBin = this._bin(power);
    this.shadowRoot.querySelectorAll('.bar span').forEach((el) => el.classList.toggle('now', Number(el.dataset.i) === nowBin));
  }
}

/* =====================================================================
 * Grafischer Editor – alle Optionen ohne YAML einstellbar
 * ===================================================================== */
const CORNER_POS = { top_left: 'Oben links', top_right: 'Oben rechts', bottom_left: 'Unten links', bottom_right: 'Unten rechts' };
const RANGE_OPTIONS = Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label }));
const num = (min, max, step, unit, mode = 'box') => ({ number: { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) } });
const COLOR = { text: { type: 'color' } };

const LABELS = {
  title: 'Titel (leer = kein Titel)',
  power_entity: 'PV-Leistungssensor (wenn keine Anlagenliste genutzt wird)',
  max_power: 'Maximale Leistung (obere Leistungsklasse)',
  legend_label: 'Beschriftung Farbskala',
  metric: 'Standard-Ansicht',
  default_range: 'Standard-Zeitraum',
  ranges: 'Angezeigte Zeitraum-Buttons',
  sectors: 'Anzahl Richtungssektoren',
  sector_opacity: 'Deckkraft der Sektoren',
  show_metric_switch: 'Umschalter Zeit / Ertrag / Ø Leistung',
  show_stats: 'Kennzahlen',
  show_legend: 'Farbskala',
  image: 'Bildpfad (optional, z. B. /local/helios/haus.png)',
  image_scale: 'Bildgröße',
  image_rotation: 'Drehung (Norden des Bildes nach oben)',
  image_offset_x: 'Verschieben links ↔ rechts',
  image_offset_y: 'Verschieben unten ↕ oben',
  image_opacity: 'Bild-Deckkraft',
  image_clip: 'Bild rund auf den Kompass zuschneiden',
  mode: 'Anzeige',
  entity: 'Entität',
  name: 'Name',
  unit: 'Einheit (optional, überschreibt die der Entität)',
  decimals: 'Nachkommastellen (optional)',
  show_total: '„Gesamt“ (Summe aller Anlagen) anzeigen',
  total_name: 'Bezeichnung für die Summe',
  total_max_power: 'Max. Leistung „Gesamt“ (leer = automatisch)',
  default_source: 'Standard-Anlage',
  value: 'Ab Leistung',
  color: 'Farbe',
  azimuth: 'Azimut (90 = Ost, 180 = Süd, 270 = West)',
  tilt: 'Neigung',
  kwp: 'Leistung (kWp, optional)',
  sun_entity: 'Sonnen-Entität',
  stats_type: '7/14 Tage: Stundenwert',
  refresh_interval: 'Verlauf neu laden alle',
  latitude: 'Breitengrad (leer = HA-Standort)',
  longitude: 'Längengrad (leer = HA-Standort)',
  unit_factor: 'Umrechnungsfaktor auf W (leer = automatisch)',
  kwp: 'Anlagenleistung (kWp, für kWh/kWp)',
  show_sun_paths: 'Sonnenbahnen einzeichnen',
  sun_paths: 'Welche Sonnenbahnen',
  elevation_bands: 'Schatten-Ansicht: Anzahl Höhenringe',
  season_overlay: 'Sommer/Winter: andere Jahreszeit gestrichelt zum Vergleich',
  ...CORNER_POS,
};

const HELPERS = {
  image_rotation: 'Positiv = im Uhrzeigersinn. Tipp: In Google Maps ist Norden oben – so soll dein Haus liegen.',
  image_offset_x: 'In % des Kompassradius, damit das Haus genau in der Mitte sitzt.',
  image_offset_y: 'In % des Kompassradius, damit das Haus genau in der Mitte sitzt.',
  sectors: '36 = 10° breite Sektoren, 16 = eine pro Kompassrichtung',
  elevation_bands: '9 = Ringe à 10° Sonnenhöhe. Für die Schatten-Ansicht am besten „1 Jahr“ wählen.',
  kwp: 'Leer = Summe der kWp aus den Modulfeldern.',
  show_sun_paths: 'Heute (mit Uhrzeiten, Auf- und Untergang) sowie 21.6. und 21.12. Abstand zur Mitte = Sonnenhöhe.',
  unit_factor: 'Nur nötig, wenn der Sensor weder W noch kW meldet (z. B. 1000 für kW).',
};

const SECTIONS = [
  { key: 'general', title: 'Allgemein', icon: '⚙️', open: true, schema: [
    { name: 'title', selector: { text: {} } },
    { name: 'power_entity', selector: { entity: { domain: 'sensor' } } },
    { type: 'grid', name: '', schema: [
      { name: 'max_power', selector: num(50, 200000, 50, 'W') },
      { name: 'legend_label', selector: { text: {} } },
    ] },
    { name: 'kwp', selector: num(0.01, 10000, 0.01, 'kWp') },
  ] },
  { key: 'display', title: 'Darstellung', icon: '🧭', schema: [
    { type: 'grid', name: '', schema: [
      { name: 'metric', selector: { select: { mode: 'dropdown', options: [
        { value: 'time', label: 'Zeitanteil' }, { value: 'energy', label: 'Ertrag' }, { value: 'avg_power', label: 'Ø Leistung' },
        { value: 'shading', label: 'Schatten (Richtung × Sonnenhöhe)' }] } } },
      { name: 'default_range', selector: { select: { mode: 'dropdown', options: RANGE_OPTIONS } } },
    ] },
    { name: 'ranges', selector: { select: { multiple: true, mode: 'list', options: RANGE_OPTIONS } } },
    { name: 'season_overlay', selector: { boolean: {} } },
    { name: 'show_sun_paths', selector: { boolean: {} } },
    { name: 'sun_paths', selector: { select: { multiple: true, mode: 'list', options: [
      { value: 'today', label: 'Heute' }, { value: 'summer', label: 'Längster Tag (21.6.)' }, { value: 'winter', label: 'Kürzester Tag (21.12.)' }] } } },
    { name: 'sectors', selector: num(8, 72, 4, null, 'slider') },
    { name: 'elevation_bands', selector: num(3, 18, 1, null, 'slider') },
    { name: 'sector_opacity', selector: num(0.2, 1, 0.05, null, 'slider') },
    { name: 'show_metric_switch', selector: { boolean: {} } },
    { name: 'show_stats', selector: { boolean: {} } },
    { name: 'show_legend', selector: { boolean: {} } },
  ] },
  { key: 'image', title: 'Hausbild', icon: '🏠', schema: [
    { name: 'image', selector: { text: {} } },
    { name: 'image_rotation', selector: num(-180, 180, 0.5, '°', 'slider') },
    { name: 'image_offset_x', selector: num(-100, 100, 0.5, '%', 'slider') },
    { name: 'image_offset_y', selector: num(-100, 100, 0.5, '%', 'slider') },
    { name: 'image_scale', selector: num(0.1, 2.5, 0.01, null, 'slider') },
    { name: 'image_opacity', selector: num(0, 1, 0.05, null, 'slider') },
    { name: 'image_clip', selector: { boolean: {} } },
  ] },
  { key: 'corners', title: 'Werte in den Ecken', icon: '🔲', custom: 'corners' },
  { key: 'sources', title: 'Anlagen (z. B. BKW + Dach)', icon: '🔆', custom: 'sources' },
  { key: 'modules', title: 'Modulausrichtung (für alle Anlagen)', icon: '📐', custom: 'modules' },
  { key: 'stops', title: 'Leistungsklassen & Farben', icon: '🎨', custom: 'stops' },
  { key: 'advanced', title: 'Erweitert', icon: '🛠️', schema: [
    { type: 'grid', name: '', schema: [
      { name: 'sun_entity', selector: { entity: { domain: 'sun' } } },
      { name: 'stats_type', selector: { select: { mode: 'dropdown', options: [{ value: 'mean', label: 'Mittelwert' }, { value: 'max', label: 'Maximum' }] } } },
    ] },
    { name: 'refresh_interval', selector: num(30, 3600, 30, 's') },
    { type: 'grid', name: '', schema: [
      { name: 'latitude', selector: num(-90, 90, 0.0001) },
      { name: 'longitude', selector: num(-180, 180, 0.0001) },
    ] },
    { name: 'unit_factor', selector: num(0.000001, 1000000, 0.000001) },
  ] },
];

const CORNER_SCHEMA = [
  { name: 'mode', selector: { select: { mode: 'dropdown', options: [
    { value: 'source', label: 'Leistung der gewählten Anlage' }, { value: 'entity', label: 'Beliebige Entität' },
    { value: 'azimuth', label: 'Sonnenazimut' }, { value: 'elevation', label: 'Sonnenhöhe' }, { value: 'none', label: 'Ausblenden' }] } } },
  { name: 'name', selector: { text: {} } },
];
const CORNER_ENTITY_SCHEMA = [
  { name: 'entity', selector: { entity: {} } },
  { type: 'grid', name: '', schema: [
    { name: 'unit', selector: { text: {} } },
    { name: 'decimals', selector: num(0, 4, 1) },
  ] },
];
const SOURCE_SCHEMA = [
  { type: 'grid', name: '', schema: [
    { name: 'name', selector: { text: {} } },
    { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
  ] },
  { type: 'grid', name: '', schema: [
    { name: 'max_power', selector: num(50, 200000, 50, 'W') },
    { name: 'legend_label', selector: { text: {} } },
  ] },
  { name: 'kwp', selector: num(0.01, 10000, 0.01, 'kWp') },
];
const MODULE_SCHEMA = [
  { type: 'grid', name: '', schema: [
    { name: 'name', selector: { text: {} } },
    { name: 'color', selector: COLOR },
  ] },
  { name: 'azimuth', selector: num(0, 359, 1, '°', 'slider') },
  { name: 'tilt', selector: num(0, 90, 1, '°', 'slider') },
  { name: 'kwp', selector: num(0, 1000, 0.01, 'kWp') },
];
const STOP_SCHEMA = [
  { type: 'grid', name: '', schema: [
    { name: 'value', selector: num(0, 1000000, 1, 'W') },
    { name: 'color', selector: COLOR },
  ] },
];
const TOTAL_SCHEMA = [
  { name: 'show_total', selector: { boolean: {} } },
  { type: 'grid', name: '', schema: [
    { name: 'total_name', selector: { text: {} } },
    { name: 'total_max_power', selector: num(50, 1000000, 50, 'W') },
  ] },
];

const FORM_DEFAULTS = { ...DEFAULTS, show_total: true };
const schemaKeys = (schema) => schema.flatMap((s) => (s.schema ? schemaKeys(s.schema) : [s.name]));
const clone = (o) => JSON.parse(JSON.stringify(o ?? null));
const autoStops = (max) => DEFAULT_COLORS.map((color, i) => ({ value: Math.round((max / (DEFAULT_COLORS.length - 1)) * i), color }));

async function ensureHaForm() {
  if (customElements.get('ha-form')) return;
  try {
    const helpers = await window.loadCardHelpers?.();
    if (helpers) {
      const card = await helpers.createCardElement({ type: 'entities', entities: [] });
      await card?.constructor?.getConfigElement?.();
    }
  } catch (e) { /* ignorieren */ }
  await customElements.whenDefined('ha-form');
}

const EDITOR_CSS = `
  .hc-editor { display:flex; flex-direction:column; gap:8px; }
  .hc-editor details { border:1px solid var(--divider-color, #ddd); border-radius:10px; background: var(--card-background-color); }
  .hc-editor summary { cursor:pointer; padding:10px 12px; font-weight:500; list-style:none; display:flex; align-items:center; gap:8px; }
  .hc-editor summary::-webkit-details-marker { display:none; }
  .hc-editor summary::after { content:'▸'; margin-left:auto; transition:transform .2s; color: var(--secondary-text-color); }
  .hc-editor details[open] > summary::after { transform:rotate(90deg); }
  .hc-editor .body { padding:0 12px 12px; display:flex; flex-direction:column; gap:8px; }
  .hc-editor .item { border:1px solid var(--divider-color, #ddd); border-radius:8px; padding:8px; background: var(--secondary-background-color, rgba(127,127,127,.05)); }
  .hc-editor .item-head { display:flex; align-items:center; gap:6px; margin-bottom:6px; font-weight:500; }
  .hc-editor .item-head .t { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .hc-editor .swatch { width:14px; height:14px; border-radius:3px; border:1px solid rgba(0,0,0,.2); flex-shrink:0; }
  .hc-editor button.b { font:inherit; font-size:.85em; border:1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
    color: var(--primary-text-color); border-radius:6px; padding:4px 10px; cursor:pointer; }
  .hc-editor button.b:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); }
  .hc-editor button.b:disabled { opacity:.35; cursor:default; }
  .hc-editor button.add { border-style:dashed; width:100%; padding:7px; }
  .hc-editor button.icon { padding:2px 7px; }
  .hc-editor .row { display:flex; gap:6px; flex-wrap:wrap; }
  .hc-editor .hint { font-size:.82em; color: var(--secondary-text-color); line-height:1.35; }
  .hc-editor .sub { margin-top:6px; }
  .hc-editor .sub > details { background:transparent; }
`;

class HeliosCompassCardEditor extends HTMLElement {
  constructor() {
    super();
    this._open = new Set(['general']);
  }

  setConfig(config) {
    if (this._lastJson && JSON.stringify(config) === this._lastJson) return; // eigene Änderung – Fokus behalten
    this._work = clone(config) || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this.querySelectorAll('ha-form').forEach((f) => { f.hass = hass; });
    if (!this._rendered) this._render();
  }

  /* ---------- Werte setzen & melden ---------- */
  _set(k, v, obj = this._work) {
    if (v === undefined || v === null || (v === '' && k !== 'title') || (Array.isArray(v) && !v.length)) delete obj[k];
    else obj[k] = v;
  }

  _emit() {
    const cfg = clone(this._work);
    cfg.type = cfg.type || 'custom:helios-compass-card';
    this._lastJson = JSON.stringify(cfg);
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
  }

  /* ---------- Bausteine ---------- */
  _form(schema, data, onChange) {
    const f = document.createElement('ha-form');
    f.computeLabel = (s) => LABELS[s.name] ?? s.title ?? s.name;
    f.computeHelper = (s) => HELPERS[s.name];
    f.hass = this._hass;
    f.schema = schema;
    f.data = data;
    f.addEventListener('value-changed', (e) => { e.stopPropagation(); onChange(e.detail.value); });
    return f;
  }

  _btn(label, onClick, cls = '', disabled = false, title = '') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `b ${cls}`;
    b.textContent = label;
    b.disabled = disabled;
    if (title) b.title = title;
    b.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
    return b;
  }

  _details(key, title, icon, open) {
    const d = document.createElement('details');
    if (this._open.has(key) || open) d.open = true;
    d.addEventListener('toggle', () => (d.open ? this._open.add(key) : this._open.delete(key)));
    const s = document.createElement('summary');
    s.textContent = `${icon ? `${icon}  ` : ''}${title}`;
    const body = document.createElement('div');
    body.className = 'body';
    d.append(s, body);
    return { d, body };
  }

  _hint(text) {
    const p = document.createElement('div');
    p.className = 'hint';
    p.textContent = text;
    return p;
  }

  /** Generische Listenbearbeitung mit Hinzufügen / Entfernen / Sortieren */
  _list(parent, { items, schema, title, swatch, newItem, addLabel, onChange, nested, key }) {
    items.forEach((item, i) => {
      const box = document.createElement('div');
      box.className = 'item';
      const head = document.createElement('div');
      head.className = 'item-head';
      const sw = document.createElement('span');
      if (swatch) { sw.className = 'swatch'; sw.style.background = swatch(item) || 'transparent'; head.append(sw); }
      const t = document.createElement('span');
      t.className = 't';
      t.textContent = title(item, i);
      head.append(t,
        this._btn('↑', () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; onChange(items, true); }, 'icon', i === 0, 'nach oben'),
        this._btn('↓', () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; onChange(items, true); }, 'icon', i === items.length - 1, 'nach unten'),
        this._btn('✕', () => { items.splice(i, 1); onChange(items, true); }, 'icon', false, 'entfernen'));
      box.append(head, this._form(schema, { ...item }, (v) => {
        const next = { ...items[i] };
        schemaKeys(schema).forEach((k) => this._set(k, v[k], next));
        items[i] = next;
        t.textContent = title(next, i);
        if (swatch) sw.style.background = swatch(next) || 'transparent';
        onChange(items, false);
      }));
      if (nested) nested(box, () => items[i], i, `${key}-${i}`, (changed, structural) => { items[i] = changed; onChange(items, structural); });
      parent.append(box);
    });
    parent.append(this._btn(`+ ${addLabel}`, () => { items.push(newItem()); onChange(items, true); }, 'add'));
  }

  _stopsEditor(parent, stops, maxPower, onChange) {
    if (!stops.length) parent.append(this._hint('Automatisch: 9 Farbstufen von 0 bis zur maximalen Leistung. Zum Anpassen „Farben bearbeiten“ wählen.'));
    const row = document.createElement('div');
    row.className = 'row';
    row.append(this._btn(stops.length ? '↺ Standardfarben neu erzeugen' : '🎨 Farben bearbeiten', () => onChange(autoStops(maxPower()), true)));
    if (stops.length) row.append(this._btn('Automatisch (zurücksetzen)', () => onChange([], true)));
    parent.append(row);
    if (!stops.length) return;
    this._list(parent, {
      items: stops,
      schema: STOP_SCHEMA,
      title: (s, i) => (stops[i + 1] ? `${fmtPower(s.value ?? 0)} – ${fmtPower(stops[i + 1].value ?? 0)}` : `ab ${fmtPower(s.value ?? 0)}`),
      swatch: (s) => s.color,
      newItem: () => ({ value: (Number(stops[stops.length - 1]?.value) || 0) + 100, color: '#888888' }),
      addLabel: 'Stufe hinzufügen',
      onChange,
    });
  }

  _modulesEditor(parent, modules, onChange, key) {
    this._list(parent, {
      key,
      items: modules,
      schema: MODULE_SCHEMA,
      title: (m) => `${m.name || 'Modulfeld'} · ${dir16(Number(m.azimuth) || 0)} ${Math.round(Number(m.azimuth) || 0)}°${m.tilt !== undefined ? ` · ${m.tilt}° Neigung` : ''}`,
      swatch: (m) => m.color || '#ff9800',
      newItem: () => ({ name: '', azimuth: 180, tilt: 30, color: '#ff9800' }),
      addLabel: 'Modulfeld hinzufügen',
      onChange,
    });
  }

  /* ---------- Abschnitte ---------- */
  _renderCorners(body) {
    const w = this._work;
    const corners = { ...defaultCorners(), ...(w.corners || {}) };
    Object.entries(CORNER_POS).forEach(([pos, label]) => {
      const box = document.createElement('div');
      box.className = 'item';
      const head = document.createElement('div');
      head.className = 'item-head';
      head.textContent = label;
      box.append(head);
      const cc = corners[pos];
      const mode = !cc ? 'none' : (cc.type || 'entity');
      const write = (next) => { w.corners = { ...defaultCorners(), ...(w.corners || {}), [pos]: next }; this._emit(); };
      box.append(this._form(CORNER_SCHEMA, { mode, name: cc?.name }, (v) => {
        const cur = { ...defaultCorners(), ...(w.corners || {}) }[pos];
        if (v.mode !== mode) {
          if (v.mode === 'none') write(null);
          else if (v.mode === 'entity') write({ entity: cur?.entity || w.power_entity || '', ...(v.name ? { name: v.name } : {}) });
          else write({ type: v.mode, ...(v.name ? { name: v.name } : {}) });
          this._render();
          return;
        }
        if (!cur) return;
        const next = { ...cur };
        this._set('name', v.name, next);
        write(next);
      }));
      if (mode === 'entity') {
        box.append(this._form(CORNER_ENTITY_SCHEMA, { entity: cc.entity, unit: cc.unit, decimals: cc.decimals }, (v) => {
          const next = { ...{ ...defaultCorners(), ...(w.corners || {}) }[pos] };
          ['entity', 'unit', 'decimals'].forEach((k) => this._set(k, v[k], next));
          write(next);
        }));
      }
      body.append(box);
    });
  }

  _renderSources(body) {
    const w = this._work;
    const sources = clone(w.sources) || [];
    body.append(this._hint(sources.length
      ? 'Über der Rose erscheint ein Umschalter. Jede Anlage hat eigene Leistungsklassen und Modulfelder.'
      : 'Leer = es wird nur der PV-Leistungssensor aus „Allgemein“ genutzt. Füge Anlagen hinzu, um mehrere Sensoren umschaltbar zu machen.'));
    this._list(body, {
      key: 'src',
      items: sources,
      schema: SOURCE_SCHEMA,
      title: (s, i) => `${s.name || `Anlage ${i + 1}`}${s.entity ? ` · ${s.entity}` : ''}`,
      newItem: () => (sources.length || !w.power_entity
        ? { name: '', entity: '' }
        : { name: 'Anlage 1', entity: w.power_entity, ...(w.max_power ? { max_power: w.max_power } : {}) }),
      addLabel: 'Anlage hinzufügen',
      onChange: (items, structural) => { this._set('sources', clone(items)); this._emit(); if (structural) this._render(); },
      nested: (box, get, i, key, update) => {
        const item = get();
        const sub = document.createElement('div');
        sub.className = 'sub';
        const m = this._details(`${key}-mod`, `Modulfelder dieser Anlage (${(item.modules || []).length})`, '📐');
        this._modulesEditor(m.body, clone(item.modules) || [], (mods, st) => {
          const next = { ...get() };
          this._set('modules', clone(mods), next);
          update(next, st);
        }, `${key}-mods`);
        const c = this._details(`${key}-col`, `Leistungsklassen dieser Anlage (${(item.color_stops || []).length ? 'eigene' : 'automatisch'})`, '🎨');
        this._stopsEditor(c.body, clone(item.color_stops) || [], () => Number(get().max_power) || Number(w.max_power) || DEFAULTS.max_power, (stops, st) => {
          const next = { ...get() };
          this._set('color_stops', clone(stops), next);
          update(next, st);
        });
        sub.append(m.d, c.d);
        box.append(sub);
      },
    });

    if (sources.length > 1) {
      const t = this._details('total', 'Summe „Gesamt“', 'Σ');
      t.body.append(this._form(TOTAL_SCHEMA, {
        show_total: w.show_total ?? true, total_name: w.total_name ?? DEFAULTS.total_name, total_max_power: w.total_max_power,
      }, (v) => {
        this._set('show_total', v.show_total === true ? undefined : v.show_total);
        this._set('total_name', v.total_name === DEFAULTS.total_name ? undefined : v.total_name);
        this._set('total_max_power', v.total_max_power);
        this._emit();
      }));
      const cs = this._details('total-col', `Leistungsklassen „Gesamt“ (${(w.total_color_stops || []).length ? 'eigene' : 'automatisch'})`, '🎨');
      this._stopsEditor(cs.body, clone(w.total_color_stops) || [],
        () => Number(w.total_max_power) || sources.reduce((a, s) => a + (Number(s.max_power) || Number(w.max_power) || DEFAULTS.max_power), 0),
        (stops, st) => { this._set('total_color_stops', clone(stops)); this._emit(); if (st) this._render(); });
      t.body.append(cs.d);
      body.append(t.d);
    }

    if (sources.length) {
      const opts = sources.filter((s) => s.entity).map((s, i) => ({ value: s.entity, label: s.name || `Anlage ${i + 1}` }));
      if (sources.length > 1 && w.show_total !== false) opts.push({ value: 'total', label: w.total_name || 'Gesamt' });
      body.append(this._form([{ name: 'default_source', selector: { select: { mode: 'dropdown', options: opts } } }],
        { default_source: w.default_source ?? opts[0]?.value }, (v) => { this._set('default_source', v.default_source); this._emit(); }));
    }
  }

  _renderSection(sec, body) {
    const w = this._work;
    if (sec.custom === 'corners') return this._renderCorners(body);
    if (sec.custom === 'sources') return this._renderSources(body);
    if (sec.custom === 'modules') {
      body.append(this._hint('Gestrichelte Pfeile zeigen, wohin deine Module zeigen. Diese Modulfelder erscheinen bei jeder Anlage; eigene Felder je Anlage findest du unter „Anlagen“.'));
      return this._modulesEditor(body, clone(w.modules) || [], (mods, st) => { this._set('modules', clone(mods)); this._emit(); if (st) this._render(); }, 'gmods');
    }
    if (sec.custom === 'stops') {
      body.append(this._hint((w.sources || []).length
        ? 'Gilt für Anlagen ohne eigene Leistungsklassen und ohne eigene maximale Leistung.'
        : 'Jede Stufe beginnt bei „Ab Leistung“ und reicht bis zur nächsten Stufe.'));
      return this._stopsEditor(body, clone(w.color_stops) || [], () => Number(w.max_power) || DEFAULTS.max_power,
        (stops, st) => { this._set('color_stops', clone(stops)); this._emit(); if (st) this._render(); });
    }
    const keys = schemaKeys(sec.schema);
    const data = {};
    keys.forEach((k) => { data[k] = w[k] ?? FORM_DEFAULTS[k]; });
    body.append(this._form(sec.schema, data, (v) => {
      keys.forEach((k) => {
        const val = v[k];
        if (!(k in w) && JSON.stringify(val) === JSON.stringify(FORM_DEFAULTS[k])) return; // Standardwerte nicht in YAML schreiben
        this._set(k, val);
      });
      this._emit();
    }));
    return undefined;
  }

  async _render() {
    if (!this._hass || !this._work) return;
    if (this._busy) { this._again = true; return; }
    this._busy = true;
    await ensureHaForm();
    this._busy = false;
    const root = document.createElement('div');
    root.className = 'hc-editor';
    const style = document.createElement('style');
    style.textContent = EDITOR_CSS;
    root.append(style);
    SECTIONS.forEach((sec) => {
      const { d, body } = this._details(sec.key, sec.title, sec.icon, false);
      this._renderSection(sec, body);
      root.append(d);
    });
    this.replaceChildren(root);
    this._rendered = true;
    if (this._again) { this._again = false; this._render(); }
  }
}

if (!customElements.get('helios-compass-card')) {
  customElements.define('helios-compass-card', HeliosCompassCard);
  customElements.define('helios-compass-card-editor', HeliosCompassCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'helios-compass-card',
    name: 'Helios Compass Card',
    description: 'Sonnenrichtung, PV-Leistung und Ertrag über dem Luftbild des Hauses',
    preview: true,
    documentationURL: 'https://github.com/muhkuh666/helios-compass-card',
  });
  console.info(`%c HELIOS COMPASS %c v${CARD_VERSION} `, 'color:#fff;background:#f57c00;font-weight:bold', 'color:#f57c00;background:#fff');
}
