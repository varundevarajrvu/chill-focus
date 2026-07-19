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
import { useRef } from 'react'
import { useThemeStore } from '../stores/themeStore'

/**
 * Hero scroll companion, chill-mode only (mounted from ChillLayout, which per
 * its own comment only ever renders in chill mode — no extra mode check
 * needed here). As of the four-companions redesign this file renders one of
 * TWO distinct chill characters depending on `useThemeStore`'s theme, sharing
 * only the flight path (S-curve position spring) and the "moving fast" gate:
 *  - DARK: the original rocket — climbs the wavy S-curve with a bouncy
 *    somersault flip, flame, squash/stretch and sparkles. UNCHANGED from the
 *    previous pass, per the redesign brief ("dark stays untouched").
 *  - LIGHT: a NEW paper plane — same S-curve chase, but it banks into
 *    velocity (±20°) instead of somersaulting, and does one full spring-driven
 *    360° barrel roll when scroll direction flips instead of flipping to face
 *    backwards (planes don't fly backwards — after the roll it's back to
 *    forward/nose-up). A faint dashed contrail replaces the sparkles.
 *
 * Both branches' hooks run unconditionally on every render (React's rules of
 * hooks — you can't call a hook inside an `if`), so the file computes both
 * the rocket's and the plane's motion values every time and only *renders*
 * one SVG tree, picked by `theme`. This is the same reason the old file
 * already computed every spring up front before its single `if (reduceMotion)
 * return null` — same discipline, just now branching on theme too instead of
 * only reduced-motion.
 *
 * Desktop-only (Section brief: "too cramped" below sm) — `hidden sm:block`
 * means it never renders at 375/390px. Decorative only: aria-hidden +
 * pointer-events-none on the one outer wrapper (inherited by every
 * descendant, so nothing below needs its own pointer-events rule). The
 * wrapper is a fixed, full-height right-edge strip (`right-0 h-full w-40
 * overflow-hidden`) — wide enough to contain the full S-curve travel (the
 * flight never swings past -8vw from the right edge) plus either character's
 * own width, so overflow-hidden there is a pure horizontal-overflow backstop
 * with no visible clipping. It has no visual presence of its own. The wrapper
 * carries a distinguishing class (`companion-rocket` / `companion-plane`) so
 * tests/tooling can tell which character is mounted without depending on SVG
 * internals.
 *
 * Motion is transform-only (x/y/rotate/scale, never top/left/width in a way
 * that would trigger layout) driven entirely by Framer motion values — no
 * per-frame React state anywhere in this file. Under prefers-reduced-motion
 * this renders nothing at all, same guarantee the old rail made.
 *
 * Direction + velocity is the heart of the "follows up or down" brief:
 *  - useVelocity(scrollY) (raw px/s, not the 0-1 progress) drives a target
 *    rotation with a dead zone: fast downward scroll (climbing the page,
 *    since progress 0->1 moves the companion UP the viewport) targets 0deg
 *    (nose up, facing the direction of travel); fast upward scroll targets
 *    180deg for the rocket (nose down — it somersaults to face back the way
 *    it's now heading) or +360 for the plane (a barrel roll that lands back
 *    on "forward" — see PLANE section below). Below the |v| < 60px/s dead
 *    zone the target simply isn't touched, so it holds its last orientation
 *    instead of jittering at rest.
 *  - The rocket's target is sprung (bouncy, low damping) for the
 *    "somersault" flip, then a second, snappier spring adds a small
 *    velocity-proportional lean on top, summed via a two-input useTransform.
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
 * "Does more" pass (chill amp-up, rocket/dark only): three additions layered
 * on top of the above, none touching the S-curve/chase/somersault/flame
 * machinery:
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
 *    them in one motion.div whose `opacity` is `fastGateOpacity` — a spring
 *    off |velocity| that's ~0 near rest and ~1 at speed — so the *group*
 *    fades in only while the rocket is moving fast, even though each dot's
 *    own animation never stops. The plane branch reuses this exact same
 *    motion value to gate its dash contrail, rather than duplicating the
 *    spring.
 *
 * PLANE (light chill, new): folded-paper-dart SVG (~56px), warm accent +
 * white paper faces with a center crease line down the spine.
 *  - Banking: `bank` is a velocity-proportional lean, same shape as the
 *    rocket's `lean` but wider (±20° vs the rocket's ±14°) since a plane
 *    visibly banking into a turn reads as a bigger tilt than a rocket's
 *    subtle lean.
 *  - Barrel roll: `rollTarget` starts at 0 and is bumped by +360 (never reset
 *    back down) every time scroll direction actually flips — tracked via a
 *    plain `useRef` holding the last direction sign (a non-rendering side
 *    channel, not React state, so it doesn't violate the "no per-frame React
 *    state" rule any more than the rocket's own dead-zone target does). A
 *    moderately bouncy spring (ROLL_SPRING) chases that ever-increasing
 *    target, so each flip reads as one continuous roll-through rather than an
 *    instant snap; because the target is always a multiple of 360, the plane
 *    always settles back at the same *visual* forward-facing angle (0 mod
 *    360 = "nose up"), never staying upside down or backwards. `rotate` sums
 *    `roll + bank` via the same two-input useTransform trick the rocket uses
 *    for `flip + lean`.
 *  - Idle sway: a plain CSS keyframe (`.paper-plane-idle-sway`) nested inside
 *    the rotate motion.div, same "dwarfed by real motion, only reads as idle
 *    once scrolling stops" trick as the rocket's own bob.
 *  - Contrail: PLANE_DASHES is a hardcoded array (same discipline as
 *    SPARKLES) of small dash marks trailing the tail, each looping a
 *    translate+fade CSS animation continuously; the whole group's opacity is
 *    the shared `fastGateOpacity` spring, so the trail only reads as visible
 *    while the plane is moving fast — the sparkle-gating pattern, reused.
 */

