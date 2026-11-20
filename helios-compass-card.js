/**
 * Helios Compass – PV-Sonnenkompass-Karte für Home Assistant
 * Solarrose: Sonnenrichtung × Leistungsklassen über dem Luftbild des Hauses.
 *
 * Installation: siehe README.md
 */
const CARD_VERSION = '1.2.1';

const DIRS = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const dir16 = (az) => DIRS[Math.round((((az % 360) + 360) % 360) / 22.5) % 16];

const RANGES = {
  '1h': { label: '1 Std.', hours: 1, step: 60 },
  '8h': { label: '8 Std.', hours: 8, step: 300 },
  '24h': { label: '24 Std.', hours: 24, step: 300 },
  '7d': { label: '7 Tage', hours: 168, step: 3600, stats: true },
  '14d': { label: '14 Tage', hours: 336, step: 3600, stats: true },
};

const METRICS = {
  time: { label: 'Zeit', legend: 'Zeitanteil je Leistungsklasse (Sonnenzeit)' },
  energy: { label: 'Ertrag', legend: 'Ertragsanteil je Leistungsklasse' },
  avg_power: { label: 'Ø Leistung', legend: 'Zeitanteil je Leistungsklasse (Sonnenzeit)' },
};

const DEFAULT_COLORS = ['#1e40af', '#2563eb', '#38bdf8', '#2dd4bf', '#22c55e', '#a3e635', '#facc15', '#f97316', '#dc2626'];

const DEFAULTS = {
  title: 'Helios Compass',
  sun_entity: 'sun.sun',
  max_power: 8000,
  metric: 'time', // 'time' | 'energy' | 'avg_power'
  show_metric_switch: true,
  show_stats: true,
  sectors: 36,
  sector_opacity: 0.8,
  ranges: ['1h', '8h', '24h', '7d', '14d'],
  default_range: '8h',
  image: null,
  image_scale: 0.8,
  image_rotation: 0,
  image_opacity: 1,
  stats_type: 'mean', // 'mean' | 'max'
  refresh_interval: 300, // Sekunden
  show_legend: true,
  legend_label: 'PV-Leistung',
  modules: [],
};

