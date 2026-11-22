/**
 * Helios Compass – PV-Sonnenkompass-Karte für Home Assistant
 * Helios Compass Card: Sonnenrichtung × Leistungsklassen über dem Luftbild des Hauses.
 *
 * Installation: siehe README.md
 */
const CARD_VERSION = '1.18.0';

/* ---------- Sprache / Language ---------- */
let LANG = 'de';
let LOCALE = 'de-DE';
function detectLang(hass, configLang) {
  const raw = String((configLang && configLang !== 'auto') ? configLang
    : (hass?.locale?.language || hass?.language || document.documentElement.lang || navigator.language || 'en'));
  LANG = raw.toLowerCase().startsWith('de') ? 'de' : 'en';
  if (LANG === 'de') LOCALE = 'de-DE';
  else LOCALE = raw.includes('-') ? raw : (String(navigator.language || '').startsWith('en') ? navigator.language : 'en-GB');
  return LANG;
}
detectLang();

const I18N = {
  de: {
    r_today: 'Heute', r_1h: '1 Std.', r_8h: '8 Std.', r_12h: '12 Std.', r_24h: '24 Std.', r_7d: '7 Tage', r_14d: '14 Tage', r_30d: '30 Tage',
    r_1y: '1 Jahr', r_summer: 'Sommer', r_winter: 'Winter', d_summer: 'Apr–Sep', d_winter: 'Okt–Mär',
    m_areas: 'Flächen', total_power: 'Gesamtleistung', sum_label: 'Gesamt',
    m_clock: 'Uhr', note_clock: 'Uhr: Winkel = Uhrzeit, Ring = {unit} (innen älter, außen neuer), Farbe = Ø Leistung', u_day: 'Tag', u_week: 'Woche', kw: 'Woche ab', now_line: 'Jetzt {t}',
    m_power: 'Leistung', note_power: 'Leistung: Winkel = Sonnenrichtung, Abstand zur Mitte = Leistung', power_now: 'Jetzt: {p}',
    m_time: 'Zeit', m_energy: 'Ertrag', m_avg_power: 'Ø Leistung', m_shading: 'Schatten',
    lg_time: 'Zeitanteil je Leistungsklasse (Sonnenzeit)', lg_energy: 'Ertragsanteil je Leistungsklasse',
    sp_today: 'Heute', sp_summer: '21.6.', sp_winter: '21.12.',
    pv_power: 'PV-Leistung', total: 'Gesamt', power_of: '{name}-Leistung', today_of: '{name} heute', yield_today: 'Ertrag heute',
    sun_azimuth: 'Sonnenazimut', sun_elevation: 'Sonnenhöhe',
    err_config: 'Bitte "power_entity" oder "sources" angeben (z. B. sensor.pv_leistung).',
    toggle_paths: 'Sonnenbahnen ein-/ausblenden', toggle_labels: 'Werte an den Balken ein-/ausblenden', toggle_areas: 'Flächen ein-/ausblenden',
    st_yield: 'Ertrag', st_yield_measured: 'Ertrag (gemessen)', st_peak: 'Spitze', st_best: 'Beste Richtung',
    pct_of_yield: '{pct} % des Ertrags', of_yield: 'des Ertrags', of_suntime: 'der Sonnenzeit',
    last: 'letzte {label}', last12: '{desc}, letzte 12 Mon.',
    measured_by: 'Gemessen mit dem Energiezähler', calculated: 'Berechnet aus dem Leistungsverlauf',
    spec_yield: 'Spezifischer Ertrag ({p})',
    img_error: 'Hausbild konnte nicht geladen werden: {img}',
    img_hint: ' – bitte einen Pfad wie /local/haus.png verwenden (die App erreicht lokale Adressen unterwegs nicht).',
    note_shading: 'Schatten: Abstand zur Mitte = Sonnenhöhe (Rand = Horizont), Farbe = Ø Leistung',
    note_compare: 'Farbig: {a} ({ad}) · gestrichelt: {b} ({bd}) zum Vergleich',
    err_history: 'Verlauf: {e}', err_nosun: 'Im gewählten Zeitraum stand die Sonne nicht über dem Horizont.',
    from: 'ab {v}', direction: 'Richtung {deg}° ({dir})', elev_range: 'Sonnenhöhe {a}–{b}°', h_sun: '{h} Std. Sonne',
    avg_tip: 'Ø {p} bei Sonne aus dieser Richtung ({pct} % der Sonnenzeit)',
    path_today: 'Sonnenbahn heute', path_on: 'Sonnenbahn am {d}', sunrise: 'Aufgang', sunset: 'Untergang',
    noon: 'Mittagshöhe {e}° um {t}', dist_note: 'Abstand zur Mitte = Sonnenhöhe (Rand = Horizont)',
    sun_tip: 'Sonne: Azimut {a}°, Höhe {e}°', sun_now: 'Sonne jetzt: Azimut {a}°, Höhe {e}°',
    array: 'Modulfeld', azimuth: 'Azimut',
    card_desc: 'Sonnenrichtung, PV-Leistung und Ertrag über dem Luftbild des Hauses',
    utilization: 'Auslastung', modules_n: 'Module', util_of: '{name} Auslastung', util_tip: '{p} von {b} ({pct} %)',
  },
  en: {
    r_today: 'Today', r_1h: '1 h', r_8h: '8 h', r_12h: '12 h', r_24h: '24 h', r_7d: '7 days', r_14d: '14 days', r_30d: '30 days',
    r_1y: '1 year', r_summer: 'Summer', r_winter: 'Winter', d_summer: 'Apr–Sep', d_winter: 'Oct–Mar',
    m_areas: 'Areas', total_power: 'Total power', sum_label: 'Total',
    m_clock: 'Clock', note_clock: 'Clock: angle = time of day, ring = {unit} (inside older, outside newer), color = avg power', u_day: 'day', u_week: 'week', kw: 'Week of', now_line: 'Now {t}',
    m_power: 'Power', note_power: 'Power: angle = sun direction, distance from center = power', power_now: 'Now: {p}',
    m_time: 'Time', m_energy: 'Yield', m_avg_power: 'Avg power', m_shading: 'Shading',
    lg_time: 'Share of sun time per power class', lg_energy: 'Share of yield per power class',
    sp_today: 'Today', sp_summer: 'Jun 21', sp_winter: 'Dec 21',
    pv_power: 'PV power', total: 'Total', power_of: '{name} power', today_of: '{name} today', yield_today: 'Yield today',
    sun_azimuth: 'Sun azimuth', sun_elevation: 'Sun elevation',
    err_config: 'Please set "power_entity" or "sources" (e.g. sensor.pv_power).',
    toggle_paths: 'Show/hide sun paths', toggle_labels: 'Show/hide values at the bars', toggle_areas: 'Show/hide areas',
    st_yield: 'Yield', st_yield_measured: 'Yield (measured)', st_peak: 'Peak', st_best: 'Best direction',
    pct_of_yield: '{pct} % of yield', of_yield: 'of yield', of_suntime: 'of sun time',
    last: 'last {label}', last12: '{desc}, last 12 mo.',
    measured_by: 'Measured by the energy meter', calculated: 'Calculated from the power history',
    spec_yield: 'Specific yield ({p})',
    img_error: 'House image could not be loaded: {img}',
    img_hint: ' – please use a path like /local/house.png (the app cannot reach local addresses when you are away).',
    note_shading: 'Shading: distance from center = sun elevation (edge = horizon), color = avg power',
    note_compare: 'Colored: {a} ({ad}) · dashed: {b} ({bd}) for comparison',
    err_history: 'History: {e}', err_nosun: 'The sun was not above the horizon in the selected period.',
    from: 'from {v}', direction: 'Direction {deg}° ({dir})', elev_range: 'sun elevation {a}–{b}°', h_sun: '{h} h of sun',
    avg_tip: 'Avg {p} with sun from this direction ({pct} % of sun time)',
    path_today: 'Sun path today', path_on: 'Sun path on {d}', sunrise: 'Sunrise', sunset: 'Sunset',
    noon: 'Max elevation {e}° at {t}', dist_note: 'Distance from center = sun elevation (edge = horizon)',
    sun_tip: 'Sun: azimuth {a}°, elevation {e}°', sun_now: 'Sun now: azimuth {a}°, elevation {e}°',
    array: 'Array', azimuth: 'Azimuth',
    card_desc: 'Sun direction, PV power and yield over an aerial image of your house',
    utilization: 'Utilization', modules_n: 'modules', util_of: '{name} utilization', util_tip: '{p} of {b} ({pct} %)',
  },
};
const t = (k, v = {}) => String(I18N[LANG][k] ?? I18N.de[k] ?? k).replace(/\{(\w+)\}/g, (_, n) => (v[n] ?? ''));

const DIRS_I18N = {
  de: ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
  en: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
};
const dirs = () => DIRS_I18N[LANG];
const dir16 = (az) => dirs()[Math.round((((az % 360) + 360) % 360) / 22.5) % 16];

const RANGES = {
  today: {
    get label() { return t('r_today'); },
    get hours() { const m = new Date(); m.setHours(0, 0, 0, 0); return Math.max(0.05, (Date.now() - m.getTime()) / 3600e3); },
    step: 300,
    today: true,
  },
  '1h': { get label() { return t('r_1h'); }, hours: 1, step: 60 },
  '8h': { get label() { return t('r_8h'); }, hours: 8, step: 300 },
  '12h': { get label() { return t('r_12h'); }, hours: 12, step: 300 },
  '24h': { get label() { return t('r_24h'); }, hours: 24, step: 300 },
  '7d': { get label() { return t('r_7d'); }, hours: 168, step: 3600, stats: true },
  '14d': { get label() { return t('r_14d'); }, hours: 336, step: 3600, stats: true },
  '30d': { get label() { return t('r_30d'); }, hours: 720, step: 3600, stats: true },
  '1y': { get label() { return t('r_1y'); }, hours: 8760, step: 3600, stats: true },
  summer: { get label() { return t('r_summer'); }, hours: 8760, step: 3600, stats: true, months: [4, 5, 6, 7, 8, 9], compare: 'winter', get desc() { return t('d_summer'); } },
  winter: { get label() { return t('r_winter'); }, hours: 8760, step: 3600, stats: true, months: [10, 11, 12, 1, 2, 3], compare: 'summer', get desc() { return t('d_winter'); } },
};

const METRICS = {
  power: { get label() { return t('m_power'); }, get legend() { return t('lg_time'); } },
  time: { get label() { return t('m_time'); }, get legend() { return t('lg_time'); } },
  energy: { get label() { return t('m_energy'); }, get legend() { return t('lg_energy'); } },
  avg_power: { get label() { return t('m_avg_power'); }, get legend() { return t('lg_time'); } },
  shading: { get label() { return t('m_shading'); }, get legend() { return t('lg_time'); } },
  clock: { get label() { return t('m_clock'); }, get legend() { return t('lg_time'); } },
  areas: { get label() { return t('m_areas'); }, get legend() { return t('lg_time'); } },
};

const SUN_PATHS = {
  today: { get label() { return t('sp_today'); }, color: '#ff9800', dash: '' },
  summer: { get label() { return t('sp_summer'); }, color: '#eab308', dash: '4 3' },
  winter: { get label() { return t('sp_winter'); }, color: '#60a5fa', dash: '4 3' },
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
  ranges: ['today', '1h', '8h', '12h', '24h', '7d', '14d', '30d', '1y', 'summer', 'winter'],
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
  get legend_label() { return t('pv_power'); },
  modules: [],
  show_total: null, // null = automatisch bei mehreren Anlagen
  show_sun_paths: true,
  sun_path_toggle: true, // ☀-Knopf in der Karte zum Ein-/Ausblenden der Sonnenbahnen
  metrics: ['areas', 'power', 'time', 'energy', 'avg_power', 'shading', 'clock'], // angezeigte Ansichten
  sun_paths: ['today', 'summer', 'winter'],
  elevation_bands: 9, // Verschattungskarte: Anzahl Höhenringe (9 = 10°)
  season_overlay: true, // Sommer/Winter: andere Jahreszeit als Umriss
  kwp: null,
  energy_entity: null, // Ertragszähler (kWh) bei nur einem Sensor
  power_unit: 'auto', // 'auto' | 'W' | 'kW'
  show_utilization: true, // Auslastung je Anlage in %
  utilization_base: 'kwp', // 'kwp' (Fallback max_power) | 'max_power'
  sun_marker: 'arrow', // 'arrow' | 'circle' | 'sun' | 'dot' | 'none'
  sun_marker_position: 'edge', // 'edge' | 'elevation'
  sun_marker_color: '#f57c00',
  power_style: 'both', // Ansicht Leistung: 'both' | 'line' | 'dots' | 'area' | 'bars'
  sector_labels: false, // Werte an den Balkenspitzen anzeigen
  sector_labels_min: 20,
  label_toggle: true,
  areas: [], // markierte Modulflächen im Hausbild (Raster und/oder Polygone)
  area_labels: true, // Beschriftung der Flächen
  area_toggle: true, // ▦-Knopf in der Karte zum Ein-/Ausblenden der Flächen
  area_summary: 'areas', // Summenzeile Leistung je Fläche + Gesamt: 'areas' (nur Ansicht Flächen) | 'always' | 'off' // %-Knopf in der Karte zum Ein-/Ausblenden der Balkenwerte // nur Balken ab x % des größten Balkens beschriften
  energy_display: 'absolute', // Ansicht Ertrag: 'absolute' (kWh je Richtung) | 'percent'
  get total_name() { return t('total'); },
  language: 'auto', // 'auto' | 'de' | 'en'
};

