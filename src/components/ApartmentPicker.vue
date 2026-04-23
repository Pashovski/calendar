<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { formatRange } from '@/lib/dates'
import { RESIDENTS } from '@/lib/residents'

const props = defineProps<{
  weekStart: Date
  rotation: readonly number[] | number[]
  currentApartment: number
}>()

const emit = defineEmits<{
  select: [apt: number]
  cancel: []
}>()

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('picker-overlay')) {
    emit('cancel')
  }
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="picker-overlay" @click="onOverlayClick">
      <div class="picker-modal" role="dialog" aria-modal="true">
        <p class="picker-title">Set week of {{ formatRange(props.weekStart) }} to…</p>
        <ul class="picker-list">
          <li v-for="apt in props.rotation" :key="apt">
            <button
              class="picker-row"
              :class="{ 'picker-row--active': apt === props.currentApartment }"
              @click="emit('select', apt)"
            >
              <span class="picker-num">#{{ apt }}</span>
              <span v-if="RESIDENTS[apt]" class="picker-names">
                <span v-for="name in RESIDENTS[apt]" :key="name" class="picker-name">{{ name }}</span>
              </span>
            </button>
          </li>
        </ul>
        <button class="picker-cancel" @click="emit('cancel')">Cancel</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.picker-modal {
  background: var(--color-paper);
  border-radius: 6px;
  padding: 1.25rem 1rem 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 340px;
}

.picker-title {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-ink-muted);
  text-align: center;
  margin-bottom: 0.25rem;
}

.picker-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.picker-row {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
  width: 100%;
  min-height: 52px;
  padding: 0.6rem 0.8rem;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.1s ease;
}

.picker-row:hover {
  background: var(--color-paper-warm);
}

.picker-row--active {
  border-left-color: var(--color-oxblood);
  background: var(--color-paper-warm);
}

.picker-num {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-ink);
  min-width: 2.2rem;
}

.picker-row--active .picker-num {
  color: var(--color-oxblood);
}

.picker-names {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--color-ink-muted);
}

.picker-name {
  white-space: nowrap;
}

.picker-cancel {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-ink-muted);
  background: none;
  border: 1px solid var(--color-corkboard-dark);
  border-radius: 3px;
  padding: 0.5rem;
  margin-top: 0.4rem;
  cursor: pointer;
}

.picker-cancel:hover {
  background: var(--color-paper-warm);
  color: var(--color-ink);
}
</style>
