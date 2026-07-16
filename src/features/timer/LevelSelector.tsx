import { useTimerStore } from '../../stores/timerStore'
import type { Level } from './levels'

const LEVEL_OPTIONS: { level: Level; label: string }[] = [
  { level: 1, label: 'Level 1' },
  { level: 2, label: 'Level 2' },
  { level: 3, label: 'Level 3' },
]

export function LevelSelector() {
  const level = useTimerStore((s) => s.level)
  const setLevel = useTimerStore((s) => s.setLevel)
  const status = useTimerStore((s) => s.status)
  const disabled = status === 'running'

  return (
    <div
      role="group"
      aria-label="Focus level"
      className="inline-flex items-center gap-1 rounded-full border border-ink-muted/15 bg-surface p-1"
    >
      {LEVEL_OPTIONS.map((option) => {
        const active = level === option.level
        return (
          <button
            key={option.level}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => setLevel(option.level)}
            title={disabled ? 'Level is locked while a session is running' : undefined}
            className={`rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
              active ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
