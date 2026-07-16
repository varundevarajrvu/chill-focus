import { useNudge } from '../../hooks/useTabTitle'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { LevelSelector } from './LevelSelector'
import { DurationEditor } from './DurationEditor'

export function TimerPanel() {
  const { message, dismiss } = useNudge()

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6"
      onClick={message ? dismiss : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Timer</h2>
        <LevelSelector />
      </div>

      {message && (
        <p role="status" className="rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-ink">
          {message}
        </p>
      )}

      <TimerDisplay />
      <TimerControls />
      <DurationEditor />
    </section>
  )
}
