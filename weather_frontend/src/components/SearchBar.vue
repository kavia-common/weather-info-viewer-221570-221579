<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'search', city: string): void
  (e: 'locate'): void
}>()

const city = ref('')

function onSubmit(e: Event) {
  e.preventDefault()
  if (city.value.trim().length === 0) return
  emit('search', city.value)
}

function useLocation() {
  emit('locate')
}
</script>

<template>
  <div class="search-card">
    <form class="search-row" @submit="onSubmit">
      <input
        class="input"
        type="text"
        v-model="city"
        placeholder="Enter city name (e.g., London)"
        aria-label="City name"
      />
      <div class="actions">
        <button class="btn btn-secondary" type="button" @click="useLocation">
          <span aria-hidden="true">📍</span> Use my location
        </button>
        <button class="btn btn-primary" type="submit">
          <span aria-hidden="true">🔎</span> Search
        </button>
      </div>
    </form>
    <div class="notice">
      Using a public weather API. Please ensure VITE_API_BASE is set in your environment. No secrets are hardcoded.
    </div>
  </div>
</template>

<style scoped>
</style>
