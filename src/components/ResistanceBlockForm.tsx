import type { ResistanceBlock, ResistanceSet } from '../types'
import { newId } from '../db/repo'
import { Button } from './Button'

function emptySet(): ResistanceSet {
  return { id: newId(), reps: 8, weight: 0 }
}

export function ResistanceBlockForm({
  block,
  exerciseName,
  onChange,
}: {
  block: ResistanceBlock
  exerciseName: string
  onChange: (b: ResistanceBlock) => void
}) {
  function updateSet(index: number, patch: Partial<ResistanceSet>) {
    const sets = block.sets.map((s, i) =>
      i === index ? { ...s, ...patch } : s,
    )
    onChange({ ...block, sets })
  }

  function addSet() {
    onChange({ ...block, sets: [...block.sets, emptySet()] })
  }

  function removeSet(index: number) {
    if (block.sets.length <= 1) return
    onChange({
      ...block,
      sets: block.sets.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 font-semibold text-teal-300">{exerciseName}</h3>
      <div className="space-y-3">
        {block.sets.map((set, i) => (
          <div
            key={set.id}
            className="rounded-lg border border-slate-800 bg-slate-950 p-3"
          >
            <div className="mb-2 text-xs font-medium text-slate-500">
              Set {i + 1}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <label className="text-xs text-slate-400">
                Reps
                <input
                  type="number"
                  inputMode="numeric"
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  value={set.reps ?? ''}
                  onChange={(e) =>
                    updateSet(i, {
                      reps:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Weight
                <input
                  type="number"
                  inputMode="decimal"
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  value={set.weight ?? ''}
                  onChange={(e) =>
                    updateSet(i, {
                      weight:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Tempo
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  placeholder="3-1-2-0"
                  value={set.tempo ?? ''}
                  onChange={(e) =>
                    updateSet(i, { tempo: e.target.value || undefined })
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Intensity
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  placeholder="RPE / %"
                  value={set.intensity ?? ''}
                  onChange={(e) =>
                    updateSet(i, { intensity: e.target.value || undefined })
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Rest (sec)
                <input
                  type="number"
                  inputMode="numeric"
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
                  value={set.restSec ?? ''}
                  onChange={(e) =>
                    updateSet(i, {
                      restSec:
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="ghost"
                className="text-xs"
                disabled={block.sets.length <= 1}
                onClick={() => removeSet(i)}
              >
                Remove set
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Button variant="secondary" className="w-full text-sm" onClick={addSet}>
          Add set
        </Button>
      </div>
    </div>
  )
}
