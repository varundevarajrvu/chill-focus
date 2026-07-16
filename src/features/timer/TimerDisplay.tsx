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
    <div className="flex flex-col items-center gap-1 py-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted/70">{PHASE_LABEL[phase]}</p>
      <p className="font-mono text-5xl font-semibold tabular-nums text-ink" aria-live="off">
        {mm}:{ss.toString().padStart(2, '0')}
      </p>
      <p className="text-xs text-ink-muted/70">
        {completedSessions} session{completedSessions === 1 ? '' : 's'} banked
      </p>
    </div>
  )
}
