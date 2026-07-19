import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { useRef } from 'react'
import { useModeStore } from '../stores/modeStore'
import { useThemeStore } from '../stores/themeStore'

/**
 * Focus's scroll companion — the calm counterpart to chill's ScrollRocket/
 * paper-plane. Mounted directly in AppShell (which renders in both modes),
 * not inside a mode-specific layout, so — mirroring the rule that makes
 * ScrollRocket safe to leave ungated ("only ever renders in chill mode"
 * because its *parent* is chill-only) — this component gates itself: it
 * bails out to `null` whenever mode !== 'focus', giving the exact same "only
 * ever present in one mode" guarantee via a different mechanism.
 *
 * As of the four-companions redesign this renders one of TWO distinct focus
 * characters depending on `useThemeStore`'s theme (the old lantern-orb design
 * is retired entirely — it read as generic):
 *  - LIGHT: a NEW hot-air balloon — envelope in a soft focus-blue gradient
 *    with vertical gores, tiny basket + support lines. Calm, zero cartoon
 *    physics: a ±5° pendulum sway tied gently to velocity, plus a slow 8s
 *    idle sway + subtle vertical drift.
 *  - DARK: a NEW ringed planet (Saturn-like) — cool gradient sphere with a
 *    tilted ring, plus a small moon that orbits it continuously on a ~9s CSS
 *    loop (motion even at idle, which is what keeps it from reading as a
 *    "generic dot" the way the old lantern did). ≤6° lean with velocity, ring
 *    glints on a slow opacity shimmer.
 *
 * Both branches' hooks run unconditionally on every render (rules of hooks),
 * same discipline ScrollRocket's file header explains for its rocket/plane
 * split — only the JSX at the bottom picks one via `theme`.
 *
 * Motion language deliberately mirrors the master prompt's chill-vs-focus
 * split (see lib/motion.ts): no somersault, no bounce, no squash/stretch.
 * Position and lean both use a single HIGH-damping spring each (damping 30+,
 * well above critical for these stiffness/mass pairs) so the companion
 * glides to its target with zero overshoot — the "no springs really, just
 * heavily damped ones" flavor of focus motion, same idea as focusFade's
 * ease-out-only tweens elsewhere in the app, expressed as a spring here only
 * because it still needs to *chase* scroll position the way chill's
 * companion does (a plain tween can't react to a continuously-updating
 * target the same way).
 *
 * Focus pages scroll far less than chill's, so the travel band is much
 * shorter than chill's companion (80vh -> 12vh instead of 88vh -> 6vh) and
 * the path has no S-curve — the brief calls for "nearly-straight"/"near-
 * straight", so x is fixed and the only horizontal movement is the small
 * velocity-proportional lean below.
 *
 * A faint dotted vertical line traces the balloon's travel path in LIGHT only
 * (`.focus-balloon-trail`) — the "trajectory hint" the brief allows here (and
 * only here; chill's companions have no such line). Dropped for the dark
 * planet: the starfield already gives dark mode its own sense of depth, and
 * the brief explicitly calls out "no dotted rail for dark" since a Saturn-like
 * planet reads as its own environment rather than needing a guide line. It's
 * a static decoration (no animation of its own), so it needs no extra
 * reduced-motion handling beyond the component's own bail-out.
 *
 * Same wrapper rules as ScrollRocket: fixed right-edge strip, hidden below
 * sm, aria-hidden + pointer-events-none (inherited by every descendant),
 * overflow-hidden as a pure horizontal-overflow backstop (the travel band and
 * lean never swing further than the rocket's own strip already accounts
 * for), transform/opacity-only motion, renders nothing under
 * prefers-reduced-motion. The wrapper carries a distinguishing class
 * (`companion-balloon` / `companion-planet`) so tests/tooling can tell which
 * character is mounted without depending on SVG internals.
 *
 * "More tricks" pass (v5) — dignity + delight, still no cartoon physics
 * (no flips, no bounce-with-overshoot beyond a single gentle hop):
 *  - Planet (dark): the moon's orbit speed now scales with |scroll
 *    velocity|. CSS `animation-duration` can't be sprung, so rather than
 *    driving the orbit via a continuously-animated rotation motion value
 *    (which would mean re-deriving the "keeps spinning at idle" behavior
 *    from scratch), this keeps the existing always-on CSS loop
 *    (`.planet-moon-orbit`, styles/index.css) and imperatively toggles a
 *    second class (`.planet-moon-orbit-fast`, shorter duration) on the orbit
 *    wrapper via a ref + `useMotionValueEvent` — a plain DOM mutation, not
 *    React state, so no re-render — once |velocity| crosses a threshold
 *    (hysteresis: a lower exit threshold than entry, so it doesn't flicker
 *    right at the edge). This is the "simpler" of the two options: it reuses
 *    the orbit's own reduced-motion/mode-gating for free instead of
 *    duplicating it on a new motion-value-driven rotation.
 *    The sphere itself now carries a few faint texture dots/a band, wrapped
 *    in a clipped `<motion.g>` whose `rotate` is tied directly to
 *    `scrollYProgress` (lightly sprung, same high-damping family as every
 *    other motion in this file) — a slow, deterministic spin so the texture
 *    (and therefore the rotation) is actually visible, rather than a bare
 *    sphere where "it's rotating" would be invisible. The ring is drawn
 *    after the texture group and stays unrotated, Saturn-style.
 *  - Balloon (light): a burner glow — a soft warm radial glow beneath the
 *    envelope/basket — flares in on fast scroll via a spring off
 *    |velocity|, same fastGate shape ScrollRocket's sparkles/contrail use.
 *    A gentle single hop (6-8px, heavily damped — no overshoot, unlike
 *    chill's bouncy triggers) fires when scrollYProgress reaches either end
 *    (<=0.02 or >=0.98), cooldown-gated so it can't repeat-fire while
 *    resting there. The hop is a small nested motion.div (plain px `y`)
 *    between the outer vh-based position wrapper and the rotate wrapper —
 *    same "nest rather than merge mismatched units" trick ScrollRocket's
 *    loop-the-loop offset uses.
 */

