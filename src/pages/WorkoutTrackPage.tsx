import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BlockSessionLog, Program, WorkoutSession } from '../types'
import { db } from '../db/schema'
import { getProgram, newId, saveWorkoutSession } from '../db/repo'
import { exerciseNameMap, logsFromRoutine } from '../db/sessionLog'
import { SessionBlockEditors } from '../components/SessionBlockEditors'
import { Button } from '../components/Button'

export function WorkoutTrackPage() {
  const { programId, dayId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState<Program | null>(null)
  const [blocks, setBlocks] = useState<BlockSessionLog[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionId] = useState(() => newId())

  const load = useCallback(async () => {
    if (!programId || !dayId) return
    setLoading(true)
    const p = await getProgram(programId)
    const ex = await db.exercises.toArray()
    const day = p?.days.find((d) => d.id === dayId)
    setProgram(p ?? null)
    if (p && day) {
      setBlocks(logsFromRoutine(day, exerciseNameMap(ex)))
    } else {
      setBlocks([])
    }
    setLoading(false)
  }, [programId, dayId])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  const day = program?.days.find((d) => d.id === dayId)

  async function onSave() {
    if (!program || !day || !programId) return
    setSaving(true)
    try {
      const session: WorkoutSession = {
        id: sessionId,
        programId: program.id,
        dayId: day.id,
        programName: program.name,
        dayLabel: day.label,
        createdAt: Date.now(),
        completedAt: Date.now(),
        notes: notes.trim() || undefined,
        blocks,
      }
      await saveWorkoutSession(session)
      navigate(`/programs/${program.id}/sessions/${session.id}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 text-sm text-slate-500">Loading…</div>
    )
  }

  if (!program || !day) {
    return (
      <div className="px-4 pt-6">
        <p className="text-slate-400">Day not found.</p>
        <Link
          to={programId ? `/programs/${programId}/track` : '/programs'}
          className="mt-4 inline-block text-teal-400"
        >
          Back
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <Link
        to={`/programs/${program.id}/track`}
        className="text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        ← Choose day
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-white">{day.label}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Log what you did. Save when finished—you can start another session for
        this day anytime.
      </p>

      <label className="mt-6 block text-sm text-slate-400">
        Session notes (optional)
        <textarea
          className="mt-1 min-h-[64px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="e.g. Felt strong, left knee fine"
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
          disabled={saving || blocks.length === 0}
          onClick={() => void onSave()}
        >
          {saving ? 'Saving…' : 'Save session'}
        </Button>
        <Link to={`/programs/${program.id}/track`} className="flex-1">
          <Button variant="secondary" className="w-full" type="button">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  )
}