const VELOCITY_DEADZONE = 60 // px/s — below this, hold the last orientation.
const VELOCITY_RANGE = 1600 // px/s — clamp point for lean/flame mapping.

// Position spring: the companion visibly chases scroll with lag + slight
// overshoot rather than being glued to it. Shared by both rocket and plane —
// only their rotation logic differs.
const POSITION_SPRING = { stiffness: 72, damping: 15, mass: 0.9 }
// Rocket rotation flip spring: bouncier/lighter so the 0<->180 somersault
// overshoots a touch, reading as a flip rather than a mechanical snap.
const FLIP_SPRING = { stiffness: 88, damping: 12, mass: 0.6 }
// Rocket lean-on-top spring: snappier, no meaningful overshoot — just smooths
// the raw per-frame velocity sample.
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
// Fast-gate spring: smooths the raw |velocity| threshold crossing into a
// fade rather than a hard cut — no overshoot needed, it's just an opacity
// gate. Shared by the rocket's sparkles and the plane's contrail dashes.
const FAST_GATE_SPRING = { stiffness: 120, damping: 22 }
// Plane barrel-roll spring: bouncy enough to read as a roll-through rather
// than a mechanical spin, same family as FLIP_SPRING.
const ROLL_SPRING = { stiffness: 90, damping: 14, mass: 0.7 }
// Plane bank spring: same idea as the rocket's LEAN_SPRING (smooths raw
// velocity into a lean), just mapped to a wider angle range below.
const BANK_SPRING = { stiffness: 150, damping: 20 }

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

interface Dash {
  /** Position in px, relative to the plane's own relative-positioned box. */
  left: number
  top: number
  width: number
  duration: number
  delay: number
}

// Hardcoded trail of small dash marks behind the tail — same
// never-Math.random()-at-render discipline as SPARKLES above.
const PLANE_DASHES: Dash[] = [
  { left: 15, top: 40, width: 6, duration: 0.7, delay: 0 },
  { left: 21, top: 46, width: 5, duration: 0.85, delay: 0.15 },
  { left: 11, top: 52, width: 6, duration: 0.75, delay: 0.3 },
  { left: 19, top: 58, width: 4, duration: 0.9, delay: 0.08 },
]

