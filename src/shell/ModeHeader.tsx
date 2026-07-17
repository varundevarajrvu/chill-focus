import { useModeStore } from '../stores/modeStore'
import { ModeSwitcher } from './ModeSwitcher'

export function ModeHeader() {
  const mode = useModeStore((s) => s.mode)

  return (
    <header className="flex items-center justify-between px-6 pt-8 pb-4 sm:px-10 sm:pt-12">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-ink-muted">
          Chill / Focus
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[2rem]">
          {mode === 'chill' ? 'Chill mode' : 'Focus mode'}
        </h1>
      </div>
      <ModeSwitcher />
    </header>
  )
}
