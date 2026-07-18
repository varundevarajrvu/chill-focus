import type { CSSProperties } from 'react'
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

/**
 * Hero scroll companion, chill-mode only (mounted from ChillLayout, which per
 * its own comment only ever renders in chill mode — no extra mode check
 * needed here). A big rocket that FLIES the page: as scrollYProgress goes
 * 0->1 it climbs from the lower-right (~88vh) to the upper-right (~6vh)
 * along a wavy S-curve rather than a straight rail, and it visibly chases
 * the scroll with spring lag/overshoot instead of being glued to it.
 *
 * Desktop-only (Section brief: "too cramped" below sm) — `hidden sm:block`
 * means it never renders at 375/390px. Decorative only: aria-hidden +
 * pointer-events-none on the one outer wrapper (inherited by every
 * descendant, so nothing below needs its own pointer-events rule). The
 * wrapper is a fixed, full-height right-edge strip (`right-0 h-full w-40
 * overflow-hidden`) — wide enough to contain the full S-curve travel (the
 * flight never swings past -8vw from the right edge) plus the rocket's own
 * width, so overflow-hidden there is a pure horizontal-overflow backstop
 * with no visible clipping. It has no visual presence of its own.
 *
 * Motion is transform-only (x/y/rotate/scale, never top/left/width in a way
 * that would trigger layout) driven entirely by Framer motion values — no
 * per-frame React state anywhere in this file. Under prefers-reduced-motion
 * this renders nothing at all, same guarantee the old rail made.
 *
 * Direction + velocity is the heart of the "follows up or down" brief:
 *  - useVelocity(scrollY) (raw px/s, not the 0-1 progress) drives a target
 *    rotation with a dead zone: fast downward scroll (climbing the page,
 *    since progress 0->1 moves the rocket UP the viewport) targets 0deg
 *    (nose up, facing the direction of travel); fast upward scroll targets
 *    180deg (nose down — the rocket somersaults to face back the way it's
 *    now heading). Below the |v| < 60px/s dead zone the target simply isn't
 *    touched, so it holds its last orientation instead of jittering at rest.
 *  - That target is sprung (bouncy, low damping) for the "somersault" flip,
 *    then a second, snappier spring adds a small velocity-proportional lean
 *    on top, summed via a two-input useTransform.
 *  - The flame is one <motion.g> inside the rocket SVG, scaled on Y from its
 *    own attach point (originY: 0) by a spring off |velocity| — idle ~0.35
 *    (plus a CSS opacity flicker so it's never perfectly static), flaring to
 *    ~1.4 at high scroll speed. Because it's drawn at the tail end of the
 *    *same* rotated group as the nose, flipping the rocket automatically
 *    flips which end the flame trails from — no extra logic needed.
 *  - Three exhaust puffs trail below the flame with progressively softer
 *    springs (lower stiffness = more lag), so they read as a staggered trail
 *    rather than all moving in lockstep.
 *
 * "Does more" pass (chill amp-up): three additions layered on top of the
 * above, none touching the S-curve/chase/somersault/flame machinery:
 *  - Idle hover-bob: a plain CSS keyframe (`.scroll-rocket-idle-bob`) on an
 *    inner wrapper nested *inside* the rotate/squash motion.div, so its small
 *    translateY oscillation composes with (rides on top of) every JS-driven
 *    transform rather than fighting it. It runs continuously rather than
 *    being explicitly gated to "at rest" — deliberately: the position spring's
 *    travel across the S-curve dwarfs a 5px wobble while actually scrolling,
 *    so the bob only reads as a visible bob when everything else is still,
 *    which is the "idle" behavior the brief asks for, with zero extra JS.
 *  - Squash & stretch: |velocity| drives scaleY (up to ~1.12, stretch) and
 *    scaleX (down to ~0.94, narrow) via SQUASH_SPRING, applied on the *same*
 *    motion.div as `rotate` — so the stretch is always along the rocket's own
 *    long axis regardless of which way it's currently facing, same trick the
 *    flame's originY already relies on.
 *  - Sparkles: SPARKLES is a small hardcoded-position array (same
 *    never-Math.random()-at-render discipline as BackgroundAmbience's STARS/
 *    MOTES/BUBBLES) of 5 tiny dots scattered around the hull, each looping a
 *    CSS emit-fade animation continuously. Visibility is gated by wrapping
 *    them in one motion.div whose `opacity` is `sparkleOpacity` — a spring off
 *    |velocity| that's ~0 near rest and ~1 at speed — so the *group* fades in
 *    only while the rocket is moving fast, even though each dot's own
 *    animation never stops.
 */

const VELOCITY_DEADZONE = 60 // px/s — below this, hold the last orientation.
const VELOCITY_RANGE = 1600 // px/s — clamp point for lean/flame mapping.

