export type ExerciseKind = 'resistance' | 'activity'

export interface Exercise {
  id: string
  name: string
  kind: ExerciseKind
  tags: string[]
  isCustom: boolean
}

/**
 * Planned resistance in a program day: same reps/weight/tempo/etc. for every set;
 * `setCount` is how many sets to do.
 */
export interface ResistanceBlock {
  id: string
  type: 'resistance'
  exerciseId: string
  setCount: number
  reps?: number
  weight?: number
  tempo?: string
  intensity?: string
  restSec?: number
}

/** Activity block: duration (minutes) and length (distance km or user-defined meaning). */
export interface ActivityBlock {
  id: string
  type: 'activity'
  exerciseId: string
  durationMin?: number
  lengthKm?: number
  notes?: string
}

export type RoutineBlock = ResistanceBlock | ActivityBlock

export interface DailyRoutine {
  id: string
  label: string
  blocks: RoutineBlock[]
}

export interface Program {
  id: string
  name: string
  createdAt: number
  days: DailyRoutine[]
}

/** One logged set during a workout (values can differ from prescribed each set). */
export interface LoggedResistanceSet {
  id: string
  reps?: number
  weight?: number
  tempo?: string
  intensity?: string
  restSec?: number
  done?: boolean
}

/** Logged resistance: one card per exercise; each set tracked separately. */
export interface ResistanceBlockLog {
  blockId: string
  type: 'resistance'
  exerciseId: string
  exerciseName: string
  sets: LoggedResistanceSet[]
}

export interface ActivityBlockLog {
  blockId: string
  type: 'activity'
  exerciseId: string
  exerciseName: string
  durationMin?: number
  lengthKm?: number
  notes?: string
  done?: boolean
}

export type BlockSessionLog = ResistanceBlockLog | ActivityBlockLog

/** One saved workout for a program day; multiple rows allowed for same programId + dayId. */
export interface WorkoutSession {
  id: string
  programId: string
  dayId: string
  programName: string
  dayLabel: string
  createdAt: number
  completedAt?: number
  notes?: string
  blocks: BlockSessionLog[]
}

export interface ExportPayload {
  version: 1 | 2
  exportedAt: string
  exercises: Exercise[]
  programs: Program[]
  /** Present on v2 exports; omitted in legacy v1 backups. */
  sessions?: WorkoutSession[]
}
