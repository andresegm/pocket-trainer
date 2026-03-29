import { useEffect, useState, type ReactNode } from 'react'
import type {
  ActivityBlockLog,
  BlockSessionLog,
  LoggedResistanceSet,
  ResistanceBlockLog,
} from '../types'
import { newId } from '../db/repo'
import { Button } from './Button'

export type SessionWorkoutAssist = {
  lastResistanceSetsByBlockId: Map<string, LoggedResistanceSet[]>
  /** Last logged sets for this exercise from any completed session (per set row hints). */
  historyResistanceSetsByBlockId?: Map<string, LoggedResistanceSet[]>
  onCopyLastResistance: (blockId: string) => void
  lastActivityFieldsByBlockId: Map<
    string,
    { durationMin?: number; lengthKm?: number; notes?: string }
  >
  onCopyLastActivity: (blockId: string) => void
}

function formatResistanceSnapshot(s: LoggedResistanceSet | undefined): string {
  if (!s) return ''
  const parts: string[] = []
  if (s.reps != null) parts.push(`${s.reps} reps`)
  if (s.weight != null) parts.push(`${s.weight}`)
  if (s.tempo) parts.push(s.tempo)
  if (s.intensity) parts.push(s.intensity)
  return parts.join(' · ')
}

function formatActivitySnapshot(a: ActivityBlockLog): string {
  const parts: string[] = []
  if (a.durationMin != null) parts.push(`${a.durationMin} min`)
  if (a.lengthKm != null) parts.push(`${a.lengthKm} km`)
  const n = a.notes?.trim()
  if (n) parts.push(n.length > 48 ? `${n.slice(0, 48)}…` : n)
  return parts.join(' · ') || 'Logged'
}

function updateResistanceLog(
  blocks: BlockSessionLog[],
  blockId: string,
  updater: (b: ResistanceBlockLog) => ResistanceBlockLog,
): BlockSessionLog[] {
  return blocks.map((b) => {
    if (b.blockId !== blockId || b.type !== 'resistance') return b
    return updater(b)
  })
}

function updateActivityLog(
  blocks: BlockSessionLog[],
  blockId: string,
  updater: (b: ActivityBlockLog) => ActivityBlockLog,
): BlockSessionLog[] {
  return blocks.map((b) => {
    if (b.blockId !== blockId || b.type !== 'activity') return b
    return updater(b)
  })
}

function emptySetFrom(last?: LoggedResistanceSet): LoggedResistanceSet {
  return {
    id: newId(),
    reps: last?.reps,
    weight: last?.weight,
    tempo: last?.tempo,
    intensity: last?.intensity,
    restSec: last?.restSec,
    done: false,
  }
}

