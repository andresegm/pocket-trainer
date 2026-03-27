import type { ActivityBlock } from '../types'

export function ActivityBlockForm({
  block,
  exerciseName,
  onChange,
}: {
  block: ActivityBlock
  exerciseName: string
  onChange: (b: ActivityBlock) => void
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 font-semibold text-teal-300">{exerciseName}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-400">
          Duration (minutes)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={block.durationMin ?? ''}
            onChange={(e) =>
              onChange({
                ...block,
                durationMin:
                  e.target.value === ''
                    ? undefined
                    : Number(e.target.value),
              })
            }
          />
        </label>
        <label className="text-sm text-slate-400">
          Length / distance (km)
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            value={block.lengthKm ?? ''}
            onChange={(e) =>
              onChange({
                ...block,
                lengthKm:
                  e.target.value === ''
                    ? undefined
                    : Number(e.target.value),
              })
            }
          />
        </label>
      </div>
      <label className="mt-3 block text-sm text-slate-400">
        Notes
        <textarea
          className="mt-1 min-h-[72px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={block.notes ?? ''}
          onChange={(e) =>
            onChange({ ...block, notes: e.target.value || undefined })
          }
        />
      </label>
    </div>
  )
}