export function ScrollRocket() {
  const theme = useThemeStore((s) => s.theme)
  const reduceMotion = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const velocity = useVelocity(scrollY)

  // --- Flight path: wavy S-curve, not a straight rail — shared by both. ---
  const yRaw = useTransform(scrollYProgress, [0, 1], ['88vh', '6vh'])
  const xRaw = useTransform(
    scrollYProgress,
    [0, 0.3, 0.5, 0.72, 1],
    ['0vw', '-3vw', '-8vw', '-4vw', '-1vw'],
  )
  const y = useSpring(yRaw, POSITION_SPRING)
  const x = useSpring(xRaw, POSITION_SPRING)

  // --- Rocket: direction dead-zoned target rotation, sprung into a somersault ---
  const rotationTarget = useMotionValue(0)
  useMotionValueEvent(velocity, 'change', (v) => {
    if (v > VELOCITY_DEADZONE) rotationTarget.set(0)
    else if (v < -VELOCITY_DEADZONE) rotationTarget.set(180)
    // else: within the dead zone — leave the target as it is (no jitter).
  })
  const flip = useSpring(rotationTarget, FLIP_SPRING)

  // --- Rocket: velocity-proportional lean layered on top of the flip ---
  const leanRaw = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-14, 0, 14], {
    clamp: true,
  })
  const lean = useSpring(leanRaw, LEAN_SPRING)
  const rocketRotate = useTransform(
    [flip, lean],
    ([flipDeg, leanDeg]) => (flipDeg as number) + (leanDeg as number),
  )

  // --- Plane: banking into velocity (wider than the rocket's lean) ---
  const bankRaw = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-20, 0, 20], {
    clamp: true,
  })
  const bank = useSpring(bankRaw, BANK_SPRING)

  // --- Plane: barrel roll on direction flip (never flips to face backwards) ---
  const rollTarget = useMotionValue(0)
  const lastDirection = useRef<-1 | 0 | 1>(0)
  useMotionValueEvent(velocity, 'change', (v) => {
    if (v > VELOCITY_DEADZONE) {
      if (lastDirection.current === -1) rollTarget.set(rollTarget.get() + 360)
      lastDirection.current = 1
    } else if (v < -VELOCITY_DEADZONE) {
      if (lastDirection.current === 1) rollTarget.set(rollTarget.get() + 360)
      lastDirection.current = -1
    }
    // else: within the dead zone — direction isn't touched, same as the rocket.
  })
  const roll = useSpring(rollTarget, ROLL_SPRING)
  const planeRotate = useTransform(
    [roll, bank],
    ([rollDeg, bankDeg]) => (rollDeg as number) + (bankDeg as number),
  )

  // --- Flame flare + trailing puffs (rocket only), all keyed off |velocity| ---
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

  // --- Squash & stretch (rocket only) + fast-gate (both), keyed off |velocity| ---
  const absVelocity = useTransform(velocity, (v) => Math.abs(v))
  const squashYRaw = useTransform(absVelocity, [0, VELOCITY_RANGE], [1, 1.12], { clamp: true })
  const stretchXRaw = useTransform(absVelocity, [0, VELOCITY_RANGE], [1, 0.94], { clamp: true })
  const squashY = useSpring(squashYRaw, SQUASH_SPRING)
  const stretchX = useSpring(stretchXRaw, SQUASH_SPRING)
  // Gate stays at 0 through the somersault/roll dead zone and only ramps up
  // once scroll is clearly fast, so sparkles/dashes read as a "moving fast"
  // tell rather than firing on every idle jitter.
  const fastGateOpacityRaw = useTransform(absVelocity, [140, 260, VELOCITY_RANGE], [0, 0.85, 1], {
    clamp: true,
  })
  const fastGateOpacity = useSpring(fastGateOpacityRaw, FAST_GATE_SPRING)

  if (reduceMotion) return null

  const isDark = theme === 'dark'

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed right-0 top-0 z-30 hidden h-full w-40 overflow-hidden sm:block ${
        isDark ? 'companion-rocket' : 'companion-plane'
      }`}
    >
      <motion.div className="absolute right-12 top-0" style={{ x, y }}>
        {isDark ? (
          <motion.div
            style={{ rotate: rocketRotate, scaleY: squashY, scaleX: stretchX }}
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
                  fastGateOpacity, a spring off |velocity|, so they only read as
                  visible while the rocket is moving fast. */}
              <motion.div className="absolute inset-0" style={{ opacity: fastGateOpacity }}>
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
        ) : (
          <motion.div style={{ rotate: planeRotate }} className="relative">
            {/* Idle sway: same "dwarfed by real motion" trick as the rocket's
                idle-bob — nested inside the rotate motion.div so it composes
                with the JS-driven bank/roll instead of fighting them. */}
            <div className="paper-plane-idle-sway relative">
              <svg viewBox="0 0 40 56" className="relative h-14 w-10" fill="none" aria-hidden="true">
                {/* Left wing — white paper face. */}
                <path
                  d="M20 4 L3 44 L20 34 Z"
                  fill="var(--color-surface-raised)"
                  stroke="var(--color-ink)"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                />
                {/* Right wing — warm accent-soft paper face. */}
                <path
                  d="M20 4 L37 44 L20 34 Z"
                  fill="var(--color-accent-soft)"
                  stroke="var(--color-ink)"
                  strokeOpacity="0.18"
                  strokeWidth="1"
                />
                {/* Crease line down the spine. */}
                <line
                  x1="20"
                  y1="4"
                  x2="20"
                  y2="34"
                  stroke="var(--color-ink)"
                  strokeOpacity="0.3"
                  strokeWidth="1"
                />
                {/* Folded tail fin — accent. */}
                <path d="M20 34 L13 44 L20 40 L27 44 Z" fill="var(--color-accent)" />
              </svg>

              {/* Dashed contrail — small dash marks trailing the tail, each
                  looping its own CSS translate+fade continuously; the whole
                  group's opacity is the same fastGateOpacity spring the
                  rocket's sparkles use, so it only reads as visible while the
                  plane is moving fast (the sparkle-gating pattern, reused). */}
              <motion.div className="absolute inset-0" style={{ opacity: fastGateOpacity }}>
                {PLANE_DASHES.map((dash, i) => (
                  <span
                    key={i}
                    className="paper-plane-dash"
                    style={{
                      left: `${dash.left}px`,
                      top: `${dash.top}px`,
                      width: `${dash.width}px`,
                      animationDuration: `${dash.duration}s`,
                      animationDelay: `${dash.delay}s`,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
