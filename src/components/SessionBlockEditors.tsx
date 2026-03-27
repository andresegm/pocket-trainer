import type { ReactNode } from 'react'
import type {
  ActivityBlockLog,
  BlockSessionLog,
  ResistanceBlockLog,
} from '../types'
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
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    Sets
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                      value={bl.setCount}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        const setCount =
                          Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
                        onChange(
                          updateResistanceLog(
                            blocks,
                            bl.blockId,
                            (b) => ({ ...b, setCount }),
                          ),
                        )
                      }}
                    />
                  </label>
                  <Button
                    type="button"
                    variant={bl.done ? 'secondary' : 'primary'}
                    className="shrink-0 px-4 py-2 text-sm"
                    onClick={() =>
                      onChange(
                        updateResistanceLog(
                          blocks,
                          bl.blockId,
                          (b) => ({ ...b, done: !b.done }),
                        ),
                      )
                    }
                  >
                    {bl.done ? 'Done' : 'Mark done'}
                  </Button>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  Same reps, weight, tempo, intensity, and rest for every set.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field
                    label="Reps"
                    input={
                      <input
                        type="number"
                        inputMode="numeric"
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                        value={bl.reps ?? ''}
                        onChange={(e) =>
                          onChange(
                            updateResistanceLog(
                              blocks,
                              bl.blockId,
                              (b) => ({
                                ...b,
                                reps:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
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
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                        value={bl.weight ?? ''}
                        onChange={(e) =>
                          onChange(
                            updateResistanceLog(
                              blocks,
                              bl.blockId,
                              (b) => ({
                                ...b,
                                weight:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
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
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                        value={bl.tempo ?? ''}
                        onChange={(e) =>
                          onChange(
                            updateResistanceLog(
                              blocks,
                              bl.blockId,
                              (b) => ({
                                ...b,
                                tempo: e.target.value || undefined,
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
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                        value={bl.intensity ?? ''}
                        onChange={(e) =>
                          onChange(
                            updateResistanceLog(
                              blocks,
                              bl.blockId,
                              (b) => ({
                                ...b,
                                intensity: e.target.value || undefined,
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
                        className="mt-0.5 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                        value={bl.restSec ?? ''}
                        onChange={(e) =>
                          onChange(
                            updateResistanceLog(
                              blocks,
                              bl.blockId,
                              (b) => ({
                                ...b,
                                restSec:
                                  e.target.value === ''
                                    ? undefined
                                    : Number(e.target.value),
                              }),
                            ),
                          )
                        }
                      />
                    }
                  />
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
