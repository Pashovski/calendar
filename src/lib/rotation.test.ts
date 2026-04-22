import { describe, it, expect } from 'vitest'
import {
  apartmentForWeek,
  advance,
  setApartmentForWeek,
  INITIAL_STATE,
  DEFAULT_ROTATION,
  type RotationState,
} from './rotation'
import { parseLocalDate } from './dates'

function freshState(overrides: Partial<RotationState> = {}): RotationState {
  return {
    rotation: [...DEFAULT_ROTATION],
    schedule: { '2026-04-11': 7 },
    currentWeekStart: '2026-04-18',
    ...overrides,
  }
}

describe('apartmentForWeek', () => {
  it('returns 7 for the seeded anchor week (2026-04-11)', () => {
    expect(apartmentForWeek(freshState(), '2026-04-11')).toBe(7)
  })

  it('lazy-fills 8 for the next week (2026-04-18)', () => {
    expect(apartmentForWeek(freshState(), '2026-04-18')).toBe(8)
  })

  it('lazy-fills 1 after wrapping past 8 (2026-04-25)', () => {
    expect(apartmentForWeek(freshState(), '2026-04-25')).toBe(1)
  })

  it('lazy-fills 2 two weeks after the wrap (2026-05-02)', () => {
    expect(apartmentForWeek(freshState(), '2026-05-02')).toBe(2)
  })

  it('returns the same apartment after a full cycle (7 weeks)', () => {
    expect(apartmentForWeek(freshState(), '2026-05-30')).toBe(7)
  })

  it('never returns apartment 6', () => {
    const s = freshState()
    const d = parseLocalDate('2026-04-11')
    for (let i = 0; i < 14; i++) {
      const wk = new Date(d)
      wk.setDate(wk.getDate() + i * 7)
      const pad = (n: number) => String(n).padStart(2, '0')
      const iso = `${wk.getFullYear()}-${pad(wk.getMonth() + 1)}-${pad(wk.getDate())}`
      expect(apartmentForWeek(s, iso)).not.toBe(6)
    }
  })

  it('handles weeks before the seed (negative offset)', () => {
    expect(apartmentForWeek(freshState(), '2026-04-04')).toBe(5)
  })

  it('lazily populates unscheduled weeks into schedule', () => {
    const s = freshState()
    expect(s.schedule['2026-05-02']).toBeUndefined()
    const apt = apartmentForWeek(s, '2026-05-02')
    expect(s.schedule['2026-05-02']).toBe(apt)
  })

  it('returns consistent results on repeat calls for the same week', () => {
    const s = freshState()
    const a = apartmentForWeek(s, '2026-05-16')
    const b = apartmentForWeek(s, '2026-05-16')
    const c = apartmentForWeek(s, '2026-05-16')
    expect(a).toBe(b)
    expect(b).toBe(c)
  })

  it('walks from the nearest scheduled week, not always the seed', () => {
    const s = freshState({
      schedule: { '2026-04-11': 7, '2026-06-06': 3 },
    })
    // 2026-06-13 is 1 week after the nearest entry (3), so → next in rotation (4)
    expect(apartmentForWeek(s, '2026-06-13')).toBe(4)
  })
})

describe('advance', () => {
  it('moves currentWeekStart forward by one week', () => {
    const s = freshState({ currentWeekStart: '2026-04-18' })
    const next = advance(s, parseLocalDate('2026-04-18'))
    expect(next.currentWeekStart).toBe('2026-04-25')
  })

  it('leaves historical schedule entries intact', () => {
    const s = freshState({ currentWeekStart: '2026-04-18' })
    // Populate a couple of weeks via lazy-fill
    apartmentForWeek(s, '2026-04-18')
    apartmentForWeek(s, '2026-04-25')
    const snapshot = { ...s.schedule }

    const next = advance(s, parseLocalDate('2026-04-18'))
    expect(next.schedule).toEqual(snapshot)
    expect(next.currentWeekStart).toBe('2026-04-25')
  })

  it('snaps to the real current week when the pointer is stale, then advances', () => {
    const stale = freshState({ currentWeekStart: '2026-04-11' })
    // "today" is in the week of 2026-04-25
    const today = parseLocalDate('2026-04-28')
    const next = advance(stale, today)
    expect(next.currentWeekStart).toBe('2026-05-02')
  })

  it('does not snap when the pointer is at or ahead of the real current week', () => {
    const s = freshState({ currentWeekStart: '2026-05-30' })
    const today = parseLocalDate('2026-04-22') // several weeks behind pointer
    const next = advance(s, today)
    expect(next.currentWeekStart).toBe('2026-06-06')
  })
})

describe('setApartmentForWeek', () => {
  it('writes a single entry into the schedule', () => {
    const s = freshState()
    setApartmentForWeek(s, '2026-04-11', 3)
    expect(s.schedule['2026-04-11']).toBe(3)
  })

  it('does not change week N+1 or N-1 when they are already scheduled', () => {
    const s = freshState({
      schedule: {
        '2026-04-04': 5,
        '2026-04-11': 7,
        '2026-04-18': 8,
      },
    })
    setApartmentForWeek(s, '2026-04-11', 3)
    expect(s.schedule['2026-04-11']).toBe(3)
    expect(s.schedule['2026-04-04']).toBe(5)
    expect(s.schedule['2026-04-18']).toBe(8)
  })

  it('does not cascade changes to previously lazy-filled neighbors', () => {
    const s = freshState()
    // Lazy-fill N-1 and N+1 around 2026-04-18
    apartmentForWeek(s, '2026-04-11') // already seeded = 7
    apartmentForWeek(s, '2026-04-18') // = 8
    apartmentForWeek(s, '2026-04-25') // = 1
    setApartmentForWeek(s, '2026-04-18', 3)
    expect(s.schedule['2026-04-18']).toBe(3)
    expect(s.schedule['2026-04-11']).toBe(7)
    expect(s.schedule['2026-04-25']).toBe(1)
  })
})
