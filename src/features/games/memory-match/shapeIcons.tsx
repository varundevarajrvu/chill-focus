import type { ReactElement } from 'react'
import type { Shape } from './memoryMatchLogic'

// Inline SVG glyphs, one distinct silhouette per shape, all rendered in a
// single token color — matching is entirely shape-based, so nothing here
// depends on hue to be legible (colorblind-safe by construction).
const PATHS: Record<Shape, ReactElement> = {
  circle: <circle cx={12} cy={12} r={8} />,
  square: <rect x={4} y={4} width={16} height={16} rx={2} />,
  triangle: <polygon points="12,4 21,20 3,20" />,
  diamond: <polygon points="12,2 22,12 12,22 2,12" />,
  star: (
    <polygon points="12,3 14.1,9.1 20.6,9.2 15.4,13.1 17.3,19.3 12,15.6 6.7,19.3 8.6,13.1 3.4,9.2 9.9,9.1" />
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  heart: (
    <path d="M12 21s-7.5-4.6-10-9.3C.6 8.6 2.3 5 6 5c2 0 3.3 1 4 2.1C10.7 6 12 5 14 5c3.7 0 5.4 3.6 4 6.7C19.5 16.4 12 21 12 21z" />
  ),
  bolt: <polygon points="13,2 3,14 10,14 9,22 21,10 14,10" />,
}

export function ShapeIcon({ shape, className }: { shape: Shape; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={28}
      height={28}
      fill="var(--color-accent)"
      aria-hidden="true"
      className={className}
    >
      {PATHS[shape]}
    </svg>
  )
}
