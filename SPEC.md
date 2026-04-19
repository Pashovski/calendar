# Garbage Rotation App — SPEC

A wall-mounted tablet app that replaces two physical artifacts in a Park Slope co-op: (1) a stack of paper cards indicating whose turn it is to do garbage duty, and (2) a printed calendar with hand-circled numbers on Tuesdays and Fridays indicating that week's apartment. The app lives on one Android tablet mounted on a bulletin board in the common hallway.

## Goals

- Show, at a glance, which apartment is "on" for the current week.
- Let a resident tap to advance the rotation at the end of their week.
- Show a month calendar view with the assigned apartment circled on each pickup day (Tuesday and Friday).
- Feel like it belongs on a bulletin board — analog, paper-like, not a glossy SaaS app.

## Non-goals (v1)

- No backend, no sync, no multi-device. State is local to this one tablet.
- No accounts, no auth, no per-apartment logins.
- No notifications or reminders.
- No move-in/move-out handling. If the apartment list ever changes, it's a code change.
- No skip/swap tracking (if someone's out of town, residents handle it verbally; the app doesn't model exceptions).
- No history or audit log of past weeks.

## Domain rules

- The building has 8 apartments.
- Apartment 6 is exempt (resident not in rotation). Apartment 6 never appears.
- Rotation order is: **1, 2, 3, 4, 5, 7, 8**. After 8, wraps back to 1.
- "A week" in this system runs Saturday → Friday. The apartment "on" for a given week is responsible for both pickup days that fall inside it (Tuesday and Friday).
  - Example: Week of Sat Apr 11 → Fri Apr 17, 2026 is apt 7's week. Apt 7 handles Tue Apr 14 and Fri Apr 17.
- Advancing the rotation moves to the next apartment in the list and, implicitly, to the next week.

## Data model

Three pieces of state, persisted to `localStorage` under a single key (e.g. `garbage-app-state`):

```ts
type State = {
  // The canonical rotation. Constant for v1, but kept as data so it's easy to change.
  rotation: number[]; // [1, 2, 3, 4, 5, 7, 8]

  // An anchor: "on this week-start date, this apartment was on duty."
  // Week-start = the Saturday that begins the week. ISO date string, e.g. "2026-04-11".
  anchorWeekStart: string;
  anchorApartment: number; // must be a member of `rotation`
};
```

Everything else — "who is on this week?", "who is on week N?", "what does April look like?" — is derived from these three fields.

### Derivation

- `currentWeekStart(today)` → the Saturday on or before `today`.
- `weeksBetween(a, b)` → integer number of 7-day periods from `a` to `b`.
- `apartmentForWeek(weekStart)` →
  `rotation[(rotation.indexOf(anchorApartment) + weeksBetween(anchorWeekStart, weekStart)) mod rotation.length]`
