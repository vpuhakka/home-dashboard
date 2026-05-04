# Home Dashboard — Design Spec

**Date:** 2026-05-04  
**Status:** Approved

## Overview

A single-page home dashboard displayed on an iPad mini in landscape orientation, hosted on a local laptop. Always-on during the day, off at night. Shows electricity spot prices, Järvenpää weather, and Järvenpää–Pasila train departures.

---

## Architecture

A single `index.html` file with embedded CSS and JavaScript. Served by a simple static file server on the laptop (e.g. `python3 -m http.server 8080`). The iPad opens the URL in its browser.

- No build step, no dependencies, no bundler
- All data fetched client-side via `fetch()` with `setInterval` for auto-refresh
- No backend, no API keys — all data sources are public and CORS-enabled

---

## Layout

iPad mini landscape (~1024×768). Three columns, full-height:

| Column | Width | Content |
|--------|-------|---------|
| Electricity | 40% | Price + hi/lo + hourly chart |
| Weather | 40% | Current + forecast |
| Trains | 20% | Next 3 departures |

Global: current time in top-right corner, last-updated timestamp at page bottom.

---

## Panels

### Electricity (40%)

- Large current spot price in c/kWh
- Today's daily low (green ↓) and high (red ↑)
- Hourly bar chart: 24 bars for 00:00–23:00
  - Current hour highlighted with a border
  - Color-coded: low prices light blue, mid blue, high orange/red
- **Data source:** `https://api.porssisahko.net/v1/latest-prices.json` — free, no auth, CORS-enabled
- **Refresh:** on page load, then every 60 minutes (prices are fixed for the day)

### Weather (40%)

- Large current temperature
- Large weather emoji alongside temperature (☀️ ⛅ 🌧️ 🌨️ etc.)
- Current condition text (e.g. "Partly cloudy")
- Secondary info: rain probability, wind speed + direction, humidity
- 3-day forecast below a divider: day name, temperature, condition emoji
- **Data source:** Open-Meteo (`https://api.open-meteo.com/`) — free, no key, CORS-enabled
  - Järvenpää coordinates: `60.4736°N, 25.0900°E`
- **Refresh:** every 30 minutes

### Trains (20%)

- Header: "→ Pasila"
- Next 3 departures from Järvenpää (`JÄR`) to Pasila (`PSL`)
- Each departure shows: time (large, bold) + status ("On time" green, "+N min" amber/red)
- Dividers between departures
- **Data source:** Digitraffic Finland (`https://rata.digitraffic.fi/api/v1/`) — free, no auth, CORS-enabled
- **Refresh:** every 2 minutes

---

## Visual Design

- **Theme:** Light (white panels, light grey background)
- **Panel style:** White cards with subtle box shadow, rounded corners
- **Typography:** System font, large numbers for primary values
- **Colors:** Green for low/good (↓ prices, on time), red for high/bad (↑ prices, delays)

---

## Error Handling

If a fetch fails, the affected panel displays `—` in place of values. No crash, no stale data shown as current.

---

## Data Sources Summary

| Data | API | Auth | Refresh |
|------|-----|------|---------|
| Electricity prices | porssisahko.net | None | 60 min |
| Weather | open-meteo.com | None | 30 min |
| Train departures | rata.digitraffic.fi | None | 2 min |
