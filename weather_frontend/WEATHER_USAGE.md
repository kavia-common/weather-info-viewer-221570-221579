# Weather Frontend - Configuration

This app reads VITE_API_BASE from environment (e.g., .env) and calls:

- GET `${VITE_API_BASE}/weather?city=<name>`
- GET `${VITE_API_BASE}/weather?lat=<lat>&lon=<lon>`

The response is mapped flexibly to support common weather APIs (OpenWeather-like or WeatherAPI-like). Provide fields such as:
- name (or location.name), sys.country (or location.country)
- main.temp (Kelvin) or current.temp_c/temp_f
- weather[0].description and weather[0].icon (or current.condition.text/icon)
- main.humidity (or current.humidity)
- wind.speed (m/s) or current.wind_kph
- dt (unix seconds) or current.last_updated

Environment variables (no new keys introduced):
- VITE_API_BASE (required)
- Others present in the environment are ignored by this frontend unless used elsewhere.

Dev:
- npm run dev (served on port 3000 per vite.config.ts)