export function SessionBlockEditors({
  blocks,
  onChange,
  workoutAssist,
}: {
  blocks: BlockSessionLog[]
  onChange: (next: BlockSessionLog[]) => void
  workoutAssist?: SessionWorkoutAssist
}) {
  const [restRemaining, setRestRemaining] = useState<number | null>(null)
  const [expandedDoneSetIds, setExpandedDoneSetIds] = useState<Set<string>>(
    () => new Set(),
  )
  /** Whole-block expand: skipped resistance, or done/skipped activity. */
  const [expandedBlockDetailIds, setExpandedBlockDetailIds] = useState<
    Set<string>
  >(() => new Set())

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return
    const id = window.setInterval(() => {
      setRestRemaining((r) => {
        if (r === null || r <= 1) return null
        return r - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [restRemaining])

  if (blocks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
        This day has no exercises. Add some in the program editor first.
      </p>
    )
  }

  return (
    <>
      {restRemaining !== null && restRemaining >= 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-900/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <span className="text-sm text-slate-200">
              Rest{' '}
              <strong className="text-teal-300">
                {restRemaining > 0 ? `${restRemaining}s` : '0s'}
              </strong>
            </span>
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => setRestRemaining(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
    <div className="space-y-8">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'resistance') {
          const bl = block as ResistanceBlockLog
          const resistanceSkippedCollapsed =
            bl.skipped && !expandedBlockDetailIds.has(bl.blockId)

          if (resistanceSkippedCollapsed) {
            return (
              <div key={bl.blockId} className="space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-teal-300">
                    <span className="text-slate-500">{blockIndex + 1}. </span>
                    {bl.exerciseName}
                  </h3>
                  <span className="text-xs text-slate-500">Resistance</span>
                </div>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left"
                  onClick={() =>
                    setExpandedBlockDetailIds((prev) =>
                      new Set(prev).add(bl.blockId),
                    )
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-amber-400/90">
                      Skipped
                    </div>
                    <div className="mt-0.5 text-sm text-slate-300">
                      Tap to view or unskip
                    </div>
                  </div>
                  <span className="shrink-0 text-slate-500" aria-hidden>
                    ▾
                  </span>
                </button>
              </div>
            )
          }

          return (
            <div key={bl.blockId} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-teal-300">
                  <span className="text-slate-500">{blockIndex + 1}. </span>
                  {bl.exerciseName}
                </h3>
                <span className="text-xs text-slate-500">Resistance</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                {bl.skipped ? (
                  <div className="mb-3 flex justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs"
                      onClick={() =>
                        onChange(
                          updateResistanceLog(blocks, bl.blockId, (b) => ({
                            ...b,
                            skipped: false,
                          })),
                        )
                      }
                    >
                      Unskip
                    </Button>
                  </div>
                ) : null}
                <p className="mb-3 text-xs text-slate-500">
                  Log each set separately—reps and weight can differ if you
                  fatigue or overshoot.
                </p>
                <div className="mb-4 flex flex-wrap justify-end gap-2">
                  {workoutAssist &&
                  (workoutAssist.lastResistanceSetsByBlockId.get(bl.blockId)
                    ?.length ?? 0) > 0 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs"
                      onClick={() =>
                        workoutAssist.onCopyLastResistance(bl.blockId)
                      }
                    >
                      Copy last session
                    </Button>
                  ) : null}
                  {!bl.skipped ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs text-slate-400"
                      onClick={() => {
                        onChange(
                          updateResistanceLog(blocks, bl.blockId, (b) => ({
                            ...b,
                            skipped: true,
                            sets: b.sets.map((s) => ({
                              ...s,
                              done: false,
                            })),
                          })),
                        )
                        setExpandedBlockDetailIds((prev) => {
                          const next = new Set(prev)
                          next.delete(bl.blockId)
                          return next
                        })
                        setExpandedDoneSetIds((prev) => {
                          const next = new Set(prev)
                          for (const s of bl.sets) next.delete(s.id)
                          return next
                        })
                      }}
                    >
                      Skip exercise
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-3">
                  {bl.sets.map((set, i) => {
                    const historySets =
                      workoutAssist?.historyResistanceSetsByBlockId?.get(
                        bl.blockId,
                      )
                    const historyHint = formatResistanceSnapshot(
                      historySets?.[i],
                    )
                    const collapsedDone =
                      set.done && !expandedDoneSetIds.has(set.id)

                    if (collapsedDone) {
                      return (
                        <div
                          key={set.id}
                          className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                        >
                          <button
                            type="button"
                            className="flex w-full items-start justify-between gap-3 text-left"
                            onClick={() =>
                              setExpandedDoneSetIds((prev) =>
                                new Set(prev).add(set.id),
                              )
                            }
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-slate-500">
                                Set {i + 1} · done
                              </div>
                              <div className="mt-0.5 text-sm text-slate-200">
                                {formatResistanceSnapshot(set) ||
                                  'Tap to view or edit'}
                              </div>
                            </div>
                            <span
                              className="shrink-0 text-slate-500"
                              aria-hidden
                            >
                              ▾
                            </span>
                          </button>
                        </div>
                      )
                    }

                    return (
                    <div
                      key={set.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <div className="mb-3 flex flex-col gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-medium text-slate-500">
                            Set {i + 1}
                          </span>
                          {i > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="px-2 py-1 text-xs text-teal-400/90"
                              onClick={() =>
                                onChange(
                                  updateResistanceLog(
                                    blocks,
                                    bl.blockId,
                                    (b) => {
                                      const prev = b.sets[i - 1]
                                      return {
                                        ...b,
                                        skipped: false,
                                        sets: b.sets.map((s, j) =>
                                          j === i
                                            ? {
                                                ...s,
                                                reps: prev.reps,
                                                weight: prev.weight,
                                                tempo: prev.tempo,
                                                intensity: prev.intensity,
                                                restSec: prev.restSec,
                                              }
                                            : s,
                                        ),
                                      }
                                    },
                                  ),
                                )
                              }
                            >
                              Same as set {i}
                            </Button>
                          )}
                          {historyHint ? (
                            <span className="text-xs text-slate-500">
                              Last time: {historyHint}
                            </span>
                          ) : null}
                          {set.done && expandedDoneSetIds.has(set.id) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="ml-auto px-2 py-1 text-xs text-slate-400"
                              onClick={() =>
                                setExpandedDoneSetIds((prev) => {
                                  const next = new Set(prev)
                                  next.delete(set.id)
                                  return next
                                })
                              }
                            >
                              Collapse
                            </Button>
                          ) : null}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant={set.done ? 'secondary' : 'primary'}
                            className="px-3 py-1.5 text-xs whitespace-nowrap"
                            onClick={() => {
                              const willComplete = !set.done
                              const sec = set.restSec
                              onChange(
                                updateResistanceLog(
                                  blocks,
                                  bl.blockId,
                                  (b) => ({
                                    ...b,
                                    skipped: willComplete ? false : b.skipped,
                                    sets: b.sets.map((s) =>
                                      s.id === set.id
                                        ? { ...s, done: !s.done }
                                        : s,
                                    ),
                                  }),
                                ),
                              )
                              setExpandedDoneSetIds((prev) => {
                                const next = new Set(prev)
                                next.delete(set.id)
                                return next
                              })
                              if (
                                willComplete &&
                                typeof sec === 'number' &&
                                sec >= 1
                              ) {
                                setRestRemaining(Math.floor(sec))
                              }
                            }}
                          >
                            {set.done ? 'Done — tap to undo' : 'Mark done'}
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <Field
                          label="Reps"
                          input={
                            <input
                              type="number"
                              inputMode="numeric"
                              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={set.reps ?? ''}
                              onChange={(e) =>
                                onChange(
                                  updateResistanceLog(
                                    blocks,
                                    bl.blockId,
                                    (b) => ({
                                      ...b,
                                      sets: b.sets.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              reps:
                                                e.target.value === ''
                                                  ? undefined
                                                  : Number(e.target.value),
                                            }
                                          : s,
                                      ),
                                    }),
                                  ),
                                )
                              }
                            />
                          }
                        />
                        <Field
                          label="Weight"
                          input={
                            <input
                              type="number"
                              inputMode="decimal"
                              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={set.weight ?? ''}
                              onChange={(e) =>
                                onChange(
                                  updateResistanceLog(
                                    blocks,
                                    bl.blockId,
                                    (b) => ({
                                      ...b,
                                      sets: b.sets.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              weight:
                                                e.target.value === ''
                                                  ? undefined
                                                  : Number(e.target.value),
                                            }
                                          : s,
                                      ),
                                    }),
                                  ),
                                )
                              }
                            />
                          }
                        />
                        <Field
                          label="Tempo"
                          input={
                            <input
                              type="text"
                              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={set.tempo ?? ''}
                              onChange={(e) =>
                                onChange(
                                  updateResistanceLog(
                                    blocks,
                                    bl.blockId,
                                    (b) => ({
                                      ...b,
                                      sets: b.sets.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              tempo:
                                                e.target.value || undefined,
                                            }
                                          : s,
                                      ),
                                    }),
                                  ),
                                )
                              }
                            />
                          }
                        />
                        <Field
                          label="Intensity"
                          input={
                            <input
                              type="text"
                              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={set.intensity ?? ''}
                              onChange={(e) =>
                                onChange(
                                  updateResistanceLog(
                                    blocks,
                                    bl.blockId,
                                    (b) => ({
                                      ...b,
                                      sets: b.sets.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              intensity:
                                                e.target.value || undefined,
                                            }
                                          : s,
                                      ),
                                    }),
                                  ),
                                )
                              }
                            />
                          }
                        />
                        <Field
                          label="Rest (sec)"
                          input={
                            <input
                              type="number"
                              inputMode="numeric"
                              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={set.restSec ?? ''}
                              onChange={(e) =>
                                onChange(
                                  updateResistanceLog(
                                    blocks,
                                    bl.blockId,
                                    (b) => ({
                                      ...b,
                                      sets: b.sets.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              restSec:
                                                e.target.value === ''
                                                  ? undefined
                                                  : Number(e.target.value),
                                            }
                                          : s,
                                      ),
                                    }),
                                  ),
                                )
                              }
                            />
                          }
                        />
                      </div>
                      {bl.sets.length > 1 && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-xs text-slate-400"
                            onClick={() =>
                              onChange(
                                updateResistanceLog(
                                  blocks,
                                  bl.blockId,
                                  (b) => ({
                                    ...b,
                                    sets: b.sets.filter((s) => s.id !== set.id),
                                  }),
                                ),
                              )
                            }
                          >
                            Remove set
                          </Button>
                        </div>
                      )}
                    </div>
                    )
                  })}
                </div>
                <div className="mt-3">
                  <Button
                    variant="secondary"
                    className="w-full text-sm"
                    type="button"
                    onClick={() =>
                      onChange(
                        updateResistanceLog(blocks, bl.blockId, (b) => ({
                          ...b,
                          skipped: false,
                          sets: [
                            ...b.sets,
                            emptySetFrom(b.sets[b.sets.length - 1]),
                          ],
                        })),
                      )
                    }
                  >
                    Add set
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        const act = block as ActivityBlockLog
        const activityCollapsed =
          (act.done || act.skipped) &&
          !expandedBlockDetailIds.has(act.blockId)

        if (activityCollapsed) {
          return (
            <div key={act.blockId} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-teal-300">
                  <span className="text-slate-500">{blockIndex + 1}. </span>
                  {act.exerciseName}
                </h3>
                <span className="text-xs text-slate-500">Activity</span>
              </div>
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-left"
                onClick={() =>
                  setExpandedBlockDetailIds((prev) =>
                    new Set(prev).add(act.blockId),
                  )
                }
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs font-medium ${act.skipped ? 'text-amber-400/90' : 'text-slate-500'}`}
                  >
                    {act.skipped ? 'Skipped' : 'Done'}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-200">
                    {act.skipped
                      ? 'Tap to view or unskip'
                      : formatActivitySnapshot(act)}
                  </div>
                </div>
                <span className="shrink-0 text-slate-500" aria-hidden>
                  ▾
                </span>
              </button>
            </div>
          )
        }

        return (
          <div key={act.blockId} className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-teal-300">
                <span className="text-slate-500">{blockIndex + 1}. </span>
                {act.exerciseName}
              </h3>
              <span className="text-xs text-slate-500">Activity</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              {act.skipped ? (
                <div className="mb-3 flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={() =>
                      onChange(
                        updateActivityLog(blocks, act.blockId, (b) => ({
                          ...b,
                          skipped: false,
                        })),
                      )
                    }
                  >
                    Unskip
                  </Button>
                </div>
              ) : null}
              <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-xs text-slate-500">
                  Log duration, distance, and notes when you finish.
                </p>
                {(act.done || act.skipped) &&
                expandedBlockDetailIds.has(act.blockId) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="shrink-0 self-end px-2 py-1 text-xs text-slate-400 sm:self-start"
                    onClick={() =>
                      setExpandedBlockDetailIds((prev) => {
                        const next = new Set(prev)
                        next.delete(act.blockId)
                        return next
                      })
                    }
                  >
                    Collapse
                  </Button>
                ) : null}
              </div>
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                {workoutAssist?.lastActivityFieldsByBlockId.has(
                  act.blockId,
                ) ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={() =>
                      workoutAssist.onCopyLastActivity(act.blockId)
                    }
                  >
                    Copy last session
                  </Button>
                ) : null}
                {!act.skipped ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs text-slate-400"
                    onClick={() => {
                      onChange(
                        updateActivityLog(blocks, act.blockId, (b) => ({
                          ...b,
                          skipped: true,
                          done: false,
                        })),
                      )
                      setExpandedBlockDetailIds((prev) => {
                        const next = new Set(prev)
                        next.delete(act.blockId)
                        return next
                      })
                    }}
                  >
                    Skip exercise
                  </Button>
                ) : null}
              </div>
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant={act.done ? 'secondary' : 'primary'}
                  className="px-3 py-1.5 text-xs whitespace-nowrap"
                  onClick={() => {
                    onChange(
                      updateActivityLog(blocks, act.blockId, (b) => ({
                        ...b,
                        done: !b.done,
                        skipped: false,
                      })),
                    )
                    setExpandedBlockDetailIds((prev) => {
                      const next = new Set(prev)
                      next.delete(act.blockId)
                      return next
                    })
                  }}
                >
                  {act.done ? 'Done — tap to undo' : 'Mark done'}
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-400">
                  Duration (minutes)
                  <input
                    type="number"
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    value={act.durationMin ?? ''}
                    onChange={(e) =>
                      onChange(
                        updateActivityLog(blocks, act.blockId, (b) => ({
                          ...b,
                          durationMin:
                            e.target.value === ''
                              ? undefined
                              : Number(e.target.value),
                        })),
                      )
                    }
                  />
                </label>
                <label className="text-sm text-slate-400">
                  Length / distance (km)
                  <input
                    type="number"
                    inputMode="decimal"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                    value={act.lengthKm ?? ''}
                    onChange={(e) =>
                      onChange(
                        updateActivityLog(blocks, act.blockId, (b) => ({
                          ...b,
                          lengthKm:
                            e.target.value === ''
                              ? undefined
                              : Number(e.target.value),
                        })),
                      )
                    }
                  />
                </label>
              </div>
              <label className="mt-3 block text-sm text-slate-400">
                Notes
                <textarea
                  className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  value={act.notes ?? ''}
                  onChange={(e) =>
                    onChange(
                      updateActivityLog(blocks, act.blockId, (b) => ({
                        ...b,
                        notes: e.target.value || undefined,
                      })),
                    )
                  }
                />
              </label>
            </div>
          </div>
        )
      })}
    </div>
    </>
  )
}

function Field({
  label,
  input,
}: {
  label: string
  input: ReactNode
}) {
  return (
    <label className="text-xs text-slate-400">
      {label}
      {input}
    </label>
  )
}