- `advance()` → set `anchorWeekStart` to `anchorWeekStart + 7 days`, `anchorApartment` to the next entry in `rotation`. (Equivalent: `anchorWeekStart = currentWeekStart(today) + 7 days`, `anchorApartment = apartmentForWeek(that)`. Either works; prefer the first, it's simpler.)

### Initial state

Hardcoded seed on first run:
- `rotation`: `[1, 2, 3, 4, 5, 7, 8]`
- `anchorWeekStart`: `"2026-04-11"` (the Saturday starting the week of Apr 12–18, 2026)
- `anchorApartment`: `7`

On every load, if `localStorage` has no state, write the seed.

## Views

Two views, toggled by tapping. No router needed; a single reactive `view` ref is fine.

### 1. Home view (default)

The primary, read-at-a-glance view. Must be legible from several feet away.

- A single large "card" centered on the screen, styled like a paper index card pinned to a corkboard.
- Top of card: a small label — `THIS WEEK` — in a typewriter/monospace face.
- Center of card: the apartment number, huge (filling most of the card), in a heavy humanist serif or display sans. Think `#7` from the reference photo but bigger and cleaner.
- Hand-drawn-looking circle around the number (SVG path with slight wobble, mimicking a ballpoint circle).
- Below the number: the resident's week range in small type — e.g. `Sat Apr 11 – Fri Apr 17`.
- Thumbtack/pushpin detail in one corner of the card (small SVG, not all four corners).
- Below the card: a secondary button — `Mark week complete →` — that advances the rotation. On tap, show a confirmation ("Pass the torch to apt 8?") before committing. This is the one destructive action; a stray tap shouldn't blow it away.
- Bottom corner: small link/button to the Calendar view.

### 2. Calendar view

A month grid showing which apartment is assigned to each pickup day.

- Header: month and year (e.g. `APRIL 2026`) with small prev/next month arrows. Default to current month on open.
- Standard 7-column calendar grid, Sunday → Saturday to match the reference.
- Each day cell shows the date number.
- On every Tuesday and Friday, show the assigned apartment number inside a hand-drawn circle (same wobble treatment as the home card). This is the visual anchor of the view.
- The current week's row is subtly highlighted (e.g. slightly warmer paper tone), not boxed or outlined.
- "Today" gets a small marker — a tiny filled dot in the corner of the cell — not a full-cell highlight.
- Back button to Home view.

No event/holiday markers in v1. The reference calendar has them (Passover, Good Friday, Earth Day, etc.) but they're out of scope.

## Visual design

North star: **clean modern UI with analog bulletin-board charm.** Function first, charm as a byproduct. Restraint over theming.

### Palette

- Paper (background of cards): `#faf7f2` — warm off-white.
- Corkboard (app shell background): a muted, desaturated tan/linen. Subtle tiled texture, very low contrast.
- Ink (primary text): `#1a1a1a` — near-black, never pure black.
- Accent (for the hand-drawn circles, the week label, calendar header): an oxblood/burgundy in the range of `#7a1f2b` to `#8b2635`, echoing the reference calendar's maroon header.
- Muted ink (secondary text, date numbers on non-duty days): `#6b6b6b`.

### Typography

- Display (apartment number, section headers): a humanist serif or chunky display sans. Good candidates: **Fraunces**, **Recoleta**, or **Inter Display** well-tracked. Prefer Fraunces — its optical sizing at large display sizes gets the "printed" feel.
- Mono (labels like `THIS WEEK`, `APT`, dates): **JetBrains Mono** or **Courier Prime**. Slight tracking. All caps for short labels.
- No more than two fonts total.

### Texture & materiality

- Very faint paper fiber / noise SVG overlay on card surfaces, at ~3–5% opacity. Should be barely perceptible.
- Cards sit on the corkboard with a soft, slightly offset warm-gray shadow — `0 2px 8px rgba(60, 40, 20, 0.12)` or similar. Not a hard drop shadow.
- Corkboard texture: a subtle tiled pattern, desaturated. Could be a hand-drawn SVG pattern or a carefully chosen CSS noise pattern. Not a photo of cork.

### Details

- Hand-drawn circles: SVG path, slightly irregular. Lean on `rough.js` if it saves time, or commit a hand-authored SVG. Same visual treatment on the home card and the calendar.
- Thumbtack: small SVG, ~24px, oxblood head with a soft highlight. One per card, upper-left or upper-right.
- Transitions: when advancing the week, the current card animates — slides down and rotates ~4° as if being tucked behind the stack — and the new apartment's card animates in from behind. Duration ~400ms, ease-out. If this proves fiddly, a simple cross-fade is acceptable.
- No Material-style ripples, elevation levels, or glassy effects.

### Layout & sizing

- Portrait orientation assumed (wall-mounted tablet).
- Apartment number on the home card should be large enough to read from ~2m away — roughly 40–50% of the viewport height.
- Tap targets at least 48×48 CSS pixels.
- Fully responsive to the tablet's native resolution; no hardcoded pixel dimensions outside of the number sizing.

## Technical stack

- **Vue 3** with Composition API and `<script setup>`.
- **TypeScript**, strict mode.
- **Vite** for dev and build.
- **Pinia** for state, or a single composable (`useRotation()`) backed by `localStorage`. Prefer the composable — Pinia is overkill for three fields of state.
- **date-fns** for date math. No moment, no luxon.
- **PWA** via `vite-plugin-pwa`: manifest, service worker, offline-first. The tablet may briefly lose wifi; the app should keep working.
- **No backend**, no API calls, no analytics.

### Suggested structure

```
src/
  main.ts
  App.vue
  composables/
    useRotation.ts        // state + derivation + persistence
  lib/
    dates.ts              // currentWeekStart, weeksBetween, formatRange
    rotation.ts           // pure functions: apartmentForWeek, advance
  components/
    HomeView.vue
    CalendarView.vue
    PaperCard.vue         // the pinned-card shell, reusable
    HandDrawnCircle.vue   // SVG circle wrapper
    Thumbtack.vue
  assets/
    fonts/
    textures/
  styles/
    tokens.css            // color + type tokens
    global.css
```

## Testing

- **Vitest** for unit tests on `lib/rotation.ts` and `lib/dates.ts`. These are the high-leverage correctness targets.
- Required test cases:
  - Given anchor apt 7 on 2026-04-11, `apartmentForWeek('2026-04-11')` → 7.
  - `apartmentForWeek('2026-04-18')` → 8.
  - `apartmentForWeek('2026-04-25')` → 1 (wraps past 8, skipping 6).
  - `apartmentForWeek('2026-05-02')` → 2.
  - A date 8 weeks after the anchor returns the same apartment.
  - `currentWeekStart` for a Tuesday returns the preceding Saturday.
  - `currentWeekStart` for a Saturday returns that same Saturday.
  - `advance()` applied 7 times returns to the starting apartment.
- No UI tests required for v1. Manual QA on the actual tablet is fine.

## Build & deploy

- Build produces a static `dist/`.
- Host it however — GitHub Pages, a tiny Vercel project, or serve from a local Raspberry Pi on the LAN. The tablet installs the PWA once and then runs offline.
- Kiosk mode: Chrome on Android with "Add to Home screen," launched fullscreen. Screen timeout disabled in Android settings.

## Acceptance criteria (v1 is done when)

1. On first load on a fresh device, home view shows apt 7 for the week of Apr 11–17, 2026.
2. Tapping "Mark week complete" + confirming changes the display to apt 8 and updates the week range.
3. Advancing past apt 8 shows apt 1 next, then 2, 3, 4, 5, 7, 8, 1 — never 6.
4. Calendar view shows correct apartment numbers circled on every Tuesday and Friday for the current and adjacent months.
5. State persists across app restarts and device reboots.
6. The app loads and functions offline.
7. Installable as a PWA on Android, launches fullscreen from home screen.
8. Readable from ~2m away in typical hallway lighting.
