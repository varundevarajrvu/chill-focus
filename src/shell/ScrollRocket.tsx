import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'

/**
 * Fixed vertical progress rail, chill-mode only (mounted from ChillLayout,
 * which per its own comment only ever renders in chill mode — no extra
 * mode check needed here). A thin track line plus a small rocket that
 * travels UP as the page scrolls DOWN: page top = rocket parked at the rail's
 * bottom (launch pad), page bottom = rocket at the rail's top.
 *
 * Desktop-only (Section brief: "too cramped" below sm) — `hidden sm:block`
 * means it never renders at 375/390px, so it can't contribute to horizontal
 * overflow there. Decorative only: aria-hidden + pointer-events-none.
 *
 * Motion is transform-only (x/y/rotate on the one motion.div — Framer folds
 * all three into a single CSS `transform`), driven by useScroll's window
 * scrollYProgress. Under prefers-reduced-motion this renders nothing at all
 * (simplest way to guarantee "no moving rocket"), which the brief explicitly
 * allows ("hidden entirely" is the primary option; "static rail OK" a looser
 * alternative this skips in favor of the simpler/safer choice).
 */

const RAIL_HEIGHT_VH = 64
const RAIL_TOP_VH = 18

export function ScrollRocket() {
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()

  // Travels the full rail height in vh units so the transform math stays
  // anchored to the rail's own explicit height (see RAIL_HEIGHT_VH below) —
  // 0 progress = 0vh (bottom/launch pad), 1 progress = -RAIL_HEIGHT_VH (top).
  const y = useTransform(scrollYProgress, [0, 1], ['0vh', `-${RAIL_HEIGHT_VH}vh`])

  // Slight wobble tied to scroll velocity — smoothed with a spring so quick
  // scroll-stop jitter doesn't read as twitchy. Kept subtle on purpose.
  const rawVelocity = useVelocity(scrollYProgress)
  const rotateRaw = useTransform(rawVelocity, [-3, 0, 3], [-7, 0, 7], { clamp: true })
  const rotate = useSpring(rotateRaw, { stiffness: 260, damping: 24 })

  if (reduceMotion) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-4 z-30 hidden w-6 sm:block"
      style={{ top: `${RAIL_TOP_VH}vh`, height: `${RAIL_HEIGHT_VH}vh` }}
    >
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink-muted/15" />
      <motion.div className="absolute bottom-0 left-1/2" style={{ x: '-50%', y, rotate }}>
        {/* Exhaust trail — a few small fading dots below the rocket (cheap CSS
            keyframe opacity/translate animation, no layout cost). Travels
            with the rocket since it's nested in the same transformed div. */}
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-full flex -translate-x-1/2 flex-col items-center gap-[3px] pt-1"
        >
          <span className="scroll-rocket-exhaust size-[3px] rounded-full bg-accent/60" style={{ animationDelay: '0s' }} />
          <span className="scroll-rocket-exhaust size-[2.5px] rounded-full bg-accent/40" style={{ animationDelay: '0.15s' }} />
          <span className="scroll-rocket-exhaust size-[2px] rounded-full bg-accent/25" style={{ animationDelay: '0.3s' }} />
        </span>
        <svg viewBox="0 0 24 24" className="relative size-5 -translate-y-1" fill="none" aria-hidden="true">
          <path d="M12 2c3 3 4 7.5 4 11.5a4 4 0 0 1-8 0C8 9.5 9 5 12 2Z" fill="var(--color-accent)" />
          <circle cx="12" cy="9.5" r="1.4" fill="var(--color-surface-raised)" />
          <path
            d="M8.3 13.2l-2.4 2.8M15.7 13.2l2.4 2.8"
            stroke="var(--color-accent)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  )
}
