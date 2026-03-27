import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BlockSessionLog, WorkoutSession } from '../types'
import {
  deleteWorkoutSession,
  getWorkoutSession,
  saveWorkoutSession,
} from '../db/repo'
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
  const [blocks, setBlocks] = useState<BlockSessionLog[]>([])
  const [notes, setNotes] = useState('')
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
    } else {
      setBlocks([])
      setNotes('')
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
      const next: WorkoutSession = {
        ...session,
        blocks,
        notes: notes.trim() || undefined,
        completedAt: Date.now(),
      }
      await saveWorkoutSession(next)
      setSession(next)
    } finally {
      setSaving(false)
    }
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
      <h1 className="mt-2 text-xl font-semibold text-white">
        {session.dayLabel}
      </h1>
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

      <div className="mt-10 flex flex-col gap-2 pb-8 sm:flex-row">
        <Button
          className="flex-1"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? 'Saving…' : 'Update session'}
        </Button>
        <Button
          variant="danger"
          className="flex-1 sm:flex-initial"
          type="button"
          onClick={() => void onDelete()}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
