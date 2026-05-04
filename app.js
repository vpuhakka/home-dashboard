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

// Stubs replaced in later tasks
export function getWeatherEmoji() {}
export function getWeatherLabel() {}
export function windDirection() {}
export function getUpcomingDepartures() { return []; }

// ── Render + Fetch ────────────────────────────────────────────────────────────
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

// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);

loadElectricity();
setInterval(loadElectricity, 60 * 60 * 1000); // 60 min
