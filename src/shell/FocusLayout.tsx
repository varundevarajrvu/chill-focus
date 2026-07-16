import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTimerStore } from '../stores/timerStore'
import { LEVELS } from '../features/timer/levels'
import { focusFade } from '../lib/motion'
import { TimerPanel } from '../features/timer/TimerPanel'
import { AmbientPanel } from '../features/audio/AmbientPanel'
import { NotesPanel } from '../features/notes/NotesPanel'
import { TodoList } from '../features/todo/TodoList'

function NotesAndTodo() {
  const level = useTimerStore((s) => s.level)
  const visibility = LEVELS[level].notesPanel
  const motionScale = LEVELS[level].motionScale
  // MotionConfig's global net (App.tsx) doesn't zero out opacity tweens, so
  // this fade needs its own reduced-motion guard too (see ChillLayout for
  // the equivalent chill-side note).
  const reduceMotion = useReducedMotion()
  const fade = reduceMotion ? { duration: 0 } : focusFade(motionScale)

  const [collapsed, setCollapsed] = useState(visibility === 'collapsed')
  const [revealed, setRevealed] = useState(visibility !== 'hidden')

  // Re-sync local UI state whenever the level (and therefore the rule)
  // changes, so switching levels while idle immediately reflects the new
  // visibility rule instead of sticking to a stale collapsed/revealed state.
  useEffect(() => {
    setCollapsed(visibility === 'collapsed')
    setRevealed(visibility !== 'hidden')
  }, [visibility])

  // Focus motion: ease-out fades only, no bounce — duration scaled per level
  // like every other focus transition (LEVELS[level].motionScale).
  const state = visibility === 'hidden' && !revealed ? 'hidden' : collapsed ? 'collapsed' : 'expanded'

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state === 'hidden' && (
        <motion.button
          key="hidden"
          type="button"
          onClick={() => setRevealed(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          className="flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-surface px-6 text-xs font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          Show notes &amp; to-do
        </motion.button>
      )}

      {state === 'collapsed' && (
        <motion.button
          key="collapsed"
          type="button"
          onClick={() => setCollapsed(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-dashed border-accent/40 bg-surface px-6 text-left text-sm font-medium text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          Notes &amp; to-do
          <span className="text-xs text-ink-muted/70">Expand</span>
        </motion.button>
      )}

      {state === 'expanded' && (
        <motion.section
          key="expanded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          className="flex min-h-48 flex-col gap-6 rounded-2xl border border-accent/30 bg-surface p-6"
        >
          <h2 className="text-base font-semibold text-ink">Notes &amp; to-do</h2>
          <NotesPanel />
          <hr className="border-t border-ink-muted/15" />
          <TodoList />
        </motion.section>
      )}
    </AnimatePresence>
  )
}

export function FocusLayout() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-6">
        <TimerPanel />
        <AmbientPanel />
      </div>
      <NotesAndTodo />
    </div>
  )
}
