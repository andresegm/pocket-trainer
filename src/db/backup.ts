import type { ExportPayload } from '../types'
import { db } from './schema'

export async function buildExportPayload(): Promise<ExportPayload> {
  const exercises = await db.exercises.toArray()
  const programs = await db.programs.toArray()
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises,
    programs,
  }
}

export async function applyImportPayload(payload: ExportPayload): Promise<void> {
  if (payload.version !== 1) {
    throw new Error('This backup version is not supported.')
  }
  await db.transaction('rw', db.exercises, db.programs, async () => {
    await db.exercises.clear()
    await db.programs.clear()
    if (payload.exercises.length) await db.exercises.bulkAdd(payload.exercises)
    if (payload.programs.length) await db.programs.bulkAdd(payload.programs)
  })
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
  return (
    o.version === 1 &&
    typeof o.exportedAt === 'string' &&
    Array.isArray(o.exercises) &&
    Array.isArray(o.programs)
  )
}
