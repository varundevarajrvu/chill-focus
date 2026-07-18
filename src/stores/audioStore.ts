import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useTimerStore } from './timerStore'
import type { TrackId } from '../features/audio/tracks'
import { isTrackSelectionLocked } from '../lib/sessionLock'

const DEFAULT_VOLUME = 0.6

/**
 * Re-exported so existing imports (e.g. AmbientPanel.tsx's
 * `import { isTrackSelectionLocked } from '../../stores/audioStore'`) keep
 * working unchanged. The helper itself now lives in lib/sessionLock.ts so
 * musicStore's CD-player lock can share the exact same rule — see that
 * file's doc comment.
 */
export { isTrackSelectionLocked }

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