const defaultCorners = (powerEntity) => ({
  top_left: { entity: powerEntity, name: 'PV-Leistung' },
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
const fmtPct = (v) => fmtNum(v, v >= 10 ? 0 : 1);
const fmtPower = (w) => (Math.abs(w) >= 10000 ? `${fmtNum(w / 1000, 1)} kW` : `${fmtNum(w)} W`);
const fmtEnergy = (wh) => (wh >= 1000 ? `${fmtNum(wh / 1000, wh >= 100000 ? 0 : wh >= 10000 ? 1 : 2)} kWh` : `${fmtNum(wh)} Wh`);

class HeliosCompassCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._series = [];
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
    if (!config || !config.power_entity) throw new Error('Bitte "power_entity" angeben (z. B. sensor.pv_leistung).');
    const c = { ...DEFAULTS, ...config };
    c.ranges = (Array.isArray(c.ranges) ? c.ranges : DEFAULTS.ranges).filter((r) => RANGES[r]);
    if (!c.ranges.length) c.ranges = DEFAULTS.ranges;
    if (!METRICS[c.metric]) c.metric = 'time';
    c.max_power = Number(c.max_power) || 8000;
    c.sectors = Math.max(4, Math.min(180, Math.round(Number(c.sectors) || 36)));
    if (!Array.isArray(c.color_stops) || !c.color_stops.length) {
      c.color_stops = DEFAULT_COLORS.map((color, i) => ({ value: (c.max_power / (DEFAULT_COLORS.length - 1)) * i, color }));
    }
    c.color_stops = [...c.color_stops].map((s) => ({ value: Number(s.value) || 0, color: s.color || '#888' })).sort((a, b) => a.value - b.value);
    c.modules = Array.isArray(c.modules) ? c.modules.filter((m) => m && isFinite(Number(m.azimuth))) : [];
    c.corners = { ...defaultCorners(c.power_entity), ...(config.corners || {}) };
    this._config = c;
    this._range = c.ranges.includes(this._load('range')) ? this._load('range') : (c.ranges.includes(c.default_range) ? c.default_range : c.ranges[0]);
    this._metric = c.show_metric_switch && METRICS[this._load('metric')] ? this._load('metric') : c.metric;
    this._built = false;
    this._lastFetch = 0;
    this._series = [];
    this._peak = null;
    if (this._hass) { this._build(); this._update(true); this._fetch(); }
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
    const id = this._config.power_entity;
    let pts = [];
    let peak = null;
    let error = null;
    try {
      if (r.stats) {
        const res = await this._hass.callWS({
          type: 'recorder/statistics_during_period',
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          statistic_ids: [id],
          period: 'hour',
          types: ['mean', 'max'],
        });
        pts = (res?.[id] || []).map((s) => {
          const t = (typeof s.start === 'number' ? s.start : Date.parse(s.start)) + 1800e3;
          const mean = Number(s.mean);
          const max = Number(s.max ?? s.mean);
          if (isFinite(max) && (!peak || max > peak.v)) peak = { v: max, t };
          return { t, v: this._config.stats_type === 'max' ? max : mean, dt: 3600 };
        });
      }
      if (!pts.length) {
        peak = null;
        const res = await this._hass.callWS({
          type: 'history/history_during_period',
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          entity_ids: [id],
          minimal_response: true,
          no_attributes: true,
          significant_changes_only: false,
        });
        const raw = (res?.[id] || []).map((s) => ({
          t: s.lu !== undefined ? s.lu * 1000 : Date.parse(s.last_updated || s.last_changed),
          v: parseFloat(s.s ?? s.state),
        }));
        raw.forEach((p) => { if (isFinite(p.v) && p.t >= start && (!peak || p.v > peak.v)) peak = { ...p }; });
        pts = resample(raw, start, end, r.step).map((p) => ({ ...p, dt: r.step }));
      }
    } catch (e) {
      console.warn('helios-compass-card: Verlauf konnte nicht geladen werden', e);
      error = e?.message || String(e);
    }
    if (token !== this._token) return; // veraltete Antwort
    const f = this._factor(id);
    const { lat, lon } = this._location();
    this._error = error;
    this._series = pts.filter((p) => isFinite(p.v)).map((p) => ({ ...p, v: Math.max(0, p.v * f), ...sunPosition(new Date(p.t), lat, lon) }));
    this._peak = peak ? { v: peak.v * f, t: peak.t, ...sunPosition(new Date(peak.t), lat, lon) } : null;
    this._renderPlot();
  }

  _bin(v) {
    let idx = 0;
    this._config.color_stops.forEach((s, i) => { if (v >= s.value) idx = i; });
    return idx;
  }

  /* ---------- Aufbau ---------- */
  _build() {
    const c = this._config;
    const corner = (pos) => (c.corners[pos] ? `<div class="corner ${pos}" data-pos="${pos}"><div class="lbl"></div><div class="val"></div></div>` : '');
    const unit = c.max_power >= 20000 ? 'kW' : 'W';
    const tick = (v) => (unit === 'kW' ? fmtNum(v / 1000, 1) : Math.round(v));
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { padding: 12px 14px 12px; overflow:hidden; height:100%; box-sizing:border-box; }
        .top { display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:2px; }
        .title { font-size: 1.25em; color: var(--primary-text-color); }
        .metrics { display:flex; border:1px solid var(--divider-color, #ccc); border-radius:14px; overflow:hidden; flex-shrink:0; }
        .metrics button { font: inherit; font-size:.72em; padding:3px 8px; border:0; background:transparent; cursor:pointer;
                 color: var(--secondary-text-color); }
        .metrics button + button { border-left:1px solid var(--divider-color, #ccc); }
        .metrics button.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
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
        .buttons button { flex:1; min-width:56px; max-width:76px; font: inherit; font-size:.8em; padding:5px 4px; border-radius:6px;
                 border:1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
                 color: var(--primary-text-color); cursor:pointer; box-shadow: 0 1px 2px rgba(0,0,0,.15); }
        .buttons button.active { color:#e53935; border-color:#e53935; }
        .err { font-size:.75em; color: var(--error-color, #db4437); text-align:center; }
        .wedge { transition: opacity .2s; } .wedge:hover { opacity:1 !important; }
      </style>
      <ha-card>
        ${c.title || c.show_metric_switch ? `<div class="top">
          <div class="title">${esc(c.title || '')}</div>
          ${c.show_metric_switch ? `<div class="metrics">${Object.entries(METRICS).map(([k, m]) => `<button data-m="${k}">${m.label}</button>`).join('')}</div>` : ''}
        </div>` : ''}
        <div class="plot">
          <svg class="rose" viewBox="-160 -160 320 320" preserveAspectRatio="xMidYMid meet">
            <g class="static"></g><g class="trace"></g><g class="modules"></g><g class="sun"></g>
          </svg>
          ${corner('top_left')}${corner('top_right')}${corner('bottom_left')}${corner('bottom_right')}
        </div>
        ${c.show_legend ? `
        <div class="legend">
          <div class="head"><span class="l">${esc(c.legend_label)}</span><span class="r">${unit}</span></div>
          <div class="bar">${c.color_stops.map((s, i) => `<span data-i="${i}" style="background:${s.color}"></span>`).join('')}</div>
          <div class="ticks">${c.color_stops.map((s, i) => `<span style="left:${(i / Math.max(1, c.color_stops.length - 1)) * 100}%">${tick(s.value)}</span>`).join('')}</div>
        </div>` : ''}
        ${c.show_stats ? `<div class="stats">
          <div class="stat" data-s="energy"><div class="k">Ertrag</div><div class="v">–</div><div class="s">&nbsp;</div></div>
          <div class="stat" data-s="peak"><div class="k">Spitze</div><div class="v">–</div><div class="s">&nbsp;</div></div>
          <div class="stat" data-s="best"><div class="k">Beste Richtung</div><div class="v">–</div><div class="s">&nbsp;</div></div>
        </div>` : ''}
        <div class="buttons">${c.ranges.map((r) => `<button data-r="${r}">${RANGES[r].label}</button>`).join('')}</div>
        <div class="err"></div>
      </ha-card>`;

    this.shadowRoot.querySelectorAll('.buttons button').forEach((b) => b.addEventListener('click', () => {
      this._range = b.dataset.r;
      this._save('range', this._range);
      this._markButtons();
      this._series = [];
      this._peak = null;
      this._renderPlot();
      this._fetch();
    }));
    this.shadowRoot.querySelectorAll('.metrics button').forEach((b) => b.addEventListener('click', () => {
      this._metric = b.dataset.m;
      this._save('metric', this._metric);
      this._markButtons();
      this._renderPlot();
    }));
    this.shadowRoot.querySelectorAll('.corner').forEach((el) => el.addEventListener('click', () => {
      const cfg = c.corners[el.dataset.pos];
      const entityId = cfg?.entity || (cfg?.type ? c.sun_entity : null);
      if (!entityId) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
    }));
    this._renderStatic();
    this._renderModules();
    this._markButtons();
    this._built = true;
  }

  _markButtons() {
    this.shadowRoot.querySelectorAll('.buttons button').forEach((b) => b.classList.toggle('active', b.dataset.r === this._range));
    this.shadowRoot.querySelectorAll('.metrics button').forEach((b) => b.classList.toggle('active', b.dataset.m === this._metric));
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
      s += `<image href="${esc(c.image)}" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}"
              preserveAspectRatio="xMidYMid meet" opacity="${Number(c.image_opacity ?? 1)}" transform="rotate(${Number(c.image_rotation) || 0})"/>`;
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
    this._config.modules.forEach((m) => {
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

  /* ---------- Auswertung ---------- */
  _aggregate() {
    const c = this._config;
    const stops = c.color_stops;
    const n = c.sectors;
    const width = 360 / n;
    const mk = () => Array.from({ length: n }, () => new Array(stops.length).fill(0));
    const agg = { n, width, time: mk(), energy: mk(), sumV: new Array(n).fill(0), cnt: new Array(n).fill(0),
      timeBins: new Array(stops.length).fill(0), energyBins: new Array(stops.length).fill(0),
      totalTime: 0, totalEnergySun: 0, totalEnergy: 0 };
    this._series.forEach((p) => {
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
    });
    return agg;
  }

  _renderPlot() {
    if (!this._built) return;
    const c = this._config;
    const R = this._R();
    const stops = c.color_stops;
    const agg = this._aggregate();
    const metric = this._metric;
    const { n, width } = agg;

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
    const maxVal = Math.max(0, ...sectorTotals);

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
      ringSvg += c.image
        ? `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="7" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width="1.8"
                    paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${lbl}</text>`
        : `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="7" fill="var(--secondary-text-color, #777)"
                    stroke="var(--card-background-color, #fff)" stroke-width="2.2" paint-order="stroke"
                    text-anchor="middle" dominant-baseline="middle">${lbl}</text>`;
    }

    const arcPath = (a0, a1, r0, r1) => {
      const f = (v) => v.toFixed(2);
      const [x0, y0] = this._xy(a0, r1);
      const [x1, y1] = this._xy(a1, r1);
      const [x2, y2] = this._xy(a1, r0);
      const [x3, y3] = this._xy(a0, r0);
      if (r0 < 0.01) return `M0,0 L${f(x0)},${f(y0)} A${f(r1)},${f(r1)} 0 0 1 ${f(x1)},${f(y1)} Z`;
      return `M${f(x3)},${f(y3)} L${f(x0)},${f(y0)} A${f(r1)},${f(r1)} 0 0 1 ${f(x1)},${f(y1)} L${f(x2)},${f(y2)} A${f(r0)},${f(r0)} 0 0 0 ${f(x3)},${f(y3)} Z`;
    };
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
    this.shadowRoot.querySelector('g.trace').innerHTML = ringSvg + wedges;

    // Legende
    const legBins = metric === 'energy' ? agg.energyBins : agg.timeBins;
    const legTot = metric === 'energy' ? agg.totalEnergySun : agg.totalTime;
    this.shadowRoot.querySelectorAll('.bar span').forEach((el) => {
      const b = Number(el.dataset.i);
      const v = legTot ? (legBins[b] / legTot) * 100 : 0;
      el.textContent = legBins[b] ? `${Math.round(v)}%` : '';
      el.title = `${this._binLabel(b)}: ${fmtPct(v)} % ${metric === 'energy' ? 'des Ertrags' : 'der Sonnenzeit'}`;
    });
    const head = this.shadowRoot.querySelector('.legend .head .l');
    if (head) head.title = METRICS[metric].legend;

    this._renderStats(agg);

    const err = this.shadowRoot.querySelector('.err');
    if (err) {
      err.textContent = this._error ? `Verlauf: ${this._error}`
        : (this._series.length && !agg.totalTime ? 'Im gewählten Zeitraum stand die Sonne nicht über dem Horizont.' : '');
    }
  }

  _binLabel(b) {
    const stops = this._config.color_stops;
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
    set('energy', hasData ? fmtEnergy(agg.totalEnergy) : '–', hasData ? `letzte ${r.label}` : '');
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
    const st = this._hass.states[cfg.entity];
    if (!st) return '–';
    const n = parseFloat(st.state);
    if (!isFinite(n)) return st.state;
    const unit = cfg.unit ?? st.attributes.unit_of_measurement ?? '';
    if (unit === 'W' && Math.abs(n) >= 10000) return `${fmtNum(n / 1000, 1)}kW`;
    const dec = cfg.decimals ?? (Math.abs(n) >= 100 || unit === 'W' ? 0 : 1);
    return `${fmtNum(n, dec)}${unit}`;
  }

  _update(force) {
    const c = this._config;
    const sun = this._sunNow();
    const pvState = this._hass.states[c.power_entity];
    const power = (parseFloat(pvState?.state) || 0) * this._factor(c.power_entity);
    const sig = `${sun.azimuth.toFixed(1)}|${sun.elevation.toFixed(1)}|${power}|`
      + Object.values(c.corners).map((x) => (x?.entity ? this._hass.states[x.entity]?.state : '')).join('|');
    if (!force && sig === this._sig) return;
    this._sig = sig;

    this.shadowRoot.querySelectorAll('.corner').forEach((el) => {
      const cfg = c.corners[el.dataset.pos];
      el.querySelector('.lbl').textContent = cfg?.name ?? (cfg?.entity ? this._hass.states[cfg.entity]?.attributes.friendly_name : '') ?? '';
      el.querySelector('.val').textContent = this._cornerValue(cfg, sun);
    });

    const R = this._R();
    const col = sun.elevation > 0 ? '#f57c00' : '#9e9e9e';
    const a = sun.azimuth;
    const [tx, ty] = this._xy(a, R + 3);
    const [l1x, l1y] = this._xy(a - 4, R + 13);
    const [l2x, l2y] = this._xy(a + 4, R + 13);
    this.shadowRoot.querySelector('g.sun').innerHTML = `<polygon points="${tx.toFixed(1)},${ty.toFixed(1)} ${l1x.toFixed(1)},${l1y.toFixed(1)} ${l2x.toFixed(1)},${l2y.toFixed(1)}" fill="${col}">
      <title>Sonne: Azimut ${a.toFixed(0)}°, Höhe ${sun.elevation.toFixed(0)}°</title></polygon>`;

    const nowBin = this._bin(power);
    this.shadowRoot.querySelectorAll('.bar span').forEach((el) => el.classList.toggle('now', Number(el.dataset.i) === nowBin));
  }
}

/* =====================================================================
 * Grafischer Editor
 * ===================================================================== */
const CORNER_POS = { top_left: 'Oben links', top_right: 'Oben rechts', bottom_left: 'Unten links', bottom_right: 'Unten rechts' };

const LABELS = {
  title: 'Titel',
  power_entity: 'PV-Leistungssensor',
  max_power: 'Maximale Leistung (obere Leistungsklasse)',
  metric: 'Standard-Ansicht',
  sectors: 'Anzahl Richtungssektoren',
  default_range: 'Standard-Zeitraum',
  ranges: 'Zeitraum-Buttons',
  show_metric_switch: 'Umschalter Zeit / Ertrag / Ø Leistung anzeigen',
  show_stats: 'Kennzahlen anzeigen',
  show_legend: 'Farbskala anzeigen',
  legend_label: 'Beschriftung Farbskala',
  image: 'Bildpfad, optional (z. B. /local/helios/haus.png)',
  image_scale: 'Bildgröße',
  image_rotation: 'Bilddrehung (°)',
  image_opacity: 'Bild-Deckkraft',
  mode: 'Anzeige',
  entity: 'Entität',
  name: 'Beschriftung',
  modules: 'Modulfelder (Liste mit name, azimuth, tilt, kwp, color)',
  color_stops: 'Leistungsklassen (Liste mit value, color) – leer = automatisch',
  sector_opacity: 'Deckkraft der Sektoren',
  sun_entity: 'Sonnen-Entität',
  stats_type: '7/14 Tage: Stundenwert',
  refresh_interval: 'Aktualisierung (Sekunden)',
  corners: 'Ecken',
  ...CORNER_POS,
};

const cornerSchema = (pos) => ({
  type: 'expandable',
  name: pos,
  title: CORNER_POS[pos],
  schema: [
    { name: 'mode', selector: { select: { mode: 'dropdown', options: [
      { value: 'entity', label: 'Entität' }, { value: 'azimuth', label: 'Sonnenazimut' },
      { value: 'elevation', label: 'Sonnenhöhe' }, { value: 'none', label: 'Ausblenden' }] } } },
    { name: 'entity', selector: { entity: {} } },
    { name: 'name', selector: { text: {} } },
  ],
});

const EDITOR_SCHEMA = [
  { name: 'title', selector: { text: {} } },
  { name: 'power_entity', required: true, selector: { entity: { domain: 'sensor' } } },
  { type: 'grid', name: '', schema: [
    { name: 'max_power', selector: { number: { min: 50, max: 200000, step: 50, mode: 'box', unit_of_measurement: 'W' } } },
    { name: 'legend_label', selector: { text: {} } },
  ] },
  { type: 'grid', name: '', schema: [
    { name: 'metric', selector: { select: { mode: 'dropdown', options: [
      { value: 'time', label: 'Zeitanteil' }, { value: 'energy', label: 'Ertrag' }, { value: 'avg_power', label: 'Ø Leistung' }] } } },
    { name: 'default_range', selector: { select: { mode: 'dropdown', options: Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label })) } } },
  ] },
  { name: 'ranges', selector: { select: { multiple: true, mode: 'list', options: Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label })) } } },
  { name: 'sectors', selector: { number: { min: 8, max: 72, step: 4, mode: 'slider' } } },
  { type: 'grid', name: '', schema: [
    { name: 'show_metric_switch', selector: { boolean: {} } },
    { name: 'show_stats', selector: { boolean: {} } },
    { name: 'show_legend', selector: { boolean: {} } },
  ] },
  { type: 'expandable', title: 'Hausbild', icon: 'mdi:home-roof', flatten: true, schema: [
    { name: 'image', selector: { text: {} } },
    { name: 'image_scale', selector: { number: { min: 0.1, max: 1.6, step: 0.05, mode: 'slider' } } },
    { name: 'image_rotation', selector: { number: { min: -180, max: 180, step: 1, mode: 'slider', unit_of_measurement: '°' } } },
    { name: 'image_opacity', selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } } },
  ] },
  { type: 'expandable', name: 'corners', title: 'Werte in den Ecken', icon: 'mdi:border-all', schema: Object.keys(CORNER_POS).map(cornerSchema) },
  { type: 'expandable', title: 'Modulausrichtung', icon: 'mdi:solar-panel', flatten: true, schema: [
    { name: 'modules', selector: { object: {} } },
  ] },
  { type: 'expandable', title: 'Farben & Erweitert', icon: 'mdi:tune', flatten: true, schema: [
    { name: 'color_stops', selector: { object: {} } },
    { name: 'sector_opacity', selector: { number: { min: 0.2, max: 1, step: 0.05, mode: 'slider' } } },
    { type: 'grid', name: '', schema: [
      { name: 'sun_entity', selector: { entity: { domain: 'sun' } } },
      { name: 'stats_type', selector: { select: { mode: 'dropdown', options: [{ value: 'mean', label: 'Mittelwert' }, { value: 'max', label: 'Maximum' }] } } },
    ] },
    { name: 'refresh_interval', selector: { number: { min: 30, max: 3600, step: 30, mode: 'box', unit_of_measurement: 's' } } },
  ] },
];

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

class HeliosCompassCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    else this._render();
  }

  async _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      if (this._loading) return;
      this._loading = true;
      await ensureHaForm();
      const form = document.createElement('ha-form');
      form.computeLabel = (s) => LABELS[s.name] ?? s.title ?? s.name;
      form.computeHelper = (s) => (s.name === 'modules'
        ? 'Beispiel: - {name: Süd, azimuth: 180, tilt: 30, kwp: 0.8, color: "#ff9800"}'
        : s.name === 'sectors' ? '36 = 10° breite Sektoren, 16 = Kompassrichtungen' : undefined);
      form.addEventListener('value-changed', (e) => this._changed(e.detail.value));
      this.appendChild(form);
      this._form = form;
      this._loading = false;
    }
    this._form.hass = this._hass;
    this._form.schema = EDITOR_SCHEMA;
    this._form.data = this._toForm(this._config);
  }

  _toForm(config) {
    const data = { ...DEFAULTS, ...config };
    delete data.corners;
    if (!Array.isArray(config.color_stops)) delete data.color_stops;
    if (!Array.isArray(config.modules) || !config.modules.length) delete data.modules;
    if (!data.image) delete data.image;
    const corners = { ...defaultCorners(config.power_entity), ...(config.corners || {}) };
    data.corners = {};
    Object.keys(CORNER_POS).forEach((pos) => {
      const cc = corners[pos];
      data.corners[pos] = {
        mode: !cc ? 'none' : (cc.type || 'entity'),
        entity: cc?.entity || undefined,
        name: cc?.name ?? undefined,
      };
    });
    return data;
  }

  _fromForm(data) {
    const out = {};
    Object.entries(data).forEach(([k, v]) => {
      if (k === 'corners' || v === undefined || v === '' || v === null) return;
      // Standardwerte nicht unnötig in die YAML schreiben
      if (k !== 'title' && k in DEFAULTS && JSON.stringify(DEFAULTS[k]) === JSON.stringify(v) && !(k in this._config)) return;
      out[k] = v;
    });
    if (data.title === '' || data.title === undefined) out.title = '';
    const corners = {};
    Object.entries(data.corners || {}).forEach(([pos, cc]) => {
      if (!cc || cc.mode === 'none') { corners[pos] = null; return; }
      if (cc.mode === 'azimuth' || cc.mode === 'elevation') corners[pos] = { type: cc.mode, ...(cc.name ? { name: cc.name } : {}) };
      else {
        // Ecke folgt dem PV-Sensor, wenn dieser im Editor gewechselt wird
        const ent = !cc.entity || cc.entity === this._config.power_entity ? out.power_entity : cc.entity;
        corners[pos] = { entity: ent, ...(cc.name ? { name: cc.name } : {}) };
      }
    });
    out.corners = corners;
    return { type: this._config.type || 'custom:helios-compass-card', ...out };
  }

  _changed(data) {
    const cfg = this._fromForm(data);
    this._config = cfg;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: cfg }, bubbles: true, composed: true }));
  }
}

if (!customElements.get('helios-compass-card')) {
  customElements.define('helios-compass-card', HeliosCompassCard);
  customElements.define('helios-compass-card-editor', HeliosCompassCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: 'helios-compass-card',
    name: 'Helios Compass',
    description: 'Solarrose: Sonnenrichtung, PV-Leistung und Ertrag über dem Luftbild des Hauses',
    preview: true,
  });
  console.info(`%c HELIOS COMPASS %c v${CARD_VERSION} `, 'color:#fff;background:#f57c00;font-weight:bold', 'color:#f57c00;background:#fff');
}
