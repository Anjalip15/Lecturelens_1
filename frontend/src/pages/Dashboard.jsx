import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { LogoGlyph } from '../components/Logo'
import FeatureIcon from '../components/FeatureIcon'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce || target === 0) {
      setValue(target)
      return undefined
    }

    let raf
    let start
    const step = (t) => {
      if (start === undefined) start = t
      const p = Math.min((t - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

function ArrowIcon({ size = 16 }) {
  return (
    <svg className="arrow" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function StatIcon({ name }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  const paths = {
    total: (
      <>
        <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2" />
        <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H19v-3" />
      </>
    ),
    done: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 4.5-5" />
      </>
    ),
    active: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    failed: (
      <>
        <path d="M12 3 2.5 20h19L12 3Z" />
        <path d="M12 10v4" />
        <path d="M12 17.5h.01" />
      </>
    ),
  }
  return <svg {...props}>{paths[name]}</svg>
}

function StatusBadge({ status }) {
  const key = ['done', 'queued', 'processing', 'failed'].includes(status) ? status : 'queued'
  const label = String(status ?? 'queued')
  return (
    <span className={`badge badge-${key}`}>
      {key === 'processing' && <span className="pulse-soft h-1.5 w-1.5 rounded-full bg-brand-600" />}
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  )
}

const statTones = {
  brand: 'bg-brand-100 text-brand-700',
  mint: 'bg-emerald-100 text-emerald-700',
  gold: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
}

function StatTile({ label, value, tone, icon, delay }) {
  const shown = useCountUp(value ?? 0)
  return (
    <div className={`rise card card-hover flex items-center gap-3 p-4 ${delay}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statTones[tone]}`}>
        <StatIcon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none tracking-tight text-ink">
          {value === null ? '–' : shown}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-ink-soft">{label}</p>
      </div>
    </div>
  )
}

/* The modules LectureLens provides. Hover a card to see what it does. */
const modules = [
  {
    icon: 'process',
    title: 'Process Lecture',
    text: 'Upload a lecture video and choose what to generate.',
    tone: 'coral',
    to: '/process',
    cta: 'Start processing',
    details: ['Upload your lecture video', 'Choose which outputs to generate', 'Live upload progress'],
  },
  {
    icon: 'transcript',
    title: 'Transcripts',
    text: 'Timestamped text via Whisper.',
    tone: 'sun',
    to: '/pick/transcript',
    cta: 'Choose a lecture',
    details: ['Whisper-powered transcription', 'Timestamps included', 'Pick a lecture to view its transcript'],
  },
  {
    icon: 'subtitles',
    title: 'Subtitles',
    text: 'SRT and VTT caption files.',
    tone: 'sea',
    to: '/pick/subtitles',
    cta: 'Choose a lecture',
    details: ['SRT caption files', 'VTT caption files', 'Pick a lecture to download its captions'],
  },
  {
    icon: 'summary',
    title: 'Summaries',
    text: 'Technical and simplified summaries.',
    tone: 'lilac',
    to: '/pick/summary',
    cta: 'Choose a lecture',
    details: ['Technical summary', 'Simplified summary', 'Pick a lecture to read its summary'],
  },
  {
    icon: 'quiz',
    title: 'Quizzes',
    text: '10 auto-generated multiple-choice questions.',
    tone: 'coral',
    to: '/pick/quiz',
    cta: 'Choose a lecture',
    details: ['Generated from the lecture', '10 multiple-choice questions', 'Pick a lecture to take its quiz'],
  },
  {
    icon: 'glossary',
    title: 'Glossary',
    text: 'Key terms extracted from the lecture.',
    tone: 'sun',
    to: '/pick/glossary',
    cta: 'Choose a lecture',
    details: ['Key terms from the lecture', 'Simple definitions', 'Pick a lecture to see its glossary'],
  },
  {
    icon: 'tutor',
    title: 'Lecture Companion',
    text: 'Ask anything about the lecture.',
    tone: 'sea',
    to: '/pick/chat',
    cta: 'Choose a lecture',
    details: ['Ask questions in plain language', 'Answers drawn from the lecture', 'Pick a lecture to start asking'],
  },
  {
    icon: 'library',
    title: 'Lecture History',
    text: 'Your whole library in one place.',
    tone: 'lilac',
    to: '/history',
    cta: 'Browse library',
    details: ['Search your lectures', 'See the status of each one', 'Open all outputs of any finished lecture'],
  },
]

function ModuleCard({ mod, index, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(mod.to)}
      style={{ animationDelay: `${120 + index * 70}ms` }}
      className={`rise group card-gradient card-gradient-${mod.tone} relative h-48 w-full p-5 text-left`}
    >
      {/* Front */}
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/85 text-ink shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        <FeatureIcon name={mod.icon} size={22} />
      </span>
      <h3 className="text-lg font-bold tracking-tight">{mod.title}</h3>
      <p className="mt-1 text-sm font-medium leading-snug text-ink/80">{mod.text}</p>

      {/* Hover panel */}
      <div className="absolute inset-0 z-10 flex translate-y-full flex-col justify-between bg-ink p-5 text-white transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-gold-400">
            {mod.title}
          </p>
          <ul className="space-y-1.5 text-[13px] leading-snug text-white/90">
            {mod.details.map((d) => (
              <li key={d} className="flex gap-2">
                <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold-400">
          {mod.cta} <ArrowIcon size={14} />
        </span>
      </div>
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { username } = useAuth()
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api
      .listLectures()
      .then((d) => setLectures(d.lectures ?? []))
      .catch((err) => setError(err.message || 'Could not load your lectures.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    if (error) return { total: null, done: null, active: null, failed: null }
    const count = (fn) => lectures.filter(fn).length
    return {
      total: lectures.length,
      done: count((l) => l.status === 'done'),
      active: count((l) => l.status === 'queued' || l.status === 'processing'),
      failed: count((l) => l.status === 'failed'),
    }
  }, [lectures, error])

  const recent = lectures.slice(0, 5)

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      {/* MAIN COLUMN (shown on the right on large screens) */}
      <div className="min-w-0 space-y-6 lg:order-2">
        {/* Compact welcome banner */}
        <section className="card relative overflow-hidden p-6 sm:p-8">
          <div className="dots pointer-events-none absolute -left-2 -top-2 h-24 w-40 opacity-60" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 hidden h-56 w-56 rounded-full bg-gold-400/30 blur-2xl sm:block" aria-hidden="true" />
          <div className="float pointer-events-none absolute right-8 top-1/2 hidden h-28 w-28 -translate-y-1/2 items-center justify-center rounded-[2rem] bg-gradient-to-br from-brand-400 to-brand-600 text-ink shadow-xl shadow-brand-500/30 md:flex" aria-hidden="true">
            <LogoGlyph size={64} />
          </div>

          <div className="relative md:max-w-[70%]">
            <p className="eyebrow rise">{greeting()}</p>
            <h1 className="rise rise-1 mt-3 break-words text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
              Welcome back, <span className="mark hl">{username}</span>.
            </h1>
            <p className="rise rise-2 mt-3 text-ink-soft">
              Turn any lecture into notes, summaries, quizzes, and answers — all in one place.
            </p>
            <div className="rise rise-3 mt-5 flex flex-wrap gap-3">
              <button onClick={() => navigate('/process')} className="btn btn-primary">
                Process a lecture <ArrowIcon />
              </button>
              <button onClick={() => navigate('/history')} className="btn btn-secondary">
                View history
              </button>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section aria-label="LectureLens modules">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight text-ink">
              What LectureLens <span className="hl">does.</span>
            </h2>
            <p className="hidden font-mono text-[11px] uppercase tracking-wider text-ink-muted sm:block">
              Hover a card for details
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {modules.map((m, i) => (
              <ModuleCard key={m.title} mod={m} index={i} onOpen={(to) => navigate(to)} />
            ))}
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN */}
      <aside className="min-w-0 space-y-6 lg:order-1">
        <section aria-label="Library overview">
          <h2 className="mb-3 text-xl font-bold tracking-tight text-ink">
            Your <span className="hl">library.</span>
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="card flex items-center gap-3 p-4">
                  <div className="skeleton h-10 w-10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-8" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Total" value={stats.total} tone="brand" icon="total" delay="rise-1" />
              <StatTile label="Ready" value={stats.done} tone="mint" icon="done" delay="rise-2" />
              <StatTile label="In progress" value={stats.active} tone="gold" icon="active" delay="rise-3" />
              <StatTile label="Failed" value={stats.failed} tone="rose" icon="failed" delay="rise-4" />
            </div>
          )}
        </section>

        <section aria-label="Recent lectures" className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-ink">Recent lectures</h2>
            {lectures.length > 0 && (
              <button onClick={() => navigate('/history')} className="btn btn-ghost btn-sm">
                See all <ArrowIcon size={13} />
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading lectures">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                  <div className="skeleton h-6 w-16 !rounded-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">{error}</p>
              <p className="mt-1 text-xs text-rose-600">
                The server could not return your lectures. Check that the backend is running.
              </p>
              <button onClick={load} className="btn btn-secondary btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : recent.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-line p-6 text-center">
              <p className="font-semibold text-ink">No lectures yet</p>
              <p className="mt-1 text-sm text-ink-soft">Process your first lecture to see it here.</p>
              <button className="btn btn-primary btn-sm mt-4" onClick={() => navigate('/process')}>
                Process a lecture
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((lec) => {
                const isDone = lec.status === 'done'
                const open = () => isDone && navigate(`/history/${lec.id}`)
                return (
                  <li key={lec.id}>
                    <div
                      onClick={open}
                      onKeyDown={(e) => {
                        if (isDone && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          open()
                        }
                      }}
                      role={isDone ? 'button' : undefined}
                      tabIndex={isDone ? 0 : undefined}
                      className={`group -mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors ${
                        isDone ? 'cursor-pointer hover:bg-brand-50' : 'cursor-default'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{lec.filename}</p>
                        {lec.processed_at && (
                          <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
                            {new Date(lec.processed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={lec.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}