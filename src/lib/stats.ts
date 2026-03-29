import type { WorkoutSession } from '../types'

/** Local calendar date YYYY-MM-DD for streaks and calendar UI. */
export function localDateKey(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Days (local) with at least one completed session. */
export function activeDayKeysFromSessions(
  sessions: WorkoutSession[],
): Set<string> {
  const set = new Set<string>()
  for (const s of sessions) {
    if (s.completedAt != null) set.add(localDateKey(s.completedAt))
  }
  return set
}

/**
 * Consecutive days with a workout, anchored at today or yesterday (so same-day
 * completion still counts after midnight hasn’t arrived yet).
 */
export function computeWorkoutStreak(activeDays: Set<string>): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const key = (x: Date) => localDateKey(x.getTime())
  if (!activeDays.has(key(d))) {
    d.setDate(d.getDate() - 1)
    if (!activeDays.has(key(d))) return 0
  }
  let streak = 0
  while (activeDays.has(key(d))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Monday = 0 … Sunday = 6 for the first of the month. */
export function weekdayMondayZero(year: number, monthIndex: number): number {
  const w = new Date(year, monthIndex, 1).getDay()
  return (w + 6) % 7
}
