import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Program } from '../types'
import { listPrograms } from '../db/repo'
import { Button } from '../components/Button'

export function TrackHubPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const progs = await listPrograms()
    setPrograms(progs)
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-6 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8">
      <h1 className="text-xl font-semibold text-white">Track</h1>
      <p className="mt-1 text-sm text-slate-500">
        Choose a program, then pick a day to log your workout.
      </p>

      <ul className="mt-6 space-y-2">
        {programs.map((p) => (
          <li
            key={p.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <div className="min-w-0 overflow-hidden">
              <div className="truncate font-medium text-slate-100">{p.name}</div>
              <div className="truncate text-xs text-slate-500">
                {p.days.length} day{p.days.length === 1 ? '' : 's'}
              </div>
            </div>
            <Link to={`/programs/${p.id}/track`} className="shrink-0">
              <Button className="px-3 py-1.5 text-xs whitespace-nowrap">
                Choose day
              </Button>
            </Link>
          </li>
        ))}
        {programs.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
            <p>No programs yet.</p>
            <Link
              to="/programs"
              className="mt-3 inline-block text-teal-400 hover:text-teal-300"
            >
              Create a program
            </Link>
          </li>
        )}
      </ul>
    </div>
  )
}
