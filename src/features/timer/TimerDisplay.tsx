import { useTimerStore } from '../../stores/timerStore'
import type { Phase } from '../../stores/timerStore'

const PHASE_LABEL: Record<Phase, string> = {
  idle: 'Ready',
  focus: 'Focus',
  break: 'Break',
}

export function TimerDisplay() {
  const phase = useTimerStore((s) => s.phase)
  const remainingMs = useTimerStore((s) => s.remainingMs)
  const completedSessions = useTimerStore((s) => s.completedSessions)

  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60

  return (
    <div className="flex flex-col items-center gap-2 py-4 sm:py-6">
      <p className="font-display text-xs font-semibold uppercase tracking-[0.32em] text-accent">
        {PHASE_LABEL[phase]}
      </p>
      <p
        className="text-gradient font-numeric text-[clamp(4.5rem,10vw,6.5rem)] font-extrabold leading-none tabular-nums"
        aria-live="off"
      >
        {mm}:{ss.toString().padStart(2, '0')}
      </p>
      <p className="text-xs text-ink-muted">
        {completedSessions} session{completedSessions === 1 ? '' : 's'} banked
      </p>
    </div>
  )
}
