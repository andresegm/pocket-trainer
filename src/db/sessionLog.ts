import type { BlockSessionLog, DailyRoutine, Exercise } from '../types'

export function exerciseNameMap(exercises: Exercise[]): Map<string, string> {
  return new Map(exercises.map((e) => [e.id, e.name]))
}

/** Build session logs from the current day template (planned values as starting point). */
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
        setCount: Math.max(1, block.setCount),
        reps: block.reps,
        weight: block.weight,
        tempo: block.tempo,
        intensity: block.intensity,
        restSec: block.restSec,
        done: false,
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
    } satisfies BlockSessionLog
  })
}
