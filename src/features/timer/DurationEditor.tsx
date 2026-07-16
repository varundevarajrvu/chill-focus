import { effectiveDurations, useTimerStore } from '../../stores/timerStore'

const MIN_MINUTES = 1
const MAX_MINUTES = 180

export function DurationEditor() {
  const level = useTimerStore((s) => s.level)
  const customDurations = useTimerStore((s) => s.customDurations)
  const setCustomDuration = useTimerStore((s) => s.setCustomDuration)
  const status = useTimerStore((s) => s.status)
  const disabled = status === 'running'

  const { focusMin, breakMin } = effectiveDurations(level, customDurations)

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ink-muted">
      <label className="flex items-center gap-2">
        Focus
        <input
          type="number"
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          value={focusMin}
          disabled={disabled}
          onChange={(e) => setCustomDuration(level, 'focusMin', e.target.valueAsNumber)}
          className="w-16 rounded-lg border border-ink-muted/20 bg-surface px-2 py-1 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        min
      </label>
      <label className="flex items-center gap-2">
        Break
        <input
          type="number"
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          value={breakMin}
          disabled={disabled}
          onChange={(e) => setCustomDuration(level, 'breakMin', e.target.valueAsNumber)}
          className="w-16 rounded-lg border border-ink-muted/20 bg-surface px-2 py-1 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        />
        min
      </label>
    </div>
  )
}
