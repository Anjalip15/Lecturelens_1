import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import FeatureIcon from '../components/FeatureIcon'

// outputId = the name stored in a lecture's requested_outputs
const SERVICES = {
  transcript: { title: 'Transcript', icon: 'transcript', outputId: 'transcript', text: 'Which lecture do you want the transcript for?' },
  subtitles:  { title: 'Subtitles',  icon: 'subtitles',  outputId: 'subtitles',  text: 'Which lecture do you want subtitles for?' },
  summary:    { title: 'Summary',    icon: 'summary',    outputId: 'summary',    text: 'Which lecture do you want a summary of?' },
  quiz:       { title: 'Quiz',       icon: 'quiz',       outputId: 'quiz',       text: 'Which lecture do you want to be quizzed on?' },
  glossary:   { title: 'Glossary',   icon: 'glossary',   outputId: 'glossary',   text: 'Which lecture do you want the glossary for?' },
  chat:       { title: 'Lecture Companion',   icon: 'tutor',      outputId: null,         text: 'Which lecture do you want to ask questions about?' },
}

export default function PickLecture() {
  const { service } = useParams()
  const navigate = useNavigate()
  const cfg = SERVICES[service]

  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    api
      .listLectures()
      .then((d) => setLectures(d.lectures ?? []))
      .catch((e) => setError(e.message || 'Could not load your lectures.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!cfg) {
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold text-ink">Unknown service.</p>
        <Link to="/" className="btn btn-primary mt-4">Back to dashboard</Link>
      </div>
    )
  }

  const available = lectures.filter((l) => {
    if (l.status !== 'done') return false
    if (!cfg.outputId) return true
    // if the list does not report requested outputs, show the lecture rather than hide it
    return !l.requested_outputs || l.requested_outputs.includes(cfg.outputId)
  })

  const filtered = available.filter((l) =>
    l.filename?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl">
      <Link
        to="/"
        className="link-underline group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to dashboard
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <span className="float flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-ink shadow-lg shadow-brand-500/25">
          <FeatureIcon name={cfg.icon} size={28} />
        </span>
        <div>
          <p className="eyebrow mb-2">{cfg.title}</p>
          <h1 className="page-title">Choose a <span className="hl">lecture.</span></h1>
          <p className="page-subtitle mt-1.5">{cfg.text}</p>
        </div>
      </div>

      {available.length > 0 && (
        <input
          type="text"
          aria-label="Search lectures"
          className="input mb-6"
          placeholder="Search lectures…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading lectures">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card flex items-center gap-4 p-5">
              <div className="skeleton h-12 w-12 shrink-0" />
              <div className="flex-1 space-y-2.5">
                <div className="skeleton h-4 w-2/5" />
                <div className="skeleton h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <button onClick={load} className="btn btn-secondary btn-sm mt-3">Try again</button>
        </div>
      ) : available.length === 0 ? (
        <div className="card border-2 border-dashed p-10 text-center">
          <h3 className="text-xl font-bold text-ink">No lectures with {cfg.title.toLowerCase()} yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            Process a lecture and select this output to see it here.
          </p>
          <button className="btn btn-primary mt-6" onClick={() => navigate('/process')}>
            Process a lecture
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-ink">No lectures match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lec, i) => (
            <div
              key={lec.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/history/${lec.id}?only=${service}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  navigate(`/history/${lec.id}?only=${service}`)
                }
              }}
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              className="rise group card card-hover flex cursor-pointer items-center gap-4 p-4 sm:p-5"
            >
              <div className="shrink-0 rounded-xl bg-brand-50 p-3 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <FeatureIcon name={cfg.icon} size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{lec.filename}</p>
                {lec.processed_at && (
                  <p className="mt-1 font-mono text-xs text-ink-muted">
                    {new Date(lec.processed_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
              <svg className="h-5 w-5 shrink-0 text-ink-muted transition-all group-hover:translate-x-1 group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}