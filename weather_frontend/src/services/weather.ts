/**
 * WeatherService - makes HTTP calls to a configurable weather API.
 * All requests use import.meta.env.VITE_API_BASE as the base URL.
 * If VITE_API_BASE is missing, the caller should surface a UI notice.
 */

export type WeatherResult = {
  name: string
  country?: string
  tempC: number
  tempF?: number
  condition: string
  icon?: string
  humidity?: number
  windKph?: number
  windMph?: number
  observedAt?: string
}

// PUBLIC_INTERFACE
export async function fetchWeatherByCity(city: string, opts?: { signal?: AbortSignal; timeoutMs?: number }): Promise<WeatherResult> {
  /** Fetch current weather by city name using the configured API base.
   * Expects API to accept /weather?city=<city>.
   */
  const base = import.meta.env.VITE_API_BASE as string | undefined
  if (!base) {
    throw new Error('VITE_API_BASE is not set. Please configure the environment variable.')
  }
  const timeoutMs = opts?.timeoutMs ?? 10000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException('Request timeout', 'TimeoutError')), timeoutMs)

  try {
    const url = new URL('/weather', base)
    url.searchParams.set('city', city.trim())

    const res = await fetch(url.toString(), { signal: mergeSignals(controller.signal, opts?.signal) })
    if (!res.ok) throw await buildHttpError(res)

    const data = await res.json()
    return mapApiToWeatherResult(data)
  } finally {
    clearTimeout(timeout)
  }
}

// PUBLIC_INTERFACE
export async function fetchWeatherByCoords(lat: number, lon: number, opts?: { signal?: AbortSignal; timeoutMs?: number }): Promise<WeatherResult> {
  /** Fetch current weather by coordinates using the configured API base.
   * Expects API to accept /weather?lat=<>&lon=<>.
   */
  const base = import.meta.env.VITE_API_BASE as string | undefined
  if (!base) {
    throw new Error('VITE_API_BASE is not set. Please configure the environment variable.')
  }
  const timeoutMs = opts?.timeoutMs ?? 10000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new DOMException('Request timeout', 'TimeoutError')), timeoutMs)

  try {
    const url = new URL('/weather', base)
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))

    const res = await fetch(url.toString(), { signal: mergeSignals(controller.signal, opts?.signal) })
    if (!res.ok) throw await buildHttpError(res)

    const data = await res.json()
    return mapApiToWeatherResult(data)
  } finally {
    clearTimeout(timeout)
  }
}

function mergeSignals(a: AbortSignal, b?: AbortSignal) {
  if (!b) return a
  const controller = new AbortController()
  const forwardAbort = () => controller.abort()
  a.addEventListener('abort', forwardAbort, { once: true })
  b.addEventListener('abort', forwardAbort, { once: true })
  return controller.signal
}

async function buildHttpError(res: Response): Promise<Error> {
  let message = `Request failed (${res.status})`
  try {
    // Best-effort parse; response may not be JSON
    const body = (await res.clone().json().catch(() => null)) as unknown
    if (body && typeof body === 'object' && body !== null && 'message' in body) {
      const maybe = (body as { message?: unknown }).message
      if (typeof maybe === 'string') {
        message = maybe
      }
    }
  } catch {
    // ignore parsing errors
  }
  return new Error(message)
}

/**
 * Map any reasonable weather API response into WeatherResult.
 * This function attempts to read common fields:
 * - name/city, sys.country or country
 * - main.temp (C), weather[0].description, weather[0].icon
 * - humidity as main.humidity
 * - wind speed as wind.speed (m/s) or wind_kph
 */
