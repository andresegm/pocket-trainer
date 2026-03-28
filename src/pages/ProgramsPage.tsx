import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Program, WorkoutSession } from '../types'
import {
  createProgram,
  deleteProgram,
  listAllSessions,
  listPrograms,
} from '../db/repo'
import { computeProgramStreak } from '../lib/programStreak'
import { Button } from '../components/Button'

export function ProgramsPage() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [name, setName] = useState('')

  const streakByProgram = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of programs) {
      m.set(p.id, computeProgramStreak(sessions, p.id))
    }
    return m
  }, [programs, sessions])

  const refresh = useCallback(async () => {
    const [progs, sess] = await Promise.all([
      listPrograms(),
      listAllSessions(),
    ])
    setPrograms(progs)
    setSessions(sess)
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
        Streaks count consecutive local days with at least one saved session
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
        {programs.map((p) => {
          const streak = streakByProgram.get(p.id) ?? 0
          return (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
            >
              <Link
                to={`/programs/${p.id}`}
                className="block min-w-0 overflow-hidden font-medium text-teal-400 hover:text-teal-300"
              >
                <span className="block truncate">{p.name}</span>
                <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
                  {p.days.length} day{p.days.length === 1 ? '' : 's'}
                  {streak > 0 && (
                    <>
                      {' · '}
                      <span className="font-medium text-amber-400/95">
                        {streak}-day streak
                      </span>
                    </>
                  )}
                </span>
              </Link>
              <div className="flex shrink-0 justify-end gap-2">
                <Link to={`/programs/${p.id}/track`}>
                  <Button variant="secondary" className="px-3 py-1.5 text-xs">
                    Track
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => void onDelete(p.id, p.name)}
                >
                  Delete
                </Button>
              </div>
            </li>
          )
        })}
        {programs.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
            No programs yet. Create one above.
          </li>
        )}
      </ul>
    </div>
  )
}
