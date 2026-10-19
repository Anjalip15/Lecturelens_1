import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import FeatureIcon from '../components/FeatureIcon'

// ── Helpers ──────────────────────────────────────────────────────
function mmss(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function downloadAsFile(url, filename) {
  const res = await fetch(url)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

// ── Small shared pieces ───────────────────────────────────────────
function InfoBox({ children, tone = 'info' }) {
  const tones = {
    info: 'border-brand-200 bg-brand-50 text-brand-800',
    neutral: 'border-line bg-white text-ink-soft',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
  }
  return (
    <div role={tone === 'error' ? 'alert' : undefined} className={`animate-in rounded-xl border p-4 text-sm font-medium ${tones[tone]}`}>
      {children}
    </div>
  )
}

function LoadingLines({ label }) {
  return (
    <div className="card space-y-3 p-6" role="status" aria-label={label}>
      <div className="skeleton h-4 w-1/3" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-11/12" />
      <div className="skeleton h-3 w-4/5" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  )
}

function ButtonSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────
function TranscriptTab({ url }) {
  const [segments, setSegments] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!url) { setErr('No transcript available for this lecture.'); return }
    fetch(url)
      .then(r => r.json())
      .then(d => setSegments(d.segments ?? []))
      .catch(() => setErr('Could not load transcript.'))
  }, [url])

  if (err) return <InfoBox>{err}</InfoBox>
  if (!segments) return <LoadingLines label="Loading transcript" />
  if (segments.length === 0) return <InfoBox tone="neutral">No segments found.</InfoBox>

  return (
    <div className="card p-3 sm:p-4">
      {segments.map((seg, i) => (
        <div key={i} className="group flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-brand-50">
          <span className="w-14 shrink-0 pt-1 font-mono text-xs font-medium text-brand-700 transition-colors group-hover:text-brand-600">
            {mmss(seg.start ?? 0)}
          </span>
          <span className="flex-1 text-base leading-relaxed text-ink">{seg.text}</span>
        </div>
      ))}
    </div>
  )
}

