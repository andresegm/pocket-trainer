import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type {
  ActivityBlockLog,
  BlockSessionLog,
  Exercise,
  LoggedResistanceSet,
  Program,
  ResistanceBlockLog,
  RoutineBlock,
  WorkoutSession,
} from '../types'
import { db } from '../db/schema'
import {
  deleteWorkoutSession,
  getLastCompletedSessionForProgramDay,
  getLastResistanceSetsByBlockFromHistory,
  getProgram,
  getWorkoutSession,
  listIncompleteSessionsForProgramDay,
  newId,
  saveProgram,
  saveWorkoutSession,
} from '../db/repo'
import { normalizeWorkoutSession } from '../db/normalizeWorkoutSession'
import {
  cloneBlocksForNewSession,
  exerciseNameMap,
  logsFromRoutine,
  routineBlocksFromSessionLogs,
} from '../db/sessionLog'
import { SessionBlockEditors } from '../components/SessionBlockEditors'
import { ExercisePicker } from '../components/ExercisePicker'
import { Button } from '../components/Button'
import {
  computeWorkoutProgress,
  finalizeActivityBlocksForSave,
} from '../lib/workoutProgress'

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function formatBackdateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function WorkoutTrackPage() {
  const { programId, dayId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const backdateStr = searchParams.get('date')
  const copyFromId = searchParams.get('copyFrom')
  const backdateTs = useMemo(() => {
    if (!backdateStr) return null
    const [y, m, d] = backdateStr.split('-').map(Number)
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d, 12, 0, 0).getTime()
  }, [backdateStr])

  const [program, setProgram] = useState<Program | null>(null)
  const [blocks, setBlocks] = useState<BlockSessionLog[]>([])
  const [notes, setNotes] = useState('')
  const [dayLabel, setDayLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [lastCompleted, setLastCompleted] = useState<WorkoutSession | null>(
    null,
  )
  const [resumedDraft, setResumedDraft] = useState(false)
  const [copiedFromLabel, setCopiedFromLabel] = useState<string | null>(null)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle')
  const [historyResistanceSetsByBlockId, setHistoryResistanceSetsByBlockId] =
    useState<Map<string, LoggedResistanceSet[]>>(new Map())
  const sessionCreatedAtRef = useRef<number | null>(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [pendingAddExercise, setPendingAddExercise] = useState<Exercise | null>(
    null,
  )

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
      // Starting from a prior session replaces any draft for this day.
      const draft =
        backdateTs == null && !copyFromId ? incompletes[0] : undefined
      if (draft) {
        const norm = normalizeWorkoutSession(draft)
        setSessionId(norm.id)
        setBlocks(norm.blocks)
        setNotes(norm.notes ?? '')
        setDayLabel(norm.dayLabel || day.label)
        sessionCreatedAtRef.current = norm.createdAt
        setResumedDraft(true)
        setCopiedFromLabel(null)
      } else {
        if (copyFromId && backdateTs == null) {
          for (const o of incompletes) {
            await deleteWorkoutSession(o.id)
          }
        }
        setSessionId(newId())
        let seededFromCopy = false
        if (copyFromId) {
          const source = await getWorkoutSession(copyFromId)
          if (source && source.programId === programId) {
            const norm = normalizeWorkoutSession(source)
            setBlocks(cloneBlocksForNewSession(norm.blocks))
            setDayLabel(norm.dayLabel || day.label)
            setNotes('')
            setCopiedFromLabel(norm.dayLabel)
            seededFromCopy = true
          }
        }
        if (!seededFromCopy) {
          setBlocks(logsFromRoutine(day, exerciseNameMap(ex)))
          setDayLabel(day.label)
          setNotes('')
          setCopiedFromLabel(null)
        }
        sessionCreatedAtRef.current = backdateTs ?? Date.now()
        setResumedDraft(false)
      }
      setLastCompleted(
        lastDone ? normalizeWorkoutSession(lastDone) : null,
      )
    } else {
      setBlocks([])
      setSessionId(null)
      setDayLabel('')
      setLastCompleted(null)
      setResumedDraft(false)
      setCopiedFromLabel(null)
    }
    setLoading(false)
  }, [programId, dayId, backdateTs, copyFromId])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  const resistanceHistoryKey = useMemo(
    () =>
      blocks
        .filter((b) => b.type === 'resistance')
        .map((b) => {
          const r = b as ResistanceBlockLog
          return `${r.blockId}:${r.exerciseId}`
        })
        .join('|'),
    [blocks],
  )

  useEffect(() => {
    if (!resistanceHistoryKey) {
      setHistoryResistanceSetsByBlockId(new Map())
      return
    }
    let cancelled = false
    void getLastResistanceSetsByBlockFromHistory(
      blocks,
      sessionId ?? undefined,
    ).then((m) => {
      if (!cancelled) setHistoryResistanceSetsByBlockId(m)
    })
    return () => {
      cancelled = true
    }
  }, [resistanceHistoryKey, sessionId, blocks])

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
            skipped: false,
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
          skipped: false,
        }
      }),
    )
  }, [lastActivityFieldsByBlockId])

  const lastSessionExtras = useMemo(() => {
    if (!lastCompleted || !day) return []
    const templateBlockIds = new Set(day.blocks.map((b) => b.id))
    return lastCompleted.blocks.filter(
      (b) => !templateBlockIds.has(b.blockId),
    )
  }, [lastCompleted, day])

  const onCopyFullLastSession = useCallback(() => {
    if (!lastCompleted) return
    setBlocks((prev) => {
      const currentBlockIds = new Set(prev.map((b) => b.blockId))
      let updated = [...prev]

      for (const lastBlock of lastCompleted.blocks) {
        const idx = updated.findIndex((b) => b.blockId === lastBlock.blockId)
        if (idx !== -1) {
          if (lastBlock.type === 'resistance') {
            updated[idx] = {
              ...lastBlock,
              sets: lastBlock.sets.map((s) => ({
                ...s,
                id: newId(),
                done: false,
              })),
              skipped: false,
            }
          } else {
            updated[idx] = {
              ...lastBlock,
              done: false,
              skipped: false,
            }
          }
        }
      }

      for (const lastBlock of lastCompleted.blocks) {
        if (!currentBlockIds.has(lastBlock.blockId)) {
          if (lastBlock.type === 'resistance') {
            updated.push({
              ...lastBlock,
              blockId: newId(),
              sets: lastBlock.sets.map((s) => ({
                ...s,
                id: newId(),
                done: false,
              })),
              skipped: false,
            })
          } else {
            updated.push({
              ...lastBlock,
              blockId: newId(),
              done: false,
              skipped: false,
            })
          }
        }
      }

      return updated
    })
  }, [lastCompleted])

  function addExerciseToSession(ex: Exercise) {
    const blockId = newId()
    let newBlock: BlockSessionLog
    if (ex.kind === 'resistance') {
      newBlock = {
        blockId,
        type: 'resistance',
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: [{ id: newId(), done: false }],
      }
    } else {
      newBlock = {
        blockId,
        type: 'activity',
        exerciseId: ex.id,
        exerciseName: ex.name,
        done: false,
      }
    }
    setBlocks((prev) => [...prev, newBlock])
    setPendingAddExercise(null)
  }

  async function addExercisePermanently(ex: Exercise) {
    if (!program || !day) return
    const blockId = newId()

    let routineBlock: RoutineBlock
    if (ex.kind === 'resistance') {
      routineBlock = { id: blockId, type: 'resistance', exerciseId: ex.id, setCount: 3 }
    } else {
      routineBlock = { id: blockId, type: 'activity', exerciseId: ex.id }
    }

    const updatedProgram: Program = {
      ...program,
      days: program.days.map((d) =>
        d.id === day.id ? { ...d, blocks: [...d.blocks, routineBlock] } : d,
      ),
    }
    await saveProgram(updatedProgram)
    setProgram(updatedProgram)

    let newBlock: BlockSessionLog
    if (ex.kind === 'resistance') {
      newBlock = {
        blockId,
        type: 'resistance',
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: Array.from({ length: 3 }, () => ({ id: newId(), done: false })),
      }
    } else {
      newBlock = {
        blockId,
        type: 'activity',
        exerciseId: ex.id,
        exerciseName: ex.name,
        done: false,
      }
    }
    setBlocks((prev) => [...prev, newBlock])
    setPendingAddExercise(null)
  }

  useEffect(() => {
    if (!program || !day || !sessionId || loading) return
    if (backdateTs != null) return
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
            dayLabel: dayLabel.trim() || day.label,
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
  }, [blocks, notes, dayLabel, program, day, sessionId, loading, backdateTs])

  async function onCancel() {
    if (!program || !sessionId) return
    if (
      !window.confirm(
        'Are you sure you want to cancel? All progress will be lost (session is erased).',
      )
    ) {
      return
    }
    if (backdateTs == null) {
      await deleteWorkoutSession(sessionId)
    }
    navigate(`/programs/${program.id}/track`)
  }

  async function onSave() {
    if (
      !window.confirm(
        'Finish session? The session will be saved.',
      )
    ) {
      return
    }
    if (!program || !day || !programId || !sessionId) return
    setSaving(true)
    try {
      const createdAt = sessionCreatedAtRef.current ?? Date.now()
      const finalizedBlocks = finalizeActivityBlocksForSave(blocks)
      const label = dayLabel.trim() || day.label
      const session: WorkoutSession = {
        id: sessionId,
        programId: program.id,
        dayId: day.id,
        programName: program.name,
        dayLabel: label,
        createdAt,
        // Prefer backdate; otherwise keep the day the workout was started.
        completedAt: backdateTs ?? createdAt,
        notes: notes.trim() || undefined,
        blocks: finalizedBlocks,
      }
      await saveWorkoutSession(session)

      // Persist renamed day + full exercise list (incl. session-only) onto the program.
      const updatedProgram: Program = {
        ...program,
        days: program.days.map((d) =>
          d.id === day.id
            ? {
                ...d,
                label,
                blocks: routineBlocksFromSessionLogs(finalizedBlocks),
              }
            : d,
        ),
      }
      await saveProgram(updatedProgram)
      setProgram(updatedProgram)

      if (backdateTs == null) {
        const incompletes = await listIncompleteSessionsForProgramDay(
          programId,
          day.id,
        )
        for (const o of incompletes) {
          if (o.id !== sessionId) await deleteWorkoutSession(o.id)
        }
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
        to={`/programs/${program.id}/track${backdateStr ? `?date=${backdateStr}` : ''}`}
        className="text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        ← Choose day
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Day name</span>
          <input
            type="text"
            className="w-full rounded-lg border border-transparent bg-transparent px-0 py-0.5 text-xl font-semibold text-white outline-none focus:border-slate-700 focus:bg-slate-900 focus:px-2"
            value={dayLabel}
            onChange={(e) => setDayLabel(e.target.value)}
            placeholder={day.label}
            aria-label="Day name"
          />
        </label>
        <span className="shrink-0 pt-1 text-xs text-slate-500" aria-live="polite">
          {autosaveStatus === 'saving' && 'Saving…'}
          {autosaveStatus === 'saved' && 'Saved'}
          {autosaveStatus === 'error' && 'Draft not saved'}
        </span>
      </div>
      {backdateStr && (
        <p className="mt-1 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2 text-xs text-amber-200/90">
          Logging for{' '}
          <span className="font-medium">
            {formatBackdateLabel(backdateStr)}
          </span>
        </p>
      )}
      {copiedFromLabel && (
        <p className="mt-1 text-xs text-teal-400/90">
          Copied from previous session ({copiedFromLabel}). Values are filled
          in; nothing is marked done yet.
        </p>
      )}
      {resumedDraft && (
        <p className="mt-1 text-xs text-teal-400/90">
          Resumed your in-progress session.
        </p>
      )}
      <p className="mt-1 text-sm text-slate-500">
        {backdateTs != null
          ? 'Fill in your workout and tap Save session when done. Backdated sessions are not auto-saved. Renaming the day updates the program when you save.'
          : 'Your work is saved automatically as you go. You can leave and resume later from the track page. Tap Save session when you are finished, or Cancel to erase this draft. Renaming the day and any exercises you added are saved onto the program day when you finish.'}
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

      {lastCompleted && (
        <div className="mt-6">
          <Button
            variant="secondary"
            className="w-full text-sm"
            type="button"
            onClick={onCopyFullLastSession}
          >
            Copy all from last session
            {lastSessionExtras.length > 0 &&
              ` (+${lastSessionExtras.length} extra)`}
          </Button>
        </div>
      )}

      <div className="mt-8">
        <SessionBlockEditors
          blocks={blocks}
          onChange={setBlocks}
          workoutAssist={{
            lastResistanceSetsByBlockId,
            historyResistanceSetsByBlockId,
            onCopyLastResistance,
            lastActivityFieldsByBlockId,
            onCopyLastActivity,
          }}
        />
      </div>

      <div className="mt-6">
        <Button
          variant="secondary"
          className="w-full text-sm"
          type="button"
          onClick={() => setShowExercisePicker(true)}
        >
          + Add exercise
        </Button>
      </div>

      <ExercisePicker
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onPick={(ex) => {
          setPendingAddExercise(ex)
          setShowExercisePicker(false)
        }}
      />

      {pendingAddExercise && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-white">
              Add {pendingAddExercise.name}
            </h3>
            <p className="mt-1.5 text-xs text-slate-400">
              Add this exercise to the current session only, or make it a
              permanent part of this program day?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => addExerciseToSession(pendingAddExercise)}
              >
                This session only
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void addExercisePermanently(pendingAddExercise)}
              >
                Add to program permanently
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400"
                onClick={() => setPendingAddExercise(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-2 pb-8 sm:flex-row">
        <Button
          className="flex-1"
          disabled={saving || blocks.length === 0}
          onClick={() => void onSave()}
        >
          {saving ? 'Saving…' : 'Save session'}
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          type="button"
          disabled={saving}
          onClick={() => void onCancel()}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
