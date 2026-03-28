import type { ReactNode } from 'react'
import type {
  ActivityBlockLog,
  BlockSessionLog,
  LoggedResistanceSet,
  ResistanceBlockLog,
} from '../types'
import { newId } from '../db/repo'
import { Button } from './Button'

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
}: {
  blocks: BlockSessionLog[]
  onChange: (next: BlockSessionLog[]) => void
}) {
  if (blocks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
        This day has no exercises. Add some in the program editor first.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'resistance') {
          const bl = block as ResistanceBlockLog
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
                <p className="mb-4 text-xs text-slate-500">
                  Log each set separately—reps and weight can differ if you
                  fatigue or overshoot.
                </p>
                <div className="space-y-3">
                  {bl.sets.map((set, i) => (
                    <div
                      key={set.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          Set {i + 1}
                        </span>
                        <Button
                          type="button"
                          variant={set.done ? 'secondary' : 'primary'}
                          className="px-3 py-1.5 text-xs"
                          onClick={() =>
                            onChange(
                              updateResistanceLog(
                                blocks,
                                bl.blockId,
                                (b) => ({
                                  ...b,
                                  sets: b.sets.map((s) =>
                                    s.id === set.id
                                      ? { ...s, done: !s.done }
                                      : s,
                                  ),
                                }),
                              ),
                            )
                          }
                        >
                          {set.done ? 'Done — tap to undo' : 'Mark done'}
                        </Button>
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
                  ))}
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  Log duration, distance, and notes when you finish.
                </p>
                <Button
                  type="button"
                  variant={act.done ? 'secondary' : 'primary'}
                  className="px-3 py-1.5 text-xs"
                  onClick={() =>
                    onChange(
                      updateActivityLog(blocks, act.blockId, (b) => ({
                        ...b,
                        done: !b.done,
                      })),
                    )
                  }
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
