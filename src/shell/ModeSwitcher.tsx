import { useModeStore } from '../stores/modeStore'

const OPTIONS = [
  { mode: 'chill', label: 'Chill' },
  { mode: 'focus', label: 'Focus' },
] as const

export function ModeSwitcher() {
  const mode = useModeStore((s) => s.mode)
  const setMode = useModeStore((s) => s.setMode)

  return (
    <div
      role="group"
      aria-label="Mode switcher"
      className="inline-flex items-center gap-1 rounded-full border border-ink-muted/15 bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const active = mode === option.mode
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(option.mode)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
              active ? 'bg-accent text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
