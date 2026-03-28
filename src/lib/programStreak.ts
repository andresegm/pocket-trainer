import type { WorkoutSession } from '../types'

/** Local calendar date YYYY-MM-DD */
export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Current consecutive-day streak for a program: at least one session per
 * calendar day (local time). Streak must include today or yesterday to count
 * (otherwise it's broken). Counts backward from the most recent of those two
 * that has a session.
 */
export function computeProgramStreak(
  sessions: WorkoutSession[],
  programId: string,
): number {
  const dates = new Set<string>()
  for (const s of sessions) {
    if (s.programId !== programId) continue
    const t = s.completedAt ?? s.createdAt
    dates.add(formatLocalYmd(new Date(t)))
  }
  if (dates.size === 0) return 0

  const now = new Date()
  const today = formatLocalYmd(now)

  const yest = new Date(now)
  yest.setDate(yest.getDate() - 1)
  const yesterday = formatLocalYmd(yest)

  let start: Date | null = null
  if (dates.has(today)) {
    start = new Date(now)
  } else if (dates.has(yesterday)) {
    start = yest
  } else {
    return 0
  }

  let streak = 0
  const cur = new Date(start)
  while (dates.has(formatLocalYmd(cur))) {
    streak++
    cur.setDate(cur.getDate() - 1)
  }
  return streak
}
