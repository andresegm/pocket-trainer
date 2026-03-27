import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Program } from '../types'
import { createProgram, deleteProgram, listPrograms } from '../db/repo'
import { Button } from '../components/Button'

export function ProgramsPage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [name, setName] = useState('')

  const refresh = useCallback(async () => {
    setPrograms(await listPrograms())
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void refresh()
    })
    return () => cancelAnimationFrame(id)
  }, [refresh])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    const p = await createProgram(name)
    setName('')
    await refresh()
    navigate(`/programs/${p.id}`)
  }

  async function onDelete(id: string, label: string) {
    if (!confirm(`Delete program “${label}”? This cannot be undone.`)) return
    await deleteProgram(id)
    await refresh()
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-xl font-semibold text-white">Programs</h1>
      <p className="mt-1 text-sm text-slate-500">
        Each program has daily routines with exercises from your library.
      </p>

      <form
        className="mt-6 flex flex-col gap-2 sm:flex-row"
        onSubmit={onCreate}
      >
        <input
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="New program name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" className="shrink-0">
          Create
        </Button>
      </form>

      <ul className="mt-6 space-y-2">
        {programs.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <Link
              to={`/programs/${p.id}`}
              className="min-w-0 flex-1 font-medium text-teal-400 hover:text-teal-300"
            >
              <span className="truncate">{p.name}</span>
              <span className="mt-0.5 block text-xs font-normal text-slate-500">
                {p.days.length} day{p.days.length === 1 ? '' : 's'}
              </span>
            </Link>
            <Button
              variant="danger"
              className="shrink-0 px-3 py-1.5 text-xs"
              onClick={() => void onDelete(p.id, p.name)}
            >
              Delete
            </Button>
          </li>
        ))}
        {programs.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
            No programs yet. Create one above.
          </li>
        )}
      </ul>
    </div>
  )
}
