import { useModeStore } from '../stores/modeStore'
import { ModeSwitcher } from './ModeSwitcher'

export function ModeHeader() {
  const mode = useModeStore((s) => s.mode)

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
          Chill / Focus
        </p>
        <h1 className="text-lg font-semibold text-ink">
          {mode === 'chill' ? 'Chill mode' : 'Focus mode'}
        </h1>
      </div>
      <ModeSwitcher />
    </header>
  )
}
