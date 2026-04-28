<script setup lang="ts">
import { computed, ref } from 'vue'

type Slot = {
  startDate: string
  endDate: string
}

const props = withDefaults(defineProps<{
  slots?: Slot[]
  title?: string
}>(), {
  slots: () => [],
  title: 'Calendario de dias reservados',
})

const monthCursor = ref(new Date())

const monthStart = computed(() => {
  const d = new Date(monthCursor.value)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
})

const monthLabel = computed(() =>
  monthStart.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
)

const weekDayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const startOfGrid = computed(() => {
  const d = new Date(monthStart.value)
  const jsWeekday = d.getDay() // 0=Sun
  const mondayIndex = (jsWeekday + 6) % 7 // 0=Mon
  d.setDate(d.getDate() - mondayIndex)
  return d
})

const dayCells = computed(() => {
  const cells: Date[] = []
  const d = new Date(startOfGrid.value)
  for (let i = 0; i < 42; i += 1) {
    cells.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return cells
})

const reservedKeys = computed(() => {
  const keys = new Set<string>()

  for (const slot of props.slots) {
    const start = new Date(slot.startDate)
    const end = new Date(slot.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue

    const cursor = new Date(start)
    cursor.setHours(0, 0, 0, 0)

    const endDay = new Date(end)
    endDay.setHours(0, 0, 0, 0)

    while (cursor <= endDay) {
      keys.add(formatKey(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return keys
})

const hasSlots = computed(() => props.slots.length > 0)

function formatKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isCurrentMonth(date: Date): boolean {
  return (
    date.getMonth() === monthStart.value.getMonth() &&
    date.getFullYear() === monthStart.value.getFullYear()
  )
}

function isReserved(date: Date): boolean {
  return reservedKeys.value.has(formatKey(date))
}

function previousMonth() {
  const d = new Date(monthCursor.value)
  d.setMonth(d.getMonth() - 1)
  monthCursor.value = d
}

function nextMonth() {
  const d = new Date(monthCursor.value)
  d.setMonth(d.getMonth() + 1)
  monthCursor.value = d
}
</script>

<template>
  <div class="mt-3 rounded-lg border border-default bg-surface px-3 py-3">
    <div class="mb-2 flex items-center justify-between">
      <p class="text-xs font-semibold uppercase tracking-wide text-muted">
        {{ title }}
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded border border-default px-2 py-1 text-xs text-main hover:bg-base"
          @click="previousMonth"
        >
          {{ '<' }}
        </button>
        <span class="min-w-[8.5rem] text-center text-xs font-medium text-main">
          {{ monthLabel }}
        </span>
        <button
          type="button"
          class="rounded border border-default px-2 py-1 text-xs text-main hover:bg-base"
          @click="nextMonth"
        >
          {{ '>' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
      <div v-for="label in weekDayLabels" :key="label" class="py-1 font-semibold">
        {{ label }}
      </div>
    </div>

    <div class="mt-1 grid grid-cols-7 gap-1">
      <div
        v-for="day in dayCells"
        :key="day.toISOString()"
        class="flex h-8 items-center justify-center rounded text-xs"
        :class="[
          isCurrentMonth(day) ? 'text-main' : 'text-gray-300',
          isReserved(day) ? 'bg-red-100 text-danger font-semibold ring-1 ring-red-200' : 'bg-base'
        ]"
      >
        {{ day.getDate() }}
      </div>
    </div>

    <div class="mt-3 flex items-center gap-2 text-xs text-muted">
      <span class="inline-block h-3 w-3 rounded bg-red-100 ring-1 ring-red-200" />
      <span>Dias reservados</span>
    </div>
    <p v-if="!hasSlots" class="mt-2 text-xs text-muted">
      No hay reservas registradas para este coche.
    </p>
  </div>
</template>
