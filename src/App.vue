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

  // Leading days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    result.push(makeCell(new Date(year, month - 1, d), d, false))
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(makeCell(new Date(year, month, d), d, true))
  }

  // Trailing days to fill last row
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
    <!-- Card -->
    <div class="card">
      <p class="label">THIS WEEK</p>
      <p class="apartment-number">#{{ apartment }}</p>
      <p class="range">{{ weekRange }}</p>
    </div>

    <!-- Advance button -->
    <div class="advance">
      <div v-if="!confirming">
        <button @click="handleAdvance">Mark week complete &rarr;</button>
      </div>
      <div v-else>
        <p>Pass the torch to apt {{ nextApartment }}?</p>
        <button @click="confirmAdvance">Yes, advance</button>
        <button @click="cancelAdvance">Cancel</button>
      </div>
    </div>

    <!-- Calendar -->
    <div class="calendar">
      <div class="calendar-header">
        <button @click="prevMonth">&larr;</button>
        <span class="month-label">{{ monthLabel }}</span>
        <button @click="nextMonth">&rarr;</button>
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
          <span>{{ cell.date }}</span>
          <span v-if="cell.isToday" class="today-dot">&bull;</span>
          <span v-if="cell.apartment !== null"> ({{ cell.apartment }})</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.card {
  text-align: center;
  margin-bottom: 1rem;
}

.label {
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.apartment-number {
  font-size: 8rem;
  font-weight: bold;
  margin: 0.25em 0;
}

.range {
  margin-bottom: 0.5rem;
}

.advance {
  text-align: center;
  margin-bottom: 2rem;
}

.advance p {
  margin-bottom: 0.5rem;
}

button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
  margin: 0.25rem;
}

.calendar {
  width: 100%;
  max-width: 600px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.month-label {
  font-family: monospace;
  font-size: 1.25rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  gap: 2px;
}

.day-name {
  font-weight: bold;
  font-family: monospace;
  padding: 0.25rem;
}

.cell {
  padding: 0.5rem 0.25rem;
  min-height: 2.5rem;
}

.out-of-month {
  opacity: 0.35;
}

.current-week {
  background: #f0f0e8;
}

.today-dot {
  color: red;
  font-size: 0.75rem;
  vertical-align: super;
}
</style>
