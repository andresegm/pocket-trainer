import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { DailyRoutine, Program, WorkoutSession } from '../types'
import {
  deleteProgram,
  getProgram,
  listSessionsForProgram,
  newId,
  saveProgram,
} from '../db/repo'
import { Button } from '../components/Button'

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ProgramEditorPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState<Program | null>(null)
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [nameDraft, setNameDraft] = useState('')

  const load = useCallback(async () => {
    if (!programId) return
    setLoading(true)
    const [p, s] = await Promise.all([
      getProgram(programId),
      listSessionsForProgram(programId),
    ])
    setProgram(p ?? null)
    setSessions(s)
    if (p) setNameDraft(p.name)
    setLoading(false)
  }, [programId])

  const lastSessionAtByDayId = useMemo(() => {
    const m = new Map<string, number>()
    for (const ses of sessions) {
      const t = ses.completedAt ?? ses.createdAt
      const prev = m.get(ses.dayId)
      if (prev === undefined || t > prev) m.set(ses.dayId, t)
    }
    return m
  }, [sessions])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  async function persist(next: Program) {
    setProgram(next)
    await saveProgram(next)
  }

  async function renameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!program) return
    await persist({ ...program, name: nameDraft.trim() || program.name })
  }

  function addDay() {
    if (!program) return
    const label = `Day ${program.days.length + 1}`
    const day: DailyRoutine = {
      id: newId(),
      label,
      blocks: [],
    }
    void persist({ ...program, days: [...program.days, day] })
  }

  function moveDay(index: number, dir: -1 | 1) {
    if (!program) return
    const days = [...program.days]
    const j = index + dir
    if (j < 0 || j >= days.length) return
    ;[days[index], days[j]] = [days[j], days[index]]
    void persist({ ...program, days })
  }

  function updateDayLabel(id: string, label: string) {
    if (!program) return
    void persist({
      ...program,
      days: program.days.map((d) =>
        d.id === id ? { ...d, label } : d,
      ),
    })
  }

  function removeDay(id: string) {
    if (!program) return
    if (!confirm('Remove this day and all of its exercises?')) return
    void persist({
      ...program,
      days: program.days.filter((d) => d.id !== id),
    })
  }

  async function removeProgram() {
    if (!program) return
    if (
      !confirm(
        `Delete program “${program.name}”? This cannot be undone.`,
      )
    )
      return
    await deleteProgram(program.id)
    navigate('/programs')
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 text-sm text-slate-500">Loading…</div>
    )
  }

  if (!program) {
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link
            to="/programs"
            className="text-xs font-medium text-slate-500 hover:text-slate-300"
          >
            ← Programs
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-white">Edit program</h1>
        </div>
        <Button variant="danger" className="shrink-0 text-xs" onClick={removeProgram}>
          Delete
        </Button>
      </div>

      <form className="mt-4 flex gap-2" onSubmit={renameSubmit}>
        <input
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
        />
        <Button type="submit" className="shrink-0">
          Save name
        </Button>
      </form>

      <Link
        to={`/programs/${program.id}/track`}
        className="mt-4 block"
      >
        <Button className="w-full">Track a workout</Button>
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Daily routines
        </h2>
        <Button className="text-sm" onClick={addDay}>
          Add day
        </Button>
      </div>

      <ul className="mt-3 space-y-2">
        {program.days.map((d, i) => {
          const lastAt = lastSessionAtByDayId.get(d.id)
          return (
          <li
            key={d.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm font-medium"
                value={d.label}
                onChange={(e) => updateDayLabel(d.id, e.target.value)}
              />
              <div className="flex gap-1">
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  disabled={i === 0}
                  onClick={() => moveDay(i, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-xs"
                  disabled={i === program.days.length - 1}
                  onClick={() => moveDay(i, 1)}
                >
                  ↓
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Last session
              {lastAt != null ? (
                <> · {formatWhen(lastAt)}</>
              ) : (
                <span className="text-slate-600"> · —</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to={`/programs/${program.id}/days/${d.id}`}
                className="inline-flex rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-500"
              >
                Edit exercises
              </Link>
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() => removeDay(d.id)}
              >
                Remove day
              </Button>
            </div>
          </li>
          )
        })}
        {program.days.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            No days yet. Add a day to build a routine.
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
