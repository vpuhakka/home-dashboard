# Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page home dashboard showing Finnish electricity spot prices, Järvenpää weather, and Järvenpää–Pasila train departures, served statically from a local laptop to an iPad mini in landscape.

**Architecture:** `index.html` links to `style.css` and `app.js` (ES module). All data fetched client-side from three free public CORS-enabled APIs. Each panel auto-refreshes independently via `setInterval`. Pure data-transformation functions are exported from `app.js` and tested via `test.html` in the browser.

**Tech Stack:** Vanilla HTML5, CSS Grid, ES Modules — no build step, no npm, no dependencies.

---

## File Map

| File | Responsibility |
|------|---------------|
| `index.html` | HTML structure: 3-column layout, panel markup, links CSS + JS |
| `style.css` | All visual styles: grid, panels, chart bars, typography, colors |
| `app.js` | Data fetch, parse, render, auto-refresh, clock (ES module) |
| `test.html` | Browser-based unit tests for pure data-transformation functions |
| `.gitignore` | Excludes `.superpowers/` |

---

### Task 1: Project skeleton

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `.gitignore`

- [ ] **Step 1: Create `.gitignore`**

```
.superpowers/
```

- [ ] **Step 2: Create `style.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f3f4f6;
  color: #111827;
  height: 100vh;
  overflow: hidden;
}

#app {
  display: grid;
  grid-template-columns: 40fr 40fr 20fr;
  gap: 12px;
  padding: 12px;
  height: 100vh;
}

.panel {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-label {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.big-number {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  color: #111827;
}

.unit {
  font-size: 0.9rem;
  color: #9ca3af;
  margin-left: 4px;
}

.hi-lo {
  display: flex;
  gap: 16px;
  margin-top: 6px;
  font-size: 0.85rem;
}

.hi { color: #dc2626; }
.lo { color: #059669; }

.divider {
  border: none;
  border-top: 1px solid #f3f4f6;
  margin: 12px 0;
}

.dash { color: #9ca3af; }

/* Chart */
#chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  flex: 1;
  min-height: 0;
}

.bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  min-height: 2px;
}

.bar.current {
  outline: 2px solid #1d4ed8;
  outline-offset: 1px;
}

.bar.price-low  { background: #bfdbfe; }
.bar.price-mid  { background: #93c5fd; }
.bar.price-high { background: #f87171; }

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #d1d5db;
  margin-top: 2px;
}

/* Weather */
.weather-current {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weather-emoji {
  font-size: 3rem;
  line-height: 1;
}

.weather-details {
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.7;
  margin-top: 8px;
}

.forecast-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  padding: 4px 0;
}

.forecast-day  { color: #6b7280; }
.forecast-temp { font-weight: 600; }

/* Trains */
.train-row {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #f3f4f6;
}

.train-row:last-child { border-bottom: none; }

.train-time {
  font-size: 1.4rem;
  font-weight: 700;
  line-height: 1;
}

.train-status {
  font-size: 0.75rem;
  margin-top: 3px;
}

.status-ok    { color: #059669; }
.status-delay { color: #d97706; }
.status-late  { color: #dc2626; }

/* Footer + clock */
#footer {
  position: fixed;
  bottom: 6px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 9px;
  color: #d1d5db;
}

#clock {
  position: fixed;
  top: 12px;
  right: 16px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6b7280;
}
```

- [ ] **Step 3: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="fi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home Dashboard</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

<div id="clock">--:--</div>

<div id="app">

  <!-- Electricity -->
  <div class="panel" id="electricity-panel">
    <div class="panel-label">Electricity</div>
    <div>
      <span class="big-number" id="el-price">&#x2014;</span>
      <span class="unit">c/kWh</span>
    </div>
    <div class="hi-lo">
      <span class="lo">&#x2193; <span id="el-lo">&#x2014;</span></span>
      <span class="hi">&#x2191; <span id="el-hi">&#x2014;</span></span>
    </div>
    <hr class="divider">
    <div id="chart"></div>
    <div class="chart-labels"><span>00</span><span>12</span><span>23</span></div>
  </div>

  <!-- Weather -->
  <div class="panel" id="weather-panel">
    <div class="panel-label">Weather &#xB7; J&#xe4;rvenp&#xe4;&#xe4;</div>
    <div class="weather-current">
      <div class="weather-emoji" id="w-emoji">&#x2014;</div>
      <div>
        <span class="big-number" id="w-temp">&#x2014;</span>
        <span class="unit">&#xB0;C</span>
      </div>
    </div>
    <div id="w-condition" style="font-size:0.85rem; color:#6b7280; margin-top:4px;">&#x2014;</div>
    <div class="weather-details" id="w-details">&#x2014;</div>
    <hr class="divider">
    <div id="w-forecast"></div>
  </div>

  <!-- Trains -->
  <div class="panel" id="trains-panel">
    <div class="panel-label">&#x2192; Pasila</div>
    <div id="trains-list"></div>
  </div>

