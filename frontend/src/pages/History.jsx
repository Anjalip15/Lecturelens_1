import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

const PlayCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="10 8 16 12 10 16 10 8" />
  </svg>
)

const EmptyStateIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    <path d="m16 19 2 2 4-4" />
  </svg>
)

const SearchIcon = ({ className = '', size = 20 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

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

function LectureSkeleton() {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="skeleton h-12 w-12 shrink-0 !rounded-xl" />
      <div className="flex-1 space-y-2.5">
        <div className="skeleton h-4 w-2/5" />
        <div className="skeleton h-3 w-1/4" />
      </div>
      <div className="skeleton hidden h-6 w-20 !rounded-full sm:block" />
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .listLectures()
      .then((d) => setLectures(d.lectures ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = lectures.filter((l) =>
    l.filename?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow mb-2">Library</p>
          <h1 className="page-title">Lecture History</h1>
          <p className="page-subtitle mt-1.5">
            {loading
              ? 'Loading your library…'
              : `${lectures.length} ${lectures.length === 1 ? 'lecture' : 'lectures'} in your library`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/process')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Process New
        </button>
      </div>

      {lectures.length > 0 && (
        <div className="relative mb-6">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            aria-label="Search lectures"
            className="input !pl-11"
            placeholder="Search lectures…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading history">
          <LectureSkeleton />
          <LectureSkeleton />
          <LectureSkeleton />
          <LectureSkeleton />
        </div>
      ) : lectures.length === 0 ? (
        <div className="card flex flex-col items-center border-2 border-dashed p-12 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <EmptyStateIcon />
          </div>
          <h3 className="font-display mb-2 text-2xl font-semibold text-ink">Nothing here yet</h3>
          <p className="mb-6 max-w-sm text-ink-soft">
            Process your first lecture video to start building your AI-powered study library.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/process')}>
            Process a lecture
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-black/[0.04] text-ink-muted">
            <SearchIcon size={40} />
          </div>
          <h3 className="font-display mb-2 text-2xl font-semibold text-ink">No results</h3>
          <p className="text-ink-soft">No lectures match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lec, i) => {
            const isDone = lec.status === 'done'
            const open = () => isDone && navigate(`/history/${lec.id}`)
            return (
              <div
                key={lec.id}
                onClick={open}
                onKeyDown={(e) => {
                  if (isDone && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    open()
                  }
                }}
                role={isDone ? 'button' : undefined}
                tabIndex={isDone ? 0 : undefined}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                className={`rise card group flex flex-col justify-between p-4 sm:flex-row sm:items-center sm:p-5 ${
                  isDone ? 'card-hover cursor-pointer' : 'cursor-default'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start sm:items-center">
                  <div
                    className={`shrink-0 rounded-xl p-3 transition-colors ${
                      isDone
                        ? 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white'
                        : 'bg-black/[0.05] text-ink-muted'
                    }`}
                  >
                    <PlayCircleIcon />
                  </div>
                  <div className="ml-4 min-w-0">
                    <div className={`truncate font-semibold ${isDone ? 'text-ink' : 'text-ink-soft'}`}>
                      {lec.filename}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {lec.processed_at && (
                        <span className="mr-1 font-mono text-xs text-ink-muted">
                          {new Date(lec.processed_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                      {lec.requested_outputs?.map((o) => (
                        <span
                          key={o}
                          className="rounded-md bg-black/[0.05] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-soft"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                    {lec.status === 'failed' && lec.error_message && (
                      <div className="mt-3 inline-block rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
                        {lec.error_message}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex shrink-0 items-center gap-4 pl-16 sm:ml-4 sm:mt-0 sm:pl-0">
                  <StatusBadge status={lec.status} />
                  {isDone && (
                    <svg
                      className="h-5 w-5 text-ink-muted transition-all group-hover:translate-x-0.5 group-hover:text-brand-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}