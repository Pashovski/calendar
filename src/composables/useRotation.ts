import { ref, computed } from 'vue'
import { formatRange, parseLocalDate } from '@/lib/dates'
import {
  apartmentForWeek,
  advance as advanceState,
  setApartmentForWeek,
  INITIAL_STATE,
  type RotationState,
} from '@/lib/rotation'

const STORAGE_KEY = 'garbage-app-state'

function freshInitial(): RotationState {
  return {
    rotation: [...INITIAL_STATE.rotation],
    schedule: { ...INITIAL_STATE.schedule },
    currentWeekStart: INITIAL_STATE.currentWeekStart,
  }
}

function load(): RotationState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<RotationState>
      if (
        parsed &&
        Array.isArray(parsed.rotation) &&
        parsed.schedule &&
        typeof parsed.currentWeekStart === 'string'
      ) {
        return parsed as RotationState
      }
    } catch {
      // corrupted — fall through to seed
    }
  }
  const seed = freshInitial()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
  return seed
}

function save(state: RotationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function isoFromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const state = ref<RotationState>(load())

export function useRotation() {
  const today = computed(() => new Date())

  const weekStart = computed(() => parseLocalDate(state.value.currentWeekStart))

  const apartment = computed(() =>
    apartmentForWeek(state.value, state.value.currentWeekStart),
  )

  const weekRange = computed(() => formatRange(weekStart.value))

  const nextApartment = computed(() => {
    const next = advanceState(state.value, today.value)
    return apartmentForWeek(next, next.currentWeekStart)
  })

  function advance() {
    state.value = advanceState(state.value, today.value)
    save(state.value)
  }

  function setApartment(apt: number) {
    setApartmentForWeek(state.value, state.value.currentWeekStart, apt)
    save(state.value)
  }

  function apartmentForWeekDate(s: RotationState, weekStart: Date): number {
    return apartmentForWeek(s, isoFromDate(weekStart))
  }

  return {
    state,
    apartment,
    weekRange,
    weekStart,
    nextApartment,
    advance,
    setApartment,
    apartmentForWeek: apartmentForWeekDate,
  }
}
