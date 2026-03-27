import type { ExportPayload } from '../types'
import { db } from './schema'

export async function buildExportPayload(): Promise<ExportPayload> {
  const exercises = await db.exercises.toArray()
  const programs = await db.programs.toArray()
  const sessions = await db.sessions.toArray()
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    exercises,
    programs,
    sessions,
  }
}

export async function applyImportPayload(payload: ExportPayload): Promise<void> {
  if (payload.version !== 1 && payload.version !== 2) {
    throw new Error('This backup version is not supported.')
  }
  const sessions =
    payload.version === 2 && Array.isArray(payload.sessions)
      ? payload.sessions
      : []
  await db.transaction(
    'rw',
    db.exercises,
    db.programs,
    db.sessions,
    async () => {
      await db.exercises.clear()
      await db.programs.clear()
      await db.sessions.clear()
      if (payload.exercises.length) await db.exercises.bulkAdd(payload.exercises)
      if (payload.programs.length) await db.programs.bulkAdd(payload.programs)
      if (sessions.length) await db.sessions.bulkAdd(sessions)
    },
  )
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function isExportPayload(x: unknown): x is ExportPayload {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (o.version !== 1 && o.version !== 2) return false
  if (typeof o.exportedAt !== 'string') return false
  if (!Array.isArray(o.exercises) || !Array.isArray(o.programs)) return false
  if (o.version === 2 && !Array.isArray(o.sessions)) return false
  return true
}