</div>

<div id="footer">Updated: <span id="last-updated">&#x2014;</span></div>

<script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Serve and verify layout**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Expected: three columns visible, em-dash placeholders, no console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html style.css .gitignore
git commit -m "feat: project skeleton with 3-column layout"
```

---

### Task 2: Clock + app bootstrap

**Files:**
- Create: `app.js`

- [ ] **Step 1: Create `app.js`**

```javascript
// ── Helpers ───────────────────────────────────────────────────────────────────
function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function stampUpdated() {
  setEl('last-updated', new Date().toLocaleTimeString('fi-FI'));
}

// ── Clock ─────────────────────────────────────────────────────────────────────
function updateClock() {
  setEl('clock', new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }));
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);
```

- [ ] **Step 2: Verify clock in browser**

Refresh `http://localhost:8080`. Top-right should show current time, updating every second.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat: live clock"
```

---

### Task 3: Electricity — data functions + tests

**Files:**
- Modify: `app.js`
- Create: `test.html`

- [ ] **Step 1: Add electricity data functions to `app.js`**

Insert before `// ── Bootstrap`:

```javascript
// ── Electricity ───────────────────────────────────────────────────────────────
export function getTodayPrices(data) {
  const todayStr = new Date().toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' });
  return data.prices
    .filter(p => {
      const d = new Date(p.startDate);
      return d.toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' }) === todayStr;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
}

export function getCurrentPrice(todayPrices) {
  const now = new Date();
  const p = todayPrices.find(p => {
    const start = new Date(p.startDate);
    const end   = new Date(start.getTime() + 3_600_000);
    return start <= now && now < end;
  });
  return p ? p.price : null;
}

export function getDayHiLo(todayPrices) {
  if (!todayPrices.length) return { hi: null, lo: null };
  const vals = todayPrices.map(p => p.price);
  return { hi: Math.max(...vals), lo: Math.min(...vals) };
}

export function getPriceClass(price, lo, hi) {
  const range = hi - lo || 1;
  const ratio = (price - lo) / range;
  if (ratio < 0.33) return 'price-low';
  if (ratio < 0.67) return 'price-mid';
  return 'price-high';
}
```

