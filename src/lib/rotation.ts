import { currentWeekStart, weeksBetween, parseLocalDate } from './dates'

export const DEFAULT_ROTATION = [1, 2, 3, 4, 5, 7, 8] as const

export interface RotationState {
  rotation: number[]
  schedule: Record<string, number>
  currentWeekStart: string
}

export const INITIAL_STATE: RotationState = {
  rotation: [...DEFAULT_ROTATION],
  schedule: { '2026-04-11': 7 },
  currentWeekStart: '2026-04-18',
}

function isoFromDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Returns the apartment on duty for the given week-start ISO.
 * If the week is already scheduled, returns it verbatim. Otherwise
 * computes it by walking from the nearest scheduled week along the
 * rotation, writes the result into schedule, and returns it.
 */
export function apartmentForWeek(state: RotationState, weekStartISO: string): number {
  const existing = state.schedule[weekStartISO]
  if (existing !== undefined) return existing

  const keys = Object.keys(state.schedule)
  if (keys.length === 0) {
    throw new Error('schedule is empty — cannot lazy-fill')
  }

  const target = parseLocalDate(weekStartISO)
  let nearestISO = keys[0]
  let nearestAbs = Math.abs(weeksBetween(parseLocalDate(nearestISO), target))
  for (const k of keys) {
    const abs = Math.abs(weeksBetween(parseLocalDate(k), target))
    if (abs < nearestAbs) {
      nearestISO = k
      nearestAbs = abs
    }
  }

  const offset = weeksBetween(parseLocalDate(nearestISO), target)
  const nearestApt = state.schedule[nearestISO]
  const nearestIdx = state.rotation.indexOf(nearestApt)
  const len = state.rotation.length
  const idx = ((nearestIdx + offset) % len + len) % len
  const apt = state.rotation[idx]
  state.schedule[weekStartISO] = apt
  return apt
}

/**
 * Moves currentWeekStart forward by one week. If the pointer lags
 * behind the real current week, snap to the real current week first,
 * then advance.
 */
export function advance(state: RotationState, today: Date = new Date()): RotationState {
  const realCurrentISO = isoFromDate(currentWeekStart(today))
  const pointerDate = parseLocalDate(state.currentWeekStart)
  const realCurrentDate = parseLocalDate(realCurrentISO)

  const basisISO = pointerDate < realCurrentDate ? realCurrentISO : state.currentWeekStart
  const basisDate = parseLocalDate(basisISO)
  const nextDate = new Date(basisDate)
  nextDate.setDate(nextDate.getDate() + 7)

  return {
    rotation: state.rotation,
    schedule: state.schedule,
    currentWeekStart: isoFromDate(nextDate),
  }
}

/**
 * Writes a single entry into the schedule. Does not cascade to any
 * other week — adjacent scheduled entries are left untouched.
 */
export function setApartmentForWeek(state: RotationState, weekStartISO: string, apt: number): void {
  state.schedule[weekStartISO] = apt
}
