# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A home dashboard webpage hosted on a local laptop and displayed on an iPad mini. It shows:
- Current electricity spot price (Finland) with today's high/low peaks
- Weather forecast for Järvenpää
- Train timetables from Järvenpää station to Pasila

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
| Trains | `rata.digitraffic.fi/api/v1/live-trains/station/JP` | 1 min |

Note: The trains API uses station code `JP` (Järvenpää), not `JPÄ` as the original plan draft said — `JP` was verified against the live API.
