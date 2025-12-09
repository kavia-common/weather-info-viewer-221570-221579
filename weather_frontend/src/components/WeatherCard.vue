<script setup lang="ts">
import type { WeatherResult } from '@/services/weather'

defineProps<{
  data: WeatherResult
}>()
</script>

<template>
  <section class="card" v-if="data">
    <div class="card-header">
      <div class="location">
        <span aria-hidden="true">📍</span>
        <span>{{ data.name }}<span v-if="data.country">, {{ data.country }}</span></span>
      </div>
      <div class="timestamp" v-if="data.observedAt">
        Updated: {{ new Date(data.observedAt).toLocaleString() }}
      </div>
    </div>

    <div class="weather-main">
      <div>
        <div class="temp">
          <span v-if="Number.isFinite(data.tempC)">{{ data.tempC }}°C</span>
          <span v-else>—</span>
        </div>
        <div class="condition">{{ data.condition }}</div>
      </div>

      <div class="icon-wrap" aria-hidden="true">
        <img v-if="data.icon" :src="data.icon" alt="" width="56" height="56" />
        <span v-else>🌤️</span>
      </div>

      <div class="metrics">
        <div class="metric" v-if="typeof data.tempF !== 'undefined'">Feels: {{ data.tempF }}°F</div>
        <div class="metric" v-if="typeof data.humidity !== 'undefined'">Humidity: {{ data.humidity }}%</div>
        <div class="metric" v-if="typeof data.windKph !== 'undefined'">Wind: {{ data.windKph }} km/h<span v-if="typeof data.windMph !== 'undefined'"> ({{ data.windMph }} mph)</span></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
