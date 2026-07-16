import { useEffect } from 'react'
import { create } from 'zustand'
import { useModeStore } from '../stores/modeStore'
import { useTimerStore } from '../stores/timerStore'
import { LEVELS } from '../features/timer/levels'

const BASE_TITLE = 'Chill / Focus'
const NUDGE_DURATION_MS = 6000

interface NudgeState {
  message: string | null
  dismiss: () => void
}

// Small dedicated store so the Level-3 "still there?" nudge — set by the
// visibilitychange listener below, which only ever runs once (mounted in
// AppShell) — can be read from TimerPanel without prop-drilling.
const useNudgeStore = create<NudgeState>((set) => ({
  message: null,
  dismiss: () => set({ message: null }),
}))

/** Read + dismiss the Level-3 nudge. Used by TimerPanel. */
export function useNudge() {
  const message = useNudgeStore((s) => s.message)
  const dismiss = useNudgeStore((s) => s.dismiss)
  return { message, dismiss }
}

function formatCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000))
  const mm = Math.floor(totalSec / 60)
  const ss = totalSec % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

/**
 * Mount once, in AppShell. Drives document.title while a focus-mode timer
 * is running (Level 2+) and arms the Level-3 "still there?" nudge on
 * visibilitychange. Resets the title to BASE_TITLE on cleanup, whenever the
 * timer stops running (paused or idle), and whenever mode leaves focus.
 */
export function useTabTitle() {
  const mode = useModeStore((s) => s.mode)
  const status = useTimerStore((s) => s.status)
  const remainingMs = useTimerStore((s) => s.remainingMs)
  const level = useTimerStore((s) => s.level)
  const tabTitleMode = LEVELS[level].tabTitle

  useEffect(() => {
    const active = mode === 'focus' && status === 'running' && tabTitleMode !== 'none'
    if (!active) {
      document.title = BASE_TITLE
      return
    }
    document.title = `${formatCountdown(remainingMs)} — Chill/Focus`

    return () => {
      document.title = BASE_TITLE
    }
  }, [mode, status, remainingMs, tabTitleMode])

  useEffect(() => {
    if (mode !== 'focus' || tabTitleMode !== 'countdown+nudge') return

    function handleVisibility() {
      if (document.visibilityState !== 'visible') return
      const s = useTimerStore.getState()
      if (s.status !== 'running') return
      const minsLeft = Math.max(1, Math.ceil(s.remainingMs / 60_000))
      useNudgeStore.setState({ message: `Still there? ${minsLeft} min left.` })
      window.setTimeout(() => useNudgeStore.getState().dismiss(), NUDGE_DURATION_MS)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [mode, tabTitleMode])
}
