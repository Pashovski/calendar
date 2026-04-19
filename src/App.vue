<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRotation } from '@/composables/useRotation'
import { currentWeekStart } from '@/lib/dates'

const { state, apartment, weekRange, nextApartment, advance, apartmentForWeek } = useRotation()

// --- advance confirmation ---
const confirming = ref(false)

function handleAdvance() {
  confirming.value = true
}

function confirmAdvance() {
  advance()
  confirming.value = false
}

function cancelAdvance() {
  confirming.value = false
}

// --- calendar ---
const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
})

interface CalendarCell {
  date: number
  inMonth: boolean
  isToday: boolean
  apartment: number | null
  currentWeek: boolean
}

const cells = computed((): CalendarCell[] => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstOfMonth = new Date(year, month, 1)
  const startDow = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const thisWeekStart = currentWeekStart(today)

  const result: CalendarCell[] = []

  function makeCell(dateObj: Date, dayOfMonth: number, inMonth: boolean): CalendarCell {
    const dow = dateObj.getDay()
    const isDutyDay = dow === 2 || dow === 5
    const ws = currentWeekStart(dateObj)
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`
    return {
      date: dayOfMonth,
      inMonth,
      isToday: inMonth && key === todayKey,
      apartment: isDutyDay ? apartmentForWeek(state.value, ws) : null,
      currentWeek: ws.getTime() === thisWeekStart.getTime(),
    }
  }

  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    result.push(makeCell(new Date(year, month - 1, d), d, false))
  }

  for (let d = 1; d <= daysInMonth; d++) {
    result.push(makeCell(new Date(year, month, d), d, true))
  }

  const remainder = result.length % 7
  if (remainder > 0) {
    const fill = 7 - remainder
    for (let d = 1; d <= fill; d++) {
      result.push(makeCell(new Date(year, month + 1, d), d, false))
    }
  }

  return result
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}
</script>

<template>
  <div class="app">
    <!-- Corkboard noise texture overlay -->
    <div class="corkboard-texture"></div>

    <!-- Main card -->
    <div class="paper-card main-card">
      <div class="paper-grain"></div>
      <!-- Thumbtack -->
      <svg class="thumbtack" width="24" height="28" viewBox="0 0 24 28" aria-hidden="true">
        <ellipse cx="12" cy="9" rx="9" ry="8" fill="var(--color-oxblood)" />
        <ellipse cx="10" cy="7" rx="3.5" ry="2.5" fill="var(--color-oxblood-light)" opacity="0.5" />
        <line x1="12" y1="17" x2="12" y2="27" stroke="#555" stroke-width="1.5" stroke-linecap="round" />
      </svg>

      <p class="label">THIS WEEK</p>

      <div class="apt-wrapper">
        <!-- Hand-drawn circle behind the number -->
        <svg class="hand-circle hand-circle--large" viewBox="0 0 200 200" aria-hidden="true">
          <path
            d="M100 18
               C 145 16, 184 42, 188 88
               C 192 134, 158 178, 108 184
               C 58 190, 16 158, 14 108
               C 12 58, 48 20, 100 18Z"
            fill="none"
            stroke="var(--color-oxblood)"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <p class="apartment-number">#{{ apartment }}</p>
      </div>

      <p class="range">{{ weekRange }}</p>
    </div>

    <!-- Advance button -->
    <div class="advance">
      <div v-if="!confirming">
        <button class="advance-btn" @click="handleAdvance">
          Mark week complete &rarr;
        </button>
      </div>
      <div v-else class="confirm-group">
        <p class="confirm-text">Pass the torch to apt {{ nextApartment }}?</p>
        <button class="advance-btn advance-btn--confirm" @click="confirmAdvance">Yes, advance</button>
        <button class="advance-btn advance-btn--cancel" @click="cancelAdvance">Cancel</button>
      </div>
    </div>

    <!-- Calendar card -->
    <div class="paper-card calendar-card">
      <div class="paper-grain"></div>
      <!-- Thumbtack -->
      <svg class="thumbtack" width="24" height="28" viewBox="0 0 24 28" aria-hidden="true">
        <ellipse cx="12" cy="9" rx="9" ry="8" fill="var(--color-oxblood)" />
        <ellipse cx="10" cy="7" rx="3.5" ry="2.5" fill="var(--color-oxblood-light)" opacity="0.5" />
        <line x1="12" y1="17" x2="12" y2="27" stroke="#555" stroke-width="1.5" stroke-linecap="round" />
      </svg>

      <div class="calendar-header">
        <button class="nav-btn" @click="prevMonth" aria-label="Previous month">&larr;</button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="nav-btn" @click="nextMonth" aria-label="Next month">&rarr;</button>
      </div>

      <div class="grid">
        <div v-for="name in DAY_NAMES" :key="name" class="day-name">{{ name }}</div>
        <div
          v-for="(cell, i) in cells"
          :key="i"
          class="cell"
          :class="{
            'out-of-month': !cell.inMonth,
            'current-week': cell.currentWeek,
          }"
        >
          <span class="date-num">{{ cell.date }}</span>
          <span v-if="cell.isToday" class="today-dot"></span>
          <span v-if="cell.apartment !== null" class="duty-badge">
            <svg class="hand-circle hand-circle--small" viewBox="0 0 200 200" aria-hidden="true">
              <path
                d="M100 22
                   C 142 18, 180 46, 183 92
                   C 186 138, 155 175, 106 180
                   C 57 185, 20 154, 18 106
                   C 16 58, 52 26, 100 22Z"
                fill="none"
                stroke="var(--color-oxblood)"
                stroke-width="5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span class="duty-num">{{ cell.apartment }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== App shell / corkboard ========== */
.app {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 1.5rem 1rem 2rem;
  background-color: var(--color-corkboard);
}

/* Subtle SVG noise over the corkboard */
.corkboard-texture {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.18;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* ========== Paper cards ========== */
.paper-card {
  position: relative;
  z-index: 1;
  background-color: var(--color-paper);
  border-radius: 4px;
  box-shadow:
    0 2px 8px var(--color-shadow),
    0 1px 2px var(--color-shadow);
  width: 100%;
  max-width: 460px;
}

/* Faint paper grain overlay */
.paper-grain {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='150' height='150' filter='url(%23g)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* ========== Thumbtack ========== */
.thumbtack {
  position: absolute;
  top: -6px;
  right: 16px;
  z-index: 2;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

/* ========== Main card ========== */
.main-card {
  padding: 2rem 1.5rem 1.5rem;
  text-align: center;
}

.label {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-oxblood);
  margin-bottom: 0.25rem;
}

.apt-wrapper {
  position: relative;
  display: inline-block;
  margin: 0 auto;
}

.apartment-number {
  font-family: var(--font-display);
  font-size: clamp(6rem, 35vh, 18rem);
  font-weight: 900;
  line-height: 1;
  color: var(--color-ink);
  position: relative;
  z-index: 1;
  padding: 0.05em 0.15em;
}

/* Hand-drawn circle (large — around apartment number) */
.hand-circle--large {
  position: absolute;
  inset: -8% -12%;
  width: 124%;
  height: 116%;
  z-index: 0;
}

.range {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-ink-muted);
  margin-top: 0.25rem;
}

/* ========== Advance button ========== */
.advance {
  position: relative;
  z-index: 1;
  text-align: center;
  margin: 1rem 0 1.25rem;
}

.advance-btn {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink);
  background: var(--color-paper);
  border: 1px solid var(--color-corkboard-dark);
  border-radius: 3px;
  padding: 0.55rem 1.2rem;
  cursor: pointer;
  box-shadow: 0 1px 3px var(--color-shadow);
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.advance-btn:hover {
  background: var(--color-paper-warm);
  box-shadow: 0 2px 5px var(--color-shadow-strong);
}

.advance-btn:active {
  box-shadow: 0 0 2px var(--color-shadow);
}

.advance-btn--confirm {
  color: var(--color-oxblood);
  border-color: var(--color-oxblood);
}

.advance-btn--cancel {
  color: var(--color-ink-muted);
}

.confirm-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.confirm-text {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-ink-muted);
  margin-bottom: 0.15rem;
}

/* ========== Calendar card ========== */
.calendar-card {
  padding: 1.75rem 1rem 1.25rem;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.month-label {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-oxblood);
  font-variant: small-caps;
}

.nav-btn {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-ink-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  transition: color 0.15s ease;
  min-width: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover {
  color: var(--color-ink);
}

/* ========== Calendar grid ========== */
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.day-name {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-ink-muted);
  padding: 0.35rem 0;
}

.cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0.35rem 0.15rem;
  min-height: 3.2rem;
  gap: 0.1rem;
}

.date-num {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-ink);
}

.out-of-month .date-num {
  color: var(--color-ink-muted);
  opacity: 0.4;
}

.current-week {
  background-color: #f5f0e6;
}

/* Today dot: tiny filled oxblood circle in upper-right corner */
.today-dot {
  position: absolute;
  top: 3px;
  right: 4px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--color-oxblood);
}

/* Duty badge: apartment number inside a hand-drawn circle */
.duty-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
}

.hand-circle--small {
  position: absolute;
  inset: -15%;
  width: 130%;
  height: 130%;
}

.duty-num {
  position: relative;
  z-index: 1;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-oxblood);
}

.out-of-month .duty-badge {
  opacity: 0.35;
}
</style>
