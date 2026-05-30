// iOS 12.5.6 Compatible Dashboard
// Uses ES5 syntax, no async/await, no fetch polyfill via XMLHttpRequest

// Helsinki timezone helper (UTC+2 or UTC+3 for DST)
function toHelsinkiTime(date) {
  // Get UTC time
  var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  // Helsinki is UTC+2, +1 more for DST (late March to late October)
  var helsinkiOffset = 2 * 60 * 60 * 1000; // base 2 hours
  var month = date.getUTCMonth();
  var day = date.getUTCDate();
  // Simple DST check: March 29 to October 25 (approximate)
  if ((month > 2 && month < 9) || (month === 2 && day >= 29) || (month === 9 && day < 25)) {
    helsinkiOffset += 60 * 60 * 1000; // +1 hour for DST
  }
  return new Date(utc + helsinkiOffset);
}

function formatHelsinkiDate(date) {
  var h = toHelsinkiTime(date);
  return pad(h.getDate()) + '.' + pad(h.getMonth() + 1) + '.' + h.getFullYear();
}

function formatHelsinkiTime(date) {
  var h = toHelsinkiTime(date);
  return pad(h.getHours()) + ':' + pad(h.getMinutes());
}

function pad(n) {
  return n < 10 ? '0' + n : n;
}

function setEl(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text;
}

function stampUpdated() {
  setEl('last-updated', formatHelsinkiTime(new Date()));
}

// Clock
function updateClock() {
  var now = new Date();
  setEl('clock', formatHelsinkiTime(now));
  
  // Update trains panel date/time
  var days = ['Sunnuntai', 'Maanantai', 'Tiistai', 'Keskiviikko', 'Torstai', 'Perjantai', 'Lauantai'];
  var months = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];
  
  var h = toHelsinkiTime(now);
  var dayName = days[h.getDay()];
  var dateStr = h.getDate() + '. ' + months[h.getMonth()] + 'ta ' + h.getFullYear();
  
  setEl('current-date', dayName + ' ' + dateStr);
  setEl('current-time', pad(h.getHours()) + ':' + pad(h.getMinutes()));
}

// Electricity
function getTodayPrices(data) {
  var allPrices = data.prices.filter(function(p) {
    return p.price !== null && p.price !== undefined;
  }).sort(function(a, b) {
    return new Date(a.startDate) - new Date(b.startDate);
  });
  
  var today = new Date();
  var todayStr = formatHelsinkiDate(today);
  var todayPrices = allPrices.filter(function(p) {
    var d = new Date(p.startDate);
    return formatHelsinkiDate(d) === todayStr;
  });
  
  return todayPrices.length > 0 ? todayPrices : allPrices;
}

function getCurrentPrice(todayPrices) {
  var now = new Date();
  for (var i = 0; i < todayPrices.length; i++) {
    var p = todayPrices[i];
    var start = new Date(p.startDate);
    var end = new Date(start.getTime() + 3600000);
    if (start <= now && now < end) {
      return p.price;
    }
  }
  return todayPrices[0] ? todayPrices[0].price : null;
}

function getDayHiLo(todayPrices) {
  if (!todayPrices.length) return { hi: null, lo: null };
  var vals = todayPrices.map(function(p) { return p.price; });
  return { hi: Math.max.apply(null, vals), lo: Math.min.apply(null, vals) };
}

function getPriceClass(price, lo, hi) {
  var range = hi - lo || 1;
  var ratio = (price - lo) / range;
  if (ratio < 0.33) return 'price-low';
  if (ratio < 0.67) return 'price-mid';
  return 'price-high';
}

// Weather
var WEATHER_EMOJIS = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  95: '⛈️'
};

var WEATHER_LABELS = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Foggy',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
  80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
  95: 'Thunderstorm'
};

function getWeatherEmoji(code) { return WEATHER_EMOJIS[code] || '🌡️'; }
function getWeatherLabel(code) { return WEATHER_LABELS[code] || 'Unknown'; }

function windDirection(degrees) {
  var dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
}

var WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=60.4736&longitude=25.0900&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe%2FHelsinki&forecast_days=4';

