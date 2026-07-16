import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LEVELS } from '../features/timer/levels'
import { useTimerStore, type Status } from './timerStore'
import type { Level } from '../features/timer/levels'
import type { TrackId } from '../features/audio/tracks'

const DEFAULT_VOLUME = 0.6

/**
 * Level 3 lock rule (master-prompt Section 5.2 table, "Ambient track" row):
 * once a Level-3 ("Deep Lock") session is running, track SELECTION is
 * locked — kills fiddling-as-procrastination. Volume and play/pause are
 * untouched by this; only selectTrack consults it. Exported so the store
 * guard and the UI (disabled state + explanatory copy) share one source of
 * truth instead of duplicating the condition.
 */
export function isTrackSelectionLocked(level: Level, status: Status): boolean {
  return LEVELS[level].canSwitchAudioMidSession === false && status === 'running'
}

interface AudioState {
  trackId: TrackId | null
  volume: number
  playing: boolean

  /** Refuses (no-op) while Level-3-lock applies — see isTrackSelectionLocked. */
  selectTrack: (trackId: TrackId) => void
  play: () => void
  pause: () => void
  setVolume: (volume: number) => void
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      trackId: null,
      volume: DEFAULT_VOLUME,
      playing: false,

      selectTrack: (trackId) => {
        const timer = useTimerStore.getState()
        if (isTrackSelectionLocked(timer.level, timer.status)) return
        // Selecting a track starts it (or, if something was already
        // playing, hands playback straight to the new track — audioManager
        // reconciles the actual engine swap).
        set({ trackId, playing: true })
      },

      play: () => {
        if (!get().trackId) return
        set({ playing: true })
      },

      pause: () => set({ playing: false }),

      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
    }),
    {
      name: 'cf-audio',
      // `playing` is deliberately excluded: autoplay policies make resuming
      // playback on load impossible anyway, so persisting it would just be a
      // lie the UI tells itself. Only the picked track + volume survive reload.
      partialize: (s) => ({ trackId: s.trackId, volume: s.volume }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        useAudioStore.setState({ playing: false })
      },
    },
  ),
)
