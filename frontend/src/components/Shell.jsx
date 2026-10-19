import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import LogoMark from './Logo'

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="8" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="11" width="7" height="10" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    process: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m10 8 6 4-6 4V8Z" />
      </>
    ),
    history: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
        <path d="M3 5v4h4" />
      </>
    ),
    signout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
      </>
    ),
  }

  return <svg {...common}>{paths[name]}</svg>
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/process', label: 'Process Lecture', icon: 'process' },
  { to: '/history', label: 'Lecture History', icon: 'history' },
]

function BrandMark({ size = 40 }) {
  return (
    <LogoMark
      size={size}
      className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
    />
  )
}

function MobileNav() {
  return (
    <nav aria-label="Main navigation" className="flex w-full items-stretch justify-around">
      {navItems.map(({ to, label, icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2.5 text-[11px] font-semibold transition-colors ${
              isActive ? 'text-brand-700' : 'text-ink-muted hover:text-ink'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 h-[3px] w-10 rounded-b-full bg-brand-500" />
              )}
              <Icon name={icon} size={22} />
              <span className="max-w-full truncate">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Shell() {
  const { session, signOut, username } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const email = session?.user?.email ?? ''
  const initials = (username || 'ST').slice(0, 2).toUpperCase()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/auth')
    } catch (error) {
      console.error('Unable to sign out:', error)
    }
  }

  return (
    <div className="flex min-h-screen flex-col font-sans text-ink">
      {/* Top navigation */}
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <NavLink to="/" className="group flex items-center gap-3" aria-label="LectureLens home">
            <BrandMark size={40} />
            <span className="text-lg font-bold tracking-tight">LectureLens</span>
          </NavLink>

          <nav aria-label="Main navigation" className="hidden items-center gap-9 md:flex">
            {navItems.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `link-underline text-sm font-medium ${
                    isActive ? 'is-active text-ink' : 'text-ink-soft hover:text-ink'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 lg:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400 text-xs font-bold text-ink">
                {initials}
              </span>
              <span className="max-w-[10rem] truncate text-sm font-medium text-ink-soft">
                {username}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="btn btn-secondary btn-sm"
            >
              <Icon name="signout" size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div
          key={location.pathname}
          className="animate-in mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-10"
        >
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-brand-50/60">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-28 pt-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] md:pb-12 lg:px-10">
          <div>
            <NavLink to="/" className="group inline-flex items-center gap-3">
              <BrandMark size={44} />
              <span className="text-xl font-bold tracking-tight">LectureLens</span>
            </NavLink>
            <p className="mt-4 max-w-xs text-sm text-ink-soft">
              Turn lectures into knowledge: transcripts, summaries, quizzes and an AI tutor.
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              &copy; {new Date().getFullYear()} LectureLens
            </p>
          </div>

          <div>
            <p className="eyebrow mb-4">Explore</p>
            <ul className="space-y-2.5">
              {navItems.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className="link-underline text-sm text-ink-soft hover:text-ink"
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="eyebrow mb-4">Account</p>
            <p className="truncate text-sm font-semibold text-ink">{username}</p>
            <p className="truncate text-sm text-ink-soft">{email || 'Student account'}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="link-underline mt-2.5 text-sm font-medium text-ink hover:text-brand-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-canvas/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(26,20,35,0.08)] backdrop-blur-xl md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}