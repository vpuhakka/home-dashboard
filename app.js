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

// ── Electricity ───────────────────────────────────────────────────────────────
export function getTodayPrices(data) {
  // Get all prices and sort by time
  // The API returns prices starting from when they're available (often tomorrow's prices after 13:00)
  const allPrices = data.prices
    .filter(p => p.price !== null && p.price !== undefined)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  // Try to find today's prices first
  const todayStr = new Date().toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' });
  const todayPrices = allPrices.filter(p => {
    const d = new Date(p.startDate);
    return d.toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' }) === todayStr;
  });
  
  // If no today's prices, return all available (likely tomorrow's prices)
  return todayPrices.length > 0 ? todayPrices : allPrices;
}

export function getCurrentPrice(todayPrices) {
  const now = new Date();
  const p = todayPrices.find(p => {
    const start = new Date(p.startDate);
    const end   = new Date(start.getTime() + 3_600_000);
    return start <= now && now < end;
  });
  // If no current hour found, return the first price (for tomorrow's prices display)
  return p ? p.price : (todayPrices[0] ? todayPrices[0].price : null);
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

// ── Trains ────────────────────────────────────────────────────────────────────
const FROM_STATION = 'JP'; // Järvenpää — verified in Task 6
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

// ── Render + Fetch ────────────────────────────────────────────────────────────
function renderElectricity(data) {
  const today = getTodayPrices(data);
  const current = getCurrentPrice(today);
  const { hi, lo } = getDayHiLo(today);

  setEl('el-price', current !== null ? current.toFixed(1) : '—');
  setEl('el-lo',    lo      !== null ? lo.toFixed(1)      : '—');
  setEl('el-hi',    hi      !== null ? hi.toFixed(1)      : '—');
  
  // Show which day's prices these are
  if (today.length > 0) {
    const firstPriceDate = new Date(today[0].startDate);
    const todayStr = new Date().toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' });
    const priceDateStr = firstPriceDate.toLocaleDateString('fi-FI', { timeZone: 'Europe/Helsinki' });
    const dateLabel = priceDateStr === todayStr ? '' : '· ' + firstPriceDate.toLocaleDateString('fi-FI', { 
      timeZone: 'Europe/Helsinki', 
      month: 'short', 
      day: 'numeric' 
    });
    setEl('el-date', dateLabel);
  }

  const chart = document.getElementById('chart');
  while (chart.firstChild) chart.removeChild(chart.firstChild);
  if (!today.length) return;

  const range = (hi - lo) || 1;
  const now = new Date();
  today.forEach(p => {
    const bar = document.createElement('div');
    bar.className = 'bar ' + getPriceClass(p.price, lo, hi);
    bar.style.height = Math.max(4, ((p.price - lo) / range) * 100) + '%';

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
    // Use local proxy to avoid CORS issues
    const res = await fetch('/api/electricity');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    console.log('Electricity API response:', data);
    console.log('Prices count:', data.prices ? data.prices.length : 0);
    renderElectricity(data);
    stampUpdated();
  } catch (err) {
    console.error('Electricity fetch failed:', err);
    setEl('el-price', '—');
    setEl('el-lo',    '—');
    setEl('el-hi',    '—');
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);

loadElectricity();
setInterval(loadElectricity, 60 * 60 * 1000); // 60 min

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000); // 30 min

loadTrains();
setInterval(loadTrains, 60 * 1000); // 1 min
