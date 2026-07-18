import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTimerStore } from '../stores/timerStore'
import { LEVELS } from '../features/timer/levels'
import { focusFade } from '../lib/motion'
import { TimerPanel } from '../features/timer/TimerPanel'
import { AmbientPanel } from '../features/audio/AmbientPanel'
import { CdPlayer } from '../features/music/CdPlayer'
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
          className="flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-accent/30 px-6 text-xs font-medium text-ink-muted outline-none transition-colors hover:bg-ink-muted/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
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
          className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-dashed border-accent/30 px-6 text-left text-sm font-medium text-ink outline-none transition-colors hover:bg-ink-muted/5 focus-visible:ring-2 focus-visible:ring-accent"
        >
          Notes &amp; to-do
          <span className="text-xs text-ink-muted">Expand</span>
        </motion.button>
      )}

      {state === 'expanded' && (
        <motion.section
          key="expanded"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
          className="flex min-h-48 flex-col gap-6 border-t border-ink-muted/10 pt-8 sm:border-t-0 sm:border-l sm:border-ink-muted/10 sm:pl-8 sm:pt-0"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
            Notes &amp; to-do
          </h2>
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
    <div className="grid gap-10 sm:grid-cols-5 sm:gap-8 lg:gap-12">
      <div className="flex min-w-0 flex-col gap-8 sm:col-span-3">
        <TimerPanel />
        <AmbientPanel />
        <CdPlayer />
      </div>
      <div className="min-w-0 sm:col-span-2">
        <NotesAndTodo />
      </div>
    </div>
  )
}