- [ ] **Step 2: Create `test.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dashboard Tests</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    .pass { color: green; }
    .fail { color: red; font-weight: bold; }
  </style>
</head>
<body>
<h2>Dashboard Tests</h2>
<div id="results"></div>
<p id="summary" style="margin-top:16px; font-weight:bold;"></p>

<script type="module">
import {
  getTodayPrices, getCurrentPrice, getDayHiLo, getPriceClass,
  getWeatherEmoji, getWeatherLabel, windDirection,
  getUpcomingDepartures
} from './app.js';

const out = document.getElementById('results');
let passed = 0, failed = 0;

function assert(label, condition) {
  const div = document.createElement('div');
  div.className = condition ? 'pass' : 'fail';
  div.textContent = (condition ? 'PASS ' : 'FAIL ') + label;
  out.appendChild(div);
  condition ? passed++ : failed++;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
// Derive the UTC offset for Europe/Helsinki so we can build UTC timestamps
// that fall at specific Helsinki hours today.
const offsetStr = new Date()
  .toLocaleString('en', { timeZone: 'Europe/Helsinki', timeZoneName: 'shortOffset' })
  .match(/GMT([+-]\d+)/)?.[1] ?? '+2';
const utcOffset = parseInt(offsetStr, 10); // e.g. 3 for EEST

const now = new Date();
const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();

function utcISOForHelsinkiHour(h) {
  return new Date(Date.UTC(y, m, d, h - utcOffset, 0, 0)).toISOString();
}

const mockData = {
  prices: [
    { price: 2.0, startDate: utcISOForHelsinkiHour(0) },
    { price: 1.5, startDate: utcISOForHelsinkiHour(1) },
    { price: 3.0, startDate: utcISOForHelsinkiHour(2) },
    { price: 5.0, startDate: utcISOForHelsinkiHour(3) },
    { price: 7.8, startDate: utcISOForHelsinkiHour(4) },
    { price: 6.0, startDate: utcISOForHelsinkiHour(5) },
    { price: 4.0, startDate: utcISOForHelsinkiHour(6) },
    { price: 3.5, startDate: utcISOForHelsinkiHour(7) },
    // yesterday — must be excluded
    { price: 99.0, startDate: new Date(Date.UTC(y, m, d - 1, 22 - utcOffset)).toISOString() }
  ]
};

// ── getTodayPrices ─────────────────────────────────────────────────────────────
const today = getTodayPrices(mockData);
assert("getTodayPrices: returns 8 today prices", today.length === 8);
assert("getTodayPrices: sorted ascending", today[0].price === 2.0);
assert("getTodayPrices: excludes yesterday price", today.every(p => p.price !== 99.0));

// ── getDayHiLo ────────────────────────────────────────────────────────────────
const { hi, lo } = getDayHiLo(today);
assert("getDayHiLo: hi is 7.8", hi === 7.8);
assert("getDayHiLo: lo is 1.5", lo === 1.5);
assert("getDayHiLo: empty array gives nulls", getDayHiLo([]).hi === null);

// ── getCurrentPrice ───────────────────────────────────────────────────────────
const nowHour = new Date();
nowHour.setMinutes(0, 0, 0);
assert("getCurrentPrice: matches current hour", getCurrentPrice([{ price: 4.2, startDate: nowHour.toISOString() }]) === 4.2);
assert("getCurrentPrice: null for empty list", getCurrentPrice([]) === null);

// ── getPriceClass ─────────────────────────────────────────────────────────────
assert("getPriceClass: at lo -> price-low",  getPriceClass(1.5, 1.5, 7.8) === 'price-low');
assert("getPriceClass: midpoint -> price-mid", getPriceClass(4.0, 1.5, 7.8) === 'price-mid');
assert("getPriceClass: at hi -> price-high", getPriceClass(7.8, 1.5, 7.8) === 'price-high');
assert("getPriceClass: flat range -> price-low", getPriceClass(5.0, 5.0, 5.0) === 'price-low');

// ── Weather helpers ───────────────────────────────────────────────────────────
assert("getWeatherEmoji: 0 -> clear sky emoji",   getWeatherEmoji(0) === '☀️');
assert("getWeatherEmoji: 61 -> rain emoji",        getWeatherEmoji(61) === '🌧️');
assert("getWeatherEmoji: unknown code -> thermometer", getWeatherEmoji(999) === '🌡️');
assert("getWeatherLabel: 0 -> Clear sky",          getWeatherLabel(0) === 'Clear sky');
assert("getWeatherLabel: 95 -> Thunderstorm",      getWeatherLabel(95) === 'Thunderstorm');
assert("windDirection: 0deg -> N",   windDirection(0)   === 'N');
assert("windDirection: 90deg -> E",  windDirection(90)  === 'E');
assert("windDirection: 225deg -> SW",windDirection(225) === 'SW');
assert("windDirection: 337deg -> N", windDirection(337) === 'N');

// ── getUpcomingDepartures ─────────────────────────────────────────────────────
const future1 = new Date(Date.now() + 10 * 60000).toISOString();
const future2 = new Date(Date.now() + 25 * 60000).toISOString();
const past    = new Date(Date.now() -  5 * 60000).toISOString();

const mockTrains = [
  {
    timeTableRows: [
      { stationShortCode: 'JPÄ', type: 'DEPARTURE', scheduledTime: future1, differenceInMinutes: 0 },
      { stationShortCode: 'TKL', type: 'ARRIVAL',   scheduledTime: future1 },
      { stationShortCode: 'PSL', type: 'ARRIVAL',   scheduledTime: future1 }
    ]
  },
  {
    timeTableRows: [
      { stationShortCode: 'JPÄ', type: 'DEPARTURE', scheduledTime: future2, differenceInMinutes: 3 },
      { stationShortCode: 'PSL', type: 'ARRIVAL',   scheduledTime: future2 }
    ]
  },
  {
    // already departed — must be excluded
    timeTableRows: [
      { stationShortCode: 'JPÄ', type: 'DEPARTURE', scheduledTime: past, differenceInMinutes: 0 },
      { stationShortCode: 'PSL', type: 'ARRIVAL',   scheduledTime: past }
    ]
  },
  {
    // does not stop at PSL — must be excluded
    timeTableRows: [
      { stationShortCode: 'JPÄ', type: 'DEPARTURE', scheduledTime: future1, differenceInMinutes: 0 },
      { stationShortCode: 'TKL', type: 'ARRIVAL',   scheduledTime: future1 }
    ]
  }
];

const deps = getUpcomingDepartures(mockTrains, 'JPÄ', 'PSL');
assert("getUpcomingDepartures: 2 valid trains",    deps.length === 2);
assert("getUpcomingDepartures: sorted ascending",  deps[0].scheduled < deps[1].scheduled);
assert("getUpcomingDepartures: delay captured",    deps[1].delayMin === 3);
assert("getUpcomingDepartures: respects count",    getUpcomingDepartures(mockTrains, 'JPÄ', 'PSL', 1).length === 1);

// ── Summary ────────────────────────────────────────────────────────────────────
document.getElementById('summary').textContent = passed + ' passed, ' + failed + ' failed';
</script>
</body>
</html>
```

