/**
 * Purely decorative ambient background — three large, pre-soft "aurora"
 * blobs (radial gradients, no CSS blur) plus a static grain overlay,
 * rendered fixed behind the whole app. All motion lives in CSS
 * (styles/index.css: .ambient-blob / @keyframes ambient-drift-*) so this
 * component never re-renders — mode/level are read from `data-mode` /
 * `data-level` on <html> (see AppShell), not from React state, matching
 * the rest of the chrome-shift system (.mode-stage filter levels).
 *
 * - fixed inset-0 -z-10: sits behind every app surface, above the body's
 *   own paper-grid background (see index.css `body` rule).
 * - aria-hidden + pointer-events-none: invisible to assistive tech and
 *   never intercepts clicks/taps on real controls.
 * - overflow-hidden: blobs are sized/positioned in vw/vh and can poke past
 *   their own box; this clips them so they never introduce a scrollbar.
 *
 * Starfield (dark mode only, Feature 3): a fixed set of tiny near-white
 * dots at hardcoded positions/sizes/timings below — never Math.random() at
 * render, so the sky is the same on every load/reload. Visibility (`.starfield`
 * is display:none by default, shown under [data-theme="dark"]) and the
 * twinkle-vs-static behavior both live in CSS (see index.css), same
 * "read the theme via a data-attribute, don't re-render" pattern as the
 * ambient blobs above.
 */

interface Star {
  top: number
  left: number
  size: number
  duration: number
  delay: number
}

const STARS: Star[] = [
  { top: 6, left: 12, size: 2, duration: 8, delay: 0 },
  { top: 14, left: 78, size: 3, duration: 11, delay: 1.4 },
  { top: 22, left: 34, size: 2, duration: 9, delay: 2.8 },
  { top: 9, left: 55, size: 2, duration: 13, delay: 0.6 },
  { top: 31, left: 90, size: 3, duration: 7, delay: 3.5 },
  { top: 18, left: 5, size: 2, duration: 14, delay: 5 },
  { top: 45, left: 66, size: 2, duration: 10, delay: 2 },
  { top: 38, left: 20, size: 3, duration: 6, delay: 4.2 },
  { top: 52, left: 8, size: 2, duration: 12, delay: 1 },
  { top: 60, left: 48, size: 2, duration: 9, delay: 6 },
  { top: 68, left: 82, size: 3, duration: 15, delay: 3 },
  { top: 4, left: 92, size: 2, duration: 8, delay: 7 },
  { top: 75, left: 15, size: 2, duration: 11, delay: 0.9 },
  { top: 82, left: 60, size: 3, duration: 7, delay: 5.5 },
  { top: 12, left: 44, size: 2, duration: 16, delay: 2.2 },
  { top: 90, left: 30, size: 2, duration: 10, delay: 4 },
  { top: 95, left: 70, size: 3, duration: 13, delay: 1.7 },
  { top: 27, left: 12, size: 2, duration: 9, delay: 6.5 },
  { top: 58, left: 95, size: 2, duration: 8, delay: 3.8 },
  { top: 70, left: 40, size: 3, duration: 12, delay: 0.3 },
  { top: 3, left: 65, size: 2, duration: 14, delay: 4.6 },
  { top: 48, left: 26, size: 2, duration: 6, delay: 2.9 },
  { top: 85, left: 4, size: 3, duration: 10, delay: 5.2 },
  { top: 20, left: 85, size: 2, duration: 15, delay: 1.1 },
  { top: 40, left: 5, size: 2, duration: 9, delay: 7.5 },
  { top: 63, left: 72, size: 3, duration: 11, delay: 3.3 },
  { top: 32, left: 58, size: 2, duration: 8, delay: 6.8 },
  { top: 78, left: 92, size: 2, duration: 13, delay: 2.5 },
]

export function BackgroundAmbience() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-layer absolute inset-0">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <div className="ambient-grain" />
      <div className="starfield absolute inset-0">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="starfield-dot"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