// Position spring: the rocket visibly chases scroll with lag + slight
// overshoot rather than being glued to it.
const POSITION_SPRING = { stiffness: 72, damping: 15, mass: 0.9 }
// Rotation flip spring: bouncier/lighter so the 0<->180 somersault overshoots
// a touch, reading as a flip rather than a mechanical snap.
const FLIP_SPRING = { stiffness: 88, damping: 12, mass: 0.6 }
// Lean-on-top spring: snappier, no meaningful overshoot — just smooths the
// raw per-frame velocity sample.
const LEAN_SPRING = { stiffness: 150, damping: 20 }
const FLAME_SPRING = { stiffness: 92, damping: 16 }
const PUFF_SPRINGS = [
  { stiffness: 58, damping: 14 },
  { stiffness: 40, damping: 13 },
  { stiffness: 26, damping: 12 },
]
// Squash/stretch spring: bouncier/lighter, same family as FLIP_SPRING, so the
// cartoon boost has a touch of overshoot at the moment speed picks up.
const SQUASH_SPRING = { stiffness: 170, damping: 14, mass: 0.5 }
// Sparkle-gate spring: smooths the raw |velocity| threshold crossing into a
// fade rather than a hard cut — no overshoot needed, it's just an opacity gate.
const SPARKLE_SPRING = { stiffness: 120, damping: 22 }

interface Sparkle {
  /** Position in px, relative to the rocket's own relative-positioned box. */
  left: number
  top: number
  size: number
  duration: number
  delay: number
  /** Horizontal drift in px during the emit-fade — sign varies for scatter. */
  dx: number
}

// Hardcoded scatter around the hull/flame — same discipline as
// BackgroundAmbience's STARS/MOTES/BUBBLES (never Math.random() at render).
const SPARKLES: Sparkle[] = [
  { left: -6, top: 12, size: 3, duration: 0.9, delay: 0, dx: -7 },
  { left: 30, top: 18, size: 2, duration: 1.1, delay: 0.2, dx: 8 },
  { left: -4, top: 34, size: 2, duration: 0.8, delay: 0.45, dx: -6 },
  { left: 28, top: 40, size: 3, duration: 1.2, delay: 0.1, dx: 7 },
  { left: 9, top: 50, size: 2, duration: 1, delay: 0.35, dx: 4 },
]

