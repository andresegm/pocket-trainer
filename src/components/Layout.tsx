import { NavLink, Outlet, useLocation } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
    isActive ? 'text-teal-400' : 'text-slate-400 hover:text-slate-200',
  ].join(' ')

function isTrackRoute(pathname: string): boolean {
  return (
    pathname === '/track' ||
    /^\/programs\/[^/]+\/track(\/|$)/.test(pathname)
  )
}

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      {/*
        Bottom padding must clear the fixed tab bar (~4.5–5.5rem) plus the home
        indicator. Do not use .safe-pad on main — it sets padding-bottom and
        overrides pb-*, leaving almost no space above the nav on many screens.
      */}
      <main
        className="flex-1 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]"
      >
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
        <NavLink
          to="/track"
          className={({ isActive }) =>
            linkClass({ isActive: isActive || isTrackRoute(pathname) })
          }
        >
          <span aria-hidden>◎</span>
          Track
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