function mapApiToWeatherResult(data: unknown): WeatherResult {
  // define type guards
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
  const get = <T = unknown>(obj: unknown, key: string): T | undefined => (isObj(obj) && key in obj ? (obj as Record<string, unknown>)[key] as T : undefined)

  const name = (get<string>(data, 'name'))
    ?? (isObj(get(data, 'location')) ? get<string>(get(data, 'location'), 'name') : undefined)
    ?? 'Unknown'

  const sys = isObj(get(data, 'sys')) ? get(data, 'sys') : undefined
  const country = (sys && get<string>(sys, 'country'))
    ?? (isObj(get(data, 'location')) ? get<string>(get(data, 'location'), 'country') : undefined)

  const main = isObj(get(data, 'main')) ? get(data, 'main') : undefined
  const tempK = main ? get<number>(main, 'temp') : undefined

  const current = isObj(get(data, 'current')) ? get(data, 'current') : undefined
  const tempCfromCurrent = current ? get<number>(current, 'temp_c') : undefined
  const tempCraw = get<number>(data, 'temp_c')

  const tempC = typeof tempK === 'number'
    ? Math.round((tempK - 273.15) * 10) / 10
    : typeof tempCfromCurrent === 'number'
      ? tempCfromCurrent
      : typeof tempCraw === 'number'
        ? tempCraw
        : NaN

  const tempFfromCurrent = current ? get<number>(current, 'temp_f') : undefined
  const tempFraw = get<number>(data, 'temp_f')
  const tempF = typeof tempFfromCurrent === 'number'
    ? tempFfromCurrent
    : typeof tempFraw === 'number'
      ? tempFraw
      : Number.isFinite(tempC)
        ? Math.round((Number(tempC) * 9 / 5 + 32) * 10) / 10
        : undefined

  // Weather array (OpenWeather-like)
  let weather0: Record<string, unknown> | undefined
  if (isObj(data)) {
    const candidate = (data as Record<string, unknown>)['weather']
    if (Array.isArray(candidate) && candidate.length > 0 && isObj(candidate[0])) {
      weather0 = candidate[0] as Record<string, unknown>
    }
  }

  const rawCondWeather = weather0 ? get<unknown>(weather0, 'description') : undefined
  const conditionFromWeather = typeof rawCondWeather === 'string' ? rawCondWeather : undefined

  let conditionFromCurrent: string | undefined
  if (current) {
    const condObj = get<unknown>(current, 'condition')
    if (isObj(condObj)) {
      const txt = get<unknown>(condObj, 'text')
      if (typeof txt === 'string') {
        conditionFromCurrent = txt
      }
    }
  }

  let conditionFromRoot: string | undefined
  const condRoot = get<unknown>(data, 'condition')
  if (isObj(condRoot)) {
    const txt = get<unknown>(condRoot, 'text')
    if (typeof txt === 'string') conditionFromRoot = txt
  }

  const condition: string = conditionFromWeather ?? conditionFromCurrent ?? conditionFromRoot ?? 'Unknown'

  const iconFromWeatherRaw = weather0 ? get<unknown>(weather0, 'icon') : undefined
  const iconFromWeatherCode = typeof iconFromWeatherRaw === 'string' ? iconFromWeatherRaw : undefined
  const iconFromWeather = iconFromWeatherCode ? buildIconUrl(iconFromWeatherCode) : undefined

  let iconFromCurrent: string | undefined
  if (current) {
    const cond = get<unknown>(current, 'condition')
    if (isObj(cond)) {
      const iconMaybe = get<unknown>(cond, 'icon')
      if (typeof iconMaybe === 'string') {
        iconFromCurrent = iconMaybe
      }
    }
  }

  const icon: string | undefined = typeof iconFromWeather === 'string' ? iconFromWeather : iconFromCurrent

  const humidity =
    (main ? get<number>(main, 'humidity') : undefined)
    ?? (current ? get<number>(current, 'humidity') : undefined)

  let windKph: number | undefined
  const wind = isObj(get(data, 'wind')) ? get(data, 'wind') : undefined
  const windSpeed = wind ? get<number>(wind, 'speed') : undefined
  if (typeof windSpeed === 'number') {
    windKph = Math.round(windSpeed * 3.6)
  } else if (current) {
    const wk = get<number>(current, 'wind_kph')
    if (typeof wk === 'number') windKph = wk
  }

  const windMph = typeof windKph === 'number' ? Math.round(windKph / 1.609344) : undefined

  const dt = get<number>(data, 'dt')
  const lastUpdated = current ? get<string>(current, 'last_updated') : undefined
  const observedAt = typeof dt === 'number'
    ? new Date(dt * 1000).toISOString()
    : (typeof lastUpdated === 'string' ? new Date(lastUpdated).toISOString() : undefined)

  return {
    name,
    country,
    tempC: Number.isFinite(tempC) ? Number(tempC) : NaN,
    tempF,
    condition,
    icon,
    humidity,
    windKph,
    windMph,
    observedAt,
  }
}

function buildIconUrl(code?: string) {
  if (!code) return undefined
  // For OpenWeather-like icons ("10d"), we can create a neutral CDN URL.
  if (/^\d{2}[dn]$/.test(code)) {
    return `https://openweathermap.org/img/wn/${code}@2x.png`
  }
  return undefined
}
