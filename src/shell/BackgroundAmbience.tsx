import type { CSSProperties } from 'react'

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
 * ambient blobs above. Four of the 32 stars are "hero" stars (amp-up pass):
 * slightly larger (3-4px), flagged `hero: true` in STARS, rendered with an
 * extra `.starfield-dot-hero` class whose brighter twinkle peak lives in CSS.
 *
 * Shooting stars (amp-up pass, dark-theme-only, both modes): two streak
 * elements, each a *pre-rotated* container div (static inline rotate — never
 * animated, so the animated child's translate composes along the diagonal)
 * holding a thin gradient-line span with a bright head that translates along
 * the container's local X axis with opacity in/out on a long loop (14s/23s —
 * occasional, not constant; each streak is visible ~10% of its cycle). All
 * constants are hardcoded inline below — same deterministic discipline as
 * STARS. Gated to [data-theme="dark"] in CSS; hidden at Level 3 and under
 * prefers-reduced-motion (see index.css comments). Travel is in vw and stays
 * clipped by this component's overflow-hidden root, so it can never
 * introduce a horizontal scrollbar.
 *
 * Motes: 12 small drifting dots, FOCUS-ONLY (as of the bubbles/rings pass —
 * chill's small-decoration role is now played by bubbles below), same
 * hardcoded-array discipline as STARS (no Math.random() at render). Each
 * drifts straight up from bottom:-5% to top:-5% (translateY(-110vh)) with a
 * gentle per-dot horizontal sway (--mote-sway custom property,
 * transform-only) over a 50-110s loop, fading in/out at the very ends of
 * the keyframe so the bottom-reset is invisible. Tint comes from --mote
 * (index.css), which shares the blobs' --ambient-opacity variable and L3
 * pause rule (`.mote` / `[data-level="3"] .mote`, mirroring `.ambient-blob`)
 * — "same mechanism" as the aurora blobs, just a separate layer so the
 * dark-theme tokens can bake in their own much-lower intrinsic alpha (see
 * index.css comment) to keep a *pale* glow from ever tipping text-on-paper
 * contrast under 4.5:1. Hidden outright (not just paused) under
 * prefers-reduced-motion — see index.css — since a frozen random dot reads
 * as dirt, not decoration. Mode gating (`[data-mode="focus"] .mote`) lives
 * entirely in index.css, same data-attribute-driven pattern as everything
 * else here — this component still renders the same markup in both modes.
 *
 * Bubbles: 8 lava-lamp orbs, CHILL-ONLY, same hardcoded-array discipline
 * (was 6 pre-amp-up). Each rises from bottom:-18% to translateY(-115vh) over
 * a 20-40s loop with a strong horizontal sway (±40-60px) + mid-flight scale
 * wobble (peak ~1.1), fading in/out at the keyframe ends for a seamless loop
 * — see index.css `bubble-rise` for the full easing story and the --bubble /
 * --bubble-rim token comments for the contrast math (the rim is a lighter
 * inner radial stop near the edge so orbs read as bubbles, not smudges).
 * Gated to `[data-mode="chill"]` in CSS, same pattern as motes/stars.
 *
 * Light-theme cohesion rework: three of the eight (indices 1, 4, 6 below —
 * flagged `extra: true`) get an extra `.bubble-extra` class, hidden in CSS
 * under `[data-theme="light"]` only, so light shows 5 distinct bubbles
 * instead of 8 identical-hued ones (dark still shows all 8, untouched). The
 * 5 that stay visible get one of three warm pastel tones (peach/rose/gold)
 * via `:nth-of-type` selectors in index.css rather than per-instance data
 * here, since DOM order alone is enough to address them.
 *
 * Rings: 4 concentric "breathing" circles, FOCUS-ONLY, plus one soft filled
 * center-glow pulse (`.ring-glow`) that swells behind the timer area on the
 * same cycle. Unlike bubbles/motes/stars these need no per-instance data
 * (all share one deterministic layout), so they're rendered as plain static
 * divs — see index.css `.ring-1/.ring-2/.ring-3/.ring-4` for sizing/stagger
 * and `ring-breathe` / `ring-glow-swell` for the expand-and-fade cycles.
 * Cycle length is level-paced via the `--ring-cycle` custom property
 * (10s/14s/18s at L1/L2/L3) but, unlike every other layer in this file,
 * rings (and the glow) are NOT paused at Level 3 — see the index.css comment
 * on `ring-breathe` for why.
 *
 * Light-theme-only wow layers (amp-up pass — "dark looks too good, light
 * looks dull"). Dark theme is completely untouched by these three; each is
 * gated in CSS to `[data-theme="light"]` AND the right `[data-mode]`, same
 * hide-by-default-then-show `display` pattern as every other gated layer
 * above, just keyed off theme+mode together instead of either alone:
 *
 * - Paper clouds (CLOUDS, light chill only): 3 flat, rounded cloud
 *   silhouettes (each a small cluster of overlapping SVG ellipses/a rounded
 *   rect — a "paper cutout" look, not a soft blob) drifting the full width of
 *   the viewport at three heights/speeds. Hardcoded array, same discipline as
 *   STARS/MOTES/BUBBLES. Fill is a warm-white (light-theme cohesion rework —
 *   retinted from a beige-gray tan that clashed with the new pastel blob
 *   wash) with a barely-there warm-gray stroke standing in for cloud shading,
 *   so the shape still reads via its edge even though the fill itself sits
 *   close to paper (contrast math lives on `.paper-clouds-layer` in
 *   index.css).
 * - Paper plane (PLANE_DURATION/PLANE_DELAY, light chill only): the daytime
 *   cousin of dark's shooting stars — same pre-rotated-container +
 *   animated-child-translate pattern, one small SVG paper-airplane glyph
 *   gliding diagonally across the upper viewport on a long, mostly-invisible
 *   loop (visible ~15% of its cycle).
 * - Light beams (BEAMS, light focus only): 3 wide, very-soft-edged
 *   translucent bands (linear-gradient, pre-rotated ~18-25deg like the
 *   clouds/plane's static-rotation trick) that drift laterally within a
 *   modest range while breathing opacity on long, staggered cycles —
 *   "sunlight through a window". These render *alongside* the existing
 *   rings/motes rather than replacing them (rings/motes stay the "focus
 *   ambient" layer in both themes; beams are the light-only bonus on top).
 *   Light-theme cohesion rework: edges softened further (extra gradient
 *   stops so the transparent->peak transition is gradual) and peak opacity
 *   dropped ~20%, retinted to match the new pastel blob wash's hue — see
 *   index.css `.light-beams-layer` for the full contrast math.
 *
 * All three share `--ambient-opacity` on their layer wrapper (same mechanism
 * as every other layer here) and pause at Level 3 the same way blobs/motes
 * do — clouds/plane can never actually observe Level 3 in practice (chill
 * never carries `data-level`, exactly like bubbles above), so that pause rule
 * is written for consistency/future-proofing rather than because it's
 * reachable today; light beams are focus-only so their Level 3 pause *is*
 * live. All three are hidden outright (not just paused) under
 * prefers-reduced-motion, added to the same `!important` block the
 * mote/bubble/ring/shooting-star hide-list already uses.
 */

interface Star {
  top: number
  left: number
  size: number
  duration: number
  delay: number
  /** Hero stars are slightly larger with a brighter twinkle peak (CSS class). */
  hero?: boolean
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
  // Hero stars (amp-up pass) — larger, brighter twinkle peak.
  { top: 16, left: 62, size: 4, duration: 9, delay: 2.4, hero: true },
  { top: 36, left: 30, size: 4, duration: 12, delay: 0.8, hero: true },
  { top: 8, left: 22, size: 3, duration: 10, delay: 5.6, hero: true },
  { top: 55, left: 80, size: 4, duration: 14, delay: 3.9, hero: true },
]

interface Mote {
  left: number
  size: number
  duration: number
  delay: number
  /** Horizontal sway amplitude in px — sign sets which way it leans first. */
  sway: number
}

/* Sizes bumped +1px across the board in the amp-up pass (5-8px, was 4-7) —
 * motes are the rings' supporting cast now, visible but not the headline. */
const MOTES: Mote[] = [
  { left: 6, size: 6, duration: 62, delay: -8, sway: 10 },
  { left: 18, size: 5, duration: 88, delay: -35, sway: -14 },
  { left: 30, size: 7, duration: 74, delay: -50, sway: 8 },
  { left: 42, size: 6, duration: 95, delay: -12, sway: -18 },
  { left: 54, size: 8, duration: 58, delay: -22, sway: 12 },
  { left: 66, size: 5, duration: 102, delay: -60, sway: -9 },
  { left: 78, size: 7, duration: 68, delay: -5, sway: 16 },
  { left: 90, size: 6, duration: 84, delay: -40, sway: -11 },
  { left: 12, size: 5, duration: 110, delay: -70, sway: 14 },
  { left: 60, size: 8, duration: 50, delay: -18, sway: -13 },
  { left: 36, size: 6, duration: 96, delay: -3, sway: 9 },
  { left: 84, size: 7, duration: 72, delay: -55, sway: -16 },
]

interface Bubble {
  left: number
  size: number
  duration: number
  delay: number
  /** Horizontal sway amplitude in px — sign sets which way it leans first. */
  sway: number
  /**
   * Light-theme cohesion rework: flagged bubbles get an extra `.bubble-extra`
   * class, hidden under `[data-theme="light"]` only (index.css) so light
   * shows 5 distinct bubbles instead of all 8 — dark is unaffected.
   */
  extra?: boolean
}

const BUBBLES: Bubble[] = [
  { left: 6, size: 120, duration: 34, delay: -6, sway: 48 },
  { left: 18, size: 180, duration: 40, delay: -20, sway: -56, extra: true },
  { left: 32, size: 90, duration: 24, delay: -14, sway: 42 },
  { left: 46, size: 150, duration: 37, delay: -30, sway: -50 },
  { left: 60, size: 105, duration: 28, delay: -3, sway: 58, extra: true },
  { left: 72, size: 220, duration: 39, delay: -22, sway: -44 },
  { left: 84, size: 130, duration: 31, delay: -12, sway: 52, extra: true },
  { left: 93, size: 75, duration: 20, delay: -9, sway: -40 },
]

interface Cloud {
  top: number
  /** Rendered width in px — silhouette scales proportionally via viewBox. */
  width: number
  duration: number
  delay: number
}

// Light chill only (see index.css `.paper-cloud` gating). Three heights/
// speeds per the brief; negative delays start each cloud partway across its
// own loop so all three don't drift in lockstep from the left edge.
const CLOUDS: Cloud[] = [
  { top: 12, width: 200, duration: 95, delay: -20 },
  { top: 28, width: 150, duration: 120, delay: -60 },
  { top: 46, width: 180, duration: 78, delay: -8 },
]

interface LightBeam {
  top: number
  left: number
  rotate: number
  duration: number
  delay: number
}

// Light focus only (see index.css `.light-beam` gating). Long, staggered
// cycles so the three never breathe/drift in sync.
const BEAMS: LightBeam[] = [
  { top: -10, left: -25, rotate: 20, duration: 42, delay: -6 },
  { top: 18, left: -15, rotate: 24, duration: 55, delay: -30 },
  { top: 48, left: -30, rotate: 18, duration: 38, delay: -18 },
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
            className={star.hero ? 'starfield-dot starfield-dot-hero' : 'starfield-dot'}
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
      <div className="motes-layer absolute inset-0">
        {MOTES.map((mote, i) => (
          <span
            key={i}
            className="mote"
            style={
              {
                left: `${mote.left}%`,
                bottom: '-5%',
                width: `${mote.size}px`,
                height: `${mote.size}px`,
                animationDuration: `${mote.duration}s`,
                animationDelay: `${mote.delay}s`,
                '--mote-sway': `${mote.sway}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="bubbles-layer absolute inset-0">
        {BUBBLES.map((bubble, i) => (
          <span
            key={i}
            className={bubble.extra ? 'bubble bubble-extra' : 'bubble'}
            style={
              {
                left: `${bubble.left}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                animationDuration: `${bubble.duration}s`,
                animationDelay: `${bubble.delay}s`,
                '--bubble-sway': `${bubble.sway}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="rings-layer absolute inset-0">
        <div className="ring-glow" />
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="ring ring-4" />
      </div>
      <div className="shooting-stars-layer absolute inset-0">
        {/* Pre-rotated containers; the child streak animates translateX along
            the rotated axis + opacity only. Deterministic constants inline —
            no Math.random() at render, same as every other layer here. */}
        <div className="shooting-star" style={{ top: '8%', left: '3%', transform: 'rotate(16deg)' }}>
          <span
            className="shooting-star-streak"
            style={{ animationDuration: '14s', animationDelay: '2s' }}
          />
        </div>
        <div className="shooting-star" style={{ top: '15%', left: '34%', transform: 'rotate(26deg)' }}>
          <span
            className="shooting-star-streak"
            style={{ animationDuration: '23s', animationDelay: '9s' }}
          />
        </div>
      </div>
      <div className="paper-clouds-layer absolute inset-0">
        {CLOUDS.map((cloud, i) => (
          <span
            key={i}
            className="paper-cloud absolute"
            style={{
              top: `${cloud.top}%`,
              width: `${cloud.width}px`,
              animationDuration: `${cloud.duration}s`,
              animationDelay: `${cloud.delay}s`,
            }}
          >
            <svg viewBox="0 0 120 50" className="block h-auto w-full" aria-hidden="true">
              {/* Warm-white fill (light-theme cohesion rework) with a
                  barely-there warm-gray stroke standing in for cloud
                  shading — see index.css `.paper-clouds-layer` for the
                  contrast math on why the fill can sit this close to paper. */}
              <rect x="14" y="28" width="92" height="18" rx="9" fill="#fdf7ec" stroke="#d9c9a8" strokeOpacity="0.35" strokeWidth="1.2" />
              <ellipse cx="30" cy="32" rx="24" ry="15" fill="#fdf7ec" stroke="#d9c9a8" strokeOpacity="0.35" strokeWidth="1.2" />
              <ellipse cx="62" cy="21" rx="30" ry="19" fill="#fdf7ec" stroke="#d9c9a8" strokeOpacity="0.35" strokeWidth="1.2" />
              <ellipse cx="92" cy="31" rx="22" ry="14" fill="#fdf7ec" stroke="#d9c9a8" strokeOpacity="0.35" strokeWidth="1.2" />
            </svg>
          </span>
        ))}
      </div>
      <div className="paper-plane-layer absolute inset-0">
        {/* Pre-rotated container (static inline rotate, never animated) + an
            animated child that translates along the local X axis with
            opacity in/out — the same mechanism the dark shooting-stars use
            above, standing in here as the light/chill "daytime meteor". */}
        <div className="paper-plane" style={{ top: '9%', left: '-8%', transform: 'rotate(12deg)' }}>
          <span className="paper-plane-glider" style={{ animationDuration: '18s', animationDelay: '5s' }}>
            <svg viewBox="0 0 34 20" className="block h-5 w-8" fill="none" aria-hidden="true">
              <path
                d="M2 10 L32 2 L18 10 L32 18 Z"
                fill="var(--color-accent-soft)"
                stroke="var(--color-ink)"
                strokeOpacity="0.15"
                strokeWidth="0.6"
              />
              <path d="M2 10 L18 10 L14 14.5 Z" fill="var(--color-accent)" opacity="0.55" />
            </svg>
          </span>
        </div>
      </div>
      <div className="light-beams-layer absolute inset-0">
        {/* Same pre-rotated-container + animated-child split as the shooting
            stars / paper plane above: the outer div's rotate is a static
            inline transform (never animated) so the inner band's own
            animated transform (translateX only) composes along the rotated
            axis instead of the two fighting over the `transform` property. */}
        {BEAMS.map((beam, i) => (
          <div
            key={i}
            className="light-beam-rotor"
            style={{
              top: `${beam.top}%`,
              left: `${beam.left}%`,
              transform: `rotate(${beam.rotate}deg)`,
            }}
          >
            <span
              className="light-beam"
              style={{ animationDuration: `${beam.duration}s`, animationDelay: `${beam.delay}s` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
