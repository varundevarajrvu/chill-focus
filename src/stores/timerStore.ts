import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LEVELS, type Level } from '../features/timer/levels'

export type Phase = 'idle' | 'focus' | 'break'
export type Status = 'running' | 'paused'
export type CustomDurations = Partial<Record<Level, { focusMin: number; breakMin: number }>>

const DEFAULT_LEVEL: Level = 1
const MIN_DURATION_MIN = 1
const MAX_DURATION_MIN = 180

function clampMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return MIN_DURATION_MIN
  return Math.min(MAX_DURATION_MIN, Math.max(MIN_DURATION_MIN, Math.round(minutes)))
}

/** Custom durations (if set for the level) override the level's table defaults. */
export function effectiveDurations(level: Level, customDurations: CustomDurations) {
  const base = LEVELS[level]
  const custom = customDurations[level]
  return {
    focusMin: custom?.focusMin ?? base.focusMin,
    breakMin: custom?.breakMin ?? base.breakMin,
  }
}

interface TimerState {
  phase: Phase
  status: Status
  /** Epoch ms — source of truth while running. */
  endAt: number | null
  /** Source of truth while paused/idle. */
  remainingMs: number
  completedSessions: number
  lastCompletionAt: number | null
  lastCompletedPhase: 'focus' | 'break' | null
  level: Level
  customDurations: CustomDurations

  setLevel: (level: Level) => void
  setCustomDuration: (level: Level, kind: 'focusMin' | 'breakMin', minutes: number) => void
  start: () => void
  pause: () => void
  reset: () => void
  tick: () => void
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => {
      // Shared by tick() and pause() — both need to route "time's actually
      // up" through the exact same completion transition, so that pausing
      // in the gap right at expiry behaves identically to the interval tick
      // catching it (see carry-over fix: pause() used to just clamp
      // remainingMs to 0, which made the next start() restart a full block
      // instead of completing).
      const completeCurrentPhase = () => {
        const s = get()
        const now = Date.now()
        const durations = effectiveDurations(s.level, s.customDurations)
        if (s.phase === 'focus') {
          // Focus session complete -> arm break, require explicit start.
          set({
            phase: 'break',
            status: 'paused',
            endAt: null,
            remainingMs: durations.breakMin * 60_000,
            completedSessions: s.completedSessions + 1,
            lastCompletionAt: now,
            lastCompletedPhase: 'focus',
          })
        } else if (s.phase === 'break') {
          // Break complete -> back to idle, armed with a fresh focus block.
          set({
            phase: 'idle',
            status: 'paused',
            endAt: null,
            remainingMs: durations.focusMin * 60_000,
            lastCompletionAt: now,
            lastCompletedPhase: 'break',
          })
        }
      }

      return {
        phase: 'idle',
        status: 'paused',
        endAt: null,
        remainingMs: LEVELS[DEFAULT_LEVEL].focusMin * 60_000,
        completedSessions: 0,
        lastCompletionAt: null,
        lastCompletedPhase: null,
        level: DEFAULT_LEVEL,
        customDurations: {},

        setLevel: (level) => {
          const s = get()
          // Level switching is disabled while a session is running.
          if (s.status === 'running') return
          const durations = effectiveDurations(level, s.customDurations)
          set({
            level,
            phase: 'idle',
            status: 'paused',
            endAt: null,
            remainingMs: durations.focusMin * 60_000,
          })
        },

        setCustomDuration: (level, kind, minutes) => {
          const s = get()
          if (s.status === 'running') return
          const current = s.customDurations[level] ?? effectiveDurations(level, s.customDurations)
          const updated = { ...current, [kind]: clampMinutes(minutes) }
          const nextCustom = { ...s.customDurations, [level]: updated }
          const patch: Partial<TimerState> = { customDurations: nextCustom }

          // If we're editing the duration that governs the currently-armed
          // phase for the currently-selected level, refresh remainingMs too.
          const relevantKind = s.phase === 'break' ? 'breakMin' : 'focusMin'
          if (s.level === level && kind === relevantKind) {
            patch.remainingMs = updated[relevantKind] * 60_000
          }
          set(patch)
        },

        start: () => {
          const s = get()
          if (s.status === 'running') return
          const durations = effectiveDurations(s.level, s.customDurations)
          const remaining = s.remainingMs > 0 ? s.remainingMs : durations.focusMin * 60_000
          set({
            phase: s.phase === 'idle' ? 'focus' : s.phase,
            status: 'running',
            endAt: Date.now() + remaining,
            remainingMs: remaining,
          })
        },

        pause: () => {
          const s = get()
          if (s.status !== 'running' || s.endAt === null) return
          const remaining = s.endAt - Date.now()
          // Paused right at/after expiry: this IS a completion, not a pause
          // with 0ms left — route it through the same transition tick() uses,
          // so the next start() arms the next phase instead of restarting a
          // full block from a stale remainingMs=0.
          if (remaining <= 0) {
            completeCurrentPhase()
            return
          }
          set({ status: 'paused', remainingMs: remaining, endAt: null })
        },

        reset: () => {
          const s = get()
          const durations = effectiveDurations(s.level, s.customDurations)
          set({
            phase: 'idle',
            status: 'paused',
            endAt: null,
            remainingMs: durations.focusMin * 60_000,
          })
        },

        tick: () => {
          const s = get()
          if (s.status !== 'running' || s.endAt === null) return
          const remaining = s.endAt - Date.now()
          if (remaining > 0) {
            set({ remainingMs: remaining })
            return
          }
          completeCurrentPhase()
        },
      }
    },
    {
      name: 'cf-timer',
      // A running session does NOT survive reload — only level + custom
      // durations persist.
      partialize: (s) => ({ level: s.level, customDurations: s.customDurations }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const durations = effectiveDurations(state.level, state.customDurations)
        useTimerStore.setState({ remainingMs: durations.focusMin * 60_000 })
      },
    },
  ),
)

// Timing is timestamp-derived: this 1s interval never accumulates its own
// drift, it only ever recomputes `remaining` from `endAt - Date.now()`, so a
// throttled/backgrounded tab cannot desync the countdown. Completion is
// re-checked on visibilitychange so a session that finished while the tab
// was hidden completes the moment focus returns, instead of waiting for the
// next 1s tick.
if (typeof window !== 'undefined') {
  window.setInterval(() => {
    if (useTimerStore.getState().status === 'running') {
      useTimerStore.getState().tick()
    }
  }, 1000)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && useTimerStore.getState().status === 'running') {
      useTimerStore.getState().tick()
    }
  })
}
