import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BlockSessionLog, Program, WorkoutSession } from '../types'
import {
  deleteWorkoutSession,
  getProgram,
  getWorkoutSession,
  listIncompleteSessionsForProgram,
  newId,
  saveProgram,
  saveWorkoutSession,
} from '../db/repo'
import { routineBlocksFromSessionLogs } from '../db/sessionLog'
import { SessionBlockEditors } from '../components/SessionBlockEditors'
import { Button } from '../components/Button'

function formatWhen(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function SessionDetailPage() {
  const { programId, sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [blocks, setBlocks] = useState<BlockSessionLog[]>([])
  const [notes, setNotes] = useState('')
  const [dayLabel, setDayLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    const s = await getWorkoutSession(sessionId)
    setSession(s ?? null)
    if (s) {
      setBlocks(s.blocks)
      setNotes(s.notes ?? '')
      setDayLabel(s.dayLabel)
      const p = await getProgram(s.programId)
      setProgram(p ?? null)
    } else {
      setBlocks([])
      setNotes('')
      setDayLabel('')
      setProgram(null)
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  async function onSave() {
    if (!session) return
    setSaving(true)
    try {
      const label = dayLabel.trim() || session.dayLabel
      const next: WorkoutSession = {
        ...session,
        dayLabel: label,
        blocks,
        notes: notes.trim() || undefined,
        // Keep the original workout date when editing a past session.
        completedAt: session.completedAt ?? session.createdAt,
      }
      await saveWorkoutSession(next)
      setSession(next)
      setDayLabel(label)
    } finally {
      setSaving(false)
    }
  }

  async function onAddAsNewDay() {
    if (!session || !program || !programId) return
    const label = dayLabel.trim() || session.dayLabel
    if (
      !window.confirm(
        `Add “${label}” as a new day on ${program.name}? Exercises from this session will be copied onto that day.`,
      )
    ) {
      return
    }
    setSaving(true)
    try {
      const newDayId = newId()
      const routineBlocks = routineBlocksFromSessionLogs(blocks)
      const updatedProgram: Program = {
        ...program,
        days: [
          ...program.days,
          {
            id: newDayId,
            label,
            blocks: routineBlocks,
          },
        ],
      }
      const next: WorkoutSession = {
        ...session,
        dayId: newDayId,
        dayLabel: label,
        blocks,
        notes: notes.trim() || undefined,
        completedAt: session.completedAt ?? session.createdAt,
      }
      await saveProgram(updatedProgram)
      await saveWorkoutSession(next)
      setProgram(updatedProgram)
      setSession(next)
      setDayLabel(label)
    } finally {
      setSaving(false)
    }
  }

  async function onCopyAsNewSession() {
    if (!session || !programId) return
    const incompletes = await listIncompleteSessionsForProgram(programId)
    const otherDayDraft = incompletes.find((s) => s.dayId !== session.dayId)
    if (otherDayDraft) {
      window.alert(
        `Finish or cancel your in-progress session (${otherDayDraft.dayLabel}) before starting a copy.`,
      )
      return
    }
    if (incompletes.some((s) => s.dayId === session.dayId)) {
      if (
        !window.confirm(
          'You already have an in-progress session for this day. Replace it with a copy of this workout?',
        )
      ) {
        return
      }
    }
    navigate(
      `/programs/${programId}/track/${session.dayId}?copyFrom=${session.id}`,
    )
  }

  async function onDelete() {
    if (!session || !programId) return
    if (!confirm('Delete this session? This cannot be undone.')) return
    await deleteWorkoutSession(session.id)
    navigate(`/programs/${programId}/track`)
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 text-sm text-slate-500">Loading…</div>
    )
  }

  if (!session || !programId) {
    return (
      <div className="px-4 pt-6">
        <p className="text-slate-400">Session not found.</p>
        <Link to="/programs" className="mt-4 inline-block text-teal-400">
          Programs
        </Link>
      </div>
    )
  }

  if (session.programId !== programId) {
    return (
      <div className="px-4 pt-6">
        <p className="text-slate-400">Session does not match this program.</p>
        <Link
          to={`/programs/${session.programId}/sessions/${session.id}`}
          className="mt-4 inline-block text-teal-400"
        >
          Open correct program
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <Link
        to={`/programs/${programId}/track`}
        className="text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        ← Sessions
      </Link>
      <label className="mt-2 block">
        <span className="sr-only">Session name</span>
        <input
          type="text"
          className="w-full rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-xl font-semibold text-white outline-none focus:border-slate-700 focus:bg-slate-900 focus:px-2"
          value={dayLabel}
          onChange={(e) => setDayLabel(e.target.value)}
          aria-label="Session name"
        />
      </label>
      <p className="mt-1 text-sm text-slate-500">
        {session.programName}
        <br />
        <span className="text-slate-600">
          Saved {formatWhen(session.completedAt ?? session.createdAt)}
        </span>
      </p>

      <label className="mt-6 block text-sm text-slate-400">
        Session notes
        <textarea
          className="mt-1 min-h-[64px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <div className="mt-8">
        <SessionBlockEditors blocks={blocks} onChange={setBlocks} />
      </div>

      <div className="mt-10 flex flex-col gap-2 pb-8">
        <Button
          className="w-full"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? 'Saving…' : 'Update session'}
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          disabled={saving}
          onClick={() => void onCopyAsNewSession()}
        >
          Copy as new session
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          type="button"
          disabled={saving || !program}
          onClick={() => void onAddAsNewDay()}
        >
          Add as new day to program
        </Button>
        <Button
          variant="danger"
          className="w-full"
          type="button"
          disabled={saving}
          onClick={() => void onDelete()}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
