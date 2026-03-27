import type { ReactNode } from 'react'
import type { ResistanceBlock } from '../types'

export function ResistanceBlockForm({
  block,
  exerciseName,
  onChange,
}: {
  block: ResistanceBlock
  exerciseName: string
  onChange: (b: ResistanceBlock) => void
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 font-semibold text-teal-300">{exerciseName}</h3>
      <div className="mb-4 border-b border-slate-800 pb-4">
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          Sets
          <input
            type="number"
            inputMode="numeric"
            min={1}
            className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={block.setCount}
            onChange={(e) => {
              const n = Number(e.target.value)
              const setCount =
                Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
              onChange({ ...block, setCount })
            }}
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">
          Same reps, weight, tempo, intensity, and rest for every set.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field
          label="Reps"
          input={
            <input
              type="number"
              inputMode="numeric"
              className="mt-0.5 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
              value={block.reps ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  reps:
                    e.target.value === ''
                      ? undefined
                      : Number(e.target.value),
                })
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
              value={block.weight ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  weight:
                    e.target.value === ''
                      ? undefined
                      : Number(e.target.value),
                })
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
              placeholder="3-1-2-0"
              value={block.tempo ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  tempo: e.target.value || undefined,
                })
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
              placeholder="RPE / %"
              value={block.intensity ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  intensity: e.target.value || undefined,
                })
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
              value={block.restSec ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  restSec:
                    e.target.value === ''
                      ? undefined
                      : Number(e.target.value),
                })
              }
            />
          }
        />
      </div>
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
