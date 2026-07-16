import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useModeStore } from '../stores/modeStore'
import { ChillLayout } from './ChillLayout'
import { FocusLayout } from './FocusLayout'

export function ModeStage() {
  const mode = useModeStore((s) => s.mode)
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative mode-stage">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeInOut' }}
        >
          {mode === 'chill' ? <ChillLayout /> : <FocusLayout />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
