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

// ── Bootstrap ─────────────────────────────────────────────────────────────────
updateClock();
setInterval(updateClock, 1000);
