// Inline SVG, sprouts via CSS keyframes (stem draws in, then leaves pop) —
// total runtime ~1.5s per spec (0.9s stem + 0.6s leaves, leaves delayed
// until the stem finishes). Plain CSS keeps this dependency-free.
export function GrowingPlant() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 56 V28" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" className="appreciation-plant-stem" />
      <path
        d="M32 28 C 20 28 14 18 14 10 C 24 10 32 16 32 28 Z"
        fill="var(--color-accent)"
        className="appreciation-plant-leaf"
      />
      <path
        d="M32 28 C 44 28 50 18 50 10 C 40 10 32 16 32 28 Z"
        fill="var(--color-accent)"
        className="appreciation-plant-leaf"
      />
    </svg>
  )
}
