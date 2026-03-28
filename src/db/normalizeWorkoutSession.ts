import type {
  BlockSessionLog,
  LoggedResistanceSet,
  ResistanceBlockLog,
  WorkoutSession,
} from '../types'
import { newId } from './repo'

/**
 * Older sessions stored uniform setCount + single reps/weight; expand to per-set logs.
 */
function normalizeResistanceBlock(b: BlockSessionLog): BlockSessionLog {
  if (b.type !== 'resistance') return b
  const r = b as ResistanceBlockLog & {
    setCount?: number
    reps?: number
    weight?: number
    tempo?: string
    intensity?: string
    restSec?: number
    done?: boolean
  }
  if (Array.isArray(r.sets) && r.sets.length > 0) {
    return {
      blockId: r.blockId,
      type: 'resistance',
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
      sets: r.sets,
    }
  }
  const count = Math.max(1, typeof r.setCount === 'number' ? r.setCount : 1)
  const sets: LoggedResistanceSet[] = Array.from({ length: count }, () => ({
    id: newId(),
    reps: r.reps,
    weight: r.weight,
    tempo: r.tempo,
    intensity: r.intensity,
    restSec: r.restSec,
    done: r.done,
  }))
  return {
    blockId: r.blockId,
    type: 'resistance',
    exerciseId: r.exerciseId,
    exerciseName: r.exerciseName,
    sets,
  }
}

export function normalizeBlockLogs(blocks: BlockSessionLog[]): BlockSessionLog[] {
  return blocks.map(normalizeResistanceBlock)
}

export function normalizeWorkoutSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    blocks: normalizeBlockLogs(session.blocks),
  }
}
