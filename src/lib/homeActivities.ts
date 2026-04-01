import type { WorkoutSession } from '../types'

const RUN_EXERCISE_IDS = new Set(['seed-run'])
const CLIMB_EXERCISE_IDS = new Set(['seed-climb', 'seed-boulder'])

function matchesRunningBlock(s: WorkoutSession): boolean {
  return s.blocks.some(
    (b) =>
      b.type === 'activity' &&
      (RUN_EXERCISE_IDS.has(b.exerciseId) ||
        /run|jog|treadmill/i.test(b.exerciseName)),
  )
}

function matchesClimbingBlock(s: WorkoutSession): boolean {
  return s.blocks.some(
    (b) =>
      b.type === 'activity' &&
      (CLIMB_EXERCISE_IDS.has(b.exerciseId) ||
        /climb|boulder/i.test(b.exerciseName)),
  )
}

function matchesLiftingBlock(s: WorkoutSession): boolean {
  return s.blocks.some((b) => b.type === 'resistance')
}

function lastCompletedAt(
  sessions: WorkoutSession[],
  matches: (s: WorkoutSession) => boolean,
): number | undefined {
  let best: number | undefined
  for (const s of sessions) {
    const t = s.completedAt
    if (t == null) continue
    if (!matches(s)) continue
    if (best == null || t > best) best = t
  }
  return best
}

export function lastSessionTimestampsByActivity(
  sessions: WorkoutSession[],
): { running?: number; climbing?: number; lifting?: number } {
  return {
    running: lastCompletedAt(sessions, matchesRunningBlock),
    climbing: lastCompletedAt(sessions, matchesClimbingBlock),
    lifting: lastCompletedAt(sessions, matchesLiftingBlock),
  }
}
