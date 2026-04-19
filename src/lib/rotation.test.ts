import { describe, it, expect } from 'vitest'
import { apartmentForWeek, advance, INITIAL_STATE, DEFAULT_ROTATION, type RotationState } from './rotation'
import { parseLocalDate, currentWeekStart } from './dates'

const state = INITIAL_STATE // anchor: apt 7, week of 2026-04-11

describe('apartmentForWeek', () => {
  it('returns 7 for the anchor week (2026-04-11)', () => {
    expect(apartmentForWeek(state, parseLocalDate('2026-04-11'))).toBe(7)
  })

  it('returns 8 for the next week (2026-04-18)', () => {
    expect(apartmentForWeek(state, parseLocalDate('2026-04-18'))).toBe(8)
  })

  it('returns 1 after wrapping past 8 (2026-04-25)', () => {
    expect(apartmentForWeek(state, parseLocalDate('2026-04-25'))).toBe(1)
  })

  it('returns 2 two weeks after the wrap (2026-05-02)', () => {
    expect(apartmentForWeek(state, parseLocalDate('2026-05-02'))).toBe(2)
  })

  it('returns the same apartment after a full cycle (7 weeks)', () => {
    // 7 apartments in rotation, so 7 weeks later → same apartment
    const sevenWeeksLater = parseLocalDate('2026-05-30') // 2026-04-11 + 49 days
    expect(apartmentForWeek(state, sevenWeeksLater)).toBe(7)
  })

  it('never returns apartment 6', () => {
    for (let i = 0; i < 14; i++) {
      const d = new Date(parseLocalDate('2026-04-11'))
      d.setDate(d.getDate() + i * 7)
      expect(apartmentForWeek(state, d)).not.toBe(6)
    }
  })

  it('handles weeks before the anchor (negative offset)', () => {
    // One week before anchor: apt 5 (rotation index wraps backward)
    expect(apartmentForWeek(state, parseLocalDate('2026-04-04'))).toBe(5)
  })
})

describe('advance', () => {
  // Use anchor Saturday as "today" so advance pins to that week
  const anchorDay = parseLocalDate('2026-04-11')

  it('moves to the next apartment', () => {
    const next = advance(state, anchorDay)
    expect(next.anchorApartment).toBe(8)
    expect(next.anchorWeekStart).toBe('2026-04-11')
  })

  it('wraps from 8 back to 1, skipping 6', () => {
    let s: RotationState = state
    // advance from apt 7 → 8 → 1
    s = advance(s, anchorDay) // → 8
    s = advance(s, anchorDay) // → 1
    expect(s.anchorApartment).toBe(1)
  })

  it('returns to starting apartment after 7 advances', () => {
    let s: RotationState = state
    for (let i = 0; i < 7; i++) {
      s = advance(s, anchorDay)
    }
    expect(s.anchorApartment).toBe(7)
  })

  it('advances the displayed apartment each call', () => {
    let s: RotationState = state
    const expected = [8, 1, 2]
    for (const apt of expected) {
      s = advance(s, anchorDay)
      expect(s.anchorApartment).toBe(apt)
    }
  })

  it('pins anchor to current week when anchor is stale (in the past)', () => {
    // Anchor is 2 weeks behind "today"
    const staleState: RotationState = {
      rotation: [...DEFAULT_ROTATION],
      anchorWeekStart: '2026-04-11', // apt 7
      anchorApartment: 7,
    }
    // "today" is 2 weeks later — a Tuesday in the week of 2026-04-25
    const today = parseLocalDate('2026-04-28') // Tuesday
    // Current week start = 2026-04-25 (Saturday)
    // apartmentForWeek(2026-04-25) = 1 (7 → 8 → 1)
    const before = apartmentForWeek(staleState, currentWeekStart(today))
    expect(before).toBe(1)

    const after = advance(staleState, today)
    // Should pin to week of 2026-04-25 and advance to next apartment (2)
    expect(after.anchorWeekStart).toBe('2026-04-25')
    expect(after.anchorApartment).toBe(2)
    // Verify current-week apartment is now the successor
    expect(apartmentForWeek(after, currentWeekStart(today))).toBe(2)
  })
})
