import { Link } from 'react-router-dom'
import { Button } from '../components/Button'

export function HomePage() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Pocket Trainer
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Build programs from your exercise library, day by day. Resistance work
        uses sets, reps, and optional tempo, intensity, and rest. Activities
        track time and distance. Everything stays on this device.
      </p>
      <div className="mt-8 flex flex-col gap-3">
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
