import Dexie, { type Table } from 'dexie'
import type { Exercise, Program, WorkoutSession } from '../types'

const DB_NAME = 'PocketTrainerDB'

export class PocketTrainerDB extends Dexie {
  exercises!: Table<Exercise, string>
  programs!: Table<Program, string>
  sessions!: Table<WorkoutSession, string>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      exercises: 'id, kind, name',
      programs: 'id, name, createdAt',
    })
    this.version(2).stores({
      exercises: 'id, kind, name',
      programs: 'id, name, createdAt',
      sessions: 'id, programId, dayId, createdAt',
    })
  }
}

export const db = new PocketTrainerDB()
