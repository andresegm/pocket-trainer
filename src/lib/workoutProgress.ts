import type {
  ActivityBlockLog,
  BlockSessionLog,
  ResistanceBlockLog,
} from '../types'

/** An exercise (block) counts as done when all resistance sets are marked, or the activity is marked done. */
export function computeWorkoutProgress(
  blocks: BlockSessionLog[],
): { done: number; total: number } {
  const total = blocks.length
  let done = 0
  for (const b of blocks) {
    if (b.type === 'resistance') {
      const r = b as ResistanceBlockLog
      if (r.skipped) {
        done++
      } else if (
        r.sets.length > 0 &&
        r.sets.every((s) => s.done)
      ) {
        done++
      }
    } else {
      const a = b as ActivityBlockLog
      if (a.skipped || a.done) done++
    }
  }
  return { done, total }
}

/** Mark activity blocks with logged fields as done when finishing a session. */
export function finalizeActivityBlocksForSave(
  blocks: BlockSessionLog[],
): BlockSessionLog[] {
  return blocks.map((b) => {
    if (b.type !== 'activity' || b.skipped || b.done) return b
    const a = b as ActivityBlockLog
    const hasLog =
      a.durationMin != null ||
      a.lengthKm != null ||
      Boolean(a.notes?.trim())
    return hasLog ? { ...a, done: true } : b
  })
}
