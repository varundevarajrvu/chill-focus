import { useReducedMotion } from 'framer-motion'
import type { Transition, TargetAndTransition } from 'framer-motion'
import { useModeStore } from '../stores/modeStore'
import { useTimerStore } from '../stores/timerStore'
import { LEVELS } from '../features/timer/levels'

/**
 * Central motion presets — Section 6 of the master prompt says chill vs
 * focus motion language must differ *concretely*. Both modes pull their
 * transitions from here instead of hand-rolling springs/tweens inline, so
 * the two languages stay consistent across every component that uses them.
 */

/** Chill micro-interactions: visible spring bounce, playful but not clownish. */
export const chillSpring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 18,
  mass: 0.6,
}

/** whileTap preset for chill buttons/cards — a light squish. */
export const chillTap: TargetAndTransition = { scale: 0.97 }

/** whileHover preset for chill buttons/cards — a light lift. */
export const chillHover: TargetAndTransition = { scale: 1.03 }

/** Mount/unmount preset for chill content swaps (e.g. game picker <-> game view). */
export const chillPop = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

const FOCUS_FADE_BASE_S = 0.3

/**
 * Focus motion: linear/ease-out tween only — no springs, no scale-bounce.
 * Base duration scaled by the level's motionScale (LEVELS[level].motionScale:
 * L1 = 1, L2 = 1.5, L3 = 2), so L1 ~0.3s, L2 ~0.45s, L3 ~0.6s. Callers that
 * want the spec's exact ~0.35/0.5/0.7s crossfade pass a slightly larger base
 * via `overrideBaseSeconds`.
 */
export function focusFade(motionScale = 1, overrideBaseSeconds = FOCUS_FADE_BASE_S): Transition {
  return { duration: overrideBaseSeconds * motionScale, ease: 'easeOut' }
}

export interface ModeMotion {
  mode: 'chill' | 'focus'
  isChill: boolean
  motionScale: number
  /** Mirrors Framer's own useReducedMotion(). MotionConfig's reducedMotion="user"
   * already neutralizes transform/positional values (scale, x, y, ...) app-wide,
   * but it does NOT zero out opacity-only tweens — components animating opacity
   * (crossfades, mount fades) should multiply this in themselves. */
  reduceMotion: boolean
  /** whileHover preset — springy scale in chill, undefined (no-op) in focus. */
  hover: TargetAndTransition | undefined
  /** whileTap preset — springy squish in chill, undefined (no-op) in focus. */
  tap: TargetAndTransition | undefined
  /** Transition to pair with hover/tap or mode-aware mount animations. */
  transition: Transition
}

/**
 * Resolves the right motion preset set from modeStore + timerStore level, so
 * components that render in both modes (ModeStage, ModeSwitcher) don't
 * hand-roll `mode === 'chill' ? spring : fade` conditions. Chill-only or
 * focus-only components can instead reach directly for chillSpring/chillHover/
 * chillTap or focusFade(motionScale) since their mode is already implied by
 * where they render.
 */
export function useModeMotion(): ModeMotion {
  const mode = useModeStore((s) => s.mode)
  const level = useTimerStore((s) => s.level)
  const reduceMotion = useReducedMotion() ?? false
  const isChill = mode === 'chill'
  const motionScale = LEVELS[level].motionScale

  return {
    mode,
    isChill,
    motionScale,
    reduceMotion,
    hover: isChill ? chillHover : undefined,
    tap: isChill ? chillTap : undefined,
    transition: isChill ? chillSpring : focusFade(motionScale),
  }
}
