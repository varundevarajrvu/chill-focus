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
 */
export function BackgroundAmbience() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-layer absolute inset-0">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <div className="ambient-grain" />
    </div>
  )
}
