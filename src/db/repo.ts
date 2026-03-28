import type {
  BlockSessionLog,
  Exercise,
  ExerciseKind,
  LoggedResistanceSet,
  Program,
  ResistanceBlockLog,
  WorkoutSession,
} from '../types'
import { normalizeWorkoutSession } from './normalizeWorkoutSession'
import { resistanceExerciseOrdinal } from './sessionLog'
import { db } from './schema'
import { isSeedExerciseId } from './seed'

export function newId(): string {
  return crypto.randomUUID()
}

export async function listExercises(kind?: ExerciseKind): Promise<Exercise[]> {
  const all = await db.exercises.orderBy('name').toArray()
  if (!kind) return all
  return all.filter((e) => e.kind === kind)
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  const q = query.trim().toLowerCase()
  const all = await db.exercises.orderBy('name').toArray()
  if (!q) return all
  return all.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

export async function addExercise(input: {
  name: string
  kind: ExerciseKind
  tags?: string[]
}): Promise<Exercise> {
  const ex: Exercise = {
    id: newId(),
    name: input.name.trim(),
    kind: input.kind,
    tags: input.tags ?? [],
    isCustom: true,
  }
  await db.exercises.add(ex)
  return ex
}

export async function deleteExercise(id: string): Promise<void> {
  if (isSeedExerciseId(id)) return
  await db.exercises.delete(id)
}

export async function listPrograms(): Promise<Program[]> {
  return db.programs.orderBy('createdAt').reverse().toArray()
}

export async function getProgram(id: string): Promise<Program | undefined> {
  return db.programs.get(id)
}

export async function saveProgram(program: Program): Promise<void> {
  await db.programs.put(program)
}

export async function deleteProgram(id: string): Promise<void> {
  await db.transaction('rw', db.programs, db.sessions, async () => {
    await db.sessions.where('programId').equals(id).delete()
    await db.programs.delete(id)
  })
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
  await db.sessions.put(session)
}

export async function getWorkoutSession(
  id: string,
): Promise<WorkoutSession | undefined> {
  const s = await db.sessions.get(id)
  return s ? normalizeWorkoutSession(s) : undefined
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}

export async function listAllSessions(): Promise<WorkoutSession[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray()
}

export async function listSessionsForProgram(
  programId: string,
): Promise<WorkoutSession[]> {
  return db.sessions
    .where('programId')
    .equals(programId)
    .sortBy('createdAt')
    .then((rows) => rows.reverse().map(normalizeWorkoutSession))
}

export async function listSessionsForProgramDay(
  programId: string,
  dayId: string,
): Promise<WorkoutSession[]> {
  const all = await listSessionsForProgram(programId)
  return all.filter((s) => s.dayId === dayId)
}

/** In-progress workouts (no completedAt) for this day, newest first. */
export async function listIncompleteSessionsForProgramDay(
  programId: string,
  dayId: string,
): Promise<WorkoutSession[]> {
  const rows = await listSessionsForProgramDay(programId, dayId)
  return rows
    .filter((s) => s.completedAt == null)
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** Most recent finished session for this program day, for copying last weights/reps. */
export async function getLastCompletedSessionForProgramDay(
  programId: string,
  dayId: string,
): Promise<WorkoutSession | undefined> {
  const rows = await listSessionsForProgramDay(programId, dayId)
  const completed = rows.filter((s) => s.completedAt != null)
  if (completed.length === 0) return undefined
  return completed.reduce((best, s) =>
    (s.completedAt ?? 0) > (best.completedAt ?? 0) ? s : best,
  )
}

/**
 * For each resistance block, the logged sets from the most recent completed
 * workout anywhere that included this exercise (matched by exercise + ordinal
 * when the exercise appears multiple times in a session).
 */
export async function getLastResistanceSetsByBlockFromHistory(
  blocks: BlockSessionLog[],
  excludeSessionId?: string,
): Promise<Map<string, LoggedResistanceSet[]>> {
  const resistanceBlocks = blocks.filter(
    (b): b is ResistanceBlockLog => b.type === 'resistance',
  )
  if (resistanceBlocks.length === 0) return new Map()

  const keys = resistanceBlocks.map((b) => ({
    blockId: b.blockId,
    exerciseId: b.exerciseId,
    ordinal: resistanceExerciseOrdinal(blocks, b.blockId),
  }))

  const rows = await db.sessions.toArray()
  const completed = rows
    .filter((s) => s.completedAt != null)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))

  const pending = new Set(keys.map((k) => k.blockId))
  const result = new Map<string, LoggedResistanceSet[]>()

  for (const s of completed) {
    if (excludeSessionId && s.id === excludeSessionId) continue
    const norm = normalizeWorkoutSession(s)
    for (const key of keys) {
      if (!pending.has(key.blockId)) continue
      const sameExercise = norm.blocks.filter(
        (b): b is ResistanceBlockLog =>
          b.type === 'resistance' && b.exerciseId === key.exerciseId,
      )
      const blk = sameExercise[key.ordinal]
      if (blk?.sets?.length) {
        result.set(key.blockId, blk.sets)
        pending.delete(key.blockId)
      }
    }
    if (pending.size === 0) break
  }

  return result
}

export async function createProgram(name: string): Promise<Program> {
  const p: Program = {
    id: newId(),
    name: name.trim() || 'Untitled program',
    createdAt: Date.now(),
    days: [],
  }
  await db.programs.add(p)
  return p
}
