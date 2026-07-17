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
  const status = useTimerStore((s) => s.status)
  const motionScale = LEVELS[level].motionScale
  // MotionConfig's global net (App.tsx) doesn't zero out opacity tweens, so
  // this fade needs its own reduced-motion guard too.
  const reduceMotion = useReducedMotion()
  const nudgeTransition = reduceMotion ? { duration: 0 } : focusFade(motionScale)
  // L3 "everything non-essential gone": the selector and duration editor
  // disappear while an L3 session is running. Hiding them at idle L3 too
  // would trap the user at Level 3 with no way back.
  const hideNonEssential = level === 3 && status === 'running'

  return (
    <section
      className="shadow-hero flex flex-col gap-5 rounded-[28px_24px_30px_24px] bg-surface-raised p-6 sm:p-10"
      onClick={message ? dismiss : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Timer</h2>
        {!hideNonEssential && <LevelSelector />}
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
      {!hideNonEssential && <DurationEditor />}
    </section>
  )
}
