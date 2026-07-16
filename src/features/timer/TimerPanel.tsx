import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNudge } from '../../hooks/useTabTitle'
import { useTimerStore } from '../../stores/timerStore'
import { LEVELS } from './levels'
import { focusFade } from '../../lib/motion'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { LevelSelector } from './LevelSelector'
import { DurationEditor } from './DurationEditor'

export function TimerPanel() {
  const { message, dismiss } = useNudge()
  const level = useTimerStore((s) => s.level)
  const motionScale = LEVELS[level].motionScale
  // MotionConfig's global net (App.tsx) doesn't zero out opacity tweens, so
  // this fade needs its own reduced-motion guard too.
  const reduceMotion = useReducedMotion()
  const nudgeTransition = reduceMotion ? { duration: 0 } : focusFade(motionScale)

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6"
      onClick={message ? dismiss : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Timer</h2>
        <LevelSelector />
      </div>

      <AnimatePresence>
        {message && (
          <motion.p
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={nudgeTransition}
            className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-ink"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>

      <TimerDisplay />
      <TimerControls />
      <DurationEditor />
    </section>
  )
}
