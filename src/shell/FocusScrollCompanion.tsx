import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
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
              </div>
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
              </defs>
              <circle cx="30" cy="30" r="18" fill="url(#focusPlanetSphere)" />
              {/* Tilted ring, Saturn-style — glints on a slow opacity shimmer. */}
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
                for, independent of scroll. */}
            <div className="planet-moon-orbit pointer-events-none absolute inset-[-10px]">
              <span className="planet-moon absolute left-1/2 top-0 -translate-x-1/2 rounded-full" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
