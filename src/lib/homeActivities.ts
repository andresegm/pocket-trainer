import type { WorkoutSession } from '../types'

const RUN_EXERCISE_IDS = new Set(['seed-run'])
const CLIMB_EXERCISE_IDS = new Set(['seed-climb', 'seed-boulder'])
const MEDITATE_EXERCISE_IDS = new Set(['seed-meditate'])

function hasCompletedActivityBlock(
  s: WorkoutSession,
  matches: (exerciseId: string, exerciseName: string) => boolean,
): boolean {
  return s.blocks.some(
    (b) =>
      b.type === 'activity' &&
      b.done === true &&
      b.skipped !== true &&
      matches(b.exerciseId, b.exerciseName),
  )
}

function matchesRunningBlock(s: WorkoutSession): boolean {
  return hasCompletedActivityBlock(
    s,
    (exerciseId, exerciseName) =>
      RUN_EXERCISE_IDS.has(exerciseId) ||
      /run|jog|treadmill/i.test(exerciseName),
  )
}

function matchesClimbingBlock(s: WorkoutSession): boolean {
  return hasCompletedActivityBlock(
    s,
    (exerciseId, exerciseName) =>
      CLIMB_EXERCISE_IDS.has(exerciseId) ||
      /climb|boulder/i.test(exerciseName),
  )
}

function matchesLiftingBlock(s: WorkoutSession): boolean {
  return s.blocks.some((b) => b.type === 'resistance')
}

function matchesMeditatingBlock(s: WorkoutSession): boolean {
  return hasCompletedActivityBlock(
    s,
    (exerciseId, exerciseName) =>
      MEDITATE_EXERCISE_IDS.has(exerciseId) ||
      /meditat|mindful|mindfulness|breathwork|breath work/i.test(exerciseName),
  )
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
): {
  running?: number
  climbing?: number
  lifting?: number
  meditating?: number
} {
  return {
    running: lastCompletedAt(sessions, matchesRunningBlock),
    climbing: lastCompletedAt(sessions, matchesClimbingBlock),
    lifting: lastCompletedAt(sessions, matchesLiftingBlock),
    meditating: lastCompletedAt(sessions, matchesMeditatingBlock),
  }
}
