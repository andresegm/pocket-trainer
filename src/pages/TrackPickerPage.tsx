import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Program, WorkoutSession } from '../types'
import { getProgram, listSessionsForProgram } from '../db/repo'
import { Button } from '../components/Button'

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TrackPickerPage() {
  const { programId } = useParams()
  const [program, setProgram] = useState<Program | null>(null)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!programId) return
    setLoading(true)
    const p = await getProgram(programId)
    const s = await listSessionsForProgram(programId)
    setProgram(p ?? null)
    setSessions(s)
    setLoading(false)
  }, [programId])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  const countByDay = useMemo(() => {
    const m = new Map<string, number>()
    for (const ses of sessions) {
      m.set(ses.dayId, (m.get(ses.dayId) ?? 0) + 1)
    }
    return m
  }, [sessions])

  if (loading) {
    return (
      <div className="px-4 pt-6 text-sm text-slate-500">Loading…</div>
    )
  }

  if (!program || !programId) {
    return (
      <div className="px-4 pt-6">
        <p className="text-slate-400">Program not found.</p>
        <Link to="/programs" className="mt-4 inline-block text-teal-400">
          Back to programs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <Link
        to={`/programs/${program.id}`}
        className="text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        ← {program.name}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-white">Track workout</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pick a day to log a session. You can save multiple sessions for the same
        day whenever you train.
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Choose day
      </h2>
      <ul className="mt-3 space-y-2">
        {program.days.map((d) => {
          const n = countByDay.get(d.id) ?? 0
          return (
            <li
              key={d.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
            >
              <div className="min-w-0 overflow-hidden">
                <div className="truncate font-medium text-slate-100">
                  {d.label}
                </div>
                <div className="truncate text-xs text-slate-500">
                  {d.blocks.length} exercise{d.blocks.length === 1 ? '' : 's'}
                  {n > 0 && ` · ${n} session${n === 1 ? '' : 's'} logged`}
                </div>
              </div>
              <Link
                to={`/programs/${program.id}/track/${d.id}`}
                className="shrink-0 self-center"
              >
                <Button className="text-sm whitespace-nowrap">
                  Start session
                </Button>
              </Link>
            </li>
          )
        })}
        {program.days.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            Add days to this program before tracking.
          </li>
        )}
      </ul>

      {sessions.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recent sessions
          </h2>
          <ul className="mt-3 space-y-2">
            {sessions.slice(0, 20).map((ses) => (
              <li key={ses.id}>
                <Link
                  to={`/programs/${program.id}/sessions/${ses.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm hover:border-slate-700"
                >
                  <span className="min-w-0 truncate text-slate-200">
                    {ses.dayLabel}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {formatWhen(ses.completedAt ?? ses.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
