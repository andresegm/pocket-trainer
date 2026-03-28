import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  ActivityBlockLog,
  BlockSessionLog,
  LoggedResistanceSet,
  Program,
  WorkoutSession,
} from '../types'
import { db } from '../db/schema'
import {
  deleteWorkoutSession,
  getLastCompletedSessionForProgramDay,
  getProgram,
  listIncompleteSessionsForProgramDay,
  newId,
  saveWorkoutSession,
} from '../db/repo'
import { normalizeWorkoutSession } from '../db/normalizeWorkoutSession'
import { exerciseNameMap, logsFromRoutine } from '../db/sessionLog'
import { SessionBlockEditors } from '../components/SessionBlockEditors'
import { Button } from '../components/Button'
import { computeWorkoutProgress } from '../lib/workoutProgress'

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function WorkoutTrackPage() {
  const { programId, dayId } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState<Program | null>(null)
  const [blocks, setBlocks] = useState<BlockSessionLog[]>([])
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastCompleted, setLastCompleted] = useState<WorkoutSession | null>(
    null,
  )
  const [resumedDraft, setResumedDraft] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')
  const sessionCreatedAtRef = useRef<number | null>(null)

  const load = useCallback(async () => {
    if (!programId || !dayId) return
    setLoading(true)
    const [p, ex, incompletes, lastDone] = await Promise.all([
      getProgram(programId),
      db.exercises.toArray(),
      listIncompleteSessionsForProgramDay(programId, dayId),
      getLastCompletedSessionForProgramDay(programId, dayId),
    ])
    const day = p?.days.find((d) => d.id === dayId)
    setProgram(p ?? null)

    if (p && day) {
      const draft = incompletes[0]
      if (draft) {
        const norm = normalizeWorkoutSession(draft)
        setSessionId(norm.id)
        setBlocks(norm.blocks)
        setNotes(norm.notes ?? '')
        sessionCreatedAtRef.current = norm.createdAt
        setResumedDraft(true)
      } else {
        setSessionId(newId())
        setBlocks(logsFromRoutine(day, exerciseNameMap(ex)))
        setNotes('')
        sessionCreatedAtRef.current = null
        setResumedDraft(false)
      }
      setLastCompleted(
        lastDone ? normalizeWorkoutSession(lastDone) : null,
      )
    } else {
      setBlocks([])
      setSessionId(null)
      setLastCompleted(null)
      setResumedDraft(false)
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

  const progress = useMemo(() => computeWorkoutProgress(blocks), [blocks])

  const lastResistanceSetsByBlockId = useMemo(() => {
    const m = new Map<string, LoggedResistanceSet[]>()
    if (!lastCompleted) return m
    for (const b of lastCompleted.blocks) {
      if (b.type === 'resistance') m.set(b.blockId, b.sets)
    }
    return m
  }, [lastCompleted])

  const lastActivityFieldsByBlockId = useMemo(() => {
    const m = new Map<
      string,
      { durationMin?: number; lengthKm?: number; notes?: string }
    >()
    if (!lastCompleted) return m
    for (const b of lastCompleted.blocks) {
      if (b.type === 'activity') {
        m.set(b.blockId, {
          durationMin: b.durationMin,
          lengthKm: b.lengthKm,
          notes: b.notes,
        })
      }
    }
    return m
  }, [lastCompleted])

  const onCopyLastResistance = useCallback(
    (blockId: string) => {
      const sets = lastResistanceSetsByBlockId.get(blockId)
      if (!sets?.length) return
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.blockId !== blockId || b.type !== 'resistance') return b
          return {
            ...b,
            sets: sets.map((s) => ({
              ...s,
              id: newId(),
              done: false,
            })),
          }
        }),
      )
    },
    [lastResistanceSetsByBlockId],
  )

  const onCopyLastActivity = useCallback((blockId: string) => {
    const snap = lastActivityFieldsByBlockId.get(blockId)
    if (!snap) return
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.blockId !== blockId || b.type !== 'activity') return b
        const a = b as ActivityBlockLog
        return {
          ...a,
          ...snap,
          done: false,
        }
      }),
    )
  }, [lastActivityFieldsByBlockId])

  useEffect(() => {
    if (!program || !day || !sessionId || loading) return
    let cancelled = false
    const t = window.setTimeout(() => {
      void (async () => {
        setAutosaveStatus('saving')
        try {
          const created = sessionCreatedAtRef.current ?? Date.now()
          sessionCreatedAtRef.current = created
          await saveWorkoutSession({
            id: sessionId,
            programId: program.id,
            dayId: day.id,
            programName: program.name,
            dayLabel: day.label,
            createdAt: created,
            notes: notes.trim() || undefined,
            blocks,
          })
          if (!cancelled) {
            setAutosaveStatus('saved')
            window.setTimeout(() => {
              if (!cancelled) setAutosaveStatus('idle')
            }, 2000)
          }
        } catch {
          if (!cancelled) setAutosaveStatus('error')
        }
      })()
    }, 800)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [blocks, notes, program, day, sessionId, loading])

  async function onSave() {
    if (!program || !day || !programId || !sessionId) return
    setSaving(true)
    try {
      const createdAt = sessionCreatedAtRef.current ?? Date.now()
      const session: WorkoutSession = {
        id: sessionId,
        programId: program.id,
        dayId: day.id,
        programName: program.name,
        dayLabel: day.label,
        createdAt,
        completedAt: Date.now(),
        notes: notes.trim() || undefined,
        blocks,
      }
      await saveWorkoutSession(session)
      const incompletes = await listIncompleteSessionsForProgramDay(
        programId,
        day.id,
      )
      for (const o of incompletes) {
        if (o.id !== sessionId) await deleteWorkoutSession(o.id)
      }
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

  if (!program || !day || !sessionId) {
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

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <Link
        to={`/programs/${program.id}/track`}
        className="text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        ← Choose day
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-xl font-semibold text-white">{day.label}</h1>
        <span className="text-xs text-slate-500" aria-live="polite">
          {autosaveStatus === 'saving' && 'Saving…'}
          {autosaveStatus === 'saved' && 'Saved'}
          {autosaveStatus === 'error' && 'Draft not saved'}
        </span>
      </div>
      {resumedDraft && (
        <p className="mt-1 text-xs text-teal-400/90">
          Resumed your in-progress session.
        </p>
      )}
      <p className="mt-1 text-sm text-slate-500">
        Log what you did. Your work is saved automatically; tap Save session
        when you are finished.
      </p>

      <div
        className="sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 mt-5 border-b border-slate-800/90 bg-slate-950/95 px-4 py-3 backdrop-blur-sm supports-[backdrop-filter]:bg-slate-950/85"
        role="region"
        aria-label="Workout progress"
      >
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>
            {progress.done} / {progress.total} exercises
          </span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-teal-600 transition-[width] duration-300"
            style={{
              width: `${pct}%`,
            }}
          />
        </div>
      </div>

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
        <SessionBlockEditors
          blocks={blocks}
          onChange={setBlocks}
          workoutAssist={{
            lastResistanceSetsByBlockId,
            onCopyLastResistance,
            lastActivityFieldsByBlockId,
            onCopyLastActivity,
          }}
        />
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
