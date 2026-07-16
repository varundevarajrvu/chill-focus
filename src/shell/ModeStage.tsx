import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useModeStore } from '../stores/modeStore'
import { useTimerStore } from '../stores/timerStore'
import { LEVELS } from '../features/timer/levels'
import { chillSpring, focusFade } from '../lib/motion'
import { ChillLayout } from './ChillLayout'
import { FocusLayout } from './FocusLayout'

// Section 6 animation language, made concrete for the one transition every
// mode switch runs through: crossing INTO chill gets a springy slight
// scale-up + fade (playful, still quick); crossing INTO focus gets a pure
// opacity fade whose duration grows with the focus level (L1 ~0.35s, L2
// ~0.5s, L3 ~0.7s per LEVELS[level].motionScale) so Level 3 reads as the
// slowest, most minimal transition per the levels table.
const FOCUS_STAGE_BASE_S = 0.35

export function ModeStage() {
  const mode = useModeStore((s) => s.mode)
  const level = useTimerStore((s) => s.level)
  const reduceMotion = useReducedMotion()
  const isChill = mode === 'chill'
  const motionScale = LEVELS[level].motionScale

  // MotionConfig's global reducedMotion="user" net (see App.tsx) only
  // neutralizes transform values like scale — it does not zero out opacity
  // tweens, so the crossfade still needs its own guard to be "effectively
  // instant" under prefers-reduced-motion.
  const transition = reduceMotion
    ? { duration: 0 }
    : isChill
      ? { scale: chillSpring, opacity: { duration: 0.2, ease: 'easeOut' as const } }
      : focusFade(motionScale, FOCUS_STAGE_BASE_S)

  const variants = isChill
    ? { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 } }
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }

  return (
    <div className="relative mode-stage">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={reduceMotion ? undefined : variants.initial}
          animate={variants.animate}
          exit={reduceMotion ? undefined : variants.exit}
          transition={transition}
        >
          {isChill ? <ChillLayout /> : <FocusLayout />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