- [ ] **Step 3: Run tests**

Open `http://localhost:8080/test.html`.

The electricity tests (`getTodayPrices`, `getCurrentPrice`, `getDayHiLo`, `getPriceClass`) should show PASS. The weather and train tests will error until those functions are added in Tasks 5 and 7 — that is expected.

- [ ] **Step 4: Commit**

```bash
git add app.js test.html
git commit -m "feat: electricity data functions with browser tests"
```

---

### Task 4: Electricity — fetch + render

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add electricity render + fetch to `app.js`**

Insert before `// ── Bootstrap`:

```javascript
function renderElectricity(data) {
  const today = getTodayPrices(data);
  const current = getCurrentPrice(today);
  const { hi, lo } = getDayHiLo(today);

  setEl('el-price', current !== null ? current.toFixed(1) : '—');
  setEl('el-lo',    lo      !== null ? lo.toFixed(1)      : '—');
  setEl('el-hi',    hi      !== null ? hi.toFixed(1)      : '—');

  const chart = document.getElementById('chart');
  while (chart.firstChild) chart.removeChild(chart.firstChild);
  if (!today.length) return;

  const now = new Date();
  today.forEach(p => {
    const bar = document.createElement('div');
    bar.className = 'bar ' + getPriceClass(p.price, lo, hi);
    bar.style.height = Math.max(4, (p.price / hi) * 100) + '%';

    const start = new Date(p.startDate);
    if (start <= now && now < new Date(start.getTime() + 3_600_000)) {
      bar.classList.add('current');
    }
    bar.title = start.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
      + ': ' + p.price.toFixed(1) + ' c/kWh';
    chart.appendChild(bar);
  });
}

async function loadElectricity() {
  try {
    const res = await fetch('https://api.porssisahko.net/v1/latest-prices.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    renderElectricity(await res.json());
    stampUpdated();
  } catch {
    setEl('el-price', '—');
    setEl('el-lo',    '—');
    setEl('el-hi',    '—');
  }
}
```

- [ ] **Step 2: Update bootstrap**

```javascript
// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);

loadElectricity();
setInterval(loadElectricity, 60 * 60 * 1000); // 60 min
```

- [ ] **Step 3: Verify in browser**

Refresh `http://localhost:8080`. Expected: current price shown (non-dash), 24 bars visible, current hour bar has blue outline.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: electricity panel with price, hi/lo, and hourly chart"
```

---

### Task 5: Weather — data functions + fetch + render

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add weather functions to `app.js`**

Insert before `// ── Bootstrap`:

