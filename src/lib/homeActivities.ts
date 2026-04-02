import type { WorkoutSession } from '../types'

const RUN_EXERCISE_IDS = new Set(['seed-run'])
const CLIMB_EXERCISE_IDS = new Set(['seed-climb', 'seed-boulder'])
const MEDITATE_EXERCISE_IDS = new Set(['seed-meditate'])

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

function matchesMeditatingBlock(s: WorkoutSession): boolean {
  return s.blocks.some(
    (b) =>
      b.type === 'activity' &&
      (MEDITATE_EXERCISE_IDS.has(b.exerciseId) ||
        /meditat|mindful|mindfulness|breathwork|breath work/i.test(
          b.exerciseName,
        )),
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
