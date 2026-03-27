import { useCallback, useEffect, useState } from 'react'
import type { Exercise, ExerciseKind } from '../types'
import { addExercise, deleteExercise, searchExercises } from '../db/repo'
import { isSeedExerciseId } from '../db/seed'
import { Button } from '../components/Button'

export function LibraryPage() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<Exercise[]>([])
  const [kindFilter, setKindFilter] = useState<ExerciseKind | 'all'>('all')
  const [name, setName] = useState('')
  const [newKind, setNewKind] = useState<ExerciseKind>('resistance')
  const [tags, setTags] = useState('')

  const refresh = useCallback(async () => {
    const rows = await searchExercises(query)
    setItems(
      kindFilter === 'all'
        ? rows
        : rows.filter((e) => e.kind === kindFilter),
    )
  }, [query, kindFilter])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void refresh()
    })
    return () => cancelAnimationFrame(id)
  }, [refresh])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    await addExercise({ name: trimmed, kind: newKind, tags: tagList })
    setName('')
    setTags('')
    await refresh()
  }

  async function onRemove(ex: Exercise) {
    if (isSeedExerciseId(ex.id)) return
    if (!confirm(`Remove “${ex.name}” from your library?`)) return
    await deleteExercise(ex.id)
    await refresh()
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-xl font-semibold text-white">Exercise library</h1>
      <p className="mt-1 text-sm text-slate-500">
        Seed exercises cannot be deleted; add your own below.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-2">
        {(['all', 'resistance', 'activity'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              kindFilter === k
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => setKindFilter(k)}
          >
            {k === 'all' ? 'All' : k === 'resistance' ? 'Resistance' : 'Activity'}
          </button>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-slate-800 rounded-xl border border-slate-800">
        {items.map((ex) => (
          <li
            key={ex.id}
            className="flex items-center justify-between gap-2 px-3 py-3 text-sm"
          >
            <div>
              <div className="font-medium text-slate-100">{ex.name}</div>
              <div className="text-xs text-slate-500">
                {ex.kind === 'resistance' ? 'Resistance' : 'Activity'}
                {ex.tags.length > 0 && ` · ${ex.tags.join(', ')}`}
                {ex.isCustom && ' · custom'}
              </div>
            </div>
            {ex.isCustom && (
              <Button
                variant="danger"
                className="shrink-0 px-2 py-1 text-xs"
                onClick={() => void onRemove(ex)}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-slate-500">
            No exercises match.
          </li>
        )}
      </ul>

      <form
        className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4"
        onSubmit={onAdd}
      >
        <h2 className="text-sm font-semibold text-slate-200">Add custom</h2>
        <label className="mt-3 block text-xs text-slate-400">
          Name
          <input
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="mt-3 flex gap-2">
          <label className="flex-1 text-xs text-slate-400">
            Kind
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as ExerciseKind)}
            >
              <option value="resistance">Resistance</option>
              <option value="activity">Activity</option>
            </select>
          </label>
        </div>
        <label className="mt-3 block text-xs text-slate-400">
          Tags (comma-separated)
          <input
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. legs, compound"
          />
        </label>
        <Button type="submit" className="mt-4 w-full">
          Add to library
        </Button>
      </form>
    </div>
  )
}
