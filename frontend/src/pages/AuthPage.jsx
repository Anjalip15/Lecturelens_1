import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import LogoMark from '../components/Logo'
import FeatureIcon from '../components/FeatureIcon'

const features = [
  { icon: 'transcript', text: 'Whisper-powered transcription with timestamps' },
  { icon: 'summary', text: 'Technical & simplified summaries' },
  { icon: 'quiz', text: 'Auto-generated quizzes to test your knowledge' },
  { icon: 'tutor', text: 'Lecture Companion — ask anything, get answers with timestamps' },
]

function ButtonSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

function Field({ id, label, type, value, onChange, placeholder, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="input"
      />
    </div>
  )
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function switchTab(t) {
    setTab(t)
    setError('')
    setSuccess('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) setError(err.message)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username.trim())) {
      setError('Username must be 3-20 characters: letters, numbers or underscores.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error: err } = await signUp(email, password, username.trim())
    setLoading(false)
    if (err) setError(err.message)
    else setSuccess('Account created — check your email to confirm, then sign in.')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#2a1230] via-[#7a250f] to-brand-600 p-12 text-white lg:flex lg:flex-1 lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="animate-blob absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-500 opacity-40 blur-3xl" />
          <div className="animate-blob animation-delay-2000 absolute -right-24 top-48 h-96 w-96 rounded-full bg-gold-400 opacity-20 blur-3xl" />
          <div className="animate-blob animation-delay-4000 absolute -bottom-24 left-32 h-96 w-96 rounded-full bg-brand-400 opacity-30 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-3">
            <LogoMark size={46} />
            <span className="text-2xl font-bold tracking-tight">LectureLens</span>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">
            Watch less.
            <br />
            <span className="text-gold-400">Understand more.</span>
          </h1>
          <p className="mb-12 max-w-md text-lg leading-relaxed text-white/80">
            Let LectureLens do the rest.
          </p>

          <div className="space-y-3">
            {features.map((f, i) => (
              <div
                key={f.text}
                style={{ animationDelay: `${200 + i * 90}ms` }}
                className="rise group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-all duration-300 hover:translate-x-1 hover:bg-white/[0.12]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <FeatureIcon name={f.icon} size={20} />
                </div>
                <span className="font-medium text-white/95">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm font-medium text-white/60">
          &copy; {new Date().getFullYear()} LectureLens. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="slide-in-from-right-4 animate-in mx-auto w-full max-w-sm lg:max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <LogoMark size={42} />
            <span className="text-2xl font-bold tracking-tight">LectureLens</span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <p className="eyebrow mb-2">{tab === 'login' ? 'Sign in' : 'Get started'}</p>
            <h2 className="page-title">
              {tab === 'login' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="page-subtitle mt-2">
              {tab === 'login'
                ? 'Sign in to access your lecture library.'
                : 'Start building your AI-powered study library.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-7 flex rounded-xl bg-black/[0.05] p-1" role="tablist">
            {[
              ['login', 'Sign in'],
              ['signup', 'Create account'],
            ].map(([t, label]) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => switchTab(t)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-white text-ink shadow-sm ring-1 ring-black/5'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              className="animate-in mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700"
            >
              <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="animate-in mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
            >
              <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <Field
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                autoComplete="email"
              />
              <Field
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="submit" disabled={loading} className="btn btn-primary mt-2 w-full !py-3.5">
                {loading ? <ButtonSpinner /> : <>Sign in <span className="arrow">→</span></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-5">
              <Field
                id="su-username"
                label="Username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. anjali_k"
                autoComplete="username"
              />
              <Field
                id="su-email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                autoComplete="email"
              />
              <Field
                id="su-pass"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
              <Field
                id="su-confirm"
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button type="submit" disabled={loading} className="btn btn-primary mt-2 w-full !py-3.5">
                {loading ? <ButtonSpinner /> : <>Create account <span className="arrow">→</span></>}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-xs font-medium text-ink-muted">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 9s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `,
        }}
      />
    </div>
  )
}