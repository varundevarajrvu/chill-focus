import { useEffect, useState } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { LEVELS } from '../features/timer/levels'
import { TimerPanel } from '../features/timer/TimerPanel'
import { AmbientPanel } from '../features/audio/AmbientPanel'
import { NotesPanel } from '../features/notes/NotesPanel'
import { TodoList } from '../features/todo/TodoList'

function NotesAndTodo() {
  const level = useTimerStore((s) => s.level)
  const visibility = LEVELS[level].notesPanel

  const [collapsed, setCollapsed] = useState(visibility === 'collapsed')
  const [revealed, setRevealed] = useState(visibility !== 'hidden')

  // Re-sync local UI state whenever the level (and therefore the rule)
  // changes, so switching levels while idle immediately reflects the new
  // visibility rule instead of sticking to a stale collapsed/revealed state.
  useEffect(() => {
    setCollapsed(visibility === 'collapsed')
    setRevealed(visibility !== 'hidden')
  }, [visibility])

  if (visibility === 'hidden' && !revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="flex min-h-12 items-center justify-center rounded-2xl border border-dashed border-accent/40 bg-surface px-6 text-xs font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        Show notes &amp; to-do
      </button>
    )
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-dashed border-accent/40 bg-surface px-6 text-left text-sm font-medium text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      >
        Notes &amp; to-do
        <span className="text-xs text-ink-muted/70">Expand</span>
      </button>
    )
  }

  return (
    <section className="flex min-h-48 flex-col gap-6 rounded-2xl border border-accent/30 bg-surface p-6">
      <h2 className="text-base font-semibold text-ink">Notes &amp; to-do</h2>
      <NotesPanel />
      <hr className="border-t border-ink-muted/15" />
      <TodoList />
    </section>
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