```javascript
// ── Weather ───────────────────────────────────────────────────────────────────
const WEATHER_EMOJIS = {
  0: '☀️',  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  95: '⛈️'
};

const WEATHER_LABELS = {
  0:  'Clear sky',      1:  'Mainly clear',   2:  'Partly cloudy', 3:  'Overcast',
  45: 'Foggy',          48: 'Foggy',
  51: 'Light drizzle',  53: 'Drizzle',        55: 'Heavy drizzle',
  61: 'Light rain',     63: 'Rain',           65: 'Heavy rain',
  71: 'Light snow',     73: 'Snow',           75: 'Heavy snow',
  80: 'Showers',        81: 'Showers',        82: 'Heavy showers',
  95: 'Thunderstorm'
};

export function getWeatherEmoji(code) { return WEATHER_EMOJIS[code] ?? '🌡️'; }
export function getWeatherLabel(code) { return WEATHER_LABELS[code] ?? 'Unknown'; }

export function windDirection(degrees) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
}

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast'
  + '?latitude=60.4736&longitude=25.0900'
  + '&current=temperature_2m,relative_humidity_2m,precipitation_probability,'
  + 'wind_speed_10m,wind_direction_10m,weather_code'
  + '&daily=weather_code,temperature_2m_max,temperature_2m_min'
  + '&timezone=Europe%2FHelsinki&forecast_days=4';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderWeather(data) {
  const c = data.current;
  setEl('w-emoji',     getWeatherEmoji(c.weather_code));
  setEl('w-temp',      String(Math.round(c.temperature_2m)));
  setEl('w-condition', getWeatherLabel(c.weather_code));
  setEl('w-details',
    'Rain ' + c.precipitation_probability + '%  ·  '
    + 'Wind ' + Math.round(c.wind_speed_10m) + ' m/s ' + windDirection(c.wind_direction_10m) + '  ·  '
    + 'Humidity ' + c.relative_humidity_2m + '%'
  );

  const d = data.daily;
  const forecastEl = document.getElementById('w-forecast');
  while (forecastEl.firstChild) forecastEl.removeChild(forecastEl.firstChild);

  for (let i = 1; i <= 3; i++) {
    const dayName = DAY_NAMES[new Date(d.time[i] + 'T12:00:00').getDay()];
    const row = document.createElement('div');
    row.className = 'forecast-row';
    row.appendChild(makeEl('span', 'forecast-day', dayName));
    row.appendChild(makeEl('span', null, getWeatherEmoji(d.weather_code[i])));
    row.appendChild(makeEl('span', 'forecast-temp',
      Math.round(d.temperature_2m_max[i]) + '° / ' + Math.round(d.temperature_2m_min[i]) + '°'
    ));
    forecastEl.appendChild(row);
  }
}

async function loadWeather() {
  try {
    const res = await fetch(WEATHER_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    renderWeather(await res.json());
    stampUpdated();
  } catch {
    setEl('w-emoji',     '—');
    setEl('w-temp',      '—');
    setEl('w-condition', 'Weather unavailable');
    setEl('w-details',   '');
  }
}
```

- [ ] **Step 2: Update bootstrap**

```javascript
// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);

loadElectricity();
setInterval(loadElectricity, 60 * 60 * 1000); // 60 min

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000); // 30 min
```

- [ ] **Step 3: Run weather tests**

Open `http://localhost:8080/test.html`. The `getWeatherEmoji`, `getWeatherLabel`, and `windDirection` tests should now show PASS. Train tests will still error — that is expected.

- [ ] **Step 4: Verify weather panel in browser**

Refresh `http://localhost:8080`. Expected: temperature shown, emoji alongside it, condition text, 3-day forecast rows below divider.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: weather panel with current conditions and 3-day forecast"
```

---

### Task 6: Trains — verify station code

**Files:** No file changes — discovery step only.

- [ ] **Step 1: Look up the Järvenpää station short code**

```bash
curl -s "https://rata.digitraffic.fi/api/v1/metadata/stations" \
  | python3 -c "
import json, sys
for s in json.load(sys.stdin):
    if 'Järvenpää' in s.get('stationName', ''):
        print(s['stationShortCode'], s['stationName'])
"
```

Expected output:
```
JPÄ Järvenpää
```

- [ ] **Step 2: Note the confirmed code**

Write down the `stationShortCode` from the output. Use it as `FROM_STATION` in Task 7. Pasila is `PSL` — no verification needed.

---

### Task 7: Trains — data function + fetch + render

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add train functions to `app.js`**

Replace `'JPÄ'` with the confirmed code from Task 6 if it differs. Insert before `// ── Bootstrap`:

