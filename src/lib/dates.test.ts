import { describe, it, expect } from 'vitest'
import { currentWeekStart, weeksBetween, formatRange, parseLocalDate } from './dates'

describe('parseLocalDate', () => {
  it('parses an ISO string to a local-midnight Date', () => {
    const d = parseLocalDate('2026-04-11')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // April = 3
    expect(d.getDate()).toBe(11)
  })
})

describe('currentWeekStart', () => {
  it('returns the same Saturday when given a Saturday', () => {
    const sat = parseLocalDate('2026-04-11') // Saturday
    expect(currentWeekStart(sat)).toEqual(sat)
  })

  it('returns the preceding Saturday when given a Tuesday', () => {
    const tue = parseLocalDate('2026-04-14') // Tuesday
    const expected = parseLocalDate('2026-04-11') // Saturday
    expect(currentWeekStart(tue)).toEqual(expected)
  })

  it('returns the preceding Saturday when given a Friday', () => {
    const fri = parseLocalDate('2026-04-17') // Friday
    const expected = parseLocalDate('2026-04-11')
    expect(currentWeekStart(fri)).toEqual(expected)
  })

  it('returns the preceding Saturday when given a Sunday', () => {
    const sun = parseLocalDate('2026-04-12') // Sunday
    const expected = parseLocalDate('2026-04-11')
    expect(currentWeekStart(sun)).toEqual(expected)
  })
})

describe('weeksBetween', () => {
  it('returns 0 for the same date', () => {
    const d = parseLocalDate('2026-04-11')
    expect(weeksBetween(d, d)).toBe(0)
  })

  it('returns 1 for dates 7 days apart', () => {
    const a = parseLocalDate('2026-04-11')
    const b = parseLocalDate('2026-04-18')
    expect(weeksBetween(a, b)).toBe(1)
  })

  it('returns negative for reverse order', () => {
    const a = parseLocalDate('2026-04-18')
    const b = parseLocalDate('2026-04-11')
    expect(weeksBetween(a, b)).toBe(-1)
  })

  it('returns 4 for dates 28 days apart', () => {
    const a = parseLocalDate('2026-04-11')
    const b = parseLocalDate('2026-05-09')
    expect(weeksBetween(a, b)).toBe(4)
  })
})

describe('formatRange', () => {
  it('formats a week range from Saturday to Friday', () => {
    const sat = parseLocalDate('2026-04-11')
    expect(formatRange(sat)).toBe('Sat Apr 11 – Fri Apr 17')
  })
})