function SummaryTab({ url }) {
  const [data, setData] = useState(null)
  const [mode, setMode] = useState('simple') // 'simple' | 'technical'
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!url) { setErr('No summary available for this lecture.'); return }
    fetch(url)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setErr('Could not load summary.'))
  }, [url])

  if (err) return <InfoBox>{err}</InfoBox>
  if (!data) return <LoadingLines label="Loading summary" />

  const chunks = data.chunks ?? []

  // Merge all chunks into one continuous summary for display,
  // even though they're generated/stored chunk-by-chunk in the background.
  const fullText = chunks
    .map(chunk => (mode === 'simple' ? (chunk.simple_summary ?? chunk.summary ?? '') : (chunk.technical_summary ?? chunk.summary ?? '')))
    .filter(Boolean)
    .join('\n\n')

  return (
    <div>
      <div className="mb-6 flex w-fit rounded-xl bg-black/[0.05] p-1" role="tablist">
        {[['simple', 'Simple'], ['technical', 'Technical']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === id ? 'bg-white text-ink shadow-sm ring-1 ring-black/5' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {chunks.length === 0 ? (
        <InfoBox tone="neutral">No summary found.</InfoBox>
      ) : (
        <div key={mode} className="card animate-in p-6 sm:p-8">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-ink">{fullText}</p>
        </div>
      )}
    </div>
  )
}

function GlossaryTab({ url }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!url) { setErr('No glossary available for this lecture.'); return }
    fetch(url)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setErr('Could not load glossary.'))
  }, [url])

  if (err) return <InfoBox>{err}</InfoBox>
  if (!data) return <LoadingLines label="Loading glossary" />

  const terms = data.glossary ?? []

  if (terms.length === 0) return <InfoBox tone="neutral">No glossary terms found for this lecture.</InfoBox>

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {terms.map((t, i) => (
        <div
          key={i}
          style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}
          className="rise card card-hover flex items-start gap-4 p-5"
        >
          {t.timestamp !== undefined && (
            <div className="mt-0.5 shrink-0 rounded-md bg-brand-100 px-2.5 py-1 font-mono text-xs font-semibold text-brand-700">
              {mmss(t.timestamp)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-base font-bold text-ink">{t.term}</div>
            <div className="mt-1 text-sm leading-relaxed text-ink-soft">{t.definition}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function QuizTab({ lectureId, url }) {
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})       // MCQ: questionText → chosenKey
  const [shortAnswers, setShortAnswers] = useState({}) // Short answer: questionText → typed text
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!url) { setErr('No quiz generated for this lecture.'); return }
    fetch(url)
      .then(r => r.json())
      .then(d => setQuiz(d))
      .catch(() => setErr('Could not load quiz.'))
  }, [url])

  if (err && !quiz) return <InfoBox>{err}</InfoBox>
  if (!quiz) return <LoadingLines label="Loading quiz" />

  const allMcqs = (quiz.quiz ?? []).flatMap(section => section.mcqs ?? [])
  const allShortAnswers = (quiz.quiz ?? []).flatMap(section => section.short_answers ?? [])
  const totalQuestions = allMcqs.length + allShortAnswers.length

  if (totalQuestions === 0) return <InfoBox tone="neutral">No questions found in this quiz.</InfoBox>

  const answeredCount = Object.keys(answers).length + Object.values(shortAnswers).filter(v => v.trim() !== '').length

  async function handleSubmit() {
    setSubmitting(true); setErr('')
    try {
      const mcqAnswers = {}
      allMcqs.forEach(q => { if (answers[q.question]) mcqAnswers[q.question] = answers[q.question] })
      const shortAnswerPayload = {}
      allShortAnswers.forEach(q => { if (shortAnswers[q.question]) shortAnswerPayload[q.question] = shortAnswers[q.question] })
      const res = await api.submitQuiz(lectureId, mcqAnswers, shortAnswerPayload)
      setResult(res)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resultMap = {}
  if (result) {
    ;(result.results ?? []).forEach(r => { resultMap[r.question] = r })
  }

  const pct = result ? Math.round((result.score / result.total_questions) * 100) : null
  const progressPct = Math.round((answeredCount / totalQuestions) * 100)

  return (
    <div className="max-w-3xl">
      {result ? (
        <div className={`animate-in mb-8 flex items-center gap-5 rounded-2xl border-2 p-6 ${pct >= 70 ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${pct >= 70 ? 'bg-emerald-500 text-white' : 'bg-gold-400 text-ink'}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {pct >= 70 ? <path d="m5 13 4 4L19 7" /> : <><path d="M12 8v5" /><path d="M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></>}
            </svg>
          </div>
          <div>
            <div className="text-lg font-bold">Quiz completed</div>
            <div className="mt-0.5 text-sm font-medium">
              You scored {result.score} out of {result.total_questions} ({pct}%).
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6" role="status" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink-soft">
            <span className="font-mono uppercase tracking-wider">Progress</span>
            <span className="font-mono">{answeredCount}/{totalQuestions} answered</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-6">
        {allMcqs.map((q, idx) => {
          const chosen = answers[q.question]
          const res = resultMap[q.question]
          const opts = q.options ?? {}

          return (
            <div key={`mcq-${idx}`} className="card p-5 sm:p-6">
              <h4 className="mb-4 flex gap-2 text-lg font-bold leading-snug text-ink">
                <span className="font-mono text-brand-600">{String(idx + 1).padStart(2, '0')}</span>
                <span>{q.question}</span>
              </h4>
              <div className="space-y-3">
                {Object.entries(opts).map(([key, text]) => {
                  let borderClass = 'border-line bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md'
                  let textClass = 'text-ink'
                  let markerClass = 'bg-black/[0.06] text-ink-soft'

                  if (result && res) {
                    if (key === res.correct_answer) {
                      borderClass = 'border-emerald-500 bg-emerald-50'
                      textClass = 'text-emerald-900 font-medium'
                      markerClass = 'bg-emerald-500 text-white'
                    } else if (key === chosen && key !== res.correct_answer) {
                      borderClass = 'border-rose-300 bg-rose-50'
                      textClass = 'text-rose-900'
                      markerClass = 'bg-rose-400 text-white'
                    } else {
                      borderClass = 'border-line bg-black/[0.02] opacity-60'
                    }
                  } else if (chosen === key) {
                    borderClass = 'border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10'
                    textClass = 'text-ink font-medium'
                    markerClass = 'bg-brand-500 text-ink'
                  }

                  return (
                    <label key={key} className={`relative flex items-center rounded-xl border-2 p-4 pr-12 transition-all duration-200 ${borderClass} ${result ? 'cursor-default' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        value={key}
                        checked={chosen === key}
                        disabled={!!result}
                        onChange={() => setAnswers(prev => ({ ...prev, [q.question]: key }))}
                        className="sr-only"
                      />
                      <span className={`mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${markerClass}`}>
                        {key}
                      </span>
                      <span className={`text-base leading-snug ${textClass}`}>{text}</span>

                      {result && res && key === res.correct_answer && (
                        <svg className="absolute right-4 h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      )}
                      {result && res && key === chosen && key !== res.correct_answer && (
                        <svg className="absolute right-4 h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                    </label>
                  )
                })}
              </div>
              {result && res?.explanation && (
                <div className="animate-in mt-4 rounded-xl border border-line bg-canvas p-4 text-sm leading-relaxed text-ink-soft">
                  <span className="eyebrow mb-1.5 block">Explanation</span>
                  {res.explanation}
                </div>
              )}
            </div>
          )
        })}

        {allShortAnswers.map((q, idx) => {
          const typed = shortAnswers[q.question] || ''
          const res = resultMap[q.question]

          return (
            <div key={`sa-${idx}`} className="card p-5 sm:p-6">
              <h4 className="mb-4 flex gap-2 text-lg font-bold leading-snug text-ink">
                <span className="font-mono text-brand-600">{String(allMcqs.length + idx + 1).padStart(2, '0')}</span>
                <span>{q.question}</span>
              </h4>

              {!result ? (
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Type your answer…"
                  value={typed}
                  onChange={(e) => setShortAnswers(prev => ({ ...prev, [q.question]: e.target.value }))}
                />
              ) : (
                <div className="space-y-3">
                  <div className={`rounded-xl border-2 p-4 ${res?.is_correct ? 'border-emerald-500 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
                    <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Your answer</div>
                    <div className="text-base text-ink">{res?.your_answer || <span className="italic text-ink-muted">No answer given</span>}</div>
                  </div>
                  <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4">
                    <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Model answer</div>
                    <div className="text-base text-ink">{res?.model_answer}</div>
                  </div>
                  {res?.feedback && (
                    <div className="rounded-xl border border-line bg-canvas p-4 text-sm leading-relaxed text-ink-soft">
                      <span className="eyebrow mb-1.5 block">Feedback</span>
                      {res.feedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {err && <div className="mt-6"><InfoBox tone="error">{err}</InfoBox></div>}

      {!result && (
        <div className="mt-8 border-t border-line pt-6">
          <button
            className="btn btn-primary w-full !px-8 !py-3.5 sm:w-auto"
            disabled={submitting || answeredCount < totalQuestions}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <ButtonSpinner />
                <span>Submitting…</span>
              </>
            ) : (
              `Submit quiz (${answeredCount}/${totalQuestions} answered)`
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function SubtitlesTab({ srtUrl, vttUrl, filename }) {
  const [downloading, setDownloading] = useState(null) // 'srt' | 'vtt' | null

  if (!srtUrl && !vttUrl) return <InfoBox tone="neutral">No subtitle files available for this lecture.</InfoBox>

  const baseName = (filename ?? 'lecture').replace(/\.[^/.]+$/, '')

  async function handleDownload(kind, url, ext) {
    setDownloading(kind)
    try {
      await downloadAsFile(url, `${baseName}.${ext}`)
    } catch (e) {
      alert('Failed to download file: ' + e.message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="card mx-auto max-w-2xl p-8 text-center sm:p-10">
      <div className="float mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
        <FeatureIcon name="subtitles" size={30} />
      </div>
      <h3 className="mb-2 text-xl font-bold text-ink">Download captions</h3>
      <p className="mx-auto mb-8 max-w-sm text-ink-soft">
        Download caption files to use with your preferred local video player like VLC or QuickTime.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {srtUrl && (
          <button
            disabled={downloading === 'srt'}
            onClick={() => handleDownload('srt', srtUrl, 'srt')}
            className="btn btn-primary !px-6 !py-3"
          >
            <DownloadIcon />
            {downloading === 'srt' ? 'Downloading…' : 'Download .srt'}
          </button>
        )}
        {vttUrl && (
          <button
            disabled={downloading === 'vtt'}
            onClick={() => handleDownload('vtt', vttUrl, 'vtt')}
            className="btn btn-secondary !px-6 !py-3"
          >
            <DownloadIcon />
            {downloading === 'vtt' ? 'Downloading…' : 'Download .vtt'}
          </button>
        )}
      </div>
    </div>
  )
}

function ChatTab({ lectureId }) {
  const [messages, setMessages] = useState([]) // { role: 'user'|'assistant', text, timestamps }
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await api.askQuestion(lectureId, q)
      setMessages(prev => [...prev, { role: 'assistant', text: res.answer, timestamps: res.timestamps }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div className="card flex h-[600px] max-w-4xl flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-brand-50/60 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-ink">
          <FeatureIcon name="tutor" size={20} />
        </span>
        <div>
          <h3 className="font-bold text-ink">Lecture Companion</h3>
          <p className="text-xs font-medium text-ink-muted">Answers come from this lecture's transcript, with timestamps.</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto bg-canvas/60 p-4 sm:p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-ink-muted">
            <div className="float mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <FeatureIcon name="tutor" size={28} />
            </div>
            <p className="font-medium">No messages yet. Ask a question below!</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`animate-in flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
              m.role === 'user'
                ? 'rounded-br-md bg-brand-500 text-ink'
                : 'rounded-bl-md border border-line bg-white text-ink'
            }`}>
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.timestamps?.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <span className="text-xs font-semibold text-ink-muted">Sources:</span>
                                    {[...m.timestamps]
                    .sort((a, b) => a.start - b.start)
                    .map((t, idx) => (
                      <span key={idx} className="rounded-md bg-brand-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-brand-700">
                        {mmss(t.start ?? 0)}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex space-x-1.5 rounded-2xl rounded-bl-md border border-line bg-white px-5 py-4 shadow-sm" aria-label="Assistant is typing">
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }}></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line bg-white p-4">
        <div className="relative flex items-center">
          <input
            type="text"
            aria-label="Ask a question about this lecture"
            className="input !py-3.5 !pr-14"
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button
            type="button"
            aria-label="Send question"
            className="absolute right-2 rounded-lg bg-brand-500 p-2 text-ink transition-all hover:scale-105 hover:bg-brand-600 hover:text-white disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-brand-500 disabled:hover:text-ink"
            onClick={send}
            disabled={!input.trim() || loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'transcript', label: 'Transcript', icon: 'transcript' },
  { id: 'summary',    label: 'Summary',    icon: 'summary' },
  { id: 'glossary',   label: 'Glossary',   icon: 'glossary' },
  { id: 'quiz',       label: 'Quiz',       icon: 'quiz' },
  { id: 'subtitles',  label: 'Subtitles',  icon: 'subtitles' },
  { id: 'chat',       label: 'Lecture Companion',     icon: 'tutor' },
]

export default function LectureDetail() {
  const { lectureId } = useParams()
  const [searchParams] = useSearchParams()
  const only = searchParams.get('only') // e.g. "transcript" when opened from a dashboard card
  const [lecture, setLecture] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [activeTab, setActiveTab] = useState(only || 'transcript')

  useEffect(() => {
    api.getLecture(lectureId)
      .then(setLecture)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [lectureId])

  // Compute these safely even before `lecture` has loaded
  const outputs = lecture?.outputs ?? {}
  const available = new Set(Object.keys(outputs))

  const visibleTabs = TABS.filter(t => {
    if (t.id === 'transcript') return available.has('transcript')
    if (t.id === 'summary')    return available.has('summary')
    if (t.id === 'glossary')   return available.has('glossary')
    if (t.id === 'quiz')       return available.has('quiz')
    if (t.id === 'subtitles')  return available.has('subtitles_srt') || available.has('subtitles_vtt')
    if (t.id === 'chat')       return true
    return false
  })

  // Ensure active tab is visible, otherwise default to first available
  // (Kept above the early returns so this hook ALWAYS runs, every render)
  const shownTabs = only ? visibleTabs.filter(t => t.id === only) : visibleTabs

  useEffect(() => {
    if (shownTabs.length > 0 && !shownTabs.find(t => t.id === activeTab)) {
      setActiveTab(shownTabs[0].id)
    }
  }, [shownTabs, activeTab])

  if (loading) return (
    <div className="max-w-5xl" role="status" aria-label="Loading lecture details">
      <div className="skeleton mb-6 h-4 w-32" />
      <div className="skeleton mb-3 h-10 w-2/3" />
      <div className="skeleton mb-8 h-4 w-48" />
      <div className="skeleton mb-8 h-12 w-full" />
      <LoadingLines label="Loading content" />
    </div>
  )

  if (err) return <InfoBox tone="error">{err}</InfoBox>
  if (!lecture) return null

  return (
    <div className="max-w-5xl">
      <Link
        to={only ? `/pick/${only}` : '/history'}
        className="link-underline group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <svg className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        {only ? 'Back to lectures' : 'Back to History'}
      </Link>

      <div className="mb-8">
        <p className="eyebrow rise mb-3">{only ? (TABS.find(t => t.id === only)?.label ?? 'Lecture') : 'Lecture'}</p>
        <h1 className="page-title rise rise-1 break-words">{lecture.filename}</h1>
        <p className="rise rise-2 mt-3 flex items-center font-mono text-xs text-ink-muted">
          <svg className="mr-1.5 h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          {lecture.processed_at ? new Date(lecture.processed_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'Unknown date'}
        </p>
      </div>

      {!only && (
        <div className="mb-8 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1" role="tablist">
            {shownTabs.map(t => {
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`group relative flex items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-semibold transition-colors ${
                    isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                  onClick={() => setActiveTab(t.id)}
                >
                  <span className={`transition-all duration-200 group-hover:-rotate-6 group-hover:scale-110 ${isActive ? 'text-brand-600' : ''}`}>
                    <FeatureIcon name={t.icon} size={18} />
                  </span>
                  <span>{t.label}</span>
                  <span
                    className={`absolute inset-x-3 bottom-0 h-[3px] origin-left rounded-t-full bg-brand-500 transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div key={activeTab} className="animate-in pb-12">
        {activeTab === 'transcript' && <TranscriptTab url={outputs.transcript?.url} />}
        {activeTab === 'summary'    && <SummaryTab url={outputs.summary?.url} />}
        {activeTab === 'glossary'   && <GlossaryTab url={outputs.glossary?.url} />}
        {activeTab === 'quiz'       && <QuizTab lectureId={lectureId} url={outputs.quiz?.url} />}
        {activeTab === 'subtitles'  && <SubtitlesTab srtUrl={outputs.subtitles_srt?.url} vttUrl={outputs.subtitles_vtt?.url} filename={lecture.filename} />}
        {activeTab === 'chat'       && <ChatTab lectureId={lectureId} />}
      </div>
    </div>
  )
}