const defaultCorners = () => ({
  top_left: { type: 'source' },
  top_right: { type: 'azimuth', name: t('sun_azimuth') },
  bottom_left: { type: 'elevation', name: t('sun_elevation') },
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
const fmtNum = (v, dec = 0) => Number(v).toLocaleString(LOCALE, { maximumFractionDigits: dec, minimumFractionDigits: 0 });
const fmtSpec = (v) => fmtNum(v, v >= 100 ? 0 : v >= 10 ? 1 : 2);
const fmtPct = (v) => fmtNum(v, v >= 10 ? 0 : 1);
let POWER_UNIT = 'auto'; // 'auto' | 'W' | 'kW'
function fmtP(w, unit = POWER_UNIT, sep = ' ', dec) {
  const u = unit === 'W' || unit === 'kW' ? unit : (Math.abs(w) >= 1000 ? 'kW' : 'W');
  if (u === 'kW') return `${fmtNum(w / 1000, dec ?? (Math.abs(w) >= 10000 ? 1 : Math.abs(w) >= 100 ? 2 : 3))}${sep}kW`;
  return `${fmtNum(w, dec ?? 0)}${sep}W`;
}
const fmtPower = (w) => fmtP(w);
const fmtEnergy = (wh) => (Math.round(wh) >= 1000 ? `${fmtNum(wh / 1000, wh >= 100000 ? 0 : wh >= 10000 ? 1 : 2)} kWh` : `${fmtNum(wh)} Wh`);

/** Entitäts-ID ergänzen: „h3_pv1_power“ → „sensor.h3_pv1_power“ */
const normEnt = (e) => (e && typeof e === 'string' && e !== 'total' && !e.includes('.') ? `sensor.${e}` : e);
const entList = (x) => (Array.isArray(x) ? x : x ? [x] : []).map(normEnt).filter(Boolean);

/** Raster-Zellen und freie Polygone einer Fläche in Bildkoordinaten */
function gridCell(grid, i, j) {
  const r = ((Number(grid.rotation) || 0) * Math.PI) / 180;
  const ux = [Math.cos(r), Math.sin(r)];
  const uy = [-Math.sin(r), Math.cos(r)];
  const w = Number(grid.w) || 5;
  const h = Number(grid.h) || 8;
  const x0 = Number(grid.x) || 0;
  const y0 = Number(grid.y) || 0;
  const P = (a, b) => [x0 + a * w * ux[0] + b * h * uy[0], y0 + a * w * ux[1] + b * h * uy[1]];
  return [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
}
function areaShapes(area) {
  const out = [];
  if (area.grid && Array.isArray(area.grid.cells)) {
    area.grid.cells.forEach((cell) => {
      const [i, j] = Array.isArray(cell) ? cell : String(cell).split(',').map(Number);
      if (isFinite(i) && isFinite(j)) out.push({ key: `${i},${j}`, pts: gridCell(area.grid, i, j) });
    });
  }
  (area.polygons || []).forEach((pg) => { if (Array.isArray(pg) && pg.length > 2) out.push({ pts: pg }); });
  return out;
}

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
    this._rawConfig = config;
    detectLang(this._hass, config?.language);
    const hasSources = Array.isArray(config?.sources) && config.sources.some((x) => x && (x.entity || (Array.isArray(x.entities) && x.entities.length)));
    if (!config || (!config.power_entity && !hasSources)) {
      throw new Error(t('err_config'));
    }
    const c = { ...DEFAULTS, ...config };
    c.ranges = (Array.isArray(c.ranges) ? c.ranges : DEFAULTS.ranges).filter((r) => RANGES[r]);
    if (!c.ranges.length) c.ranges = DEFAULTS.ranges;
    c.metrics = (Array.isArray(c.metrics) ? c.metrics : DEFAULTS.metrics).filter((m) => METRICS[m]);
    if (!c.metrics.length) c.metrics = ['time'];
    if (!c.metrics.includes(c.metric)) c.metric = c.metrics[0];
    c.max_power = Number(c.max_power) || 8000;
    c.sectors = Math.max(4, Math.min(180, Math.round(Number(c.sectors) || 36)));
    const globalModules = Array.isArray(c.modules) ? c.modules.filter(validModule) : [];
    const kwpOf = (mods) => mods.reduce((a, m) => a + (Number(m.kwp) || 0), 0);
    c.elevation_bands = Math.max(3, Math.min(30, Math.round(Number(c.elevation_bands) || 9)));
    c.sun_paths = Array.isArray(c.sun_paths) ? c.sun_paths.filter((k) => SUN_PATHS[k]) : DEFAULTS.sun_paths;
    const raw = hasSources ? config.sources.filter((x) => x && (x.entity || (Array.isArray(x.entities) && x.entities.length))) : [{ entity: config.power_entity }];
    c.sources = raw.map((x) => {
      const max = Number(x.max_power) || c.max_power;
      const ownMods = Array.isArray(x.modules) ? x.modules.filter(validModule) : [];
      const kwp = Number(x.kwp) || (hasSources ? kwpOf(ownMods) : 0) || (!hasSources ? Number(config.kwp) || kwpOf(globalModules) : 0);
      return {
        kwp,
        energy: x.energy_entity || x.energy_entities ? entList(x.energy_entities || x.energy_entity) : (!hasSources && config.energy_entity ? entList(config.energy_entity) : []),
        id: normEnt(x.entity) || entList(x.entities).join('+'),
        entities: x.entities && x.entities.length ? entList(x.entities) : entList(x.entity),
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
        name: c.total_name || t('total'),
        max_power: max,
        color_stops: makeStops(c.total_color_stops, max),
        modules: [...new Set(c.sources.flatMap((x) => x.modules))],
        kwp: c.sources.every((x) => x.kwp > 0) ? c.sources.reduce((a, x) => a + x.kwp, 0) : 0,
        energy: c.sources.every((x) => x.energy.length) ? c.sources.flatMap((x) => x.energy) : [],
      });
    }
    c.power_entity = c.sources[0].entities[0];
    c.corners = { ...defaultCorners(), ...(config.corners || {}) };
    c.areas = (Array.isArray(config.areas) ? config.areas : [])
      .filter((a) => a && ((a.grid && Array.isArray(a.grid.cells) && a.grid.cells.length) || (Array.isArray(a.polygons) && a.polygons.some((pg) => Array.isArray(pg) && pg.length > 2))));
    if (!c.areas.length || !c.image) {
      c.metrics = c.metrics.filter((m) => m !== 'areas');
      if (!c.metrics.length) c.metrics = ['time'];
      if (!c.metrics.includes(c.metric)) c.metric = c.metrics[0];
    }
    // Alte Konfigurationen: Ecke oben links war fest auf den ersten Sensor gestellt
    // (z. B. {entity: sensor.bkw, name: 'BKW-Leistung'}). Bei mehreren Anlagen soll sie der Auswahl folgen.
    const tl = c.corners.top_left;
    if (c.sources.length > 1 && tl && tl.entity && tl.follow !== false) {
      const src = c.sources.find((x) => !x.total && x.entities[0] === tl.entity);
      const autoNames = [undefined, '', 'PV-Leistung', 'PV power', ...c.sources.flatMap((x) => (x.name ? [`${x.name}-Leistung`, `${x.name} power`] : []))];
      if (src && autoNames.includes(tl.name)) c.corners.top_left = { type: 'source' };
    }
    this._config = c;
    this._range = c.ranges.includes(this._load('range')) ? this._load('range') : (c.ranges.includes(c.default_range) ? c.default_range : c.ranges[0]);
    this._metric = c.show_metric_switch && c.metrics.includes(this._load('metric')) ? this._load('metric') : c.metric;
    const sp = this._load('sunpaths');
    this._showPaths = c.show_sun_paths && c.sun_path_toggle && sp !== null ? sp === '1' : c.show_sun_paths;
    const sl = this._load('labels');
    this._showLabels = c.label_toggle && sl !== null ? sl === '1' : !!c.sector_labels;
    const sa = this._load('areas');
    this._showAreas = c.area_toggle && sa !== null ? sa === '1' : true;
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

  _utilBase(src) {
    if (this._config.utilization_base === 'max_power') return src.max_power;
    return src.kwp > 0 ? src.kwp * 1000 : src.max_power;
  }

  _utilization(src = this._src()) {
    const b = this._utilBase(src);
    return b > 0 ? (this._livePower(src) / b) * 100 : null;
  }

  _livePower(src = this._src()) {
    return src.entities.reduce((acc, e) => acc + (parseFloat(this._hass.states[e]?.state) || 0) * this._factor(e), 0);
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._config) return;
    if (first) {
      const prev = LANG;
      detectLang(hass, this._config.language);
      if (prev !== LANG) { this.setConfig(this._rawConfig); return; }
    }
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
    const key = r.today ? `today-${new Date().toDateString()}-${Math.floor(Date.now() / (this._config.refresh_interval * 1000))}` : `${r.stats ? 's' : 'h'}${r.hours}`;
    const cache = this._cache;
    if (cache && cache.key === key && Date.now() - cache.time < this._config.refresh_interval * 1000) {
      this._data = cache.data;
      this._energy = cache.energy || {};
      this._error = null;
      this._composeSeries();
      this._renderPlot();
      return;
    }
    const eIds = [...new Set(this._config.sources.flatMap((x) => x.energy))];
    const energy = {};
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
      if (eIds.length) {
        // Gemessener Ertrag aus den Langzeitstatistiken der Energiezähler
        const res = await this._hass.callWS({
          type: 'recorder/statistics_during_period',
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          statistic_ids: eIds,
          period: r.hours <= 24 ? '5minute' : 'hour',
          types: ['change', 'state'],
        });
        eIds.forEach((id) => {
          const f = this._energyFactor(id);
          energy[id] = (res?.[id] || []).map((st) => ({
            t: typeof st.start === 'number' ? st.start : Date.parse(st.start),
            change: (Number(st.change) || 0) * f,
            state: Number(st.state) * f,
          }));
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
    this._energy = energy;
    this._error = error;
    if (!error) this._cache = { key, time: Date.now(), data, energy };
    this._fetchToday();
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

  /** Umrechnung des Energiezählers auf Wh */
  _energyFactor(id) {
    const u = this._hass.states[id]?.attributes.unit_of_measurement;
    if (u === 'kWh') return 1000;
    if (u === 'MWh') return 1e6;
    if (u === 'GWh') return 1e9;
    return 1; // Wh
  }

  /** Teilstunde seit der letzten Statistik: aktueller Zählerstand minus letzter Stand */
  _liveTail(id, rows) {
    const last = rows[rows.length - 1];
    const cur = parseFloat(this._hass.states[id]?.state) * this._energyFactor(id);
    if (!last || !isFinite(cur) || !isFinite(last.state)) return 0;
    return cur >= last.state ? cur - last.state : cur; // Rücksetzung (Tageszähler)
  }

  /** Gemessener Ertrag einer Anlage im Zeitraum (Wh) oder null */
  _measured(src, months) {
    if (!src.energy?.length || !this._energy) return null;
    let sum = 0;
    const curMonth = new Date().getMonth() + 1;
    for (const id of src.energy) {
      const rows = this._energy[id];
      if (!rows || !rows.length) return null;
      rows.forEach((row) => { if (!months || months.includes(new Date(row.t).getMonth() + 1)) sum += row.change; });
      if (!months || months.includes(curMonth)) sum += this._liveTail(id, rows);
    }
    return sum;
  }

  /** Ertrag heute je Energiezähler (ab Mitternacht) */
  async _fetchToday() {
    const eIds = [...new Set(this._config.sources.flatMap((x) => x.energy))];
    if (!eIds.length || !this._hass) return;
    const mid = new Date();
    mid.setHours(0, 0, 0, 0);
    try {
      const res = await this._hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: new Date(mid.getTime() - 3600e3).toISOString(),
        end_time: new Date().toISOString(),
        statistic_ids: eIds,
        period: 'hour',
        types: ['change', 'state'],
      });
      const today = {};
      eIds.forEach((id) => {
        const f = this._energyFactor(id);
        const rows = (res?.[id] || []).map((st) => ({
          t: typeof st.start === 'number' ? st.start : Date.parse(st.start),
          change: (Number(st.change) || 0) * f,
          state: Number(st.state) * f,
        }));
        today[id] = { sum: rows.filter((x) => x.t >= mid.getTime()).reduce((a, x) => a + x.change, 0), rows };
      });
      this._today = today;
      this._update(true);
    } catch (e) {
      console.warn('helios-compass-card: Tagesertrag konnte nicht geladen werden', e);
    }
  }

  /** Ertrag heute der Anlage in Wh oder null */
  _todayEnergy(src = this._src()) {
    if (!src.energy?.length || !this._today) return null;
    let sum = 0;
    for (const id of src.energy) {
      const d = this._today[id];
      if (!d) return null;
      sum += d.sum + this._liveTail(id, d.rows);
    }
    return sum;
  }

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
    POWER_UNIT = c.power_unit || 'auto';
    const corner = (pos) => (c.corners[pos] ? `<div class="corner ${pos}" data-pos="${pos}"><div class="lbl"></div><div class="val"></div></div>` : '');
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        ha-card { padding: 12px 14px 12px; overflow:hidden; height:100%; box-sizing:border-box; }
        .top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:4px 8px; margin-bottom:2px; }
        .title { font-size: 1.25em; color: var(--primary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
        .metrics { display:flex; border:1px solid var(--divider-color, #ccc); border-radius:14px; overflow:hidden; flex-shrink:0; }
        .metrics button { font: inherit; font-size:.72em; padding:3px 6px; border:0; background:transparent; cursor:pointer;
                 color: var(--secondary-text-color); }
        .metrics button + button { border-left:1px solid var(--divider-color, #ccc); }
        .tools { display:flex; align-items:center; gap:5px; flex-wrap:wrap; }
        .tgls { display:inline-flex; gap:4px; flex-wrap:nowrap; }
        .tgls:empty { display:none; }
        .tgl { font: inherit; font-size:.8em; line-height:1; width:24px; height:22px; border-radius:11px; cursor:pointer; padding:0;
               border:1px solid var(--divider-color, #ccc); background:transparent; color: var(--secondary-text-color); filter: grayscale(1); opacity:.6; }
        .tgl.on { background:#fff3cd; border-color:#f5b400; filter:none; opacity:1; }
        .tgl.pct, .tgl.ar { font-weight:700; color: var(--primary-text-color); }
        .tgl.pct.on { background: var(--primary-color, #03a9f4); border-color: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
        .metrics button.active, .sources button.active { background: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
        .sources { display:inline-flex; flex-wrap:wrap; border:1px solid var(--divider-color, #ccc); border-radius:14px; overflow:hidden; margin:2px 0 4px; }
        .sources button { font: inherit; font-size:.78em; padding:3px 10px; border:0; background:transparent; cursor:pointer;
                 color: var(--primary-text-color); }
        .sources button + button { border-left:1px solid var(--divider-color, #ccc); }
        .util { display:flex; flex-wrap:wrap; gap:6px; margin:2px 0 4px; }
        .util .u { position:relative; overflow:hidden; font-size:.74em; padding:2px 8px; border-radius:10px; cursor:pointer;
                   border:1px solid var(--divider-color, #ccc); color: var(--secondary-text-color); background: var(--card-background-color, #fff); }
        .util .u i { position:absolute; left:0; top:0; bottom:0; opacity:.22; transition: width .6s; }
        .util .u span { position:relative; }
        .util .u b { color: var(--primary-text-color); font-weight:500; }
        .util .u.active { border-color: var(--primary-color, #03a9f4); }
        .plot { position:relative; width:100%; max-width:420px; margin:0 auto; aspect-ratio: 1 / 1.02; }
        svg.rose { position:absolute; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
        svg.rose g.trace *, svg.rose g.paths *, svg.rose g.modules *, svg.rose g.sun * { pointer-events:auto; }
        svg.rose g.areas .area { pointer-events:auto; cursor:pointer; }
        svg.rose g.areas .area:hover polygon { fill-opacity:.75; }
        /* Hausbild als HTML-Ebene unter dem Kompass (funktioniert auch in der Companion-App) */
        .bgwrap { position:absolute; left:50%; top:50%; width:${(2 * 108 / 320) * 100}%; aspect-ratio:1/1;
                  transform:translate(-50%,-50%); pointer-events:none; }
        .bgwrap.clip { border-radius:50%; overflow:hidden; -webkit-mask-image:-webkit-radial-gradient(white, black); }
        .bgwrap img { position:absolute; object-fit:contain; transform-origin:50% 50%; max-width:none; }
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
        .stat .s { font-size:.68em; color: var(--secondary-text-color); line-height:1.25; overflow-wrap:anywhere; }
        .buttons { display:flex; gap:6px; justify-content:center; margin-top:10px; flex-wrap:wrap; }
        .buttons button { flex:1; min-width:44px; max-width:72px; font: inherit; font-size:.76em; padding:5px 2px; border-radius:6px; white-space:nowrap;
                 border:1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
                 color: var(--primary-text-color); cursor:pointer; box-shadow: 0 1px 2px rgba(0,0,0,.15); }
        .buttons button.active { color:#e53935; border-color:#e53935; }
        .err { font-size:.75em; color: var(--error-color, #db4437); text-align:center; }
        .wedge { transition: opacity .2s; } .wedge:hover { opacity:1 !important; }
        .buttons.many button { flex: 0 0 calc(20% - 5px); max-width:none; }
        .note { font-size:.72em; color: var(--secondary-text-color); text-align:center; margin-top:4px; min-height:0; }
        .note:empty { display:none; }
        .sum { display:flex; flex-wrap:wrap; justify-content:center; gap:3px 12px; font-size:.92em; color: var(--primary-text-color); margin:2px 0 4px; }
        .sum-i { display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
        .sum-i i { width:10px; height:10px; border-radius:3px; display:inline-block; }
        .sum-i b { font-weight:600; }
        .sum-i.tot { padding-left:10px; border-left:1px solid var(--divider-color, #ccc); }
        .yield { font-size:.75em; color: var(--secondary-text-color); margin-top:6px; text-align:center; }
        .yield:empty { display:none; }
        .yield b { color: var(--primary-text-color); font-weight:500; }
      </style>
      <ha-card>
        ${c.title || c.show_metric_switch || c.sun_path_toggle || c.label_toggle || this._areaToggle() ? `<div class="top">
          <div class="title">${esc(c.title || '')}</div>
          <div class="tools">
            ${c.show_metric_switch && c.metrics.length > 1 ? `<div class="metrics">${c.metrics.map((k) => `<button data-m="${k}">${METRICS[k].label}</button>`).join('')}</div>` : ''}
            <span class="tgls">${c.show_sun_paths && c.sun_path_toggle && c.sun_paths.length ? `<button class="tgl" data-t="paths" title="${t('toggle_paths')}">☀</button>` : ''}
            ${c.label_toggle ? `<button class="tgl pct" data-t="labels" title="${t('toggle_labels')}">%</button>` : ''}
            ${this._areaToggle() ? `<button class="tgl ar" data-t="areas" title="${t('toggle_areas')}">▦</button>` : ''}</span>
          </div>
        </div>` : ''}
        ${c.sources.length > 1 ? `<div class="sources">${c.sources.map((x) => `<button data-src="${esc(x.id)}">${esc(x.name || this._hass?.states[x.entities[0]]?.attributes.friendly_name || x.entities[0])}</button>`).join('')}</div>` : ''}
        ${c.show_utilization ? '<div class="util"></div>' : ''}
        <div class="plot">
          ${c.image ? '<div class="bgwrap"><img class="bg" alt="" decoding="async"></div>' : ''}
          <svg class="rose" viewBox="-160 -160 320 320" preserveAspectRatio="xMidYMid meet">
            <g class="static"></g><g class="areas"></g><g class="trace"></g><g class="paths"></g><g class="modules"></g><g class="sun"></g>
          </svg>
          ${corner('top_left')}${corner('top_right')}${corner('bottom_left')}${corner('bottom_right')}
        </div>
        <div class="areasum"></div>
        <div class="note"></div>
        ${c.show_legend ? `<div class="legend">${this._legendHtml()}</div>` : ''}
        ${c.show_stats ? `<div class="stats">
          <div class="stat" data-s="energy"><div class="k">${t('st_yield')}</div><div class="v">–</div><div class="s">&nbsp;</div></div>
          <div class="stat" data-s="peak"><div class="k">${t('st_peak')}</div><div class="v">–</div><div class="s">&nbsp;</div></div>
          <div class="stat" data-s="best"><div class="k">${t('st_best')}</div><div class="v">–</div><div class="s">&nbsp;</div></div>
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
    this.shadowRoot.querySelector('.tgl[data-t="labels"]')?.addEventListener('click', () => {
      this._showLabels = !this._showLabels;
      this._save('labels', this._showLabels ? '1' : '0');
      this._markButtons();
      this._renderPlot();
    });
    this.shadowRoot.querySelector('.tgl[data-t="areas"]')?.addEventListener('click', () => {
      this._showAreas = !this._showAreas;
      this._save('areas', this._showAreas ? '1' : '0');
      this._markButtons();
      this._renderAreas();
    });
    this.shadowRoot.querySelector('.tgl[data-t="paths"]')?.addEventListener('click', () => {
      this._showPaths = !this._showPaths;
      this._save('sunpaths', this._showPaths ? '1' : '0');
      this._markButtons();
      this._renderSunPaths();
      this._update(true);
    });
    this.shadowRoot.querySelectorAll('.metrics button').forEach((b) => b.addEventListener('click', () => {
      this._metric = b.dataset.m;
      this._save('metric', this._metric);
      this._markButtons();
      this._renderPlot();
      this._update(true);
    }));
    this.shadowRoot.querySelectorAll('.corner').forEach((el) => el.addEventListener('click', () => {
      const cfg = c.corners[el.dataset.pos];
      const entityId = cfg?.entity || (['source', 'utilization'].includes(cfg?.type) ? this._src().entities[0]
        : cfg?.type === 'energy_today' ? (this._src().energy[0] || this._src().entities[0]) : cfg?.type ? c.sun_entity : null);
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
    this.shadowRoot.querySelector('.tgl[data-t="paths"]')?.classList.toggle('on', !!this._showPaths);
    this.shadowRoot.querySelector('.tgl[data-t="labels"]')?.classList.toggle('on', !!this._showLabels);
    this.shadowRoot.querySelector('.tgl[data-t="areas"]')?.classList.toggle('on', !!this._showAreas);
  }

  _areaToggle() {
    const c = this._config;
    return !!(c.area_toggle && c.image && c.areas.length);
  }

  _legendHtml() {
    const src = this._src();
    const stops = src.color_stops;
    const unit = src.max_power >= 20000 ? 'kW' : 'W';
    const tick = (v) => (unit === 'kW' ? fmtNum(v / 1000, 1) : Math.round(v));
    const label = src.legend_label || (this._config.sources.length > 1 && src.name ? t('power_of', { name: src.name }) : this._config.legend_label);
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
    this._renderImage();
    const line = 'rgba(46,160,120,.55)';
    for (let i = 0; i < 16; i++) {
      const [x, y] = this._xy(i * 22.5, R);
      s += `<line x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${line}" stroke-width="0.6"/>`;
    }
    s += `<circle r="${R}" fill="none" stroke="${line}" stroke-width="1"/>`;
    dirs().forEach((d, i) => {
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

  _renderImage() {
    const c = this._config;
    const wrap = this.shadowRoot.querySelector('.bgwrap');
    const img = wrap?.querySelector('img');
    if (!img) return;
    const scale = Number(c.image_scale || 0.8) * 100; // % des Kompassdurchmessers
    const ox = (Number(c.image_offset_x) || 0) / 2; // % von R → % des Durchmessers
    const oy = (Number(c.image_offset_y) || 0) / 2;
    wrap.classList.toggle('clip', !!c.image_clip);
    Object.assign(img.style, {
      width: `${scale}%`,
      height: `${scale}%`,
      left: `calc(${50 + ox}% - ${scale / 2}%)`,
      top: `calc(${50 - oy}% - ${scale / 2}%)`,
      transform: `rotate(${Number(c.image_rotation) || 0}deg)`,
      opacity: String(Number(c.image_opacity ?? 1)),
    });
    let url = String(c.image);
    if (this._hass && /^\/(local|media|api)\//.test(url) && this._hass.hassUrl) url = this._hass.hassUrl(url);
    img.onerror = () => {
      this._imageError = t('img_error', { img: c.image })
        + (/^https?:\/\/(192\.168|10\.|172\.|[^/]*\.local)/.test(c.image) ? t('img_hint') : '');
      this._renderError();
    };
    img.onload = () => {
      if (img.naturalWidth) this._imgAR = img.naturalHeight / img.naturalWidth;
      if (this._imageError) { this._imageError = null; this._renderError(); }
      this._renderAreas();
    };
    if (img.getAttribute('src') !== url) img.setAttribute('src', url);
  }

  /* ---------- Flächen im Hausbild ---------- */
  /** Abbildung Bildkoordinaten (u: 0–100 der Breite, v: 0–100·H/B) → SVG-Koordinaten der Rose */
  _areaMap() {
    const c = this._config;
    const R = this._R();
    const S = 2 * R * Number(c.image_scale || 0.8);
    const ar = this._imgAR || 1;
    const Wi = ar <= 1 ? S : S / ar;
    const Hi = Wi * ar;
    const k = Wi / 100;
    const dx = ((Number(c.image_offset_x) || 0) / 100) * R;
    const dy = (-(Number(c.image_offset_y) || 0) / 100) * R;
    const rot = ((Number(c.image_rotation) || 0) * Math.PI) / 180;
    const pt = (u, v) => {
      const lx = u * k - Wi / 2;
      const ly = v * k - Hi / 2;
      return [lx * Math.cos(rot) - ly * Math.sin(rot) + dx, lx * Math.sin(rot) + ly * Math.cos(rot) + dy];
    };
    return { pt, k };
  }

  _findSystem(ref) {
    const srcs = this._config.sources;
    if (!ref) return null;
    if (ref === 'total') return srcs.find((x) => x.total) || null;
    const e = normEnt(ref);
    return srcs.find((x) => !x.total && (x.id === e || x.entities.includes(e))) || null;
  }

  _areaSource(area) { return this._findSystem(area.system) || this._findSystem(area.source); }

  /** Leistung und Bezugsgröße einer Fläche: eigener Sensor (W/kW) oder ganze Anlage */
  _areaInfo(area) {
    const c = this._config;
    const own = this._findSystem(area.source);
    const sys = this._findSystem(area.system) || own;
    if (own) return { sys, power: this._livePower(own), base: Number(area.kwp) > 0 ? area.kwp * 1000 : this._utilBase(own) };
    const ent = normEnt(area.source);
    if (!ent && sys) return { sys, power: this._livePower(sys), base: Number(area.kwp) > 0 ? area.kwp * 1000 : this._utilBase(sys) };
    const st = ent ? this._hass.states[ent] : null;
    const power = st ? (parseFloat(st.state) || 0) * this._factor(ent) : null;
    let base = 0;
    if (Number(area.kwp) > 0) base = Number(area.kwp) * 1000;
    else if (Number(area.max_power) > 0) base = Number(area.max_power);
    else if (sys) {
      const siblings = c.areas.filter((a) => this._findSystem(a.system) === sys && !this._findSystem(a.source)).length || 1;
      base = this._utilBase(sys) / siblings;
    }
    return { sys, power, base };
  }

  _areaSun(area, src) {
    const sun = this._sunNow();
    if (sun.elevation <= 0) return false;
    const mod = (area.azimuth !== undefined && area.azimuth !== null && area.azimuth !== '')
      ? { azimuth: area.azimuth, tilt: area.tilt ?? 30 } : src?.modules?.[0];
    if (!mod) return null;
    const d2r = Math.PI / 180;
    const tilt = Number(mod.tilt ?? 30) * d2r;
    const inc = Math.cos(sun.elevation * d2r) * Math.sin(tilt) * Math.cos((sun.azimuth - Number(mod.azimuth)) * d2r)
      + Math.sin(sun.elevation * d2r) * Math.cos(tilt);
    return inc > 0.05;
  }

  _renderAreas() {
    const c = this._config;
    const g = this.shadowRoot.querySelector('g.areas');
    if (!g) return;
    if (!c.image || !c.areas.length || !this._imgAR || (this._areaToggle() && !this._showAreas)) { g.innerHTML = ''; return; }
    const { pt, k } = this._areaMap();
    const f = (v) => v.toFixed(2);
    let svg = '';
    let labels = '';
    c.areas.forEach((area, ai) => {
      const info = this._areaInfo(area);
      const src = info.sys;
      const col = area.color || '#f5a623';
      const { power, base } = info;
      const util = power !== null && base > 0 ? (power / base) * 100 : null;
      const lit = this._areaSun(area, src);
      const sel = src && src.id === this._sourceId;
      const shapes = areaShapes(area);
      const cellCount = shapes.filter((x) => x.key).length;
      const modWp = Number(area.module_wp) || (base > 0 && cellCount ? base / cellCount : 0);
      const focus = this._metric === 'areas';
      const baseOp = util === null ? 0.35 : (focus ? 0.3 : 0.12) + (focus ? 0.55 : 0.6) * Math.min(1, Math.max(0, util / 100));
      const name = area.name || src?.name || area.source || '';
      const tip = `${name}${power !== null ? ` · ${fmtPower(power)}` : ''}${util !== null ? ` · ${fmtNum(util, util < 10 ? 1 : 0)} %` : ''}`
        + `${lit === true ? ' · ☀' : lit === false ? ' · ☁' : ''}${cellCount ? ` · ${cellCount} ${t('modules_n')}` : ''}`;
      let polys = '';
      shapes.forEach((sh) => {
        let op = baseOp;
        let cellTip = '';
        const ent = sh.key && area.cell_sensors ? area.cell_sensors[sh.key] : null;
        if (ent) {
          const st = this._hass.states[ent];
          const pw = (parseFloat(st?.state) || 0) * this._factor(ent);
          op = modWp > 0 ? 0.12 + 0.75 * Math.min(1, pw / modWp) : baseOp;
          cellTip = `\n${st?.attributes.friendly_name || ent}: ${fmtPower(pw)}`;
        }
        const pts = sh.pts.map(([u, v]) => pt(u, v).map(f).join(',')).join(' ');
        polys += `<polygon points="${pts}" fill="${esc(col)}" fill-opacity="${op.toFixed(2)}" stroke="${esc(col)}"
          stroke-width="${sel ? 1.6 : 0.9}" stroke-linejoin="round" ${lit === false ? 'stroke-dasharray="2.5 1.8"' : ''}>${cellTip ? `<title>${esc(tip + cellTip)}</title>` : ''}</polygon>`;
        if (ent) {
          const cx = sh.pts.reduce((a, q) => a + q[0], 0) / sh.pts.length;
          const cy = sh.pts.reduce((a, q) => a + q[1], 0) / sh.pts.length;
          const [x, y] = pt(cx, cy);
          polys += `<circle cx="${f(x)}" cy="${f(y)}" r="0.9" fill="#fff" opacity=".85" pointer-events="none"/>`;
        }
      });
      svg += `<g class="area" data-i="${ai}" ${sel ? 'filter="drop-shadow(0 0 2.5px rgba(255,255,255,.9))"' : ''}><title>${esc(tip)}</title>${polys}</g>`;
      if (c.area_labels && shapes.length) {
        const all = shapes.flatMap((x) => x.pts);
        const cu = all.reduce((a, q) => a + q[0], 0) / all.length;
        const cv = all.reduce((a, q) => a + q[1], 0) / all.length;
        const [x, y] = pt(cu, cv);
        const line1 = `${lit === true ? '☀ ' : lit === false ? '☁ ' : ''}${name}`;
        const line2 = `${power !== null ? fmtPower(power) : ''}${util !== null ? ` · ${fmtNum(util, util < 10 ? 1 : 0)} %` : ''}`;
        const z = this._metric === 'areas' ? 1.45 : 1;
        const wPx = (Math.max(line1.length, line2.length) * 3.3 + 6) * z;
        labels += `<g pointer-events="none"><rect x="${f(x - wPx / 2)}" y="${f(y - 8 * z)}" width="${f(wPx)}" height="${f((line2 ? 16 : 10) * z)}" rx="${f(4 * z)}" fill="rgba(0,0,0,.7)"/>
          <text x="${f(x)}" y="${f(y - 2.5 * z)}" font-size="${f(6 * z)}" font-weight="600" fill="#fff" text-anchor="middle">${esc(line1)}</text>
          ${line2 ? `<text x="${f(x)}" y="${f(y + 4.8 * z)}" font-size="${f(5.6 * z)}" fill="#fff" text-anchor="middle">${esc(line2)}</text>` : ''}</g>`;
      }
    });
    g.innerHTML = svg + labels;
    g.querySelectorAll('.area').forEach((el) => el.addEventListener('click', () => {
      const src = this._areaSource(c.areas[Number(el.dataset.i)]);
      if (!src || src.id === this._sourceId || c.sources.length < 2) return;
      this._sourceId = src.id;
      this._save('source', this._sourceId);
      this._markButtons();
      this._switchSource();
    }));
    void k;
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
      s += `<g class="module"><title>${esc(m.name || t('array'))}: ${t('azimuth')} ${Math.round(az)}° (${dir16(az)})${esc(tilt)}${esc(kwp)}</title>
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
    if (!this._showPaths || !c.sun_paths.length) { g.innerHTML = ''; this._pathsDay = null; return; }
    const R = this._R();
    const rEl = (e) => (1 - Math.max(0, e) / 90) * R;
    const now = new Date();
    const dates = { today: now, summer: new Date(now.getFullYear(), 5, 21), winter: new Date(now.getFullYear(), 11, 21) };
    const fmtT = (ts) => new Date(ts).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
    const P = (pt) => this._xy(pt.azimuth, rEl(pt.elevation)).map((v) => v.toFixed(1)).join(',');
    let svg = '';
    // Reihenfolge: Sommer, Winter unten, Heute oben
    ['summer', 'winter', 'today'].filter((k) => c.sun_paths.includes(k)).forEach((k) => {
      const def = SUN_PATHS[k];
      const day = this._sunDay(dates[k]);
      const up = day.pts.filter((p) => p.elevation >= 0);
      if (!up.length && !day.rise) return;
      const line = [day.rise, ...up, day.set].filter(Boolean);
      const title = (k === 'today' ? t('path_today') : t('path_on', { d: def.label }))
        + (day.rise ? `\n${t('sunrise')} ${fmtT(day.rise.t)} (${dir16(day.rise.azimuth)} ${Math.round(day.rise.azimuth)}°)` : '')
        + (day.set ? `\n${t('sunset')} ${fmtT(day.set.t)} (${dir16(day.set.azimuth)} ${Math.round(day.set.azimuth)}°)` : '')
        + `\n${t('noon', { e: Math.round(day.top.elevation), t: fmtT(day.top.t) })}`
        + `\n${t('dist_note')}`;
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
    POWER_UNIT = this._config.power_unit || 'auto';
    const c = this._config;
    const R = this._R();
    const stops = this._src().color_stops;
    const agg = this._aggregate();
    const metric = this._metric;
    const { n, width } = agg;
    const isClock = metric === 'clock';
    this._renderAreaSummary();
    ['g.static', 'g.modules', 'g.paths', 'g.areas', '.bgwrap'].forEach((sel) => {
      const el = this.shadowRoot.querySelector(sel);
      if (el) el.style.display = isClock ? 'none' : '';
    });

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

    if (metric === 'areas') {
      // nur Hausbild mit Flächen: keine Balken, Summenzeile darunter
      this.shadowRoot.querySelector('g.trace').innerHTML = '';
      this._renderAreas();
      this._legendShares(agg, 'time');
      this._renderStats(agg);
      this._renderError(agg);
      return;
    }

    if (isClock) {
      this._renderClock(agg, labelSvg, note);
      return;
    }

    if (metric === 'power') {
      // Leistungsverlauf: Winkel = Sonnenazimut, Abstand = Leistung
      const max = this._src().max_power || c.max_power;
      const rP = (v) => Math.max(0, Math.min(1, v / max)) * R;
      const line = 'rgba(46,160,120,.55)';
      let svg = '';
      [0.25, 0.5, 0.75, 1].forEach((fr) => {
        if (fr < 1) svg += `<circle r="${(fr * R).toFixed(1)}" fill="none" stroke="${line}" stroke-width=".6"/>`;
        const [x, y] = this._xy(135, fr * R);
        svg += labelSvg(x, y, fmtP(fr * max, POWER_UNIT, '', fr * max >= 1000 && POWER_UNIT !== 'W' ? 1 : 0));
      });
      const vis = this._series.filter((p) => p.elevation > -1 && p.v >= 1);
      const pos = vis.map((p) => this._xy(p.azimuth, rP(p.v)));
      const maxGap = (r.step || 300) * 1500;
      const fmtT = (ts) => new Date(ts).toLocaleString(LOCALE, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      const style = c.power_style || 'both';
      let lines = '';
      let dots = '';
      const tipOf = (p) => `<title>${fmtT(p.t)} – ${fmtPower(p.v)} · ${dir16(p.azimuth)} ${Math.round(p.azimuth)}° · ${t('sun_elevation')} ${Math.round(p.elevation)}°</title>`;
      const joined = (i) => !r.stats && i > 0 && vis[i].t - vis[i - 1].t <= maxGap;
      if (style === 'bars') {
        // Balken je Richtung mit der Höchstleistung
        const n = c.sectors;
        const width = 360 / n;
        const best = new Array(n).fill(null);
        vis.forEach((p) => {
          const sec = Math.floor(((p.azimuth + width / 2) % 360) / width) % n;
          if (!best[sec] || p.v > best[sec].v) best[sec] = p;
        });
        const gap = Math.min(1.2, width * 0.12);
        const bestMax = Math.max(0, ...best.filter(Boolean).map((p) => p.v));
        best.forEach((p, sec) => {
          if (!p) return;
          const center = sec * width;
          if (this._showLabels && p.v >= bestMax * (Math.max(0, Number(c.sector_labels_min) || 0) / 100)) {
            dots += this._tipLabel(center, rP(p.v), fmtPower(p.v).replace(' ', ''));
          }
          lines += `<path class="wedge" d="${arcPath(center - width / 2 + gap / 2, center + width / 2 - gap / 2, 0, rP(p.v))}"
            fill="${stops[this._bin(p.v)].color}" opacity="${c.sector_opacity}">
            <title>${t('direction', { deg: Math.round(center), dir: dir16(center) })}: max. ${fmtPower(p.v)} (${fmtT(p.t)})</title></path>`;
        });
      } else if (style === 'area') {
        // Fläche: je zusammenhängendem Abschnitt eine Fläche von der Mitte aus
        if (r.stats) {
          // lange Zeiträume: Hülle aus Durchschnitt (Fläche) und Maximum (Linie) je Richtung
          const n = c.sectors;
          const width = 360 / n;
          const acc = Array.from({ length: n }, () => ({ sum: 0, cnt: 0, max: 0 }));
          vis.forEach((p) => {
            const sec = Math.floor(((p.azimuth + width / 2) % 360) / width) % n;
            acc[sec].sum += p.v; acc[sec].cnt += 1; acc[sec].max = Math.max(acc[sec].max, p.v);
          });
          const used = acc.map((x, i) => ({ ...x, i })).filter((x) => x.cnt);
          if (used.length > 1) {
            const pt = (i, v) => this._xy(i * width, rP(v)).map((q) => q.toFixed(1)).join(',');
            const avgPeak = Math.max(...used.map((x) => x.sum / x.cnt));
            lines += `<path d="M0,0 ${used.map((x) => `L${pt(x.i, x.sum / x.cnt)}`).join(' ')} Z" fill="${stops[this._bin(avgPeak)].color}" fill-opacity=".45"
              stroke="${stops[this._bin(avgPeak)].color}" stroke-width="1.5"/>`;
            lines += `<polyline points="${used.map((x) => pt(x.i, x.max)).join(' ')}" fill="none" stroke="var(--primary-text-color, #333)"
              stroke-width="1.2" stroke-dasharray="3 2" opacity=".7"/>`;
            used.forEach((x) => {
              const [cx, cy] = this._xy(x.i * width, rP(x.sum / x.cnt));
              dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="1.6" fill="${stops[this._bin(x.sum / x.cnt)].color}" stroke="#fff" stroke-width=".5">
                <title>${t('direction', { deg: Math.round(x.i * width), dir: dir16(x.i * width) })}: Ø ${fmtPower(x.sum / x.cnt)} · max. ${fmtPower(x.max)}</title></circle>`;
            });
          }
        }
        let seg = [];
        const flush = () => {
          if (seg.length > 1) {
            const peak = seg.reduce((m, i) => (vis[i].v > vis[m].v ? i : m), seg[0]);
            const col = stops[this._bin(vis[peak].v)].color;
            const d = `M0,0 ${seg.map((i) => `L${pos[i][0].toFixed(1)},${pos[i][1].toFixed(1)}`).join(' ')} Z`;
            lines += `<path d="${d}" fill="${col}" fill-opacity="${r.stats ? 0.08 : 0.35}" stroke="none"/>`;
            seg.slice(1).forEach((i) => {
              const [px, py] = pos[i - 1];
              const [x, y] = pos[i];
              lines += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${stops[this._bin(vis[i].v)].color}" stroke-width="1.8" stroke-linecap="round"/>`;
            });
          }
          seg = [];
        };
        if (!r.stats) vis.forEach((p, i) => {
          const newDay = i > 0 && new Date(p.t).toDateString() !== new Date(vis[i - 1].t).toDateString();
          if (i > 0 && (newDay || p.t - vis[i - 1].t > Math.max(maxGap, 3 * 3600e3))) flush();
          seg.push(i);
        });
        flush();
      } else {
        vis.forEach((p, i) => {
          const [x, y] = pos[i];
          const col = stops[this._bin(p.v)].color;
          if (style !== 'dots' && joined(i)) {
            const [px, py] = pos[i - 1];
            lines += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="${style === 'line' ? 3 : 2.6}" stroke-linecap="round" opacity=".9">${style === 'line' ? tipOf(p) : ''}</line>`;
          }
          const showDot = style === 'dots' || style === 'both' || (style === 'line' && (r.stats || !joined(i)));
          if (showDot) {
            dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${style === 'dots' ? (r.stats ? 2.4 : 2.2) : r.stats ? 2.4 : 1.7}" fill="${col}" stroke="rgba(0,0,0,.35)" stroke-width=".4" opacity="${r.stats ? 0.8 : 1}">${tipOf(p)}</circle>`;
          }
        });
      }
      this.shadowRoot.querySelector('g.trace').innerHTML = svg + lines + dots;
      if (note) note.textContent = vis.length ? t('note_power') : '';
      this._legendShares(agg, 'time');
      this._renderStats(agg);
      this._renderError(agg);
      return;
    }

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
                   <title>${t('direction', { deg: Math.round(center), dir: dir16(center) })}, ${t('elev_range', { a: fmtNum(e0, 1), b: fmtNum(e1, 1) })}
Ø ${fmtPower(avg)} · ${t('h_sun', { h: fmtNum(cell.hours, cell.hours < 10 ? 1 : 0) })}</title></path>`;
      });
      this.shadowRoot.querySelector('g.trace').innerHTML = svg;
      if (note) note.textContent = agg.totalTime ? t('note_shading') : '';
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
      tip = (sec, part) => t('avg_tip', { p: fmtPower(part.value), pct: fmtPct((agg.cnt[sec] / Math.max(1, agg.totalTime)) * 100) });
    } else if (metric === 'energy' && c.energy_display !== 'percent') {
      // absolute kWh je Richtung; mit Energiezähler auf den gemessenen Ertrag skaliert
      unit = 'Wh';
      const measured = this._measured(this._src(), r.months);
      const scale = measured !== null && agg.totalEnergy > 0 ? measured / agg.totalEnergy : 1;
      stacks = agg.energy.map((row) => row.map((v, bin) => ({ bin, value: v * scale })).filter((x) => x.value > 0));
      tip = (sec, part) => `${this._binLabel(part.bin)}: ${fmtEnergy(part.value)}`;
      this._energyScale = scale;
    } else {
      unit = '%';
      const mat = metric === 'energy' ? agg.energy : agg.time;
      const tot = metric === 'energy' ? agg.totalEnergySun : agg.totalTime;
      stacks = mat.map((row) => row.map((v, bin) => ({ bin, value: tot ? (v / tot) * 100 : 0 })).filter((x) => x.value > 0));
      tip = (sec, part) => `${this._binLabel(part.bin)}: ${fmtPct(part.value)} % ${metric === 'energy' ? t('of_yield') : t('of_suntime')}`;
    }
    const sectorTotals = stacks.map((st) => st.reduce((a, b) => a + b.value, 0));
    // Vergleich Sommer/Winter: andere Jahreszeit als Umriss
    let compareTotals = null;
    if (this._compare && this._compare.length) {
      const ca = this._aggregate(this._compare);
      if (metric === 'avg_power') compareTotals = ca.cnt.map((k, i) => (k ? ca.sumV[i] / k : 0));
      else if (unit === 'Wh') compareTotals = ca.energy.map((row) => row.reduce((x, y) => x + y, 0) * (this._energyScale || 1));
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
      const lbl = unit === '%' ? `${fmtNum(val, 1)}%` : unit === 'Wh' ? fmtEnergy(val).replace(' ', '') : fmtPower(val).replace(' ', '');
      ringSvg += labelSvg(x, y, lbl);
    }

    const gap = Math.min(1.2, width * 0.12);
    let wedges = '';
    stacks.forEach((parts, sec) => {
      const center = sec * width;
      const a0 = center - width / 2 + gap / 2;
      const a1 = center + width / 2 - gap / 2;
      const head = t('direction', { deg: Math.round(center), dir: dir16(center) })
        + (unit === '%' ? `: ${fmtPct(sectorTotals[sec])} % ${metric === 'energy' ? t('of_yield') : t('of_suntime')}` : unit === 'Wh' ? `: ${fmtEnergy(sectorTotals[sec])}` : '');
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
                      <title>${other.label} (${other.desc}), ${t('direction', { deg: Math.round(center), dir: dir16(center) })}: ${unit === '%' ? `${fmtPct(v)} %` : unit === 'Wh' ? fmtEnergy(v) : fmtPower(v)}</title></path>`;
      });
      if (note) note.textContent = t('note_compare', { a: r.label, ad: r.desc, b: other.label, bd: other.desc });
    }
    let labels = '';
    if (this._showLabels) {
      const minV = maxVal * (Math.max(0, Number(c.sector_labels_min) || 0) / 100);
      sectorTotals.forEach((v, sec) => {
        if (!(v > 0) || v < minV) return;
        const txt = unit === '%' ? `${fmtPct(v)}%` : unit === 'Wh' ? fmtEnergy(v).replace(' ', '') : fmtPower(v).replace(' ', '');
        labels += this._tipLabel(sec * width, rOf(v), txt);
      });
    }
    this.shadowRoot.querySelector('g.trace').innerHTML = ringSvg + wedges + outline + labels;

    this._legendShares(agg, metric);
    this._renderStats(agg);
    this._renderError(agg);
  }

  /** Uhr-Heatmap: Winkel = Uhrzeit, Ring = Tag bzw. Woche, Farbe = Ø Leistung */
  _renderClock(agg, labelSvg, note) {
    const c = this._config;
    const R = this._R();
    const stops = this._src().color_stops;
    const r = RANGES[this._range];
    const r0 = 26;
    const series = this._series;
    const end = Date.now();
    const start = end - r.hours * 3600e3;
    // Tage ab Mitternacht des ersten Tages
    const first = new Date(start);
    first.setHours(0, 0, 0, 0);
    const dayIdx = new Map();
    const dayStarts = [];
    for (const d = new Date(first); d.getTime() <= end; d.setDate(d.getDate() + 1)) {
      dayIdx.set(d.toDateString(), dayStarts.length);
      dayStarts.push(new Date(d));
    }
    const weekly = dayStarts.length > 62;
    const rings = weekly ? Math.ceil(dayStarts.length / 7) : dayStarts.length;
    const slotMin = r.stats ? 60 : 15;
    const slots = 1440 / slotMin;
    const cells = new Map();
    series.forEach((p) => {
      const d = new Date(p.t);
      const di = dayIdx.get(d.toDateString());
      if (di === undefined) return;
      const ring = weekly ? Math.floor(di / 7) : di;
      const slot = Math.floor((d.getHours() * 60 + d.getMinutes()) / slotMin);
      const key = ring * slots + slot;
      const cell = cells.get(key) || { ring, slot, sum: 0, cnt: 0 };
      cell.sum += p.v;
      cell.cnt += 1;
      cells.set(key, cell);
    });
    const rr = (i) => r0 + ((R - r0) * i) / Math.max(1, rings);
    const xyM = (m, rad) => this._xy((m / 1440) * 360, rad);
    const f = (v) => v.toFixed(2);
    let svg = `<circle r="${((R + r0) / 2).toFixed(1)}" fill="none" stroke="var(--secondary-background-color, rgba(127,127,127,.12))" stroke-width="${(R - r0).toFixed(1)}"/>`;
    const gapR = rings > 40 ? 0 : 0.5;
    const fmtD = (dt) => dt.toLocaleDateString(LOCALE, { weekday: 'short', day: '2-digit', month: '2-digit' });
    cells.forEach((cell) => {
      const avg = cell.sum / cell.cnt;
      if (!(avg >= 1)) return;
      const m0 = cell.slot * slotMin;
      const m1 = m0 + slotMin;
      const ri = rr(cell.ring);
      const ro = rr(cell.ring + 1) - gapR;
      const [x1, y1] = xyM(m0, ro);
      const [x2, y2] = xyM(m1, ro);
      const [x3, y3] = xyM(m1, ri);
      const [x4, y4] = xyM(m0, ri);
      const ds = dayStarts[weekly ? cell.ring * 7 : cell.ring];
      const when = weekly ? `${t('kw')} ${fmtD(ds)}` : fmtD(ds);
      const hh = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      svg += `<path class="wedge" d="M${f(x4)},${f(y4)} L${f(x1)},${f(y1)} A${f(ro)},${f(ro)} 0 0 1 ${f(x2)},${f(y2)} L${f(x3)},${f(y3)} A${f(ri)},${f(ri)} 0 0 0 ${f(x4)},${f(y4)} Z"
        fill="${stops[this._bin(avg)].color}" opacity="${c.sector_opacity}"><title>${when}, ${hh(m0)}–${hh(m1)}: Ø ${fmtPower(avg)}</title></path>`;
    });
    for (let h = 0; h < 24; h += 3) {
      const [x1, y1] = xyM(h * 60, r0 - 2);
      const [x2, y2] = xyM(h * 60, R + 2);
      svg += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="rgba(46,160,120,.45)" stroke-width=".6"/>`;
      const [lx, ly] = xyM(h * 60, R + 13);
      svg += `<text x="${f(lx)}" y="${f(ly)}" font-size="${h % 6 === 0 ? 10 : 8}" fill="${h % 6 === 0 ? '#f5b400' : 'var(--secondary-text-color, #888)'}"
        text-anchor="middle" dominant-baseline="central">${h}:00</text>`;
    }
    svg += `<circle r="${R}" fill="none" stroke="rgba(46,160,120,.55)" stroke-width="1"/><circle r="${r0}" fill="none" stroke="rgba(46,160,120,.4)" stroke-width=".6"/>`;
    svg += `<text x="0" y="-3" font-size="8" text-anchor="middle" fill="var(--primary-text-color)">${esc(r.label)}</text>
      <text x="0" y="7" font-size="6.5" text-anchor="middle" fill="var(--secondary-text-color)">${rings} × ${weekly ? t('u_week') : t('u_day')}</text>`;
    this.shadowRoot.querySelector('g.trace').innerHTML = svg;
    if (note) note.textContent = t('note_clock', { unit: weekly ? t('u_week') : t('u_day') });
    this._clockGeom = { r0 };
    this._legendShares(agg, 'time');
    this._renderStats(agg);
    this._renderError(agg);
  }

  _totalPower() {
    return this._config.sources.filter((x) => !x.total).reduce((a, x) => a + this._livePower(x), 0);
  }

  _renderAreaSummary() {
    const c = this._config;
    const box = this.shadowRoot.querySelector('.areasum');
    if (!box) return;
    const show = c.areas.length && (c.area_summary === 'always' || (c.area_summary !== 'off' && this._metric === 'areas'));
    if (!show) { box.innerHTML = ''; return; }
    const parts = c.areas.map((a) => {
      const info = this._areaInfo(a);
      if (info.power === null) return '';
      const col = a.color || '#f5a623';
      return `<span class="sum-i"><i style="background:${esc(col)}"></i>${esc(a.name || info.sys?.name || '')} <b>${fmtPower(info.power)}</b></span>`;
    }).filter(Boolean);
    box.innerHTML = `<div class="sum">${parts.join('')}<span class="sum-i tot">Σ ${t('sum_label')} <b>${fmtPower(this._totalPower())}</b></span></div>`;
  }

  /** Beschriftung an der Spitze eines Balkens */
  _tipLabel(center, radius, text) {
    const [x, y] = this._xy(center, radius + 7);
    const img = !!this._config.image;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="6.8" font-weight="600" text-anchor="middle" dominant-baseline="middle"
      fill="${img ? '#fff' : 'var(--primary-text-color, #222)'}" stroke="${img ? 'rgba(0,0,0,.7)' : 'var(--card-background-color, #fff)'}"
      stroke-width="2.2" paint-order="stroke" pointer-events="none">${text}</text>`;
  }

  _legendShares(agg, metric) {
    const legBins = metric === 'energy' ? agg.energyBins : agg.timeBins;
    const legTot = metric === 'energy' ? agg.totalEnergySun : agg.totalTime;
    this.shadowRoot.querySelectorAll('.bar span').forEach((el) => {
      const b = Number(el.dataset.i);
      const v = legTot ? (legBins[b] / legTot) * 100 : 0;
      el.textContent = legBins[b] ? `${Math.round(v)}%` : '';
      el.title = `${this._binLabel(b)}: ${fmtPct(v)} % ${metric === 'energy' ? t('of_yield') : t('of_suntime')}`;
    });
    const head = this.shadowRoot.querySelector('.legend .head .l');
    if (head) head.title = METRICS[metric]?.legend || '';
  }

  _renderError(agg = this._lastAgg) {
    this._lastAgg = agg;
    const err = this.shadowRoot.querySelector('.err');
    if (err && this._imageError) { err.textContent = this._imageError; return; }
    if (err && agg) {
      err.textContent = this._error ? t('err_history', { e: this._error })
        : (this._series.length && !agg.totalTime ? t('err_nosun') : '');
    }
  }

  _binLabel(b) {
    const stops = this._src().color_stops;
    return stops[b + 1] ? `${fmtPower(stops[b].value)}–${fmtPower(stops[b + 1].value)}` : t('from', { v: fmtPower(stops[b].value) });
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
    const period = r.months ? t('last12', { desc: r.desc }) : r.today ? r.label : t('last', { label: r.label });
    const measured = this._measured(src, r.months);
    const total = measured ?? agg.totalEnergy;
    const ok = hasData || measured !== null;
    const spec = src.kwp > 0 && ok ? `${fmtSpec(total / 1000 / src.kwp)} kWh/kWp` : '';
    root.querySelector('.stat[data-s="energy"] .k').textContent = measured !== null ? t('st_yield_measured') : t('st_yield');
    set('energy', ok ? fmtEnergy(total) : '–', ok ? (spec || period) : '');
    root.querySelector('.stat[data-s="energy"]').title = ok
      ? `${fmtEnergy(total)} ${period}${spec ? ` · ${spec}` : ''}\n${measured !== null ? t('measured_by') : t('calculated')}` : '';
    // Vergleich der Anlagen: spezifischer Ertrag
    const yieldEl = root.querySelector('.yield');
    if (yieldEl) {
      const withKwp = this._config.sources.filter((x) => x.kwp > 0);
      if (withKwp.length > 1 && hasData) {
        yieldEl.innerHTML = `${t('spec_yield', { p: esc(r.months ? r.desc : r.label) })}: ${withKwp.map((x) => {
          const e = this._measured(x, r.months) ?? this._energyOf(this._rawSeries(x, r.months).series);
          return `${esc(x.name || x.entities[0])} <b>${fmtSpec(e / 1000 / x.kwp)}</b>`;
        }).join(' · ')} kWh/kWp`;
      } else yieldEl.innerHTML = '';
    }
    if (this._peak && this._peak.v > 0) {
      const d = new Date(this._peak.t);
      const when = r.hours > 24
        ? `${d.toLocaleDateString(LOCALE, LANG === 'de' ? { day: '2-digit', month: '2-digit' } : { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })}`
        : d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
      set('peak', fmtPower(this._peak.v), `${when} · ${dir16(this._peak.azimuth)}`);
    } else set('peak', '–');
    // beste Richtung: Sektor mit dem meisten Ertrag
    const secEnergy = agg.energy.map((row) => row.reduce((a, b) => a + b, 0));
    let best = -1;
    secEnergy.forEach((v, i) => { if (v > 0 && (best < 0 || v > secEnergy[best])) best = i; });
    if (best >= 0 && agg.totalEnergySun > 0) {
      const center = best * agg.width;
      set('best', `${dir16(center)} (${Math.round(center)}°)`, t('pct_of_yield', { pct: fmtPct((secEnergy[best] / agg.totalEnergySun) * 100) }));
    } else set('best', '–');
  }

  /* ---------- Live-Werte ---------- */
  _cornerValue(cfg, sun) {
    if (!cfg) return '';
    if (cfg.type === 'azimuth') return `${Math.round(sun.azimuth)}°`;
    if (cfg.type === 'elevation') return `${Math.round(sun.elevation)}°`;
    const pu = cfg.power_unit && cfg.power_unit !== 'auto' ? cfg.power_unit : this._config.power_unit;
    if (cfg.type === 'source') return fmtP(this._livePower(), pu, '', cfg.decimals);
    if (cfg.type === 'total') return fmtP(this._totalPower(), pu, '', cfg.decimals);
    if (cfg.type === 'utilization') {
      const u = this._utilization();
      return u === null ? '–' : `${fmtNum(u, cfg.decimals ?? (u < 10 ? 1 : 0))} %`;
    }
    if (cfg.type === 'energy_today') {
      const wh = this._todayEnergy();
      if (wh === null) return this._src().energy?.length ? '…' : '–';
      return wh >= 1000 ? `${fmtNum(wh / 1000, wh >= 100000 ? 0 : wh >= 10000 ? 1 : 2)}kWh` : `${fmtNum(wh)}Wh`;
    }
    const st = this._hass.states[cfg.entity];
    if (!st) return '–';
    const n = parseFloat(st.state);
    if (!isFinite(n)) return st.state;
    const unit = cfg.unit ?? st.attributes.unit_of_measurement ?? '';
    const srcUnit = st.attributes.unit_of_measurement;
    if (!cfg.unit && (srcUnit === 'W' || srcUnit === 'kW')) return fmtP(srcUnit === 'kW' ? n * 1000 : n, pu, '', cfg.decimals);
    const dec = cfg.decimals ?? (Math.abs(n) >= 100 || unit === 'W' ? 0 : 1);
    return `${fmtNum(n, dec)}${unit}`;
  }

  _update(force) {
    const c = this._config;
    POWER_UNIT = c.power_unit || 'auto';
    const sun = this._sunNow();
    const src = this._src();
    const power = this._livePower(src);
    const allP = c.show_utilization ? c.sources.map((x) => this._livePower(x)).join(',') : '';
    const cellSig = c.areas.flatMap((a) => [...Object.values(a.cell_sensors || {}), normEnt(a.source)]).map((e) => this._hass.states[e]?.state).join(',');
    const sig = `${cellSig}|${allP}|${this._showPaths}|${this._sourceId}|${sun.azimuth.toFixed(1)}|${sun.elevation.toFixed(1)}|${power}|${src.energy.map((e) => this._hass.states[e]?.state).join(',')}|`
      + Object.values(c.corners).map((x) => (x?.entity ? this._hass.states[x.entity]?.state : '')).join('|');
    if (!force && sig === this._sig) return;
    this._sig = sig;

    this.shadowRoot.querySelectorAll('.corner').forEach((el) => {
      const cfg = c.corners[el.dataset.pos];
      let lbl = cfg?.name;
      if (lbl === undefined || lbl === null) {
        if (cfg?.type === 'source') lbl = c.sources.length > 1 && src.name ? t('power_of', { name: src.name }) : t('pv_power');
        else if (cfg?.type === 'total') lbl = t('total_power');
        else if (cfg?.type === 'utilization') lbl = c.sources.length > 1 && src.name ? t('util_of', { name: src.name }) : t('utilization');
        else if (cfg?.type === 'energy_today') lbl = c.sources.length > 1 && src.name ? t('today_of', { name: src.name }) : t('yield_today');
        else lbl = cfg?.entity ? this._hass.states[cfg.entity]?.attributes.friendly_name : '';
      }
      el.querySelector('.lbl').textContent = lbl ?? '';
      el.querySelector('.val').textContent = this._cornerValue(cfg, sun);
    });

    const R = this._R();
    const up = sun.elevation > 0;
    const col = up ? (c.sun_marker_color || '#f57c00') : '#9e9e9e';
    const a = sun.azimuth;
    const atElev = c.sun_marker_position === 'elevation';
    const rr = atElev ? (1 - Math.max(0, sun.elevation) / 90) * R : R;
    const tip = `<title>${t(atElev ? 'sun_now' : 'sun_tip', { a: a.toFixed(0), e: sun.elevation.toFixed(0) })}</title>`;
    const f = (v) => v.toFixed(1);
    let sunSvg = '';
    const style = this._metric === 'clock' ? 'clock' : (c.sun_marker || 'arrow');
    if (style === 'clock') {
      const nowD = new Date();
      const m = nowD.getHours() * 60 + nowD.getMinutes();
      const [x1, y1] = this._xy((m / 1440) * 360, 24);
      const [x2, y2] = this._xy((m / 1440) * 360, R + 5);
      sunSvg = `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c.sun_marker_color || '#f57c00'}" stroke-width="1.8" stroke-linecap="round">
        <title>${t('now_line', { t: nowD.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' }) })}</title></line>`;
    }
    if (style === 'arrow') {
      const r0 = atElev ? rr : R + 3;
      const [tx, ty] = this._xy(a, r0);
      const [l1x, l1y] = this._xy(a - (atElev ? 4 * R / Math.max(rr + 10, 20) : 4), r0 + 10);
      const [l2x, l2y] = this._xy(a + (atElev ? 4 * R / Math.max(rr + 10, 20) : 4), r0 + 10);
      sunSvg = `<polygon points="${f(tx)},${f(ty)} ${f(l1x)},${f(l1y)} ${f(l2x)},${f(l2y)}" fill="${col}" stroke="#fff" stroke-width="${atElev ? 0.8 : 0}">${tip}</polygon>`;
    } else if (style !== 'none') {
      const [x, y] = this._xy(a, atElev ? rr : R + 8);
      const glow = up ? 'filter="drop-shadow(0 0 3px rgba(255,170,0,.85))"' : '';
      if (style === 'circle') {
        sunSvg = `<circle cx="${f(x)}" cy="${f(y)}" r="5.5" fill="${col}" stroke="#fff" stroke-width="1.5" ${glow}>${tip}</circle>`;
      } else if (style === 'dot') {
        sunSvg = `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="${col}" stroke="#fff" stroke-width="1">${tip}</circle>`;
      } else if (style === 'sun') {
        let rays = '';
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          rays += `<line x1="${f(x + Math.cos(ang) * 6.5)}" y1="${f(y + Math.sin(ang) * 6.5)}" x2="${f(x + Math.cos(ang) * 10)}" y2="${f(y + Math.sin(ang) * 10)}"
                     stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`;
        }
        sunSvg = `<g ${glow}>${tip}${rays}<circle cx="${f(x)}" cy="${f(y)}" r="4.6" fill="${col}" stroke="#fff" stroke-width="1"/></g>`;
      }
    }
    if (style !== 'clock' && this._metric === 'power' && up && power > 0) {
      const max = src.max_power || c.max_power;
      const [px, py] = this._xy(a, Math.min(1, power / max) * R);
      sunSvg += `<circle cx="${f(px)}" cy="${f(py)}" r="5.5" fill="${src.color_stops[this._bin(power)].color}" stroke="#fff" stroke-width="2"
        filter="drop-shadow(0 0 2px rgba(0,0,0,.5))"><title>${t('power_now', { p: fmtPower(power) })}</title></circle>`;
    }
    if (style !== 'clock' && this._showPaths && up && !atElev) {
      const [sx, sy] = this._xy(a, (1 - sun.elevation / 90) * R);
      sunSvg += `<circle cx="${f(sx)}" cy="${f(sy)}" r="5" fill="#ffc107" stroke="#fff" stroke-width="1.5"
        filter="drop-shadow(0 0 3px rgba(255,170,0,.9))"><title>${t('sun_now', { a: a.toFixed(0), e: sun.elevation.toFixed(0) })}</title></circle>`;
    }
    this.shadowRoot.querySelector('g.sun').innerHTML = sunSvg;
    if (this._pathsDay && this._pathsDay !== new Date().toDateString()) this._renderSunPaths();

    const nowBin = this._bin(power);
    this.shadowRoot.querySelectorAll('.bar span').forEach((el) => el.classList.toggle('now', Number(el.dataset.i) === nowBin));
    this._renderUtil();
    this._renderAreas();
    this._renderAreaSummary();
  }

  _renderUtil() {
    const c = this._config;
    const el = this.shadowRoot.querySelector('.util');
    if (!el) return;
    el.innerHTML = c.sources.map((x) => {
      const b = this._utilBase(x);
      const p = this._livePower(x);
      const u = b > 0 ? (p / b) * 100 : 0;
      const name = c.sources.length > 1 ? (x.name || x.entities[0]) : t('utilization');
      const col = x.color_stops[this._bin.call({ _src: () => x }, p)]?.color || 'var(--primary-color)';
      return `<div class="u${x.id === this._sourceId && c.sources.length > 1 ? ' active' : ''}" data-src="${esc(x.id)}"
        title="${esc(t('util_tip', { p: fmtP(p), b: fmtP(b), pct: fmtNum(u, 1) }))}">
        <i style="width:${Math.min(100, Math.max(0, u)).toFixed(1)}%;background:${col}"></i>
        <span>${c.sources.length > 1 ? `${esc(name)} ` : `${esc(name)} `}<b>${fmtNum(u, u < 10 ? 1 : 0)} %</b></span></div>`;
    }).join('');
    el.querySelectorAll('.u').forEach((u) => u.addEventListener('click', () => {
      if (c.sources.length < 2) return;
      this._sourceId = u.dataset.src;
      this._save('source', this._sourceId);
      this._markButtons();
      this._switchSource();
    }));
  }
}

/* =====================================================================
 * Grafischer Editor – alle Optionen ohne YAML einstellbar
 * ===================================================================== */
const L = (de, en) => (LANG === 'de' ? de : en);
let CORNER_POS; let RANGE_OPTIONS; let LABELS; let HELPERS; let SECTIONS; let CORNER_SCHEMA; let CORNER_ENTITY_SCHEMA;
let SOURCE_SCHEMA; let MODULE_SCHEMA; let STOP_SCHEMA; let TOTAL_SCHEMA;

const LABELS_EN = {
  language: 'Language',
  source: 'Power sensor of this area (W or kW)', system: 'Belongs to system', g_rot: 'Grid rotation', g_w: 'Panel width', g_h: 'Panel height', g_x: 'Move grid ↔', g_y: 'Move grid ↕', cell_entity: 'Sensor for the next panel', area_labels: 'Labels on the areas', area_toggle: '▦ button on the card to show/hide the areas', area_summary: 'Summary row (power per area + total)',
  power_unit: 'Power unit (W/kW)', show_utilization: 'Utilization row (% per system)', utilization_base: 'Utilization based on',
  sun_marker: 'Sun marker', sun_marker_position: 'Sun marker position', sun_marker_color: 'Sun marker color',
  energy_display: '“Yield” view shows', power_style: '“Power” view shows', sector_labels: 'Values at the bars', label_toggle: '% button on the card to show/hide values', sector_labels_min: 'Label bars from (% of largest)',
  title: 'Title (empty = no title)', power_entity: 'PV power sensor', max_power: 'Max. power', legend_label: 'Color scale label',
  metric: 'Default view', default_range: 'Default period', ranges: 'Visible period buttons', sectors: 'Number of direction sectors',
  sector_opacity: 'Sector opacity', show_metric_switch: 'View switch Time / Yield / Avg power', show_stats: 'Key figures', show_legend: 'Color scale',
  image: 'Image path (optional, e.g. /local/helios/house.png)', image_scale: 'Image size', image_rotation: 'Rotation (image north up)',
  image_offset_x: 'Move left ↔ right', image_offset_y: 'Move down ↕ up', image_opacity: 'Image opacity', image_clip: 'Crop image to the compass circle',
  mode: 'Show', entity: 'Entity', name: 'Name', unit: 'Unit (optional, overrides the entity unit)', decimals: 'Decimals (optional)',
  show_total: 'Show “Total” (sum of all systems)', total_name: 'Label for the sum', total_max_power: 'Max. power “Total” (empty = automatic)',
  default_source: 'Default system', value: 'From power', color: 'Color', azimuth: 'Azimuth (90 = east, 180 = south, 270 = west)', tilt: 'Tilt',
  kwp: 'System size in kWp', energy_entity: 'Energy meter (kWh) – optional', sun_entity: 'Sun entity', stats_type: '7 days and longer: hourly value',
  refresh_interval: 'Reload history every', latitude: 'Latitude (empty = HA location)', longitude: 'Longitude (empty = HA location)',
  unit_factor: 'Conversion factor to W (empty = automatic)', show_sun_paths: 'Draw sun paths', sun_path_toggle: '☀ button on the card to show/hide sun paths',
  metrics: 'Visible views (switch)', sun_paths: 'Which sun paths', elevation_bands: 'Shading view: number of elevation rings',
  season_overlay: 'Summer/Winter: other season dashed for comparison',
};
const HELPERS_EN = {
  image_rotation: 'Positive = clockwise. Tip: in Google Maps north is up – that is how your house should be aligned.',
  image_offset_x: 'In % of the compass radius, so the house sits exactly in the center.',
  image_offset_y: 'In % of the compass radius, so the house sits exactly in the center.',
  sectors: '36 = 10° sectors, 16 = one per compass direction',
  elevation_bands: '9 = rings of 10° sun elevation. For the shading view, “1 year” works best.',
  energy_entity: 'Energy sensor in kWh/Wh, e.g. total or daily yield of the inverter. Yield, kWh/kWp and “Yield today” are then measured instead of calculated.',
  kwp: 'In kilowatt peak: 750 Wp = 0.75 kWp. Empty = sum of kWp from the arrays.',
  max_power: 'Upper limit of the power classes, e.g. 800 W for a balcony system.',
  metrics: 'Deselected views disappear from the switch, e.g. “Shading”.',
  show_sun_paths: 'Today (with times, sunrise and sunset) plus Jun 21 and Dec 21. Distance from center = sun elevation.',
  unit_factor: 'Only needed if the sensor reports neither W nor kW (e.g. 1000 for kW).',
  language: 'Automatic = language of your Home Assistant user.',
  utilization_base: 'Current power relative to kWp (falls back to max. power if no kWp is set) or to max. power.',
  sun_marker_position: '“At sun elevation” places the marker like on the sun paths: edge = horizon, center = zenith.',
};

function rebuildSchemas() {
CORNER_POS = LANG === 'de'
    ? { top_left: 'Oben links', top_right: 'Oben rechts', bottom_left: 'Unten links', bottom_right: 'Unten rechts' }
    : { top_left: 'Top left', top_right: 'Top right', bottom_left: 'Bottom left', bottom_right: 'Bottom right' };
RANGE_OPTIONS = Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label }));
const num = (min, max, step, unit, mode = 'box') => ({ number: { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) } });
const COLOR = { text: { type: 'color' } };

LABELS = {
  language: 'Sprache',
  source: 'Leistungssensor dieser Fläche (W oder kW)', system: 'Gehört zu Anlage', g_rot: 'Raster-Drehung', g_w: 'Modul-Breite', g_h: 'Modul-Höhe', g_x: 'Raster verschieben ↔', g_y: 'Raster verschieben ↕', cell_entity: 'Sensor für das nächste Modul', area_labels: 'Beschriftung auf den Flächen', area_toggle: '▦-Knopf in der Karte zum Ein-/Ausblenden der Flächen', area_summary: 'Summenzeile (Leistung je Fläche + Gesamt)',
  power_unit: 'Leistungseinheit (W/kW)', show_utilization: 'Auslastungszeile (% je Anlage)', utilization_base: 'Auslastung bezogen auf',
  sun_marker: 'Sonnenmarker', sun_marker_position: 'Position des Sonnenmarkers', sun_marker_color: 'Farbe des Sonnenmarkers',
  energy_display: 'Ansicht „Ertrag“ zeigt', power_style: 'Ansicht „Leistung“ zeigt', sector_labels: 'Werte an den Balken', label_toggle: '%-Knopf in der Karte zum Ein-/Ausblenden der Werte', sector_labels_min: 'Beschriften ab (% des größten Balkens)',
  title: 'Titel (leer = kein Titel)',
  power_entity: 'PV-Leistungssensor',
  max_power: 'Max. Leistung',
  legend_label: 'Text Farbskala',
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
  kwp: 'Anlagenleistung in kWp',
  energy_entity: 'Ertragszähler (kWh) – optional',
  show_sun_paths: 'Sonnenbahnen einzeichnen',
  sun_path_toggle: '☀-Knopf in der Karte zum Ein-/Ausblenden der Sonnenbahnen',
  metrics: 'Angezeigte Ansichten (Umschalter)',
  sun_paths: 'Welche Sonnenbahnen',
  elevation_bands: 'Schatten-Ansicht: Anzahl Höhenringe',
  season_overlay: 'Sommer/Winter: andere Jahreszeit gestrichelt zum Vergleich',
  ...CORNER_POS,
};

HELPERS = {
  image_rotation: 'Positiv = im Uhrzeigersinn. Tipp: In Google Maps ist Norden oben – so soll dein Haus liegen.',
  image_offset_x: 'In % des Kompassradius, damit das Haus genau in der Mitte sitzt.',
  image_offset_y: 'In % des Kompassradius, damit das Haus genau in der Mitte sitzt.',
  sectors: '36 = 10° breite Sektoren, 16 = eine pro Kompassrichtung',
  elevation_bands: '9 = Ringe à 10° Sonnenhöhe. Für die Schatten-Ansicht am besten „1 Jahr“ wählen.',
  energy_entity: 'Energiesensor in kWh/Wh, z. B. Gesamt- oder Tagesertrag des Wechselrichters. Dann sind Ertrag, kWh/kWp und „Ertrag heute“ exakt gemessen statt berechnet.',
  kwp: 'In Kilowatt-Peak: 750 Wp = 0,75 kWp. Leer = Summe der kWp aus den Modulfeldern.',
  max_power: 'Obergrenze der Leistungsklassen, z. B. 800 W für ein BKW.',
  metrics: 'Abgewählte Ansichten verschwinden aus dem Umschalter, z. B. „Schatten“.',
  show_sun_paths: 'Heute (mit Uhrzeiten, Auf- und Untergang) sowie 21.6. und 21.12. Abstand zur Mitte = Sonnenhöhe.',
  unit_factor: 'Nur nötig, wenn der Sensor weder W noch kW meldet (z. B. 1000 für kW).',
};

SECTIONS = [
  { key: 'general', title: L('Allgemein', 'General'), icon: '⚙️', open: true, schema: [
    { name: 'title', selector: { text: {} } },
    { name: 'power_entity', selector: { entity: { domain: 'sensor' } } },
    { type: 'grid', name: '', schema: [
      { name: 'max_power', selector: num(50, 200000, 50, 'W') },
      { name: 'legend_label', selector: { text: {} } },
    ] },
    { name: 'kwp', selector: num(0.01, 10000, 0.01, 'kWp') },
    { name: 'energy_entity', selector: { entity: { domain: 'sensor', device_class: 'energy' } } },
  ] },
  { key: 'display', title: L('Darstellung', 'Display'), icon: '🧭', schema: [
    { type: 'grid', name: '', schema: [
      { name: 'metric', selector: { select: { mode: 'dropdown', options: [
        { value: 'power', label: L('Leistung (Verlauf als Punkte)', 'Power (history as dots)') },
        { value: 'time', label: L('Zeitanteil', 'Share of time') }, { value: 'energy', label: L('Ertrag', 'Yield') }, { value: 'avg_power', label: L('Ø Leistung', 'Avg power') },
        { value: 'shading', label: L('Schatten (Richtung × Sonnenhöhe)', 'Shading (direction × sun elevation)') },
        { value: 'clock', label: L('Uhr (Uhrzeit × Tag)', 'Clock (time of day × day)') },
        { value: 'areas', label: L('Flächen (nur Stränge im Bild)', 'Areas (strings in the image only)') }] } } },
      { name: 'default_range', selector: { select: { mode: 'dropdown', options: RANGE_OPTIONS } } },
    ] },
    { name: 'metrics', selector: { select: { multiple: true, mode: 'list', options: [
      { value: 'power', label: L('Leistung', 'Power') },
      { value: 'time', label: L('Zeit', 'Time') }, { value: 'energy', label: L('Ertrag', 'Yield') }, { value: 'avg_power', label: L('Ø Leistung', 'Avg power') },
      { value: 'shading', label: L('Schatten (Verschattungskarte)', 'Shading (shading map)') },
      { value: 'clock', label: L('Uhr (Heatmap nach Uhrzeit)', 'Clock (heatmap by time of day)') },
      { value: 'areas', label: L('Flächen (nur Stränge im Bild, ohne Balken)', 'Areas (strings in the image only, no bars)') }] } } },
    { name: 'ranges', selector: { select: { multiple: true, mode: 'list', options: RANGE_OPTIONS } } },
    { name: 'power_style', selector: { select: { mode: 'dropdown', options: [
      { value: 'both', label: L('Linie mit Punkten', 'Line with dots') }, { value: 'line', label: L('Nur Linie', 'Line only') },
      { value: 'dots', label: L('Nur Punkte', 'Dots only') }, { value: 'area', label: L('Fläche', 'Area') },
      { value: 'bars', label: L('Balken (Höchstleistung je Richtung)', 'Bars (peak power per direction)') }] } } },
    { type: 'grid', name: '', schema: [
      { name: 'sector_labels', selector: { boolean: {} } },
      { name: 'label_toggle', selector: { boolean: {} } },
      { name: 'sector_labels_min', selector: num(0, 100, 5, '%', 'slider') },
    ] },
    { name: 'energy_display', selector: { select: { mode: 'dropdown', options: [
      { value: 'absolute', label: L('kWh je Richtung', 'kWh per direction') }, { value: 'percent', label: L('Anteil in %', 'Share in %') }] } } },
    { type: 'grid', name: '', schema: [
      { name: 'power_unit', selector: { select: { mode: 'dropdown', options: [
        { value: 'auto', label: L('Automatisch (W/kW)', 'Automatic (W/kW)') }, { value: 'W', label: 'W' }, { value: 'kW', label: 'kW' }] } } },
      { name: 'utilization_base', selector: { select: { mode: 'dropdown', options: [
        { value: 'kwp', label: 'kWp' }, { value: 'max_power', label: L('Max. Leistung', 'Max. power') }] } } },
    ] },
    { name: 'show_utilization', selector: { boolean: {} } },
    { type: 'grid', name: '', schema: [
      { name: 'sun_marker', selector: { select: { mode: 'dropdown', options: [
        { value: 'arrow', label: L('Pfeil', 'Arrow') }, { value: 'circle', label: L('Kreis', 'Circle') }, { value: 'sun', label: L('Sonnensymbol ☀', 'Sun symbol ☀') },
        { value: 'dot', label: L('Punkt', 'Dot') }, { value: 'none', label: L('Keiner', 'None') }] } } },
      { name: 'sun_marker_position', selector: { select: { mode: 'dropdown', options: [
        { value: 'edge', label: L('Am Rand', 'At the edge') }, { value: 'elevation', label: L('Auf Sonnenhöhe', 'At sun elevation') }] } } },
    ] },
    { name: 'sun_marker_color', selector: COLOR },
    { name: 'season_overlay', selector: { boolean: {} } },
    { name: 'show_sun_paths', selector: { boolean: {} } },
    { name: 'sun_path_toggle', selector: { boolean: {} } },
    { name: 'sun_paths', selector: { select: { multiple: true, mode: 'list', options: [
      { value: 'today', label: L('Heute', 'Today') }, { value: 'summer', label: L('Längster Tag (21.6.)', 'Longest day (Jun 21)') }, { value: 'winter', label: L('Kürzester Tag (21.12.)', 'Shortest day (Dec 21)') }] } } },
    { name: 'sectors', selector: num(8, 72, 4, null, 'slider') },
    { name: 'elevation_bands', selector: num(3, 18, 1, null, 'slider') },
    { name: 'sector_opacity', selector: num(0.2, 1, 0.05, null, 'slider') },
    { name: 'show_metric_switch', selector: { boolean: {} } },
    { name: 'show_stats', selector: { boolean: {} } },
    { name: 'show_legend', selector: { boolean: {} } },
  ] },
  { key: 'image', title: L('Hausbild', 'House image'), icon: '🏠', schema: [
    { name: 'image', selector: { text: {} } },
    { name: 'image_rotation', selector: num(-180, 180, 0.5, '°', 'slider') },
    { name: 'image_offset_x', selector: num(-100, 100, 0.5, '%', 'slider') },
    { name: 'image_offset_y', selector: num(-100, 100, 0.5, '%', 'slider') },
    { name: 'image_scale', selector: num(0.1, 2.5, 0.01, null, 'slider') },
    { name: 'image_opacity', selector: num(0, 1, 0.05, null, 'slider') },
    { name: 'image_clip', selector: { boolean: {} } },
  ] },
  { key: 'areas', title: L('Flächen im Bild (Stränge markieren)', 'Areas in the image (mark strings)'), icon: '🟩', custom: 'areas' },
  { key: 'corners', title: L('Werte in den Ecken', 'Corner values'), icon: '🔲', custom: 'corners' },
  { key: 'sources', title: L('Anlagen (z. B. BKW + Dach)', 'Systems (e.g. balcony + roof)'), icon: '🔆', custom: 'sources' },
  { key: 'modules', title: L('Modulausrichtung (für alle Anlagen)', 'Panel orientation (all systems)'), icon: '📐', custom: 'modules' },
  { key: 'stops', title: L('Leistungsklassen & Farben', 'Power classes & colors'), icon: '🎨', custom: 'stops' },
  { key: 'advanced', title: L('Erweitert', 'Advanced'), icon: '🛠️', schema: [
    { type: 'grid', name: '', schema: [
      { name: 'sun_entity', selector: { entity: { domain: 'sun' } } },
      { name: 'stats_type', selector: { select: { mode: 'dropdown', options: [{ value: 'mean', label: L('Mittelwert', 'Mean') }, { value: 'max', label: L('Maximum', 'Maximum') }] } } },
    ] },
    { name: 'refresh_interval', selector: num(30, 3600, 30, 's') },
    { type: 'grid', name: '', schema: [
      { name: 'latitude', selector: num(-90, 90, 0.0001) },
      { name: 'longitude', selector: num(-180, 180, 0.0001) },
    ] },
    { name: 'unit_factor', selector: num(0.000001, 1000000, 0.000001) },
    { name: 'language', selector: { select: { mode: 'dropdown', options: [
      { value: 'auto', label: L('Automatisch', 'Automatic') }, { value: 'de', label: 'Deutsch' }, { value: 'en', label: 'English' }] } } },
  ] },
];

CORNER_SCHEMA = [
  { name: 'mode', selector: { select: { mode: 'dropdown', options: [
    { value: 'source', label: L('Leistung der gewählten Anlage', 'Power of the selected system') }, { value: 'energy_today', label: L('Ertrag heute der gewählten Anlage', 'Yield today of the selected system') },
    { value: 'total', label: L('Gesamtleistung aller Anlagen', 'Total power of all systems') },
    { value: 'utilization', label: L('Auslastung der gewählten Anlage (%)', 'Utilization of the selected system (%)') },
    { value: 'entity', label: L('Beliebige Entität', 'Any entity') },
    { value: 'azimuth', label: L('Sonnenazimut', 'Sun azimuth') }, { value: 'elevation', label: L('Sonnenhöhe', 'Sun elevation') }, { value: 'none', label: L('Ausblenden', 'Hide') }] } } },
  { name: 'name', selector: { text: {} } },
];
CORNER_ENTITY_SCHEMA = [
  { name: 'entity', selector: { entity: {} } },
  { type: 'grid', name: '', schema: [
    { name: 'unit', selector: { text: {} } },
    { name: 'decimals', selector: num(0, 4, 1) },
  ] },
];
SOURCE_SCHEMA = [
  { type: 'grid', name: '', schema: [
    { name: 'name', selector: { text: {} } },
    { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
  ] },
  { type: 'grid', name: '', schema: [
    { name: 'max_power', selector: num(50, 200000, 50, 'W') },
    { name: 'legend_label', selector: { text: {} } },
  ] },
  { name: 'kwp', selector: num(0.01, 10000, 0.01, 'kWp') },
  { name: 'energy_entity', selector: { entity: { domain: 'sensor', device_class: 'energy' } } },
];
MODULE_SCHEMA = [
  { type: 'grid', name: '', schema: [
    { name: 'name', selector: { text: {} } },
    { name: 'color', selector: COLOR },
  ] },
  { name: 'azimuth', selector: num(0, 359, 1, '°', 'slider') },
  { name: 'tilt', selector: num(0, 90, 1, '°', 'slider') },
  { name: 'kwp', selector: num(0, 1000, 0.01, 'kWp') },
];
STOP_SCHEMA = [
  { type: 'grid', name: '', schema: [
    { name: 'value', selector: num(0, 1000000, 1, 'W') },
    { name: 'color', selector: COLOR },
  ] },
];
TOTAL_SCHEMA = [
  { name: 'show_total', selector: { boolean: {} } },
  { type: 'grid', name: '', schema: [
    { name: 'total_name', selector: { text: {} } },
    { name: 'total_max_power', selector: num(50, 1000000, 50, 'W') },
  ] },
];

  if (LANG !== 'de') {
    LABELS = { ...LABELS, ...LABELS_EN, ...CORNER_POS };
    HELPERS = { ...HELPERS_EN };
  } else {
    HELPERS = {
      ...HELPERS,
      language: 'Automatisch = Sprache deines Home-Assistant-Benutzers.',
      utilization_base: 'Aktuelle Leistung im Verhältnis zu kWp (ohne kWp-Angabe: max. Leistung) oder zur max. Leistung.',
      sun_marker_position: '„Auf Sonnenhöhe“ setzt den Marker wie bei den Sonnenbahnen: Rand = Horizont, Mitte = Zenit.',
    };
  }
}
rebuildSchemas();

const formDefaults = () => ({ ...DEFAULTS, show_total: true });
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
  .hc-editor .painter { position:relative; border-radius:8px; overflow:hidden; background:repeating-conic-gradient(#e8e8e8 0% 25%, #fff 0% 50%) 50% / 16px 16px; touch-action:none; user-select:none; }
  .hc-editor .painter img { display:block; width:100%; height:auto; pointer-events:none; }
  .hc-editor .painter svg { position:absolute; inset:0; width:100%; height:100%; cursor:crosshair; }
  .hc-editor .brushes { display:flex; flex-wrap:wrap; gap:6px; align-items:center; font-size:.85em; }
  .hc-editor .b.on { border-color: var(--primary-color); color: var(--primary-color); background: rgba(3,169,244,.08); }
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
  _form(schema, data, onChange, helpers) {
    const f = document.createElement('ha-form');
    f.computeLabel = (s) => LABELS[s.name] ?? s.title ?? s.name;
    f.computeHelper = (s) => (helpers && s.name in helpers ? helpers[s.name] : HELPERS[s.name]);
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
  _list(parent, { items, schema, title, swatch, newItem, addLabel, onChange, nested, key, helpers }) {
    items.forEach((item, i) => {
      const box = document.createElement('div');
      box.className = 'item';
      const head = document.createElement('div');
      head.className = 'item-head';
      const sw = document.createElement('span');
      if (swatch) { sw.className = 'swatch'; sw.style.background = swatch(item) || 'transparent'; head.append(sw); }
      const tEl = document.createElement('span');
      tEl.className = 't';
      tEl.textContent = title(item, i);
      head.append(tEl,
        this._btn('↑', () => { [items[i - 1], items[i]] = [items[i], items[i - 1]]; onChange(items, true); }, 'icon', i === 0, L('nach oben', 'move up')),
        this._btn('↓', () => { [items[i + 1], items[i]] = [items[i], items[i + 1]]; onChange(items, true); }, 'icon', i === items.length - 1, L('nach unten', 'move down')),
        this._btn('✕', () => { items.splice(i, 1); onChange(items, true); }, 'icon', false, L('entfernen', 'remove')));
      box.append(head, this._form(schema, { ...item }, (v) => {
        const next = { ...items[i] };
        schemaKeys(schema).forEach((k) => this._set(k, v[k], next));
        items[i] = next;
        tEl.textContent = title(next, i);
        if (swatch) sw.style.background = swatch(next) || 'transparent';
        onChange(items, false);
      }, helpers));
      if (nested) nested(box, () => items[i], i, `${key}-${i}`, (changed, structural) => { items[i] = changed; onChange(items, structural); });
      parent.append(box);
    });
    parent.append(this._btn(`+ ${addLabel}`, () => { items.push(newItem()); onChange(items, true); }, 'add'));
  }

  _stopsEditor(parent, stops, maxPower, onChange) {
    if (!stops.length) parent.append(this._hint(L('Automatisch: 9 Farbstufen von 0 bis zur maximalen Leistung. Zum Anpassen „Farben bearbeiten“ wählen.', 'Automatic: 9 color steps from 0 to the maximum power. Choose “Edit colors” to customize.')));
    const row = document.createElement('div');
    row.className = 'row';
    row.append(this._btn(stops.length ? L('↺ Standardfarben neu erzeugen', '↺ Regenerate default colors') : L('🎨 Farben bearbeiten', '🎨 Edit colors'), () => onChange(autoStops(maxPower()), true)));
    if (stops.length) row.append(this._btn(L('Automatisch (zurücksetzen)', 'Automatic (reset)'), () => onChange([], true)));
    parent.append(row);
    if (!stops.length) return;
    this._list(parent, {
      items: stops,
      schema: STOP_SCHEMA,
      title: (s, i) => (stops[i + 1] ? `${fmtPower(s.value ?? 0)} – ${fmtPower(stops[i + 1].value ?? 0)}` : t('from', { v: fmtPower(s.value ?? 0) })),
      swatch: (s) => s.color,
      newItem: () => ({ value: (Number(stops[stops.length - 1]?.value) || 0) + 100, color: '#888888' }),
      addLabel: L('Stufe hinzufügen', 'Add step'),
      onChange,
    });
  }

  _modulesEditor(parent, modules, onChange, key) {
    this._list(parent, {
      key,
      items: modules,
      schema: MODULE_SCHEMA,
      title: (m) => `${m.name || t('array')} · ${dir16(Number(m.azimuth) || 0)} ${Math.round(Number(m.azimuth) || 0)}°${m.tilt !== undefined ? ` · ${m.tilt}° ${L('Neigung', 'tilt')}` : ''}`,
      swatch: (m) => m.color || '#ff9800',
      newItem: () => ({ name: '', azimuth: 180, tilt: 30, color: '#ff9800' }),
      addLabel: L('Modulfeld hinzufügen', 'Add array'),
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
      const puSchema = { name: 'power_unit', selector: { select: { mode: 'dropdown', options: [
        { value: 'auto', label: L('Wie Karte', 'Like card') }, { value: 'W', label: 'W' }, { value: 'kW', label: 'kW' }] } } };
      if (mode === 'entity') {
        box.append(this._form([...CORNER_ENTITY_SCHEMA, puSchema], { entity: cc.entity, unit: cc.unit, decimals: cc.decimals, power_unit: cc.power_unit || 'auto' }, (v) => {
          const next = { ...{ ...defaultCorners(), ...(w.corners || {}) }[pos] };
          ['entity', 'unit', 'decimals'].forEach((k) => this._set(k, v[k], next));
          this._set('power_unit', v.power_unit === 'auto' ? undefined : v.power_unit, next);
          write(next);
        }));
      } else if (mode === 'source') {
        box.append(this._form([puSchema], { power_unit: cc.power_unit || 'auto' }, (v) => {
          const next = { ...{ ...defaultCorners(), ...(w.corners || {}) }[pos] };
          this._set('power_unit', v.power_unit === 'auto' ? undefined : v.power_unit, next);
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
      ? L('Über der Rose erscheint ein Umschalter. Jede Anlage hat eigene Leistungsklassen und Modulfelder.', 'A switch appears above the rose. Each system has its own power classes and arrays.')
      : L('Leer = es wird nur der PV-Leistungssensor aus „Allgemein“ genutzt. Füge Anlagen hinzu, um mehrere Sensoren umschaltbar zu machen.', 'Empty = only the PV power sensor from “General” is used. Add systems to switch between several sensors.')));
    this._list(body, {
      key: 'src',
      items: sources,
      schema: SOURCE_SCHEMA,
      title: (s, i) => `${s.name || `${L('Anlage', 'System')} ${i + 1}`}${s.entity ? ` · ${s.entity}` : ''}`,
      newItem: () => (sources.length || !w.power_entity
        ? { name: '', entity: '' }
        : { name: `${L('Anlage', 'System')} 1`, entity: w.power_entity, ...(w.max_power ? { max_power: w.max_power } : {}) }),
      addLabel: L('Anlage hinzufügen', 'Add system'),
      onChange: (items, structural) => { this._set('sources', clone(items)); this._emit(); if (structural) this._render(); },
      nested: (box, get, i, key, update) => {
        const item = get();
        const sub = document.createElement('div');
        sub.className = 'sub';
        const m = this._details(`${key}-mod`, `${L('Modulfelder dieser Anlage', 'Arrays of this system')} (${(item.modules || []).length})`, '📐');
        this._modulesEditor(m.body, clone(item.modules) || [], (mods, st) => {
          const next = { ...get() };
          this._set('modules', clone(mods), next);
          update(next, st);
        }, `${key}-mods`);
        const c = this._details(`${key}-col`, `${L('Leistungsklassen dieser Anlage', 'Power classes of this system')} (${(item.color_stops || []).length ? L('eigene', 'custom') : L('automatisch', 'automatic')})`, '🎨');
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
      const tot = this._details('total', L('Summe „Gesamt“', 'Sum “Total”'), 'Σ');
      tot.body.append(this._form(TOTAL_SCHEMA, {
        show_total: w.show_total ?? true, total_name: w.total_name ?? DEFAULTS.total_name, total_max_power: w.total_max_power,
      }, (v) => {
        this._set('show_total', v.show_total === true ? undefined : v.show_total);
        this._set('total_name', v.total_name === DEFAULTS.total_name ? undefined : v.total_name);
        this._set('total_max_power', v.total_max_power);
        this._emit();
      }));
      const cs = this._details('total-col', `${L('Leistungsklassen „Gesamt“', 'Power classes “Total”')} (${(w.total_color_stops || []).length ? L('eigene', 'custom') : L('automatisch', 'automatic')})`, '🎨');
      this._stopsEditor(cs.body, clone(w.total_color_stops) || [],
        () => Number(w.total_max_power) || sources.reduce((a, s) => a + (Number(s.max_power) || Number(w.max_power) || DEFAULTS.max_power), 0),
        (stops, st) => { this._set('total_color_stops', clone(stops)); this._emit(); if (st) this._render(); });
      tot.body.append(cs.d);
      body.append(tot.d);
    }

    if (sources.length) {
      const opts = sources.filter((s) => s.entity).map((s, i) => ({ value: s.entity, label: s.name || `${L('Anlage', 'System')} ${i + 1}` }));
      if (sources.length > 1 && w.show_total !== false) opts.push({ value: 'total', label: w.total_name || t('total') });
      body.append(this._form([{ name: 'default_source', selector: { select: { mode: 'dropdown', options: opts } } }],
        { default_source: w.default_source ?? opts[0]?.value }, (v) => { this._set('default_source', v.default_source); this._emit(); }));
    }
  }

  /* ---------- Flächen im Bild ---------- */
  _renderAreasEditor(body) {
    const COLOR = { text: { type: 'color' } };
    const num = (min, max, step, unit, mode = 'box') => ({ number: { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) } });
    const w = this._work;
    if (!w.image) {
      body.append(this._hint(L('Trage zuerst unter „🏠 Hausbild“ ein Bild ein.', 'First set an image under “🏠 House image”.')));
      return;
    }
    const PAL = ['#f05a28', '#f5a623', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];
    const areas = clone(w.areas) || [];
    const save = (structural) => { this._set('areas', clone(areas)); this._emit(); if (structural) this._render(); };
    const opts = (w.sources || []).filter((x) => x.entity).map((x) => ({ value: x.entity, label: x.name || x.entity }));
    if (!opts.length && w.power_entity) opts.push({ value: w.power_entity, label: t('pv_power') });
    if ((w.sources || []).length > 1 && w.show_total !== false) opts.push({ value: 'total', label: w.total_name || t('total') });
    const schema = [
      { type: 'grid', name: '', schema: [{ name: 'name', selector: { text: {} } }, { name: 'color', selector: COLOR }] },
      { name: 'source', selector: { entity: { domain: 'sensor' } } },
      { type: 'grid', name: '', schema: [
        { name: 'system', selector: { select: { mode: 'dropdown', options: [{ value: '', label: L('– keine –', '– none –') }, ...opts] } } },
        { name: 'kwp', selector: num(0.01, 1000, 0.01, 'kWp') },
      ] },
      { type: 'grid', name: '', schema: [{ name: 'azimuth', selector: num(0, 359, 1, '°') }, { name: 'tilt', selector: num(0, 90, 1, '°') }] },
    ];
    body.append(this._hint(L(
      'Markiere jeden Strang im Hausbild: Fläche anlegen, Anlage zuordnen, dann „🖌 Im Bild markieren“. Am einfachsten mit dem Raster: Drehung an die Modulreihen anpassen, Kästchen auf Modulgröße stellen und die Module anklicken oder überstreichen. Azimut/Neigung (optional) zeigen, ob die Sonne die Fläche gerade trifft.',
      'Mark each string in the house image: add an area, assign the system, then “🖌 Mark in image”. Easiest with the grid: rotate it to the panel rows, set the cell size to one panel and click or brush over the panels. Azimuth/tilt (optional) show whether the sun currently hits the area.')));
    body.append(this._form([
      { name: 'area_labels', selector: { boolean: {} } },
      { name: 'area_toggle', selector: { boolean: {} } },
      { name: 'area_summary', selector: { select: { mode: 'dropdown', options: [
        { value: 'areas', label: L('Nur in der Ansicht „Flächen“', 'Only in the “Areas” view') },
        { value: 'always', label: L('In allen Ansichten', 'In all views') },
        { value: 'off', label: L('Aus', 'Off') }] } } },
    ], { area_labels: w.area_labels ?? true, area_toggle: w.area_toggle ?? true, area_summary: w.area_summary ?? 'areas' }, (v) => {
      this._set('area_labels', v.area_labels === true ? undefined : v.area_labels);
      this._set('area_toggle', v.area_toggle === true ? undefined : v.area_toggle);
      this._set('area_summary', v.area_summary === 'areas' ? undefined : v.area_summary);
      this._emit();
    }));
    this._list(body, {
      key: 'areas',
      items: areas,
      schema,
      title: (a, i) => {
        const n = (a.grid?.cells || []).length;
        const pgs = (a.polygons || []).filter((x) => x.length > 2).length;
        return `${a.name || `${L('Fläche', 'Area')} ${i + 1}`}${n ? ` · ${n} ${t('modules_n')}` : ''}${pgs ? ` · ${pgs} ${L('Teilflächen', 'parts')}` : ''}`;
      },
      swatch: (a) => a.color,
      newItem: () => ({ name: `${L('Strang', 'String')} ${areas.length + 1}`, color: PAL[areas.length % PAL.length], system: opts[0]?.value }),
      addLabel: L('Fläche hinzufügen', 'Add area'),
      helpers: {
        kwp: L('kWp nur dieses Strangs: Module × Wp ÷ 1000 (z. B. 9 × 395 Wp = 3,555). Leer = kWp der Anlage gleichmäßig auf ihre Flächen verteilt.',
          'kWp of this string only: panels × Wp ÷ 1000 (e.g. 9 × 395 Wp = 3.555). Empty = the system\'s kWp split evenly across its areas.'),
        source: L('Strang-Sensor dieser Fläche, W oder kW (z. B. PV1-Leistung). Leer = Leistung der zugehörigen Anlage.', 'String sensor of this area, W or kW (e.g. PV1 power). Empty = power of the linked system.'),
        system: L('Zu welcher Anlage gehört diese Fläche? Sie leuchtet dann mit, wenn die Anlage gewählt ist.', 'Which system does this area belong to? It is highlighted when that system is selected.'),
      },
      onChange: (items, structural) => {
        if (structural && this._activeArea !== undefined && this._activeArea >= items.length) this._activeArea = undefined;
        save(structural);
      },
      nested: (box, get, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        const active = this._activeArea === i;
        row.append(this._btn(active ? L('✓ Markieren beenden', '✓ Finish marking') : L('🖌 Im Bild markieren', '🖌 Mark in image'), () => {
          this._activeArea = active ? undefined : i;
          this._render();
        }, active ? 'on' : ''));
        box.append(row);
        if (active) box.append(this._painter(areas, i, save));
      },
    });
  }

  _painter(areas, ai, save) {
    const COLOR = { text: { type: 'color' } };
    const num = (min, max, step, unit, mode = 'box') => ({ number: { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) } });
    const wrapAll = document.createElement('div');
    wrapAll.className = 'sub';
    const A = () => areas[ai];
    this._paintMode = this._paintMode || 'grid';
    this._brush = this._brush || 'paint';
    if (!A().grid) A().grid = { rotation: 0, x: 0, y: 0, w: 4, h: 7, cells: [] };
    if (!Array.isArray(A().grid.cells)) A().grid.cells = [];
    if (!Array.isArray(A().polygons)) A().polygons = [];
    // Modus
    const modes = document.createElement('div');
    modes.className = 'brushes';
    const mkBtn = (label, on, fn) => { const b = this._btn(label, fn); if (on) b.classList.add('on'); return b; };
    modes.append(
      mkBtn(L('▦ Raster', '▦ Grid'), this._paintMode === 'grid', () => { this._paintMode = 'grid'; this._render(); }),
      mkBtn(L('✎ Frei zeichnen', '✎ Free drawing'), this._paintMode === 'free', () => { this._paintMode = 'free'; this._render(); }),
    );
    wrapAll.append(modes);
    let redraw = () => {};
    if (this._paintMode === 'grid') {
      const g = A().grid;
      const gridSchema = [
        { name: 'g_rot', selector: num(-90, 90, 0.5, '°', 'slider') },
        { type: 'grid', name: '', schema: [
          { name: 'g_w', selector: num(0.5, 40, 0.1, null, 'slider') },
          { name: 'g_h', selector: num(0.5, 40, 0.1, null, 'slider') },
        ] },
        { type: 'grid', name: '', schema: [
          { name: 'g_x', selector: num(-20, 120, 0.1, null, 'slider') },
          { name: 'g_y', selector: num(-20, 120, 0.1, null, 'slider') },
        ] },
      ];
      wrapAll.append(this._form(gridSchema, { g_rot: g.rotation, g_w: g.w, g_h: g.h, g_x: g.x, g_y: g.y }, (v) => {
        Object.assign(g, { rotation: v.g_rot, w: v.g_w, h: v.g_h, x: v.g_x, y: v.g_y });
        redraw();
        save(false);
      }));
      const brushes = document.createElement('div');
      brushes.className = 'brushes';
      brushes.append(document.createTextNode(L('Pinsel:', 'Brush:')));
      [['paint', L('🖌 Malen', '🖌 Paint')], ['erase', L('🧽 Radieren', '🧽 Erase')], ['sensor', L('🔌 Modul-Sensor', '🔌 Panel sensor')]].forEach(([k, lbl]) => {
        brushes.append(mkBtn(lbl, this._brush === k, () => { this._brush = k; this._render(); }));
      });
      brushes.append(this._btn(L('Alle löschen', 'Clear all'), () => { g.cells = []; A().cell_sensors = {}; redraw(); save(false); }));
      wrapAll.append(brushes);
      if (this._brush === 'sensor') {
        wrapAll.append(this._hint(L('Sensor wählen und dann ein markiertes Modul anklicken. Leeres Feld + Klick entfernt die Zuordnung.', 'Pick a sensor, then click a marked panel. Empty field + click removes the assignment.')));
        wrapAll.append(this._form([{ name: 'cell_entity', selector: { entity: { domain: 'sensor' } } }], { cell_entity: this._cellEntity }, (v) => { this._cellEntity = v.cell_entity; }));
      }
    } else {
      const tools = document.createElement('div');
      tools.className = 'brushes';
      this._polyIdx = Math.min(this._polyIdx ?? A().polygons.length - 1, A().polygons.length - 1);
      tools.append(
        this._btn(L('+ Teilfläche', '+ Part'), () => { A().polygons.push([]); this._polyIdx = A().polygons.length - 1; redraw(); }),
        this._btn(L('↺ Letzten Punkt entfernen', '↺ Remove last point'), () => { const pg = A().polygons[this._polyIdx]; if (pg) pg.pop(); redraw(); save(false); }),
        this._btn(L('Teilfläche löschen', 'Delete part'), () => { if (this._polyIdx >= 0) A().polygons.splice(this._polyIdx, 1); this._polyIdx = A().polygons.length - 1; redraw(); save(false); }),
      );
      wrapAll.append(tools);
      wrapAll.append(this._hint(L('Ecken der Module nacheinander anklicken. Punkte lassen sich ziehen, Rechtsklick löscht einen Punkt.', 'Click the panel corners one after another. Drag points to move them, right-click deletes a point.')));
    }
    // Zeichenfläche
    const stage = document.createElement('div');
    stage.className = 'painter';
    const img = document.createElement('img');
    let url = String(this._work.image);
    if (/^\/(local|media|api)\//.test(url) && this._hass?.hassUrl) url = this._hass.hassUrl(url);
    img.src = url;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('preserveAspectRatio', 'none');
    stage.append(img, svg);
    wrapAll.append(stage);
    let ar = 1;
    const toImg = (ev) => {
      const r = svg.getBoundingClientRect();
      return [((ev.clientX - r.left) / r.width) * 100, ((ev.clientY - r.top) / r.height) * 100 * ar];
    };
    const f = (v) => v.toFixed(2);
    redraw = () => {
      const H = 100 * ar;
      svg.setAttribute('viewBox', `0 0 100 ${f(H)}`);
      let out = '';
      areas.forEach((a, k) => {
        if (k === ai) return;
        areaShapes(a).forEach((sh) => { out += `<polygon points="${sh.pts.map((q) => q.map(f).join(',')).join(' ')}" fill="${esc(a.color || '#888')}" fill-opacity=".35" stroke="${esc(a.color || '#888')}" stroke-width=".25"/>`; });
      });
      const col = A().color || '#f5a623';
      if (this._paintMode === 'grid') {
        const g = A().grid;
        const r = ((Number(g.rotation) || 0) * Math.PI) / 180;
        const ux = [Math.cos(r), Math.sin(r)];
        const uy = [-Math.sin(r), Math.cos(r)];
        const corners = [[0, 0], [100, 0], [100, H], [0, H]].map(([x, y]) => {
          const d = [x - g.x, y - g.y];
          return [(d[0] * ux[0] + d[1] * ux[1]) / g.w, (d[0] * uy[0] + d[1] * uy[1]) / g.h];
        });
        const i0 = Math.floor(Math.min(...corners.map((q) => q[0])));
        const i1 = Math.ceil(Math.max(...corners.map((q) => q[0])));
        const j0 = Math.floor(Math.min(...corners.map((q) => q[1])));
        const j1 = Math.ceil(Math.max(...corners.map((q) => q[1])));
        if ((i1 - i0) * (j1 - j0) < 6000) {
          for (let i = i0; i <= i1; i++) {
            const a = gridCell(g, i, j0)[0];
            const b = gridCell(g, i, j1)[0];
            out += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="rgba(0,190,255,.75)" stroke-width=".18"/>`;
          }
          for (let j = j0; j <= j1; j++) {
            const a = gridCell(g, i0, j)[0];
            const b = gridCell(g, i1, j)[0];
            out += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="rgba(0,190,255,.75)" stroke-width=".18"/>`;
          }
        }
        g.cells.forEach(([i, j]) => {
          const pts = gridCell(g, i, j);
          out += `<polygon points="${pts.map((q) => q.map(f).join(',')).join(' ')}" fill="${esc(col)}" fill-opacity=".6" stroke="#fff" stroke-width=".3"/>`;
          if (A().cell_sensors?.[`${i},${j}`]) {
            const cx = pts.reduce((s1, q) => s1 + q[0], 0) / 4;
            const cy = pts.reduce((s1, q) => s1 + q[1], 0) / 4;
            out += `<circle cx="${f(cx)}" cy="${f(cy)}" r=".9" fill="#fff" stroke="${esc(col)}" stroke-width=".3"><title>${esc(A().cell_sensors[`${i},${j}`])}</title></circle>`;
          }
        });
      } else {
        A().polygons.forEach((pg, k) => {
          if (!pg.length) return;
          const pts = pg.map((q) => q.map(f).join(',')).join(' ');
          out += pg.length > 2 && k !== this._polyIdx
            ? `<polygon points="${pts}" fill="${esc(col)}" fill-opacity=".45" stroke="${esc(col)}" stroke-width=".4"/>`
            : `<polygon points="${pts}" fill="${esc(col)}" fill-opacity=".3" stroke="${esc(col)}" stroke-width=".5" stroke-dasharray="1.2 .8"/>`;
          if (k === this._polyIdx) pg.forEach((q, n) => { out += `<circle data-p="${n}" cx="${f(q[0])}" cy="${f(q[1])}" r="1.3" fill="#fff" stroke="${esc(col)}" stroke-width=".5"/>`; });
        });
      }
      svg.innerHTML = out;
    };
    img.onload = () => { ar = img.naturalHeight / img.naturalWidth || 1; redraw(); };
    // Eingabe
    let down = false;
    let target = null;
    let dragPt = -1;
    const cellAt = (p) => {
      const g = A().grid;
      const r = ((Number(g.rotation) || 0) * Math.PI) / 180;
      const d = [p[0] - g.x, p[1] - g.y];
      return [Math.floor((d[0] * Math.cos(r) + d[1] * Math.sin(r)) / g.w), Math.floor((-d[0] * Math.sin(r) + d[1] * Math.cos(r)) / g.h)];
    };
    const applyCell = (p) => {
      const [i, j] = cellAt(p);
      const g = A().grid;
      const idx = g.cells.findIndex((q) => q[0] === i && q[1] === j);
      if (this._brush === 'sensor') {
        if (idx < 0) return;
        A().cell_sensors = A().cell_sensors || {};
        if (this._cellEntity) A().cell_sensors[`${i},${j}`] = this._cellEntity;
        else delete A().cell_sensors[`${i},${j}`];
        return;
      }
      if (target === null) target = this._brush === 'paint' ? idx < 0 : false;
      if (target && idx < 0) g.cells.push([i, j]);
      if (!target && idx >= 0) {
        g.cells.splice(idx, 1);
        if (A().cell_sensors) delete A().cell_sensors[`${i},${j}`];
      }
    };
    svg.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (this._paintMode !== 'free') return;
      const n = ev.target.dataset?.p;
      if (n !== undefined) { A().polygons[this._polyIdx].splice(Number(n), 1); redraw(); save(false); }
    });
    svg.addEventListener('pointerdown', (ev) => {
      if (ev.button === 2) return;
      ev.preventDefault();
      svg.setPointerCapture(ev.pointerId);
      down = true;
      target = null;
      const p = toImg(ev);
      if (this._paintMode === 'grid') { applyCell(p); redraw(); return; }
      if (this._polyIdx < 0 || !A().polygons[this._polyIdx]) { A().polygons.push([]); this._polyIdx = A().polygons.length - 1; }
      const pg = A().polygons[this._polyIdx];
      dragPt = pg.findIndex((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 2);
      if (dragPt < 0) { pg.push([Number(p[0].toFixed(2)), Number(p[1].toFixed(2))]); dragPt = pg.length - 1; }
      redraw();
    });
    svg.addEventListener('pointermove', (ev) => {
      if (!down) return;
      const p = toImg(ev);
      if (this._paintMode === 'grid') { if (this._brush !== 'sensor') { applyCell(p); redraw(); } return; }
      const pg = A().polygons[this._polyIdx];
      if (pg && dragPt >= 0) { pg[dragPt] = [Number(p[0].toFixed(2)), Number(p[1].toFixed(2))]; redraw(); }
    });
    const up = () => { if (!down) return; down = false; dragPt = -1; target = null; save(false); };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    if (img.complete && img.naturalWidth) img.onload();
    return wrapAll;
  }

  _renderSection(sec, body) {
    const w = this._work;
    if (sec.custom === 'corners') return this._renderCorners(body);
    if (sec.custom === 'areas') return this._renderAreasEditor(body);
    if (sec.custom === 'sources') return this._renderSources(body);
    if (sec.custom === 'modules') {
      body.append(this._hint(L('Gestrichelte Pfeile zeigen, wohin deine Module zeigen. Diese Modulfelder erscheinen bei jeder Anlage; eigene Felder je Anlage findest du unter „Anlagen“.', 'Dashed arrows show where your panels face. These arrays appear for every system; arrays per system are under “Systems”.')));
      return this._modulesEditor(body, clone(w.modules) || [], (mods, st) => { this._set('modules', clone(mods)); this._emit(); if (st) this._render(); }, 'gmods');
    }
    if (sec.custom === 'stops') {
      body.append(this._hint((w.sources || []).length
        ? L('Gilt für Anlagen ohne eigene Leistungsklassen und ohne eigene maximale Leistung.', 'Applies to systems without their own power classes and maximum power.')
        : L('Jede Stufe beginnt bei „Ab Leistung“ und reicht bis zur nächsten Stufe.', 'Each step starts at “From power” and reaches up to the next step.')));
      return this._stopsEditor(body, clone(w.color_stops) || [], () => Number(w.max_power) || DEFAULTS.max_power,
        (stops, st) => { this._set('color_stops', clone(stops)); this._emit(); if (st) this._render(); });
    }
    let schema = sec.schema;
    if (sec.key === 'general' && (w.sources || []).length) {
      schema = schema.filter((x) => !['power_entity', 'kwp', 'energy_entity'].includes(x.name));
      body.append(this._hint(L('Mehrere Anlagen sind aktiv: Sensoren, Ertragszähler und kWp stellst du unter „🔆 Anlagen“ ein. Die maximale Leistung hier gilt für Anlagen ohne eigene Angabe.', 'Several systems are active: set sensors, energy meters and kWp under “🔆 Systems”. The maximum power here applies to systems without their own value.')));
    }
    const keys = schemaKeys(schema);
    const data = {};
    keys.forEach((k) => { data[k] = w[k] ?? formDefaults()[k]; });
    body.append(this._form(schema, data, (v) => {
      keys.forEach((k) => {
        const val = v[k];
        if (!(k in w) && JSON.stringify(val) === JSON.stringify(formDefaults()[k])) return; // Standardwerte nicht in YAML schreiben
        this._set(k, val);
      });
      this._emit();
    }));
    return undefined;
  }

  async _render() {
    if (!this._hass || !this._work) return;
    detectLang(this._hass, this._work.language);
    rebuildSchemas();
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
    description: t('card_desc'),
    preview: true,
    documentationURL: 'https://github.com/muhkuh666/helios-compass-card',
  });
  console.info(`%c HELIOS COMPASS %c v${CARD_VERSION} `, 'color:#fff;background:#f57c00;font-weight:bold', 'color:#f57c00;background:#fff');
}
