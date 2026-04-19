import { ref, computed } from 'vue'
import { currentWeekStart, formatRange } from '@/lib/dates'
import {
  apartmentForWeek,
  advance as advanceState,
  currentApartment,
  INITIAL_STATE,
  type RotationState,
} from '@/lib/rotation'

const STORAGE_KEY = 'garbage-app-state'

function load(): RotationState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as RotationState
    } catch {
      // corrupted — fall through to seed
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE))
  return { ...INITIAL_STATE, rotation: [...INITIAL_STATE.rotation] }
}

function save(state: RotationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const state = ref<RotationState>(load())

export function useRotation() {
  const today = computed(() => new Date())

  const weekStart = computed(() => currentWeekStart(today.value))

  const apartment = computed(() => currentApartment(state.value, today.value))

  const weekRange = computed(() => formatRange(weekStart.value))

  const nextApartment = computed(() => {
    const next = advanceState(state.value, today.value)
    return next.anchorApartment
  })

  function advance() {
    state.value = advanceState(state.value, today.value)
    save(state.value)
  }

  return {
    state,
    apartment,
    weekRange,
    weekStart,
    nextApartment,
    advance,
    apartmentForWeek,
  }
}