export function ScrollRocket() {
  const reduceMotion = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const velocity = useVelocity(scrollY)

  // --- Flight path: wavy S-curve, not a straight rail ---
  const yRaw = useTransform(scrollYProgress, [0, 1], ['88vh', '6vh'])
  const xRaw = useTransform(
    scrollYProgress,
    [0, 0.3, 0.5, 0.72, 1],
    ['0vw', '-3vw', '-8vw', '-4vw', '-1vw'],
  )
  const y = useSpring(yRaw, POSITION_SPRING)
  const x = useSpring(xRaw, POSITION_SPRING)

  // --- Direction: dead-zoned target rotation, sprung into a somersault ---
  const rotationTarget = useMotionValue(0)
  useMotionValueEvent(velocity, 'change', (v) => {
    if (v > VELOCITY_DEADZONE) rotationTarget.set(0)
    else if (v < -VELOCITY_DEADZONE) rotationTarget.set(180)
    // else: within the dead zone — leave the target as it is (no jitter).
  })
  const flip = useSpring(rotationTarget, FLIP_SPRING)

  // --- Velocity-proportional lean layered on top of the flip ---
  const leanRaw = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-14, 0, 14], {
    clamp: true,
  })
  const lean = useSpring(leanRaw, LEAN_SPRING)
  const rotate = useTransform([flip, lean], ([flipDeg, leanDeg]) => (flipDeg as number) + (leanDeg as number))

  // --- Flame flare + trailing puffs, all keyed off |velocity| ---
  const flameScaleRaw = useTransform(
    velocity,
    [-VELOCITY_RANGE, 0, VELOCITY_RANGE],
    [1.4, 0.35, 1.4],
    { clamp: true },
  )
  const flameScale = useSpring(flameScaleRaw, FLAME_SPRING)
  const puff1 = useSpring(flameScaleRaw, PUFF_SPRINGS[0])
  const puff2 = useSpring(flameScaleRaw, PUFF_SPRINGS[1])
  const puff3 = useSpring(flameScaleRaw, PUFF_SPRINGS[2])
  const puff1Size = useTransform(puff1, [0.35, 1.4], ['3px', '7px'])
  const puff1Opacity = useTransform(puff1, [0.35, 1.4], [0.15, 0.55])
  const puff2Size = useTransform(puff2, [0.35, 1.4], ['2.5px', '6px'])
  const puff2Opacity = useTransform(puff2, [0.35, 1.4], [0.12, 0.45])
  const puff3Size = useTransform(puff3, [0.35, 1.4], ['2px', '5px'])
  const puff3Opacity = useTransform(puff3, [0.35, 1.4], [0.1, 0.35])

  // --- Squash & stretch + sparkle gate, all keyed off |velocity| ---
  const absVelocity = useTransform(velocity, (v) => Math.abs(v))
  const squashYRaw = useTransform(absVelocity, [0, VELOCITY_RANGE], [1, 1.12], { clamp: true })
  const stretchXRaw = useTransform(absVelocity, [0, VELOCITY_RANGE], [1, 0.94], { clamp: true })
  const squashY = useSpring(squashYRaw, SQUASH_SPRING)
  const stretchX = useSpring(stretchXRaw, SQUASH_SPRING)
  // Gate stays at 0 through the somersault dead zone and only ramps up once
  // scroll is clearly fast, so sparkles read as a "moving fast" tell rather
  // than firing on every idle jitter.
  const sparkleOpacityRaw = useTransform(absVelocity, [140, 260, VELOCITY_RANGE], [0, 0.85, 1], {
    clamp: true,
  })
  const sparkleOpacity = useSpring(sparkleOpacityRaw, SPARKLE_SPRING)

  if (reduceMotion) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-0 top-0 z-30 hidden h-full w-40 overflow-hidden sm:block"
    >
      <motion.div className="absolute right-12 top-0" style={{ x, y }}>
        <motion.div
          style={{ rotate, scaleY: squashY, scaleX: stretchX }}
          className="relative"
        >
          {/* Idle hover-bob: plain CSS keyframe on an inner wrapper, nested
              inside the rotate/squash motion.div above so it composes with
              (rides on top of) every JS-driven transform. Runs continuously —
              see the file header comment for why that alone is enough to
              read as "idle only" without extra gating logic. */}
          <div className="scroll-rocket-idle-bob relative">
            <svg viewBox="0 0 32 64" className="relative h-16 w-8" fill="none" aria-hidden="true">
              {/* Fins — accent-soft so they read as a distinct layer from the
                  accent body rather than blending flat. */}
              <path d="M8 34 L-1 51 L8 46 Z" fill="var(--color-accent-soft)" />
              <path d="M24 34 L33 51 L24 46 Z" fill="var(--color-accent-soft)" />

              {/* Layered flame — one motion.g scaled on Y from its attach
                  point (originY: 0), so it grows/shrinks from the tail
                  regardless of the rocket's current orientation. The CSS
                  flicker class rides underneath the JS-driven scale, keeping
                  the flame alive even when scroll velocity is flat. */}
              <motion.g
                style={{ scaleY: flameScale, originY: 0 }}
                className="scroll-rocket-flame-flicker"
              >
                <path d="M9 48 Q16 57 16 63 Q16 57 23 48 Z" fill="var(--color-accent-soft)" opacity="0.55" />
                <path d="M11.5 48 Q16 55.5 16 59.5 Q16 55.5 20.5 48 Z" fill="var(--color-accent)" opacity="0.88" />
                <path d="M13.5 48 Q16 52.5 16 55 Q16 52.5 18.5 48 Z" fill="var(--color-surface-raised)" opacity="0.95" />
              </motion.g>

              {/* Body: nose cone + cylindrical hull in one path. */}
              <path
                d="M16 2 C21 8 25 15 25 24 L25 42 C25 46 22 48 18 48 L14 48 C10 48 7 46 7 42 L7 24 C7 15 11 8 16 2 Z"
                fill="var(--color-accent)"
              />

              {/* Porthole window — surface-raised fill with a low-opacity ink
                  rim so it reads as glass against the accent hull in both
                  light and dark (ink itself already flips per theme). */}
              <circle cx="16" cy="20" r="4.5" fill="var(--color-surface-raised)" />
              <circle
                cx="16"
                cy="20"
                r="4.5"
                fill="none"
                stroke="var(--color-ink)"
                strokeOpacity="0.25"
                strokeWidth="1"
              />
            </svg>

            {/* Trailing exhaust puffs — staggered springs (progressively
                softer stiffness) so they lag the flame itself rather than
                moving in lockstep, reading as a drifting trail. */}
            <span className="absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center gap-1 pt-0.5">
              <motion.span
                className="rounded-full bg-accent"
                style={{ width: puff1Size, height: puff1Size, opacity: puff1Opacity }}
              />
              <motion.span
                className="rounded-full bg-accent"
                style={{ width: puff2Size, height: puff2Size, opacity: puff2Opacity }}
              />
              <motion.span
                className="rounded-full bg-accent"
                style={{ width: puff3Size, height: puff3Size, opacity: puff3Opacity }}
              />
            </span>

            {/* Sparkles — 5 hardcoded dots (SPARKLES) each looping its own CSS
                emit-fade continuously; the whole group's opacity is
                sparkleOpacity, a spring off |velocity|, so they only read as
                visible while the rocket is moving fast. */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: sparkleOpacity }}
            >
              {SPARKLES.map((sparkle, i) => (
                <span
                  key={i}
                  className="scroll-rocket-sparkle"
                  style={
                    {
                      left: `${sparkle.left}px`,
                      top: `${sparkle.top}px`,
                      width: `${sparkle.size}px`,
                      height: `${sparkle.size}px`,
                      animationDuration: `${sparkle.duration}s`,
                      animationDelay: `${sparkle.delay}s`,
                      '--sparkle-dx': `${sparkle.dx}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