const VELOCITY_RANGE = 1600 // px/s — same clamp point ScrollRocket uses for its lean mapping.

// High damping (well above critical for this stiffness/mass) — the companion
// glides to its target with no overshoot, unlike chill's bouncy chase.
const POSITION_SPRING = { stiffness: 55, damping: 30, mass: 1 }
// Planet lean: ≤6° with velocity, same high-damping family as POSITION_SPRING.
const PLANET_LEAN_SPRING = { stiffness: 70, damping: 32 }
// Balloon pendulum sway: ±5°, slightly softer/slower than the planet's lean —
// a balloon's sway reads as heavier/slower than a small planet's.
const BALLOON_LEAN_SPRING = { stiffness: 55, damping: 34 }
// Planet spin: slow, deterministic rotation tied to scrollYProgress — lightly
// sprung (same high-damping family as the rest of this file) purely to avoid
// an instant snap, not to add overshoot.
const PLANET_SPIN_SPRING = { stiffness: 60, damping: 30 }
// Balloon burner-glow gate: smooths the raw |velocity| threshold crossing
// into a fade, same shape as ScrollRocket's FAST_GATE_SPRING.
const GLOW_GATE_SPRING = { stiffness: 120, damping: 22 }
// Balloon hop: heavily damped (no overshoot/bounce) — a single gentle settle,
// not a cartoon boing.
const HOP_SPRING = { stiffness: 130, damping: 28, mass: 1 }

// Moon-orbit fast-orbit hysteresis (px/s) — enter above the high threshold,
// exit below the low one, so the class doesn't flicker right at the edge.
const MOON_FAST_ENTER = 500
const MOON_FAST_EXIT = 300

// End-of-page hop trigger — same "reaching the end with speed" gate
// ScrollRocket's celebrations use, plus its own cooldown.
const HOP_SPEED_MIN = 150 // px/s
const HOP_COOLDOWN_MS = 2500

