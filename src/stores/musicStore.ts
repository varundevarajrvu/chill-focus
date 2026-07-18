import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PLAYLIST } from '../features/music/playlist'
import { useTimerStore } from './timerStore'
import { isTrackSelectionLocked } from '../lib/sessionLock'

const DEFAULT_VOLUME = 0.6

interface MusicState {
  trackIndex: number
  playing: boolean
  volume: number

  play: () => void
  pause: () => void
  /** Advances to the next track, looping back to the first after the last.
   *  Preserves whatever `playing` was — skipping while playing keeps
   *  playing (on the new track); skipping while paused just reselects. */
  next: () => void
  /** Same continuity rule as `next`, wrapping to the last track from the first. */
  prev: () => void
  setVolume: (volume: number) => void
  /** Explicit selection (e.g. clicking a playlist row) always starts playback.
   *  Refuses (no-op) while Level-3-lock applies — see isTrackSelectionLocked
   *  in lib/sessionLock.ts, the same rule the ambient panel uses. */
  selectTrack: (index: number) => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      trackIndex: 0,
      playing: false,
      volume: DEFAULT_VOLUME,

      play: () => set({ playing: true }),
      pause: () => set({ playing: false }),

      next: () =>
        set((s) => ({
          trackIndex: (s.trackIndex + 1) % PLAYLIST.length,
        })),

      prev: () =>
        set((s) => ({
          trackIndex: (s.trackIndex - 1 + PLAYLIST.length) % PLAYLIST.length,
        })),

      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),

      selectTrack: (index) => {
        const timer = useTimerStore.getState()
        if (isTrackSelectionLocked(timer.level, timer.status)) return
        set({ trackIndex: index, playing: true })
      },
    }),
    {
      name: 'cf-music',
      // `playing` is deliberately excluded: autoplay policies make resuming
      // playback on load impossible anyway, so persisting it would just be a
      // lie the UI tells itself. Only the picked track + volume survive reload.
      partialize: (s) => ({ trackIndex: s.trackIndex, volume: s.volume }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        useMusicStore.setState({ playing: false })
      },
    },
  ),
)
