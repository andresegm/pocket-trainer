import Dexie, { type Table } from 'dexie'
import type { Exercise, Program } from '../types'

const DB_NAME = 'PocketTrainerDB'
const DB_VERSION = 1

export class PocketTrainerDB extends Dexie {
  exercises!: Table<Exercise, string>
  programs!: Table<Program, string>

  constructor() {
    super(DB_NAME)
    this.version(DB_VERSION).stores({
      exercises: 'id, kind, name',
      programs: 'id, name, createdAt',
    })
  }
}

export const db = new PocketTrainerDB()