export function FocusScrollCompanion() {
  const mode = useModeStore((s) => s.mode)
  const theme = useThemeStore((s) => s.theme)
  const reduceMotion = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const velocity = useVelocity(scrollY)

  // --- Flight path: short, nearly-straight vertical travel — shared. ---
  const yRaw = useTransform(scrollYProgress, [0, 1], ['80vh', '12vh'])
  const y = useSpring(yRaw, POSITION_SPRING)

  // --- Planet: ≤6° lean tied to velocity. ---
  const planetLeanRaw = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-6, 0, 6], {
    clamp: true,
  })
  const planetLean = useSpring(planetLeanRaw, PLANET_LEAN_SPRING)

  // --- Balloon: ±5° pendulum sway tied gently to velocity. ---
  const balloonLeanRaw = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-5, 0, 5], {
    clamp: true,
  })
  const balloonLean = useSpring(balloonLeanRaw, BALLOON_LEAN_SPRING)

  // --- Planet: slow deterministic spin tied to scrollYProgress (texture
  // dots/band on the sphere, drawn below, are what makes this visible). ---
  const planetSpinRaw = useTransform(scrollYProgress, [0, 1], [0, 160])
  const planetSpin = useSpring(planetSpinRaw, PLANET_SPIN_SPRING)

  // --- Planet: moon-orbit speed scales with |scroll velocity| — CSS
  // animation-duration can't be sprung, so a ref + useMotionValueEvent
  // imperatively toggles a second "fast" class on the orbit wrapper (plain
  // DOM mutation, not React state — no re-render). Hysteresis (enter/exit at
  // different thresholds) avoids flicker right at the edge. ---
  const moonOrbitRef = useRef<HTMLDivElement>(null)
  const moonFastRef = useRef(false)
  useMotionValueEvent(velocity, 'change', (v) => {
    const speed = Math.abs(v)
    const el = moonOrbitRef.current
    if (!el) return
    if (!moonFastRef.current && speed > MOON_FAST_ENTER) {
      moonFastRef.current = true
      el.classList.add('planet-moon-orbit-fast')
    } else if (moonFastRef.current && speed < MOON_FAST_EXIT) {
      moonFastRef.current = false
      el.classList.remove('planet-moon-orbit-fast')
    }
  })

  // --- Balloon: burner-glow flare on fast scroll, same fastGate shape as
  // ScrollRocket's sparkle/contrail gate. ---
  const absVelocity = useTransform(velocity, (v) => Math.abs(v))
  const glowOpacityRaw = useTransform(absVelocity, [200, 900], [0, 1], { clamp: true })
  const glowOpacity = useSpring(glowOpacityRaw, GLOW_GATE_SPRING)

  // --- Balloon: gentle single hop at either page end, heavily damped (no
  // overshoot) — cooldown-gated so it can't repeat-fire while resting there. ---
  const hopTarget = useMotionValue(0)
  const hopSpring = useSpring(hopTarget, HOP_SPRING)
  const lastHopTime = useRef(0)
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const atEnd = p <= 0.02 || p >= 0.98
    if (!atEnd || Math.abs(velocity.get()) < HOP_SPEED_MIN) return
    const now = Date.now()
    if (now - lastHopTime.current < HOP_COOLDOWN_MS) return
    lastHopTime.current = now
    hopTarget.set(-7)
    setTimeout(() => hopTarget.set(0), 260)
  })

  if (mode !== 'focus' || reduceMotion) return null

  const isLight = theme === 'light'

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed right-0 top-0 z-30 hidden h-full w-40 overflow-hidden sm:block ${
        isLight ? 'companion-balloon' : 'companion-planet'
      }`}
    >
      {isLight ? (
        <>
          {/* Faint dotted trajectory hint — static, no animation of its own,
              light/balloon only (see file header). */}
          <div className="focus-balloon-trail absolute right-16 top-[10vh] h-[70vh]" />

          <motion.div className="absolute right-14 top-0" style={{ y }}>
            {/* Hop offset: a small nested wrapper (plain px `y`) rather than
                merged into the vh-based position spring above — sidesteps
                any unit mismatch, same trick ScrollRocket's loop-the-loop
                offset uses. */}
            <motion.div style={{ y: hopSpring }}>
              <motion.div style={{ rotate: balloonLean }} className="relative">
                {/* Idle: slow 8s sway + subtle vertical drift, nested inside the
                    rotate motion.div so it composes with the JS-driven pendulum
                    sway instead of fighting it — same "dwarfed by real motion"
                    trick as ScrollRocket's idle-bob. */}
                <div className="focus-balloon-idle-sway relative">
                  <svg viewBox="0 0 44 64" className="relative h-16 w-11" aria-hidden="true">
                  <defs>
                    <linearGradient id="focusBalloonEnvelope" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent-soft)" />
                      <stop offset="100%" stopColor="var(--color-accent)" />
                    </linearGradient>
                  </defs>
                  {/* Envelope — soft focus-blue gradient. */}
                  <path
                    d="M22 2 C33 2 39 15 39 25 C39 37 32 46 22 46 C12 46 5 37 5 25 C5 15 11 2 22 2 Z"
                    fill="url(#focusBalloonEnvelope)"
                  />
                  {/* Vertical gores (2 seams -> 3 panels). */}
                  <path
                    d="M22 2 C18 13 18 34 22 46"
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeOpacity="0.16"
                    strokeWidth="1"
                  />
                  <path
                    d="M22 2 C26 13 26 34 22 46"
                    fill="none"
                    stroke="var(--color-ink)"
                    strokeOpacity="0.16"
                    strokeWidth="1"
                  />
                  {/* Basket support lines. */}
                  <line
                    x1="14"
                    y1="45"
                    x2="18"
                    y2="55"
                    stroke="var(--color-ink)"
                    strokeOpacity="0.4"
                    strokeWidth="1"
                  />
                  <line
                    x1="30"
                    y1="45"
                    x2="26"
                    y2="55"
                    stroke="var(--color-ink)"
                    strokeOpacity="0.4"
                    strokeWidth="1"
                  />
                  {/* Tiny basket. */}
                  <rect
                    x="17"
                    y="55"
                    width="10"
                    height="7"
                    rx="1.5"
                    fill="var(--color-surface-raised)"
                    stroke="var(--color-ink)"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                  </svg>

                  {/* Burner glow flare — brief warm pulse under the
                      envelope/basket on fast scroll, gated by the same
                      fastGate shape ScrollRocket's sparkles/contrail use. A
                      real burner glows warm/orange regardless of focus's own
                      cool accent hue, so this is a fixed warm color rather
                      than a --color-accent token. */}
                  <motion.div
                    aria-hidden="true"
                    className="balloon-burner-glow pointer-events-none absolute left-1/2 top-[50px] h-4 w-4 -translate-x-1/2 rounded-full"
                    style={{
                      opacity: glowOpacity,
                      background:
                        'radial-gradient(circle, rgba(255,176,102,0.95) 0%, rgba(255,176,102,0) 72%)',
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      ) : (
        <motion.div className="absolute right-14 top-0" style={{ y }}>
          <motion.div style={{ rotate: planetLean }} className="relative h-[60px] w-[60px]">
            <svg viewBox="0 0 60 60" className="relative h-[60px] w-[60px]" aria-hidden="true">
              <defs>
                <radialGradient id="focusPlanetSphere" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="var(--color-accent-soft)" />
                  <stop offset="100%" stopColor="var(--color-accent)" />
                </radialGradient>
                <clipPath id="focusPlanetClip">
                  <circle cx="30" cy="30" r="18" />
                </clipPath>
              </defs>
              <circle cx="30" cy="30" r="18" fill="url(#focusPlanetSphere)" />
              {/* Texture dots/band, clipped to the sphere and slowly rotated
                  tied to scrollYProgress (planetSpin) — without this the
                  sphere's own rotation would be entirely invisible (a plain
                  gradient circle looks identical at any rotation). Framer's
                  default SVG rotation origin is the center of the element's
                  own bounding box, which the visible texture dots alone don't
                  fill symmetrically — the invisible circle (same geometry as
                  the clip path) pads that bounding box out to exactly match
                  the sphere, so rotation stays centered on (30,30) rather
                  than drifting toward wherever the dots happen to cluster. */}
              <motion.g style={{ rotate: planetSpin }} clipPath="url(#focusPlanetClip)">
                <circle cx="30" cy="30" r="18" fill="none" />
                <ellipse cx="30" cy="24" rx="16" ry="2" fill="var(--color-surface-raised)" opacity="0.25" />
                <circle cx="21" cy="34" r="1.6" fill="var(--color-surface-raised)" opacity="0.3" />
                <circle cx="37" cy="30" r="1.2" fill="var(--color-surface-raised)" opacity="0.22" />
                <circle cx="27" cy="19" r="1" fill="var(--color-surface-raised)" opacity="0.2" />
              </motion.g>
              {/* Tilted ring, Saturn-style — glints on a slow opacity shimmer.
                  Drawn after (and independent of) the texture group above, so
                  the ring itself never rotates. */}
              <ellipse
                className="planet-ring"
                cx="30"
                cy="32"
                rx="28"
                ry="7"
                fill="none"
                stroke="var(--color-surface-raised)"
                strokeOpacity="0.7"
                strokeWidth="2.5"
                transform="rotate(-18 30 32)"
              />
            </svg>

            {/* Orbiting moon — a rotating wrapper (CSS animation) sized larger
                than the planet itself, with the moon positioned at its top
                edge, so the wrapper's continuous rotation reads as the moon
                tracing a circle around the planet. Runs continuously, even at
                idle — the "kills the generic-dot feel" motion the brief asks
                for, independent of scroll. Orbit *speed* additionally scales
                with |scroll velocity|: moonOrbitRef lets the velocity handler
                above toggle `.planet-moon-orbit-fast` (shorter duration,
                styles/index.css) imperatively, without touching React state. */}
            <div
              ref={moonOrbitRef}
              className="planet-moon-orbit pointer-events-none absolute inset-[-10px]"
            >
              <span className="planet-moon absolute left-1/2 top-0 -translate-x-1/2 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