```javascript
// ── Trains ────────────────────────────────────────────────────────────────────
const FROM_STATION = 'JPÄ'; // Järvenpää — confirmed in Task 6
const TO_STATION   = 'PSL'; // Pasila

export function getUpcomingDepartures(trains, fromCode, toCode, count = 3) {
  const now = new Date();
  const departures = [];

  for (const train of trains) {
    const rows = train.timeTableRows ?? [];
    const fromIdx = rows.findIndex(r =>
      r.stationShortCode === fromCode && r.type === 'DEPARTURE'
    );
    if (fromIdx === -1) continue;

    const goesToDest = rows.slice(fromIdx + 1).some(r => r.stationShortCode === toCode);
    if (!goesToDest) continue;

    const row = rows[fromIdx];
    const scheduled = new Date(row.scheduledTime);
    if (scheduled <= now) continue;

    departures.push({ scheduled, delayMin: row.differenceInMinutes ?? 0 });
  }

  return departures
    .sort((a, b) => a.scheduled - b.scheduled)
    .slice(0, count);
}

function renderTrains(departures) {
  const list = document.getElementById('trains-list');
  while (list.firstChild) list.removeChild(list.firstChild);

  if (!departures.length) {
    const row = document.createElement('div');
    row.className = 'train-row';
    const span = document.createElement('span');
    span.className = 'train-time dash';
    span.textContent = '—';
    row.appendChild(span);
    list.appendChild(row);
    return;
  }

  departures.forEach(dep => {
    const time  = dep.scheduled.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
    const delay = dep.delayMin;
    const statusClass = delay === 0 ? 'status-ok' : delay <= 5 ? 'status-delay' : 'status-late';
    const statusText  = delay === 0 ? 'On time' : '+' + delay + ' min';

    const row = document.createElement('div');
    row.className = 'train-row';

    const timeEl = document.createElement('span');
    timeEl.className = 'train-time';
    timeEl.textContent = time;

    const statusEl = document.createElement('span');
    statusEl.className = 'train-status ' + statusClass;
    statusEl.textContent = statusText;

    row.appendChild(timeEl);
    row.appendChild(statusEl);
    list.appendChild(row);
  });
}

async function loadTrains() {
  try {
    const url = 'https://rata.digitraffic.fi/api/v1/live-trains/station/' + FROM_STATION
      + '?departing_trains=20&include_nonstopping=false';
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const trains = await res.json();
    renderTrains(getUpcomingDepartures(trains, FROM_STATION, TO_STATION));
    stampUpdated();
  } catch {
    renderTrains([]);
  }
}
```

- [ ] **Step 2: Update bootstrap (final)**

```javascript
// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);

loadElectricity();
setInterval(loadElectricity, 60 * 60 * 1000); // 60 min

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000); // 30 min

loadTrains();
setInterval(loadTrains, 60 * 1000); // 1 min
```

- [ ] **Step 3: Run all tests**

Open `http://localhost:8080/test.html`. All tests including `getUpcomingDepartures` should now show PASS.

- [ ] **Step 4: Verify trains panel in browser**

Refresh `http://localhost:8080`. Expected: next departures shown with time and status. If no trains are running (e.g. late night), the panel shows `—`.

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat: trains panel with live departures from Jarvenpaa to Pasila"
```

---

### Task 8: Final verification + CLAUDE.md update

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Verify `.gitignore` contains `.superpowers/`**

```bash
cat .gitignore
```

Expected: `.superpowers/` on its own line.

- [ ] **Step 2: Test on iPad-sized viewport**

In browser DevTools, set viewport to **1024 x 768** (landscape iPad mini).

Open `http://localhost:8080` and verify:
- All three panels visible, no horizontal scroll
- Chart bars readable
- Train times not clipped
- Clock visible in top-right
- Footer visible at bottom

- [ ] **Step 3: Append run + file reference to `CLAUDE.md`**

```markdown

## Development

```bash
python3 -m http.server 8080
# Dashboard: http://localhost:8080
# Tests:     http://localhost:8080/test.html
```

## Files

| File | Purpose |
|------|---------|
| `index.html` | HTML structure, links CSS and JS |
| `style.css` | All styles: layout, panels, chart, typography |
| `app.js` | Data fetch/parse/render + auto-refresh + clock (ES module) |
| `test.html` | Browser unit tests for pure data-transformation functions |

## APIs (all free, no auth, CORS-enabled)

| Panel | API | Refresh |
|-------|-----|---------|
| Electricity | `api.porssisahko.net/v1/latest-prices.json` | 60 min |
| Weather | `api.open-meteo.com/v1/forecast` (lat 60.4736, lon 25.0900) | 30 min |
| Trains | `rata.digitraffic.fi/api/v1/live-trains/station/JPÄ` | 1 min |
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add run, test, and API reference to CLAUDE.md"
```
