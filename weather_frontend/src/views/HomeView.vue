<script setup lang="ts">
import { ref } from 'vue'
import HeaderBar from '@/components/HeaderBar.vue'
import SearchBar from '@/components/SearchBar.vue'
import WeatherCard from '@/components/WeatherCard.vue'
import { fetchWeatherByCity, fetchWeatherByCoords, type WeatherResult } from '@/services/weather'

const loading = ref(false)
const error = ref<string | null>(null)
const data = ref<WeatherResult | null>(null)
let inflight: AbortController | null = null

function clearInflight() {
  if (inflight) {
    inflight.abort()
    inflight = null
  }
}

async function doSearch(city: string) {
  error.value = null
  data.value = null
  clearInflight()
  inflight = new AbortController()
  loading.value = true
  try {
    const result = await fetchWeatherByCity(city, { signal: inflight.signal })
    data.value = result
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch weather.'
    error.value = message
  } finally {
    loading.value = false
    inflight = null
  }
}

async function doLocate() {
  error.value = null
  data.value = null

  if (!('geolocation' in navigator)) {
    error.value = 'Geolocation is not supported by this browser.'
    return
  }

  loading.value = true
  clearInflight()
  inflight = new AbortController()

  const getPosition = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
    })

  try {
    const pos = await getPosition()
    const { latitude, longitude } = pos.coords
    const result = await fetchWeatherByCoords(latitude, longitude, { signal: inflight.signal })
    data.value = result
  } catch (e: unknown) {
    if (typeof window !== 'undefined' && 'GeolocationPositionError' in window) {
      const geoErr = e as Partial<GeolocationPositionError>
      if (typeof geoErr.code === 'number' && geoErr.code === 1 /* PERMISSION_DENIED */) {
        error.value = 'Location permission denied. Please search by city.'
      } else {
        error.value = (e instanceof Error && e.message) ? e.message : 'Failed to fetch location or weather.'
      }
    } else {
      error.value = (e instanceof Error && e.message) ? e.message : 'Failed to fetch location or weather.'
    }
  } finally {
    loading.value = false
    inflight = null
  }
}

const apiBaseSet = !!import.meta.env.VITE_API_BASE
</script>

<template>
  <main class="op-container">
    <HeaderBar />
    <SearchBar @search="doSearch" @locate="doLocate" />

    <div class="loading" v-if="loading">
      Loading current weather...
    </div>

    <div v-if="!apiBaseSet" class="error" role="alert">
      VITE_API_BASE is not set. Please set it in your .env file to enable API requests.
      <div class="divider"></div>
      Example endpoints expected by the frontend:
      <ul style="margin-top:8px; padding-left: 18px;">
        <li>/weather?city=London</li>
        <li>/weather?lat=51.5074&lon=-0.1278</li>
      </ul>
    </div>

    <WeatherCard v-if="!loading && data" :data="data" />

    <div v-if="!loading && error" class="error" role="alert">
      {{ error }}
      <div style="margin-top:8px;">
        <button class="btn btn-secondary" @click="error=null">Dismiss</button>
      </div>
    </div>

    <div class="footer">Powered by your configured API (VITE_API_BASE). No secrets stored on client.</div>
  </main>
</template>
