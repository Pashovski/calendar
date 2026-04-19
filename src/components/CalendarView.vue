<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRotation } from '@/composables/useRotation'
import { currentWeekStart } from '@/lib/dates'

const emit = defineEmits<{ (e: 'back'): void }>()

const { state, apartmentForWeek } = useRotation()

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth()) // 0-indexed

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthLabel = computed(() => {
  const d = new Date(viewYear.value, viewMonth.value, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
})

interface CalendarCell {
  date: number
  inMonth: boolean
  isToday: boolean
  apartment: number | null // non-null on Tue/Fri
  currentWeek: boolean
}

const cells = computed((): CalendarCell[] => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstOfMonth = new Date(year, month, 1)
  const startDow = firstOfMonth.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const thisWeekStart = currentWeekStart(today)

  const result: CalendarCell[] = []

  // Leading blanks from previous month
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const date = new Date(year, month - 1, d)
    const dow = date.getDay()
    const isDutyDay = dow === 2 || dow === 5
    const ws = currentWeekStart(date)
    result.push({
      date: d,
      inMonth: false,
      isToday: false,
      apartment: isDutyDay ? apartmentForWeek(state.value, ws) : null,
      currentWeek: ws.getTime() === thisWeekStart.getTime(),
    })
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dow = date.getDay()
    const isDutyDay = dow === 2 || dow === 5 // Tue or Fri
    const ws = currentWeekStart(date)
    const key = `${year}-${month}-${d}`
    result.push({
      date: d,
      inMonth: true,
      isToday: key === todayKey,
      apartment: isDutyDay ? apartmentForWeek(state.value, ws) : null,
      currentWeek: ws.getTime() === thisWeekStart.getTime(),
    })
  }

  // Trailing blanks to fill last row
  const remainder = result.length % 7
  if (remainder > 0) {
    const fill = 7 - remainder
    for (let d = 1; d <= fill; d++) {
      const date = new Date(year, month + 1, d)
      const dow = date.getDay()
      const isDutyDay = dow === 2 || dow === 5
      const ws = currentWeekStart(date)
      result.push({
        date: d,
        inMonth: false,
        isToday: false,
        apartment: isDutyDay ? apartmentForWeek(state.value, ws) : null,
        currentWeek: ws.getTime() === thisWeekStart.getTime(),
      })
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
  <div class="calendar">
    <div class="header">
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

    <button class="back" @click="$emit('back')">Back to Home</button>
  </div>
</template>

<style scoped>
.calendar {
  padding: 1rem;
}

.header {
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

.back {
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

button {
  cursor: pointer;
  padding: 0.5rem 1rem;
}
</style>
