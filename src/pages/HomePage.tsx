import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { WorkoutSession } from '../types'
import { listAllSessions } from '../db/repo'
import { normalizeWorkoutSession } from '../db/normalizeWorkoutSession'
import {
  activeDayKeysFromSessions,
  computeWorkoutStreak,
  daysInMonth,
  localDateKey,
  weekdayMondayZero,
} from '../lib/stats'
import { lastSessionTimestampsByActivity } from '../lib/homeActivities'
import { Button } from '../components/Button'

function formatSessionWhen(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatActivityLastDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function IconRunning(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={props.className}
      aria-hidden
    >
      <path d="M5 19c2.5-5 7-7 11-4.5S21 19 21 19" />
      <circle cx="8" cy="7" r="2.25" />
    </svg>
  )
}

function IconClimbing(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden
    >
      <path d="M4 20 10 9l4 4 6-9" />
      <circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconLifting(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      className={props.className}
      aria-hidden
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <rect x="1" y="8.5" width="3" height="7" rx="0.75" fill="currentColor" />
      <rect x="20" y="8.5" width="3" height="7" rx="0.75" fill="currentColor" />
    </svg>
  )
}

function IconMeditating(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden
    >
      <circle cx="12" cy="8" r="2.5" />
      <path d="M7.5 19c0-3.2 2-6 4.5-6s4.5 2.8 4.5 6" />
    </svg>
  )
}

export function HomePage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [todayKey] = useState(() => localDateKey(Date.now()))

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await listAllSessions()
    setSessions(rows.map(normalizeWorkoutSession))
    setLoading(false)
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load()
    })
    return () => cancelAnimationFrame(id)
  }, [load])

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.completedAt != null),
    [sessions],
  )

  const activeDays = useMemo(
    () => activeDayKeysFromSessions(completedSessions),
    [completedSessions],
  )

  const streak = useMemo(() => computeWorkoutStreak(activeDays), [activeDays])

  const activityLastAt = useMemo(
    () => lastSessionTimestampsByActivity(completedSessions),
    [completedSessions],
  )

  const recentSessions = useMemo(() => {
    return [...completedSessions]
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 8)
  }, [completedSessions])

  const monthLabel = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    })
  }, [viewYear, viewMonth])

  const calendarCells = useMemo(() => {
    const firstDow = weekdayMondayZero(viewYear, viewMonth)
    const dim = daysInMonth(viewYear, viewMonth)
    const cells: { day: number | null; key: string | null }[] = []
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: null })
    for (let d = 1; d <= dim; d++) {
      const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, key })
    }
    while (cells.length % 7 !== 0) cells.push({ day: null, key: null })
    return cells
  }, [viewYear, viewMonth])

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-8">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Pocket Trainer
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Build programs from your exercise library, track sessions, and review
        your training history. Everything stays on this device.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading stats…</p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Workouts
              </div>
              <div className="mt-1 text-2xl font-semibold text-teal-300">
                {completedSessions.length}
              </div>
              <div className="text-xs text-slate-500">Completed sessions</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Streak
              </div>
              <div className="mt-1 text-2xl font-semibold text-teal-300">
                {streak}
              </div>
              <div className="text-xs text-slate-500">Days in a row</div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-200">
              Running, climbing, lifting &amp; meditation
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3">
              {(
                [
                  {
                    key: 'running',
                    label: 'Running',
                    Icon: IconRunning,
                    lastAt: activityLastAt.running,
                  },
                  {
                    key: 'climbing',
                    label: 'Climbing',
                    Icon: IconClimbing,
                    lastAt: activityLastAt.climbing,
                  },
                  {
                    key: 'lifting',
                    label: 'Lifting',
                    Icon: IconLifting,
                    lastAt: activityLastAt.lifting,
                  },
                  {
                    key: 'meditating',
                    label: 'Meditating',
                    Icon: IconMeditating,
                    lastAt: activityLastAt.meditating,
                  },
                ] as const
              ).map(({ key, label, Icon, lastAt }) => (
                <div
                  key={key}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border border-slate-700/80 bg-slate-900/60 text-teal-400/90"
                    aria-hidden
                  >
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="mt-2 text-xs font-medium text-slate-300">
                    {label}
                  </div>
                  <div className="mt-1 text-[10px] leading-snug text-slate-500">
                    Last session:{' '}
                    {lastAt != null ? (
                      <span className="text-slate-400">
                        {formatActivityLastDate(lastAt)}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-200">Activity</h2>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs text-slate-400"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Previous month"
                >
                  ‹
                </Button>
                <span className="min-w-[10rem] text-center text-xs text-slate-400">
                  {monthLabel}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="px-2 py-1 text-xs text-slate-400"
                  onClick={() => shiftMonth(1)}
                  aria-label="Next month"
                >
                  ›
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-slate-600">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {calendarCells.map((c, i) => {
                if (c.day == null || c.key == null) {
                  return (
                    <div key={`e-${i}`} className="aspect-square" aria-hidden />
                  )
                }
                const has = activeDays.has(c.key)
                const isToday = c.key === todayKey
                return (
                  <div
                    key={c.key}
                    className={[
                      'flex aspect-square items-center justify-center rounded-lg text-xs',
                      has
                        ? 'bg-teal-600/35 font-medium text-teal-100'
                        : 'text-slate-600',
                      isToday ? 'ring-1 ring-teal-500/60' : '',
                    ].join(' ')}
                    title={c.key}
                  >
                    {c.day}
                  </div>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Days with at least one saved session (local time).
            </p>
          </div>

          {recentSessions.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-slate-200">
                Recent sessions
              </h2>
              <ul className="mt-3 space-y-2">
                {recentSessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/programs/${s.programId}/sessions/${s.id}`}
                      className="block rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 transition-colors hover:border-slate-700 hover:bg-slate-900/70"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-slate-200">
                          {s.dayLabel}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatSessionWhen(s.completedAt ?? s.createdAt)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {s.programName}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-8 text-sm text-slate-500">
              No completed sessions yet. Finish a workout from a program to see
              it here.
            </p>
          )}
        </>
      )}

      <div className="mt-10 flex flex-col gap-3">
        <Link to="/library">
          <Button className="w-full">Exercise library</Button>
        </Link>
        <Link to="/programs">
          <Button variant="secondary" className="w-full">
            Your programs
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="secondary" className="w-full">
            Backup &amp; settings
          </Button>
        </Link>
      </div>
    </div>
  )
}
