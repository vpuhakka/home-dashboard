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
