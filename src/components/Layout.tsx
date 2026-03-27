import { NavLink, Outlet } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
    isActive ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200',
  ].join(' ')

export function Layout() {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <main className="safe-pad flex-1 pb-24">
        <Outlet />
      </main>
      <nav className="safe-pad fixed bottom-0 left-0 right-0 z-10 flex border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <NavLink to="/" className={linkClass} end>
          <span aria-hidden>⌂</span>
          Home
        </NavLink>
        <NavLink to="/library" className={linkClass}>
          <span aria-hidden>≡</span>
          Library
        </NavLink>
        <NavLink to="/programs" className={linkClass}>
          <span aria-hidden>▤</span>
          Programs
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          <span aria-hidden>⚙</span>
          Settings
        </NavLink>
      </nav>
    </div>
  )
}
