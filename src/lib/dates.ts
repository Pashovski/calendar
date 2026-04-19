import { startOfWeek, differenceInCalendarWeeks, format } from 'date-fns'

/**
 * Returns the Saturday on or before `date` (the start of the garbage week).
 * date-fns weeks default to Sunday; we override weekStartsOn to Saturday (6).
 */
export function currentWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 6 })
}

/**
 * Integer number of 7-day periods between two week-start Saturdays.
 * Both dates should be Saturdays; result is positive when b > a.
 */
export function weeksBetween(a: Date, b: Date): number {
  return differenceInCalendarWeeks(b, a, { weekStartsOn: 6 })
}

/**
 * Formats a week range for display: "Sat Apr 11 – Fri Apr 17"
 */
export function formatRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => format(d, 'EEE MMM d')
  return `${fmt(weekStart)} – ${fmt(end)}`
}

/**
 * Parse an ISO date string (YYYY-MM-DD) into a local-date Date at midnight.
 * Avoids UTC-offset pitfalls of `new Date("2026-04-11")`.
 */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
