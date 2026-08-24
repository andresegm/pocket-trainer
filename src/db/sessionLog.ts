import type {
  ActivityBlock,
  ActivityBlockLog,
  BlockSessionLog,
  DailyRoutine,
  Exercise,
  LoggedResistanceSet,
  ResistanceBlock,
  ResistanceBlockLog,
  RoutineBlock,
} from '../types'
import { newId } from './repo'

export function exerciseNameMap(exercises: Exercise[]): Map<string, string> {
  return new Map(exercises.map((e) => [e.id, e.name]))
}

/**
 * 0-based index of this resistance block among blocks with the same exercise
 * in the workout (handles the same exercise appearing twice in one day).
 */
export function resistanceExerciseOrdinal(
  blocks: BlockSessionLog[],
  blockId: string,
): number {
  const target = blocks.find(
    (b) => b.blockId === blockId && b.type === 'resistance',
  ) as ResistanceBlockLog | undefined
  if (!target) return 0
  let ordinal = 0
  for (const b of blocks) {
    if (b.type !== 'resistance') continue
    const r = b as ResistanceBlockLog
    if (r.blockId === blockId) return ordinal
    if (r.exerciseId === target.exerciseId) ordinal++
  }
  return 0
}

function templateSetsFromBlock(block: {
  setCount: number
  reps?: number
  weight?: number
  tempo?: string
  intensity?: string
  restSec?: number
}): LoggedResistanceSet[] {
  const n = Math.max(1, block.setCount)
  return Array.from({ length: n }, () => ({
    id: newId(),
    reps: block.reps,
    weight: block.weight,
    tempo: block.tempo,
    intensity: block.intensity,
    restSec: block.restSec,
    done: false,
  }))
}

/** Build session logs from the current day template (planned values per set as defaults). */
export function logsFromRoutine(
  day: DailyRoutine,
  names: Map<string, string>,
): BlockSessionLog[] {
  return day.blocks.map((block) => {
    const exerciseName = names.get(block.exerciseId) ?? 'Unknown exercise'
    if (block.type === 'resistance') {
      return {
        blockId: block.id,
        type: 'resistance',
        exerciseId: block.exerciseId,
        exerciseName,
        sets: templateSetsFromBlock(block),
      } satisfies BlockSessionLog
    }
    return {
      blockId: block.id,
      type: 'activity',
      exerciseId: block.exerciseId,
      exerciseName,
      durationMin: block.durationMin,
      lengthKm: block.lengthKm,
      notes: block.notes,
      done: false,
    } satisfies BlockSessionLog
  })
}

/**
 * Turn logged session blocks into a program-day template (including session-only
 * exercises), so finishing a workout can update the day definition.
 */
export function routineBlocksFromSessionLogs(
  blocks: BlockSessionLog[],
): RoutineBlock[] {
  return blocks.map((b) => {
    if (b.type === 'resistance') {
      const r = b as ResistanceBlockLog
      const first = r.sets[0]
      return {
        id: r.blockId,
        type: 'resistance',
        exerciseId: r.exerciseId,
        setCount: Math.max(1, r.sets.length),
        reps: first?.reps,
        weight: first?.weight,
        tempo: first?.tempo,
        intensity: first?.intensity,
        restSec: first?.restSec,
      } satisfies ResistanceBlock
    }
    const a = b as ActivityBlockLog
    return {
      id: a.blockId,
      type: 'activity',
      exerciseId: a.exerciseId,
      durationMin: a.durationMin,
      lengthKm: a.lengthKm,
      notes: a.notes,
    } satisfies ActivityBlock
  })
}
