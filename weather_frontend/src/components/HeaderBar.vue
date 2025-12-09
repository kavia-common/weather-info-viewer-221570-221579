<script setup lang="ts">
const appTitle = 'Weather Now'
const subtitle = 'Search by city or use your current location'
</script>

<template>
  <header class="header">
    <div>
      <div class="header-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style="color: var(--op-primary)">
          <path d="M6.5 2a.5.5 0 0 0 0 1h1.586L4.293 6.793a1 1 0 1 0 1.414 1.414L9.5 4.414V6a.5.5 0 0 0 1 0V2.5a.5.5 0 0 0-.5-.5H6.5z"/>
          <path d="M7 10a7 7 0 1 1 0 14h10a7 7 0 0 0 0-14H7z" />
        </svg>
        {{ appTitle }}
        <span class="badge">Ocean Professional</span>
      </div>
      <div class="header-sub">{{ subtitle }}</div>
    </div>
    <div class="header-sub">
      <!-- Right side optional area -->
    </div>
  </header>
</template>

<style scoped>
</style>
