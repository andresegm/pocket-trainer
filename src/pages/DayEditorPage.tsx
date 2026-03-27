import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type {
  ActivityBlock,
  Exercise,
  Program,
  ResistanceBlock,
  RoutineBlock,
} from '../types'
import { db } from '../db/schema'
import { getProgram, newId, saveProgram } from '../db/repo'
import { ActivityBlockForm } from '../components/ActivityBlockForm'
import { Button } from '../components/Button'
import { ExercisePicker } from '../components/ExercisePicker'
import { ResistanceBlockForm } from '../components/ResistanceBlockForm'

export function DayEditorPage() {
  const { programId, dayId } = useParams()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [picker, setPicker] = useState<'resistance' | 'activity' | null>(null)

  const load = useCallback(async () => {
    if (!programId) return
    setLoading(true)
    const p = await getProgram(programId)
    setProgram(p ?? null)
    const ex = await db.exercises.toArray()
    setExercises(ex)
    setLoading(false)
  }, [programId])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  const byId = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])) as Record<
      string,
      Exercise
    >,
    [exercises],
  )

  const day = program?.days.find((d) => d.id === dayId)

  async function persist(next: Program) {
    setProgram(next)
    await saveProgram(next)
  }

  function updateDayBlocks(blocks: RoutineBlock[]) {
    if (!program || !dayId) return
    void persist({
      ...program,
      days: program.days.map((d) =>
        d.id === dayId ? { ...d, blocks } : d,
      ),
    })
  }

  function updateBlock(blockId: string, block: RoutineBlock) {
    if (!day) return
    updateDayBlocks(
      day.blocks.map((b) => (b.id === blockId ? block : b)),
    )
  }

  function removeBlock(blockId: string) {
    if (!day) return
    if (!confirm('Remove this block from the day?')) return
    updateDayBlocks(day.blocks.filter((b) => b.id !== blockId))
  }

  function moveBlock(index: number, dir: -1 | 1) {
    if (!day) return
    const blocks = [...day.blocks]
    const j = index + dir
    if (j < 0 || j >= blocks.length) return
    ;[blocks[index], blocks[j]] = [blocks[j], blocks[index]]
    updateDayBlocks(blocks)
  }

  function onPickResistance(ex: Exercise) {
    if (!program || !dayId || !day) return
    const block: ResistanceBlock = {
      id: newId(),
      type: 'resistance',
      exerciseId: ex.id,
      sets: [{ id: newId(), reps: 8, weight: 0 }],
    }
    void persist({
      ...program,
      days: program.days.map((d) =>
        d.id === dayId ? { ...d, blocks: [...d.blocks, block] } : d,
      ),
    })
  }

  function onPickActivity(ex: Exercise) {
    if (!program || !dayId || !day) return
    const block: ActivityBlock = {
      id: newId(),
      type: 'activity',
      exerciseId: ex.id,
    }
    void persist({
      ...program,
      days: program.days.map((d) =>
        d.id === dayId ? { ...d, blocks: [...d.blocks, block] } : d,
      ),
    })
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
        <Link to="/programs" className="mt-4 inline-block text-teal-400">
          Back to programs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <Link
        to={`/programs/${program.id}`}
        className="text-xs font-medium text-slate-500 hover:text-slate-300"
      >
        ← {program.name}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-white">{day.label}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add exercises from your library. Resistance blocks support multiple sets;
        activities capture duration and distance.
      </p>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={() => setPicker('resistance')}>
          Add resistance
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => setPicker('activity')}
        >
          Add activity
        </Button>
      </div>

      <ExercisePicker
        kind="resistance"
        open={picker === 'resistance'}
        onClose={() => setPicker(null)}
        onPick={onPickResistance}
      />
      <ExercisePicker
        kind="activity"
        open={picker === 'activity'}
        onClose={() => setPicker(null)}
        onPick={onPickActivity}
      />

      <div className="mt-8 space-y-6">
        {day.blocks.map((b, i) => {
          const name = byId[b.exerciseId]?.name ?? 'Unknown exercise'
          return (
            <div key={b.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {b.type === 'resistance' ? 'Resistance' : 'Activity'}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    disabled={i === 0}
                    onClick={() => moveBlock(i, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    disabled={i === day.blocks.length - 1}
                    onClick={() => moveBlock(i, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="danger"
                    className="px-2 py-1 text-xs"
                    onClick={() => removeBlock(b.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              {b.type === 'resistance' ? (
                <ResistanceBlockForm
                  block={b}
                  exerciseName={name}
                  onChange={(next) => updateBlock(b.id, next)}
                />
              ) : (
                <ActivityBlockForm
                  block={b}
                  exerciseName={name}
                  onChange={(next) => updateBlock(b.id, next)}
                />
              )}
            </div>
          )
        })}
        {day.blocks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-sm text-slate-500">
            No exercises yet. Use the buttons above.
          </p>
        )}
      </div>
    </div>
  )
}
