import { effectiveDurations, useTimerStore } from '../../stores/timerStore'

export function TimerControls() {
  const status = useTimerStore((s) => s.status)
  const phase = useTimerStore((s) => s.phase)
  const remainingMs = useTimerStore((s) => s.remainingMs)
  const level = useTimerStore((s) => s.level)
  const customDurations = useTimerStore((s) => s.customDurations)
  const start = useTimerStore((s) => s.start)
  const pause = useTimerStore((s) => s.pause)
  const reset = useTimerStore((s) => s.reset)

  const isRunning = status === 'running'
  // Idle, and a just-armed break/focus phase, both sit at their full
  // duration with nothing consumed yet -> "Start". Anything paused with
  // less than the full duration remaining is a session in progress ->
  // "Resume". This is what makes the post-completion armed phase (e.g.
  // "break ready") read as Start rather than a stale Resume.
  const durations = effectiveDurations(level, customDurations)
  const fullDurationMs = (phase === 'break' ? durations.breakMin : durations.focusMin) * 60_000
  const isFreshPhase = remainingMs >= fullDurationMs
  const primaryLabel = isRunning ? 'Pause' : isFreshPhase ? 'Start' : 'Resume'

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={isRunning ? pause : start}
        className="rounded-full bg-accent px-9 py-3 text-base font-semibold text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        onClick={reset}
        className="rounded-full px-6 py-3 text-sm font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        Reset
      </button>
    </div>
  )
}