var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function makeEl(tag, className, text) {
  var el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderWeather(data) {
  var c = data.current;
  setEl('w-emoji', getWeatherEmoji(c.weather_code));
  setEl('w-temp', String(Math.round(c.temperature_2m)));
  setEl('w-condition', getWeatherLabel(c.weather_code));
  setEl('w-details', 
    'Rain ' + c.precipitation_probability + '% · ' +
    'Wind ' + Math.round(c.wind_speed_10m) + ' m/s ' + windDirection(c.wind_direction_10m) + ' · ' +
    'Humidity ' + c.relative_humidity_2m + '%'
  );

  var d = data.daily;
  var forecastEl = document.getElementById('w-forecast');
  while (forecastEl.firstChild) forecastEl.removeChild(forecastEl.firstChild);

  for (var i = 1; i <= 3; i++) {
    var dayName = DAY_NAMES[new Date(d.time[i] + 'T12:00:00').getDay()];
    var row = document.createElement('div');
    row.className = 'forecast-row';
    row.appendChild(makeEl('span', 'forecast-day', dayName));
    row.appendChild(makeEl('span', null, getWeatherEmoji(d.weather_code[i])));
    row.appendChild(makeEl('span', 'forecast-temp',
      Math.round(d.temperature_2m_max[i]) + '° / ' + Math.round(d.temperature_2m_min[i]) + '°'
    ));
    forecastEl.appendChild(row);
  }
}

function loadWeather() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', WEATHER_URL, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          renderWeather(JSON.parse(xhr.responseText));
          stampUpdated();
        } catch (e) {
          console.error('Weather parse error:', e);
        }
      } else {
        setEl('w-emoji', '—');
        setEl('w-temp', '—');
        setEl('w-condition', 'Weather unavailable');
        setEl('w-details', '');
      }
    }
  };
  xhr.send();
}

// Trains
var FROM_STATION = 'JP';
var TO_STATION = 'PSL';

function getUpcomingDepartures(trains, fromCode, toCode, count) {
  count = count || 3;
  var now = new Date();
  var departures = [];

  for (var i = 0; i < trains.length; i++) {
    var train = trains[i];
    var rows = train.timeTableRows || [];
    var fromIdx = -1;
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].stationShortCode === fromCode && rows[j].type === 'DEPARTURE') {
        fromIdx = j;
        break;
      }
    }
    if (fromIdx === -1) continue;

    var goesToDest = false;
    for (var k = fromIdx + 1; k < rows.length; k++) {
      if (rows[k].stationShortCode === toCode) {
        goesToDest = true;
        break;
      }
    }
    if (!goesToDest) continue;

    var row = rows[fromIdx];
    var scheduled = new Date(row.scheduledTime);
    if (scheduled <= now) continue;

    departures.push({ scheduled: scheduled, delayMin: row.differenceInMinutes || 0 });
  }

  departures.sort(function(a, b) { return a.scheduled - b.scheduled; });
  return departures.slice(0, count);
}

function renderTrains(departures) {
  var list = document.getElementById('trains-list');
  while (list.firstChild) list.removeChild(list.firstChild);

  if (!departures.length) {
    var row = document.createElement('div');
    row.className = 'train-row';
    var span = document.createElement('span');
    span.className = 'train-time dash';
    span.textContent = '—';
    row.appendChild(span);
    list.appendChild(row);
    return;
  }

  for (var i = 0; i < departures.length; i++) {
    var dep = departures[i];
    var time = formatHelsinkiTime(dep.scheduled);
    var delay = dep.delayMin;
    var statusClass = delay === 0 ? 'status-ok' : (delay <= 5 ? 'status-delay' : 'status-late');
    var statusText = delay === 0 ? 'On time' : ('+' + delay + ' min');

    var row = document.createElement('div');
    row.className = 'train-row';

    var timeEl = document.createElement('span');
    timeEl.className = 'train-time';
    timeEl.textContent = time;

    var statusEl = document.createElement('span');
    statusEl.className = 'train-status ' + statusClass;
    statusEl.textContent = statusText;

    row.appendChild(timeEl);
    row.appendChild(statusEl);
    list.appendChild(row);
  }
}

function loadTrains() {
  var xhr = new XMLHttpRequest();
  var url = 'https://rata.digitraffic.fi/api/v1/live-trains/station/' + FROM_STATION + 
    '?departing_trains=20&include_nonstopping=false';
  xhr.open('GET', url, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          var trains = JSON.parse(xhr.responseText);
          renderTrains(getUpcomingDepartures(trains, FROM_STATION, TO_STATION));
          stampUpdated();
        } catch (e) {
          console.error('Trains parse error:', e);
          renderTrains([]);
        }
      } else {
        renderTrains([]);
      }
    }
  };
  xhr.send();
}

