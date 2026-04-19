<script setup lang="ts">
import { ref } from 'vue'
import { useRotation } from '@/composables/useRotation'

const { apartment, weekRange, nextApartment, advance } = useRotation()

const confirming = ref(false)

function handleAdvance() {
  confirming.value = true
}

function confirm() {
  advance()
  confirming.value = false
}

function cancel() {
  confirming.value = false
}
</script>

<template>
  <div class="home">
    <p class="label">THIS WEEK</p>
    <p class="apartment">#{{ apartment }}</p>
    <p class="range">{{ weekRange }}</p>

    <div v-if="!confirming">
      <button @click="handleAdvance">Mark week complete &rarr;</button>
    </div>
    <div v-else class="confirm">
      <p>Pass the torch to apt {{ nextApartment }}?</p>
      <button @click="confirm">Yes, advance</button>
      <button @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.label {
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.apartment {
  font-size: 8rem;
  font-weight: bold;
  margin: 0.25em 0;
}

.range {
  margin-bottom: 2rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  margin: 0.25rem;
}

.confirm p {
  margin-bottom: 0.5rem;
}
</style>
