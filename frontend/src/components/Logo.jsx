/** The LectureLens mark: an open book with a magnifying glass over it. */
export function LogoGlyph({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Open book */}
      <path d="M4 7.5C7.5 6.3 11.5 6.8 15 9v16C11.5 22.8 7.5 22.3 4 23.5Z" />
      <path d="M15 9c3.5-2.2 7.5-2.7 11-1.5V13" />
      {/* Magnifying glass */}
      <circle cx="21.5" cy="19" r="5.5" fill="currentColor" fillOpacity="0.14" />
      <path d="m25.6 23.1 3.4 3.4" strokeWidth="2.4" />
      {/* Glint */}
      <path d="M19.6 19a2 2 0 0 1 2-2" strokeWidth="1.6" />
    </svg>
  )
}

export default function LogoMark({ size = 40, className = '' }) {
  return (
    <span
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
      className={`relative inline-flex shrink-0 items-center justify-center bg-brand-500 text-ink shadow-lg shadow-brand-500/30 ${className}`}
    >
      <LogoGlyph size={Math.round(size * 0.66)} />
      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-gold-400 ring-2 ring-canvas" />
    </span>
  )
}