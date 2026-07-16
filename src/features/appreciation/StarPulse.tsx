// Inline SVG star with a CSS scale/opacity pulse on mount.
export function StarPulse() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="var(--color-accent)"
      aria-hidden="true"
      className="appreciation-star-pulse"
    >
      <path d="M32 4 L38 24 L58 24 L42 36 L48 56 L32 44 L16 56 L22 36 L6 24 L26 24 Z" />
    </svg>
  )
}
