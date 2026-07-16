import { motion } from 'framer-motion'
import { useModeStore } from '../stores/modeStore'
import { useModeMotion } from '../lib/motion'

const OPTIONS = [
  { mode: 'chill', label: 'Chill' },
  { mode: 'focus', label: 'Focus' },
] as const

export function ModeSwitcher() {
  const mode = useModeStore((s) => s.mode)
  const setMode = useModeStore((s) => s.setMode)
  // Springy press in chill, inert (no bounce) in focus — resolved once here
  // rather than each button hand-rolling the mode check.
  const { hover, tap, transition } = useModeMotion()

  return (
    <div
      role="group"
      aria-label="Mode switcher"
      className="inline-flex items-center gap-1 rounded-full border border-ink-muted/15 bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const active = mode === option.mode
        return (
          <motion.button
            key={option.mode}
            type="button"
            aria-pressed={active}
            onClick={() => setMode(option.mode)}
            whileHover={hover}
            whileTap={tap}
            transition={transition}
            className={`rounded-full px-4 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
              active ? 'bg-accent text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </motion.button>
        )
      })}
    </div>
  )
}
