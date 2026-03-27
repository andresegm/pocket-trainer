export type ExerciseKind = 'resistance' | 'activity'

export interface Exercise {
  id: string
  name: string
  kind: ExerciseKind
  tags: string[]
  isCustom: boolean
}

export interface ResistanceSet {
  id: string
  reps?: number
  weight?: number
  tempo?: string
  intensity?: string
  restSec?: number
}

export interface ResistanceBlock {
  id: string
  type: 'resistance'
  exerciseId: string
  sets: ResistanceSet[]
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

export interface ExportPayload {
  version: 1
  exportedAt: string
  exercises: Exercise[]
  programs: Program[]
}
