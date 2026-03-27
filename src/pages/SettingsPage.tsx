import { useRef, useState } from 'react'
import {
  applyImportPayload,
  buildExportPayload,
  downloadJson,
  isExportPayload,
  readJsonFile,
} from '../db/backup'
import { ensureSeedExercises } from '../db/seed'
import { Button } from '../components/Button'

export function SettingsPage() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function onExport() {
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const payload = await buildExportPayload()
      downloadJson(
        `pocket-trainer-backup-${new Date().toISOString().slice(0, 10)}.json`,
        payload,
      )
      setMessage('Backup downloaded.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const raw = await readJsonFile(file)
      if (!isExportPayload(raw)) {
        throw new Error('File does not look like a Pocket Trainer backup.')
      }
      if (
        !confirm(
          'Replace all data on this device with this backup? This cannot be undone.',
        )
      ) {
        setBusy(false)
        return
      }
      await applyImportPayload(raw)
      await ensureSeedExercises()
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Data is stored only in this browser. Export regularly so you do not lose
        programs if you clear site data or switch devices.
      </p>

      {message && (
        <p className="mt-4 rounded-lg border border-teal-800 bg-teal-950/40 px-3 py-2 text-sm text-teal-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Backup</h2>
        <p className="mt-2 text-sm text-slate-500">
          Download a JSON file with all exercises and programs. Store it somewhere
          safe (Files, iCloud, email).
        </p>
        <Button
          className="mt-4 w-full"
          disabled={busy}
          onClick={() => void onExport()}
        >
          Export backup
        </Button>
      </section>

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">Restore</h2>
        <p className="mt-2 text-sm text-slate-500">
          Importing replaces all exercises and programs on this device.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onFileChange(e)}
        />
        <Button
          variant="secondary"
          className="mt-4 w-full"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Import backup
        </Button>
      </section>

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-sm font-semibold text-slate-200">iPhone</h2>
        <p className="mt-2 text-sm text-slate-500">
          Deploy this app to a free HTTPS host (see README), open the URL in
          Safari, then Share → Add to Home Screen for a full-screen shortcut and
          offline caching.
        </p>
      </section>
    </div>
  )
}
