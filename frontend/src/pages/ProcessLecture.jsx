import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

// SVG Icons
const TranscriptIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
const SubtitlesIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
const SummaryIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
const QuizIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
const GlossaryIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
const PlayCircleIcon = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
const CheckCircleIcon = () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
const UploadIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
)
const ArrowIcon = () => (
  <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
)
const Spinner = () => (
  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

const ACCEPTED = '.mp4,.mkv,.mov,.avi,.webm'

const OUTPUT_OPTIONS = [
  { id: 'transcript', icon: <TranscriptIcon />, label: 'Transcript',  desc: 'Timestamped text via Whisper' },
  { id: 'subtitles',  icon: <SubtitlesIcon />,  label: 'Subtitles',   desc: 'SRT + VTT caption files' },
  { id: 'summary',    icon: <SummaryIcon />,    label: 'Summary',     desc: 'Technical + simplified summaries' },
  { id: 'quiz',       icon: <QuizIcon />,       label: 'Quiz',        desc: '10 auto-generated MCQs' },
  { id: 'glossary',   icon: <GlossaryIcon />,   label: 'Glossary',    desc: 'Key terms extracted' },
]

const STEPS = {
  queued:     { label: 'Queued — waiting to start', pct: 8 },
  processing: { label: 'Pipeline running…',         pct: 55 },
  done:       { label: 'Complete',                  pct: 100 },
  failed:     { label: 'Processing failed',         pct: 100 },
}

function StepIndicator({ current }) {
  const items = ['Upload video', 'Choose outputs', 'Process']
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Progress">
      {items.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full font-mono text-xs font-semibold transition-all duration-300 ${
                done
                  ? 'bg-emerald-500 text-white'
                  : active
                  ? 'bg-brand-500 text-ink shadow-lg shadow-brand-500/30'
                  : 'border border-line bg-white text-ink-muted'
              }`}
            >
              {done ? '✓' : n}
            </span>
            <span className={`text-sm font-semibold ${active ? 'text-ink' : 'text-ink-muted'}`}>
              {label}
            </span>
            {n < items.length && <span className="hidden h-px w-8 bg-line sm:block" />}
          </li>
        )
      })}
    </ol>
  )
}

export default function ProcessLecture() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)
  const pollRef  = useRef(null)
  const abortRef = useRef(null)

  const [file, setFile]           = useState(null)
  const [dragOver, setDragOver]   = useState(false)
  const [outputs, setOutputs]     = useState(['transcript', 'subtitles', 'summary', 'quiz'])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [job, setJob]             = useState(null)
  const [pollStatus, setPollStatus] = useState(null)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [processingSeconds, setProcessingSeconds] = useState(null)

  const startPolling = useCallback((id) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const d = await api.getLecture(id)
        setPollStatus(d.status)
        setProgress(d.progress_pct ?? 0)
        setProgressStage(d.progress_stage ?? '')
        if (d.processing_seconds != null) setProcessingSeconds(d.processing_seconds)
        if (d.status === 'done' || d.status === 'failed') clearInterval(pollRef.current)
      } catch {}
    }, 2000)
  }, [])

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (abortRef.current) abortRef.current.abort()
  }, [])

  function toggleOutput(id) {
    setOutputs(p => p.includes(id) ? p.filter(o => o !== id) : [...p, id])
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  async function handleSubmit() {
    if (!file)             { setUploadError('Please select a video file.'); return }
    if (!outputs.length)   { setUploadError('Select at least one output type.'); return }
    setUploadError(''); setUploading(true)
    setProgress(0); setProgressStage(''); setProcessingSeconds(null)

    const controller = new AbortController()
    abortRef.current = controller

    setUploadProgress(0)
    try {
      const result = await api.uploadLecture(file, outputs, {
        signal: controller.signal,
        onProgress: setUploadProgress,
      })
      setJob(result)
      setPollStatus(result.status)
      setProgress(result.progress_pct ?? 0)
      setProgressStage(result.progress_stage ?? '')
      setProcessingSeconds(result.processing_seconds ?? null)
      if (result.status !== 'done') startPolling(result.lecture_id)
    } catch (err) {
      if (err.name === 'AbortError') {
        // User clicked Cancel — this is expected, not a real error.
        setUploadError('')
      } else {
        setUploadError(err.message)
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
      abortRef.current = null
    }
  }

  function handleCancelUpload() {
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }

  const effectiveStatus = pollStatus ?? job?.status
  const step   = STEPS[effectiveStatus]
  const isDone = effectiveStatus === 'done'
  const isFailed = effectiveStatus === 'failed'

  // Real progress from the backend; STEPS is only a fallback for the brief
  // moment before the first poll response comes back.
  const displayPct   = isDone ? 100 : isFailed ? 100 : (progress || step?.pct || 5)
  const displayLabel = isDone ? 'Complete' : isFailed ? 'Processing failed' : (progressStage || step?.label || effectiveStatus)

  function formatDuration(totalSeconds) {
    if (totalSeconds == null) return null
    const s = Math.round(totalSeconds)
    const m = Math.floor(s / 60)
    const rem = s % 60
    return m === 0 ? `${rem}s` : `${m}m ${rem}s`
  }

  const currentStep = job ? 3 : file ? 2 : 1

  function openPicker() {
    fileRef.current?.click()
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <p className="eyebrow rise mb-3">Process lecture</p>
        <h1 className="page-title rise rise-1">
          Process a <span className="hl">Lecture.</span>
        </h1>
        <p className="page-subtitle rise rise-2 mt-2">
          Upload a video file and the AI pipeline handles everything.
        </p>
      </div>

      <StepIndicator current={isDone ? 4 : currentStep} />

      {!job ? (
        <>
          {/* Upload zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Choose a lecture video file"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker() }
            }}
            className={`group relative mb-10 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 sm:p-14
              ${file
                ? 'border-emerald-400 bg-emerald-50/60 hover:border-emerald-500'
                : dragOver
                ? 'scale-[1.02] border-brand-500 bg-brand-50 shadow-xl shadow-brand-500/15'
                : 'border-brand-300 bg-white hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-lg hover:shadow-brand-500/10'}
            `}
            onClick={openPicker}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden"
              onChange={e => setFile(e.target.files[0] ?? null)} />

            <div
              className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${
                file
                  ? 'bg-emerald-100 text-emerald-600'
                  : `bg-brand-100 text-brand-600 group-hover:scale-110 ${dragOver ? 'scale-125' : 'float'}`
              }`}
            >
              {file ? <CheckCircleIcon /> : <UploadIcon />}
            </div>

            {file ? (
              <>
                <h3 className="max-w-full truncate text-xl font-bold text-ink">{file.name}</h3>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change file
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-ink">
                  {dragOver ? 'Drop it here!' : 'Drag & drop your lecture video'}
                </h3>
                <p className="mt-1.5 text-sm font-medium text-ink-soft">or click to browse your files</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {['MP4', 'MKV', 'MOV', 'AVI', 'WebM'].map(t => (
                    <span key={t} className="rounded-md bg-black/[0.05] px-2.5 py-1 font-mono text-[11px] font-medium text-ink-soft">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Output selector */}
          <div className="mb-8">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-ink">
                  Choose <span className="hl">outputs.</span>
                </h3>
                <p className="mt-1 text-sm text-ink-soft">Select what you want the AI pipeline to generate.</p>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                {outputs.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {OUTPUT_OPTIONS.map((opt, i) => {
                const sel = outputs.includes(opt.id)
                return (
                  <label
                    key={opt.id}
                    style={{ animationDelay: `${i * 60}ms` }}
                    className={`rise group relative flex cursor-pointer items-start rounded-2xl border-2 p-4 transition-all duration-300 hover:-translate-y-1
                      ${sel
                        ? 'border-brand-500 bg-brand-50 shadow-lg shadow-brand-500/15'
                        : 'border-line bg-white hover:border-brand-300 hover:shadow-lg'}
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={sel}
                      onChange={() => toggleOutput(opt.id)}
                    />

                    <div
                      className={`mr-4 shrink-0 rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 ${
                        sel ? 'bg-brand-500 text-ink shadow-md' : 'bg-black/[0.05] text-ink-muted'
                      }`}
                    >
                      {opt.icon}
                    </div>

                    <div className="min-w-0 flex-1 pr-7">
                      <div className="truncate text-sm font-bold text-ink">{opt.label}</div>
                      <div className="mt-1 text-xs leading-relaxed text-ink-soft">{opt.desc}</div>
                    </div>

                    <div
                      className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 ${
                        sel ? 'scale-110 border-brand-500 bg-brand-500' : 'border-line bg-white'
                      }`}
                    >
                      {sel && (
                        <svg className="h-3 w-3 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {uploadError && (
            <div role="alert" className="animate-in mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {uploadError}
            </div>
          )}

          {uploading && (
            <div className="animate-in mb-6" role="status" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-ink">
                <span>Uploading…</span>
                <span className="font-mono text-xs text-ink-muted">{uploadProgress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
            <button
              disabled={uploading || !file}
              onClick={handleSubmit}
              className="btn btn-primary !px-6 !py-3"
            >
              {uploading ? (
                <>
                  <Spinner />
                  <span>Uploading…</span>
                </>
              ) : (
                <>
                  <span>Start Processing</span>
                  <ArrowIcon />
                </>
              )}
            </button>
            {uploading && (
              <button className="btn btn-danger !px-6 !py-3" onClick={handleCancelUpload}>
                Cancel Upload
              </button>
            )}
            {file && !uploading && (
              <button className="btn btn-ghost !px-6 !py-3" onClick={() => setFile(null)}>
                Clear
              </button>
            )}
          </div>
        </>
      ) : (
        /* Job progress */
        <div className="card animate-in mx-auto max-w-2xl p-6 sm:p-8">
          {job.duplicate && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
              <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <span>This video was already processed. Returning cached results immediately.</span>
            </div>
          )}

          <div className="mb-8 flex items-center gap-4">
            <div className={`shrink-0 rounded-2xl p-4 ${isDone ? 'bg-emerald-100 text-emerald-600' : isFailed ? 'bg-rose-100 text-rose-600' : 'bg-brand-100 text-brand-600'}`}>
              <PlayCircleIcon />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-ink">{file?.name ?? 'Lecture'}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {outputs.map(o => (
                  <span key={o} className="rounded-md bg-black/[0.05] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-ink-soft">
                    {o}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between" role="status" aria-live="polite">
            <span className={`text-sm font-bold ${isFailed ? 'text-rose-600' : isDone ? 'text-emerald-600' : 'text-ink'}`}>
              {displayLabel}
            </span>
            <span className="font-mono text-sm font-semibold text-ink-muted">{displayPct}%</span>
          </div>

          <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className={`relative h-full overflow-hidden rounded-full transition-all duration-500 ease-out ${
                isFailed ? 'bg-rose-500' : isDone ? 'bg-emerald-500' : 'bg-brand-500'
              }`}
              style={{ width: `${displayPct}%` }}
            >
              {!isDone && !isFailed && (
                <div className="absolute inset-0 bg-white/30" style={{ animation: 'shimmer 1.5s infinite linear', transform: 'skewX(-20deg)' }}></div>
              )}
            </div>
          </div>

          {!isDone && !isFailed && (
            <p className="pulse-soft text-center text-sm font-medium text-ink-soft">
              Processing may take a few minutes depending on lecture length…
            </p>
          )}

          {isFailed && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
              Processing failed. Check the backend logs for details.
            </div>
          )}

          {isDone && !job.duplicate && formatDuration(processingSeconds) && (
            <p className="mt-4 text-center text-sm font-medium text-ink-soft">
              ⏱ Processed in {formatDuration(processingSeconds)}
            </p>
          )}

          {isDone && (
            <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/history/${job.lecture_id}`)}
              >
                View Results <ArrowIcon />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setJob(null); setFile(null); setPollStatus(null); setProgress(0); setProgressStage(''); setProcessingSeconds(null) }}
              >
                Process Another
              </button>
            </div>
          )}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(200%) skewX(-20deg); }
          0% { transform: translateX(-200%) skewX(-20deg); }
        }
      `}} />
    </div>
  )
}