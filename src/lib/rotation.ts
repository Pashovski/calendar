import { currentWeekStart, weeksBetween, parseLocalDate } from './dates'

export const DEFAULT_ROTATION = [1, 2, 3, 4, 5, 7, 8] as const

export interface RotationState {
  rotation: number[]
  anchorWeekStart: string // ISO date, e.g. "2026-04-11"
  anchorApartment: number
}

export const INITIAL_STATE: RotationState = {
  rotation: [...DEFAULT_ROTATION],
  anchorWeekStart: '2026-04-11',
  anchorApartment: 7,
}

/**
 * Given the rotation state and a week-start Saturday,
 * returns the apartment number on duty that week.
 */
export function apartmentForWeek(state: RotationState, weekStart: Date): number {
  const anchor = parseLocalDate(state.anchorWeekStart)
  const offset = weeksBetween(anchor, weekStart)
  const anchorIndex = state.rotation.indexOf(state.anchorApartment)
  const len = state.rotation.length
  // JS modulo can go negative, so we add len to ensure positive
  const idx = ((anchorIndex + offset) % len + len) % len
  return state.rotation[idx]
}

/**
 * Returns a new state with the rotation advanced by one position.
 * Pins the anchor to currentWeekStart(today) so the anchor never lags behind.
 */
export function advance(state: RotationState, today: Date = new Date()): RotationState {
  const ws = currentWeekStart(today)
  const currentApt = apartmentForWeek(state, ws)
  const currentIndex = state.rotation.indexOf(currentApt)
  const nextIndex = (currentIndex + 1) % state.rotation.length
  const nextApt = state.rotation[nextIndex]

  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = `${ws.getFullYear()}-${pad(ws.getMonth() + 1)}-${pad(ws.getDate())}`

  return {
    rotation: state.rotation,
    anchorWeekStart: iso,
    anchorApartment: nextApt,
  }
}

/**
 * Returns the apartment on duty for the current real-world week.
 */
export function currentApartment(state: RotationState, today: Date = new Date()): number {
  return apartmentForWeek(state, currentWeekStart(today))
}
