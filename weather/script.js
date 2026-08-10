/* ===========================================================
   MERIDIAN — Weather Station
   Data: Open-Meteo (geocoding + forecast), no API key required.
   Docs: https://open-meteo.com/en/docs
   =========================================================== */

(() => {
  'use strict';

  const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

  const QUICK_CITIES = ['Delhi', 'Tokyo', 'London', 'New York', 'Nairobi', 'São Paulo'];

  /* WMO weather interpretation codes -> { label, icon } */
  const WEATHER_CODES = {
    0:  { label: 'Clear sky',            icon: '☀️' },
    1:  { label: 'Mainly clear',         icon: '🌤️' },
    2:  { label: 'Partly cloudy',        icon: '⛅' },
    3:  { label: 'Overcast',             icon: '☁️' },
    45: { label: 'Fog',                  icon: '🌫️' },
    48: { label: 'Depositing rime fog',  icon: '🌫️' },
    51: { label: 'Light drizzle',        icon: '🌦️' },
    53: { label: 'Drizzle',              icon: '🌦️' },
    55: { label: 'Dense drizzle',        icon: '🌧️' },
    56: { label: 'Freezing drizzle',     icon: '🌧️' },
    57: { label: 'Dense freezing drizzle', icon: '🌧️' },
    61: { label: 'Slight rain',          icon: '🌦️' },
    63: { label: 'Rain',                 icon: '🌧️' },
    65: { label: 'Heavy rain',           icon: '🌧️' },
    66: { label: 'Freezing rain',        icon: '🌧️' },
    67: { label: 'Heavy freezing rain',  icon: '🌨️' },
    71: { label: 'Slight snow',          icon: '🌨️' },
    73: { label: 'Snow',                 icon: '❄️' },
    75: { label: 'Heavy snow',           icon: '❄️' },
    77: { label: 'Snow grains',          icon: '❄️' },
    80: { label: 'Slight rain showers',  icon: '🌦️' },
    81: { label: 'Rain showers',         icon: '🌧️' },
    82: { label: 'Violent rain showers', icon: '⛈️' },
    85: { label: 'Slight snow showers',  icon: '🌨️' },
    86: { label: 'Heavy snow showers',   icon: '🌨️' },
    95: { label: 'Thunderstorm',         icon: '⛈️' },
    96: { label: 'Thunderstorm + hail',  icon: '⛈️' },
    99: { label: 'Severe thunderstorm',  icon: '⛈️' },
  };

  const weatherInfo = (code) => WEATHER_CODES[code] || { label: 'Unknown', icon: '🌡️' };

  /* ---------------- DOM refs ---------------- */

  const $ = (id) => document.getElementById(id);

  const els = {
    form: $('searchForm'),
    input: $('citySearch'),
    suggestList: $('suggestList'),
    locateBtn: $('locateBtn'),
    unitBtns: document.querySelectorAll('.unit-btn'),

    emptyState: $('emptyState'),
    loadingState: $('loadingState'),
    errorState: $('errorState'),
    errorTitle: $('errorTitle'),
    errorBody: $('errorBody'),
    retryBtn: $('retryBtn'),
    dashboard: $('dashboard'),
    quickCities: $('quickCities'),

    placeCountry: $('placeCountry'),
    placeName: $('placeName'),
    placeCoords: $('placeCoords'),
    heroTemp: $('heroTemp'),
    conditionIcon: $('conditionIcon'),
    conditionLabel: $('conditionLabel'),
    heroFeels: $('heroFeels'),
    heroUpdated: $('heroUpdated'),

    compassNeedle: $('compassNeedle'),
    compassTicks: $('compassTicks'),
    windSpeed: $('windSpeed'),
    windDir: $('windDir'),

    metricHumidity: $('metricHumidity'),
    humidityBar: $('humidityBar'),
    metricPressure: $('metricPressure'),
    metricPrecip: $('metricPrecip'),
    metricCloud: $('metricCloud'),
    metricUv: $('metricUv'),
    metricVisibility: $('metricVisibility'),

    hourlyStrip: $('hourlyStrip'),
    hourlyDate: $('hourlyDate'),
    sunDot: $('sunDot'),
    sunrise: $('sunrise'),
    sunset: $('sunset'),
    forecastGrid: $('forecastGrid'),
  };

  /* ---------------- State ---------------- */

  let unit = 'c';                 // 'c' | 'f'
  let currentWeatherData = null;  // last successful payload, kept for unit re-render
  let currentLocationLabel = null;
  let suggestions = [];
  let activeSuggestIndex = -1;
  let debounceTimer = null;
  let searchAbortController = null;

  /* ---------------- Helpers ---------------- */

  const cToF = (c) => (c * 9) / 5 + 32;
  const fmtTemp = (celsius, { decimals = 0 } = {}) => {
    if (celsius === null || celsius === undefined || Number.isNaN(celsius)) return '—';
    const value = unit === 'f' ? cToF(celsius) : celsius;
    return `${value.toFixed(decimals)}°${unit.toUpperCase()}`;
  };

  const compassDirection = (deg) => {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  };

  const formatHour = (isoString, timezone) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: timezone });
  };

  const formatClock = (isoString, timezone) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone });
  };

  const formatDow = (isoString) => {
    const date = new Date(isoString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  /* ---------------- View state switching ---------------- */

  function showState(name) {
    els.emptyState.hidden = name !== 'empty';
    els.loadingState.hidden = name !== 'loading';
    els.errorState.hidden = name !== 'error';
    els.dashboard.hidden = name !== 'dashboard';
  }

  function showError(title, body) {
    els.errorTitle.textContent = title;
    els.errorBody.textContent = body;
    showState('error');
  }

  /* ---------------- Networking: geocoding ---------------- */

  async function geocodeCity(query) {
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding service responded with ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  }

  /* ---------------- Networking: forecast ---------------- */

  async function fetchWeather(latitude, longitude) {
    const params = new URLSearchParams({
      latitude,
      longitude,
      timezone: 'auto',
      forecast_days: '8',
      current: [
        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
        'precipitation', 'weather_code', 'wind_speed_10m', 'wind_direction_10m',
        'pressure_msl', 'cloud_cover', 'is_day'
      ].join(','),
      hourly: [
        'temperature_2m', 'precipitation_probability', 'weather_code', 'visibility'
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'sunrise', 'sunset', 'precipitation_probability_max', 'uv_index_max'
      ].join(','),
    });

    const url = `${FORECAST_URL}?${params.toString()}`;

    let response;
    try {
      response = await fetch(url);
    } catch (networkErr) {
      // fetch() itself throws on DNS failure / offline / CORS block
      throw new Error('NETWORK_DOWN');
    }

    if (!response.ok) {
      throw new Error(`FORECAST_HTTP_${response.status}`);
    }

    return response.json();
  }

  /* ---------------- Orchestration ---------------- */

  async function loadCity(place) {
    // place: { name, country, admin1, latitude, longitude, timezone? }
    if (searchAbortController) searchAbortController.abort();
    hideSuggestions();
    showState('loading');

    try {
      const weather = await fetchWeather(place.latitude, place.longitude);
      currentWeatherData = weather;
      currentLocationLabel = place;
      renderDashboard(place, weather);
      showState('dashboard');
      persistLastCity(place);
    } catch (err) {
      console.error('Weather fetch failed:', err);
      if (err.message === 'NETWORK_DOWN') {
        showError('No connection to the network', 'Check your internet connection and try again.');
      } else if (/^FORECAST_HTTP_5/.test(err.message)) {
        showError('The weather service is having trouble', 'Open‑Meteo returned a server error. Try again shortly.');
      } else if (/^FORECAST_HTTP_4/.test(err.message)) {
        showError('That request was rejected', 'The coordinates for this city look invalid. Try a different search.');
      } else {
        showError('Something went wrong', 'An unexpected error stopped the readout from loading.');
      }
    }
  }

  async function handleSearchSubmit(rawQuery) {
    const query = rawQuery.trim();
    if (!query) return;

    showState('loading');
    try {
      const results = await geocodeCity(query);
      if (results.length === 0) {
        showError('No station found', `Nothing came back for "${query}". Check the spelling and try again.`);
        return;
      }
      await loadCity(results[0]);
    } catch (err) {
      console.error('Geocoding failed:', err);
      showError('Couldn\u2019t search for that city', 'The location lookup failed. Check your connection and try again.');
    }
  }

  function handleGeolocate() {
    if (!('geolocation' in navigator)) {
      showError('Location isn\u2019t available', 'Your browser doesn\u2019t support geolocation. Try searching by city name instead.');
      return;
    }
    showState('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await loadCity({ name: 'Current location', country: '', admin1: '', latitude, longitude });
      },
      (err) => {
        console.error('Geolocation failed:', err);
        showError('Couldn\u2019t get your location', 'Location access was blocked or timed out. Try searching by city name instead.');
      },
      { timeout: 10000 }
    );
  }

  /* ---------------- Rendering ---------------- */

  function renderDashboard(place, data) {
    const tz = data.timezone;
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // --- Hero ---
    const locationParts = [place.admin1, place.country].filter(Boolean);
    els.placeCountry.textContent = locationParts.join(' · ') || '\u2014';
    els.placeName.textContent = place.name;
    els.placeCoords.textContent = `${place.latitude.toFixed(2)}°, ${place.longitude.toFixed(2)}°  ·  ${tz}`;

    els.heroTemp.textContent = fmtTemp(current.temperature_2m);
    const wx = weatherInfo(current.weather_code);
    els.conditionIcon.textContent = wx.icon;
    els.conditionLabel.textContent = current.is_day ? wx.label : `${wx.label} (night)`;
    els.heroFeels.textContent = `Feels like ${fmtTemp(current.apparent_temperature)}`;
    els.heroUpdated.textContent = `Updated ${formatClock(current.time, tz)} local time`;

    // --- Wind compass ---
    buildCompassTicks();
    const windDeg = current.wind_direction_10m;
    els.compassNeedle.setAttribute('transform', `rotate(${windDeg} 110 110)`);
    els.windSpeed.textContent = current.wind_speed_10m.toFixed(0);
    els.windDir.textContent = `${compassDirection(windDeg)} · ${windDeg}°`;

    // --- Metric grid ---
    els.metricHumidity.innerHTML = `${current.relative_humidity_2m}<small>%</small>`;
    els.humidityBar.style.width = `${current.relative_humidity_2m}%`;
    els.metricPressure.innerHTML = `${Math.round(current.pressure_msl)}<small>hPa</small>`;
    els.metricPrecip.innerHTML = `${current.precipitation.toFixed(1)}<small>mm</small>`;
    els.metricCloud.innerHTML = `${current.cloud_cover}<small>%</small>`;
    els.metricUv.textContent = daily.uv_index_max?.[0]?.toFixed(1) ?? '\u2014';

    const nowIndex = findNearestHourIndex(hourly.time, current.time);
    const visibilityM = hourly.visibility?.[nowIndex];
    els.metricVisibility.innerHTML = visibilityM != null
      ? `${(visibilityM / 1000).toFixed(1)}<small>km</small>`
      : '\u2014';

    // --- Hourly strip (next 24h from now) ---
    els.hourlyDate.textContent = new Date(current.time).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    renderHourly(hourly, nowIndex, tz);

    // --- Sun arc ---
    renderSun(daily, current, tz);

    // --- 7-day forecast ---
    renderForecast(daily);
  }

  function findNearestHourIndex(timeArray, targetIso) {
    const target = new Date(targetIso).getTime();
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < timeArray.length; i++) {
      const diff = Math.abs(new Date(timeArray[i]).getTime() - target);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    return bestIdx;
  }

  function buildCompassTicks() {
    if (els.compassTicks.childElementCount > 0) return; // build once
    const frag = document.createDocumentFragment();
    for (let deg = 0; deg < 360; deg += 15) {
      const isMajor = deg % 90 === 0;
      const rad = (deg - 90) * (Math.PI / 180);
      const rOuter = 98;
      const rInner = isMajor ? 86 : 90;
      const x1 = 110 + rOuter * Math.cos(rad);
      const y1 = 110 + rOuter * Math.sin(rad);
      const x2 = 110 + rInner * Math.cos(rad);
      const y2 = 110 + rInner * Math.sin(rad);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(1));
      line.setAttribute('y1', y1.toFixed(1));
      line.setAttribute('x2', x2.toFixed(1));
      line.setAttribute('y2', y2.toFixed(1));
      line.setAttribute('class', `compass-tick${isMajor ? ' major' : ''}`);
      frag.appendChild(line);
    }
    els.compassTicks.appendChild(frag);
  }

  function renderHourly(hourly, startIdx, tz) {
    els.hourlyStrip.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = startIdx; i < Math.min(startIdx + 24, hourly.time.length); i++) {
      const wx = weatherInfo(hourly.weather_code[i]);
      const card = document.createElement('div');
      card.className = 'hour-card';
      card.innerHTML = `
        <span class="hour-time">${i === startIdx ? 'Now' : formatHour(hourly.time[i], tz)}</span>
        <span class="hour-icon">${wx.icon}</span>
        <span class="hour-temp">${fmtTemp(hourly.temperature_2m[i])}</span>
        <span class="hour-precip">${hourly.precipitation_probability[i]}%</span>
      `;
      frag.appendChild(card);
    }
    els.hourlyStrip.appendChild(frag);
  }

  function renderSun(daily, current, tz) {
    const sunrise = new Date(daily.sunrise[0]).getTime();
    const sunset = new Date(daily.sunset[0]).getTime();
    const now = new Date(current.time).getTime();

    els.sunrise.textContent = formatClock(daily.sunrise[0], tz);
    els.sunset.textContent = formatClock(daily.sunset[0], tz);

    let progress = (now - sunrise) / (sunset - sunrise);
    progress = Math.min(1, Math.max(0, progress));

    // arc path: M10,100 A90,90 0 0 1 190,100  -> semicircle
    const angle = Math.PI * (1 - progress); // PI at sunrise (left), 0 at sunset (right)
    const cx = 100, cy = 100, r = 90;
    const x = cx - r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    els.sunDot.setAttribute('cx', x.toFixed(1));
    els.sunDot.setAttribute('cy', y.toFixed(1));
  }

  function renderForecast(daily) {
    els.forecastGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < daily.time.length; i++) {
      const wx = weatherInfo(daily.weather_code[i]);
      const day = document.createElement('div');
      day.className = 'forecast-day';
      day.innerHTML = `
        <span class="forecast-dow">${i === 0 ? 'Today' : formatDow(daily.time[i])}</span>
        <span class="forecast-icon">${wx.icon}</span>
        <span class="forecast-hi">${fmtTemp(daily.temperature_2m_max[i])}</span>
        <span class="forecast-lo">${fmtTemp(daily.temperature_2m_min[i])}</span>
        <span class="forecast-rain">${daily.precipitation_probability_max[i] ?? 0}% rain</span>
      `;
      frag.appendChild(day);
    }
    els.forecastGrid.appendChild(frag);
  }

  function rerenderForUnitChange() {
    if (currentWeatherData && currentLocationLabel) {
      renderDashboard(currentLocationLabel, currentWeatherData);
    }
  }

  /* ---------------- Suggestions / autocomplete ---------------- */

  function hideSuggestions() {
    els.suggestList.hidden = true;
    els.suggestList.innerHTML = '';
    suggestions = [];
    activeSuggestIndex = -1;
  }

  function renderSuggestions(results) {
    suggestions = results;
    activeSuggestIndex = -1;
    if (results.length === 0) {
      hideSuggestions();
      return;
    }
    els.suggestList.innerHTML = results.map((r, i) => {
      const meta = [r.admin1, r.country].filter(Boolean).join(', ');
      return `<li role="option" data-index="${i}">${escapeHtml(r.name)}<small>${escapeHtml(meta)}</small></li>`;
    }).join('');
    els.suggestList.hidden = false;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  async function handleInputChange(value) {
    clearTimeout(debounceTimer);
    const query = value.trim();
    if (query.length < 2) {
      hideSuggestions();
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const results = await geocodeCity(query);
        renderSuggestions(results);
      } catch (err) {
        console.error('Suggestion lookup failed:', err);
        hideSuggestions();
      }
    }, 300);
  }

  /* ---------------- Persistence ---------------- */

  function persistLastCity(place) {
    try {
      localStorage.setItem('meridian:lastCity', JSON.stringify(place));
    } catch (_) { /* storage unavailable — non-critical */ }
  }

  function loadLastCity() {
    try {
      const raw = localStorage.getItem('meridian:lastCity');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /* ---------------- Event wiring ---------------- */

  function initQuickCities() {
    els.quickCities.innerHTML = QUICK_CITIES.map(c => `<button type="button" class="chip" data-city="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
    els.quickCities.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      els.input.value = btn.dataset.city;
      handleSearchSubmit(btn.dataset.city);
    });
  }

  function initEvents() {
    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (activeSuggestIndex >= 0 && suggestions[activeSuggestIndex]) {
        loadCity(suggestions[activeSuggestIndex]);
      } else {
        handleSearchSubmit(els.input.value);
      }
    });

    els.input.addEventListener('input', (e) => handleInputChange(e.target.value));

    els.input.addEventListener('keydown', (e) => {
      if (els.suggestList.hidden) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestIndex = Math.min(activeSuggestIndex + 1, suggestions.length - 1);
        highlightSuggestion();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestIndex = Math.max(activeSuggestIndex - 1, 0);
        highlightSuggestion();
      } else if (e.key === 'Escape') {
        hideSuggestions();
      }
    });

    els.suggestList.addEventListener('click', (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const idx = Number(li.dataset.index);
      loadCity(suggestions[idx]);
    });

    document.addEventListener('click', (e) => {
      if (!els.form.contains(e.target)) hideSuggestions();
    });

    els.locateBtn.addEventListener('click', handleGeolocate);
    els.retryBtn.addEventListener('click', () => showState('empty'));

    els.unitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.unit === unit) return;
        unit = btn.dataset.unit;
        els.unitBtns.forEach(b => b.classList.toggle('is-active', b === btn));
        rerenderForUnitChange();
      });
    });
  }

  function highlightSuggestion() {
    [...els.suggestList.children].forEach((li, i) => {
      li.classList.toggle('is-active', i === activeSuggestIndex);
    });
    if (activeSuggestIndex >= 0) {
      els.input.value = suggestions[activeSuggestIndex].name;
    }
  }

  /* ---------------- Init ---------------- */

  function init() {
    showState('empty');
    initQuickCities();
    initEvents();

    const last = loadLastCity();
    if (last) {
      els.input.value = last.name;
      loadCity(last);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
