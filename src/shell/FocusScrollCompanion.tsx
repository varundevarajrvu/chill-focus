import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'framer-motion'
import { useModeStore } from '../stores/modeStore'

/**
 * Focus's scroll companion — the calm counterpart to chill's ScrollRocket.
 * A serene glowing lantern-orb that travels a gentle, nearly-straight path up
 * the right edge of the viewport as scrollYProgress goes 0->1. Unlike the
 * rocket this is mounted directly in AppShell (which renders in both modes),
 * not inside a mode-specific layout, so — mirroring the rule that makes the
 * rocket safe to leave ungated ("only ever renders in chill mode" because its
 * *parent* is chill-only) — this component gates itself: it bails out to
 * `null` whenever mode !== 'focus', giving the exact same "only ever present
 * in one mode" guarantee via a different mechanism.
 *
 * Motion language deliberately mirrors the master prompt's chill-vs-focus
 * split (see lib/motion.ts): no somersault, no bounce, no squash/stretch.
 * Position and lean both use a single HIGH-damping spring each (damping 30+,
 * well above critical for these stiffness/mass pairs) so the orb glides to
 * its target with zero overshoot — the "no springs really, just heavily
 * damped ones" flavor of focus motion, same idea as focusFade's ease-out-only
 * tweens elsewhere in the app, expressed as a spring here only because the
 * orb still needs to *chase* scroll position the way the rocket does (a
 * plain tween can't react to a continuously-updating target the same way).
 *
 * Focus pages scroll far less than chill's, so the travel band is much
 * shorter than the rocket's (80vh -> 12vh instead of 88vh -> 6vh) and the
 * path has no S-curve — the brief calls for "nearly-straight", so x is fixed
 * and the only horizontal movement is the small velocity-proportional lean
 * below.
 *
 * Idle breathing: a plain CSS keyframe pair (`.focus-lantern-pulse-core` /
 * `-halo`, styles/index.css) on the core disc and the outer halo, both on the
 * same 7s cycle so they read as one synchronized breath. Fixed 7s rather than
 * tying it to --ring-cycle: that variable's own L1 base is 10s (paced for the
 * rings' much slower "always something breathing" cadence across 4 staggered
 * rings), which would sit outside the "reads calm ~6-8s" window the brief
 * asks for at Level 1 — a fixed cycle keeps the companion in its own asked-for
 * range regardless of level, at the cost of the rings' L2/L3 slow-down not
 * propagating here (a deliberate, narrow trade — said explicitly since the
 * brief allows either choice).
 *
 * A faint dotted vertical line traces the orb's travel path — the "trajectory
 * hint" the brief allows here (and only here; chill's rocket has no such
 * line). It's a static decoration (no animation of its own), so it needs no
 * extra reduced-motion handling beyond the component's own bail-out.
 *
 * Same wrapper rules as ScrollRocket: fixed right-edge strip, hidden below
 * sm, aria-hidden + pointer-events-none (inherited by every descendant),
 * overflow-hidden as a pure horizontal-overflow backstop (the travel band and
 * lean never swing further than the rocket's own strip already accounts
 * for), transform/opacity-only motion, renders nothing under
 * prefers-reduced-motion.
 */

const VELOCITY_RANGE = 1600 // px/s — same clamp point ScrollRocket uses for its lean mapping.

// High damping (well above critical for this stiffness/mass) — the orb
// glides to its target with no overshoot, unlike the rocket's bouncy chase.
const POSITION_SPRING = { stiffness: 55, damping: 30, mass: 1 }
const LEAN_SPRING = { stiffness: 70, damping: 32 }

export function FocusScrollCompanion() {
  const mode = useModeStore((s) => s.mode)
  const reduceMotion = useReducedMotion()
  const { scrollY, scrollYProgress } = useScroll()
  const velocity = useVelocity(scrollY)

  // --- Flight path: short, nearly-straight vertical travel ---
  const yRaw = useTransform(scrollYProgress, [0, 1], ['80vh', '12vh'])
  const y = useSpring(yRaw, POSITION_SPRING)

  // --- Slight velocity-proportional lean, capped well below the rocket's ---
  const leanRaw = useTransform(velocity, [-VELOCITY_RANGE, 0, VELOCITY_RANGE], [-6, 0, 6], {
    clamp: true,
  })
  const lean = useSpring(leanRaw, LEAN_SPRING)

  if (mode !== 'focus' || reduceMotion) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-0 top-0 z-30 hidden h-full w-40 overflow-hidden sm:block"
    >
      {/* Faint dotted trajectory hint — static, no animation of its own. */}
      <div className="focus-lantern-trail absolute right-16 top-[10vh] h-[70vh]" />

      <motion.div className="absolute right-16 top-0" style={{ y }}>
        <motion.div style={{ rotate: lean }} className="relative h-10 w-10">
          {/* Faint outer halo — breathes opacity on the same 7s cycle as the
              core's scale pulse below. */}
          <div className="focus-lantern-halo pointer-events-none absolute -inset-4 rounded-full" />

          {/* Core disc — scale-pulses 1 -> 1.06 -> 1 on the same 7s cycle. */}
          <div className="focus-lantern-core relative h-10 w-10">
            <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden="true">
              <circle cx="20" cy="20" r="17" fill="var(--color-accent-soft)" opacity="0.35" />
              <circle cx="20" cy="20" r="10" fill="var(--color-accent-soft)" opacity="0.65" />
              <circle cx="20" cy="20" r="5.5" fill="var(--color-accent)" />
              <circle
                cx="20"
                cy="20"
                r="5.5"
                fill="none"
                stroke="var(--color-surface-raised)"
                strokeOpacity="0.5"
                strokeWidth="1"
              />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
