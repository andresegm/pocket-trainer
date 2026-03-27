import { useEffect, useMemo, useState } from 'react'
import type { Exercise, ExerciseKind } from '../types'
import { searchExercises } from '../db/repo'
import { Button } from './Button'

export function ExercisePicker({
  kind,
  open,
  onClose,
  onPick,
}: {
  kind: ExerciseKind
  open: boolean
  onClose: () => void
  onPick: (ex: Exercise) => void
}) {
  const [query, setQuery] = useState('')
  const [list, setList] = useState<Exercise[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void searchExercises(query).then((rows) => {
      if (cancelled) return
      setList(rows.filter((e) => e.kind === kind))
    })
    return () => {
      cancelled = true
    }
  }, [open, query, kind])

  const title = useMemo(
    () => (kind === 'resistance' ? 'Resistance exercise' : 'Activity'),
    [kind],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ex-picker-title"
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 id="ex-picker-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="p-4">
          <label className="sr-only" htmlFor="ex-search">
            Search
          </label>
          <input
            id="ex-search"
            className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="max-h-[50vh] space-y-1 overflow-y-auto">
            {list.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-800"
                  onClick={() => {
                    onPick(ex)
                    onClose()
                  }}
                >
                  <span className="font-medium">{ex.name}</span>
                  {ex.tags.length > 0 && (
                    <span className="ml-2 text-xs text-slate-500">
                      {ex.tags.join(', ')}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-500">
                No matches. Add exercises in Library.
              </li>
            )}
          </ul>
        </div>
        <div className="border-t border-slate-800 p-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
