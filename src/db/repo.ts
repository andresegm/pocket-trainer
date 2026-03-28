import type { Exercise, ExerciseKind, Program, WorkoutSession } from '../types'
import { normalizeWorkoutSession } from './normalizeWorkoutSession'
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