// Electricity rendering
function renderElectricity(data) {
  var today = getTodayPrices(data);
  var current = getCurrentPrice(today);
  var hiLo = getDayHiLo(today);
  var hi = hiLo.hi;
  var lo = hiLo.lo;

  setEl('el-price', current !== null ? current.toFixed(1) : '—');
  setEl('el-lo', lo !== null ? lo.toFixed(1) : '—');
  setEl('el-hi', hi !== null ? hi.toFixed(1) : '—');
  
  if (today.length > 0) {
    var firstPriceDate = new Date(today[0].startDate);
    var todayDate = new Date();
    var todayStr = formatHelsinkiDate(todayDate);
    var priceDateStr = formatHelsinkiDate(firstPriceDate);
    var dateLabel = priceDateStr === todayStr ? '' : ('· ' + priceDateStr);
    setEl('el-date', dateLabel);
  }

  var chart = document.getElementById('chart');
  while (chart.firstChild) chart.removeChild(chart.firstChild);
  if (!today.length) return;

  var range = (hi - lo) || 1;
  var now = new Date();
  
  // Set Y-axis labels (5 price levels)
  var yRange = hi - lo || 1;
  setEl('y-1', hi.toFixed(0));
  setEl('y-2', (hi - yRange * 0.25).toFixed(0));
  setEl('y-3', (hi - yRange * 0.5).toFixed(0));
  setEl('y-4', (hi - yRange * 0.75).toFixed(0));
  setEl('y-5', lo.toFixed(0));
  
  // Set X-axis labels (5 time points)
  if (today.length > 0) {
    var firstTime = new Date(today[0].startDate);
    var lastTime = new Date(today[today.length - 1].startDate);
    var q1Index = Math.floor(today.length * 0.25);
    var q2Index = Math.floor(today.length * 0.5);
    var q3Index = Math.floor(today.length * 0.75);
    
    setEl('x-1', pad(firstTime.getHours()) + ':00');
    setEl('x-2', pad(new Date(today[q1Index].startDate).getHours()) + ':00');
    setEl('x-3', pad(new Date(today[q2Index].startDate).getHours()) + ':00');
    setEl('x-4', pad(new Date(today[q3Index].startDate).getHours()) + ':00');
    setEl('x-5', pad(lastTime.getHours()) + ':00');
  }
  
  for (var i = 0; i < today.length; i++) {
    var p = today[i];
    var bar = document.createElement('div');
    bar.className = 'bar ' + getPriceClass(p.price, lo, hi);
    bar.style.height = Math.max(4, ((p.price - lo) / range) * 100) + '%';

    var start = new Date(p.startDate);
    if (start <= now && now < new Date(start.getTime() + 3600000)) {
      bar.className += ' current';
    }
    bar.title = formatHelsinkiTime(start) + ': ' + p.price.toFixed(1) + ' c/kWh';
    chart.appendChild(bar);
  }
}

function loadElectricity() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/electricity', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          console.log('Electricity loaded:', data);
          renderElectricity(data);
          stampUpdated();
        } catch (e) {
          console.error('Electricity parse error:', e);
          setEl('el-price', '—');
          setEl('el-lo', '—');
          setEl('el-hi', '—');
        }
      } else {
        console.error('Electricity HTTP error:', xhr.status);
        setEl('el-price', '—');
        setEl('el-lo', '—');
        setEl('el-hi', '—');
      }
    }
  };
  xhr.send();
}

// News
var newsItems = [];

function parseRSS(xmlText) {
  var parser = new DOMParser();
  var xml = parser.parseFromString(xmlText, 'text/xml');
  var items = xml.querySelectorAll('item');
  var titles = [];
  for (var i = 0; i < items.length && i < 15; i++) {
    var title = items[i].querySelector('title');
    if (title && title.textContent) {
      titles.push(title.textContent.trim());
    }
  }
  return titles;
}

function renderNews() {
  var newsList = document.getElementById('news-list');
  if (!newsList) return;
  
  while (newsList.firstChild) {
    newsList.removeChild(newsList.firstChild);
  }
  
  if (newsItems.length === 0) {
    var emptyItem = document.createElement('div');
    emptyItem.className = 'news-item';
    emptyItem.textContent = 'No news available';
    newsList.appendChild(emptyItem);
    return;
  }
  
  for (var i = 0; i < newsItems.length; i++) {
    var item = document.createElement('div');
    item.className = 'news-item';
    item.textContent = newsItems[i];
    newsList.appendChild(item);
  }
}

function loadNews() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/news', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          newsItems = parseRSS(xhr.responseText);
          renderNews();
        } catch (e) {
          console.error('News parse error:', e);
          newsItems = ['News unavailable'];
          renderNews();
        }
      } else {
        console.error('News HTTP error:', xhr.status);
        newsItems = ['News unavailable'];
        renderNews();
      }
    }
  };
  xhr.send();
}

// Bootstrap
updateClock();
setInterval(updateClock, 1000);

loadElectricity();
setInterval(loadElectricity, 60 * 60 * 1000);

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000);

loadTrains();
setInterval(loadTrains, 60 * 1000);

loadNews();
setInterval(loadNews, 10 * 60 * 1000);
