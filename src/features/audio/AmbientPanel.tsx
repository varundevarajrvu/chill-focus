import { isTrackSelectionLocked, useAudioStore } from '../../stores/audioStore'
import { useTimerStore } from '../../stores/timerStore'
import { TRACKS } from './tracks'

const TRACK_LOCKED_MESSAGE = 'Track locked during Level 3 session'

export function AmbientPanel() {
  const trackId = useAudioStore((s) => s.trackId)
  const playing = useAudioStore((s) => s.playing)
  const volume = useAudioStore((s) => s.volume)
  const selectTrack = useAudioStore((s) => s.selectTrack)
  const play = useAudioStore((s) => s.play)
  const pause = useAudioStore((s) => s.pause)
  const setVolume = useAudioStore((s) => s.setVolume)

  const level = useTimerStore((s) => s.level)
  const status = useTimerStore((s) => s.status)
  const trackLocked = isTrackSelectionLocked(level, status)

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">Ambient sound</h2>
        <button
          type="button"
          onClick={() => (playing ? pause() : play())}
          disabled={!trackId}
          aria-pressed={playing}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>

      <div role="group" aria-label="Ambient track" className="flex flex-wrap gap-2">
        {TRACKS.map((track) => {
          const active = trackId === track.id
          return (
            <button
              key={track.id}
              type="button"
              aria-pressed={active}
              disabled={trackLocked}
              title={trackLocked ? TRACK_LOCKED_MESSAGE : undefined}
              onClick={() => selectTrack(track.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? 'bg-accent text-white' : 'border border-ink-muted/20 text-ink-muted hover:text-ink'
              }`}
            >
              {track.label}
            </button>
          )
        })}
      </div>

      {trackLocked && (
        <p role="status" className="text-xs text-ink-muted/70">
          {TRACK_LOCKED_MESSAGE}. Volume and play/pause still work.
        </p>
      )}

      <label className="flex items-center gap-3 text-sm text-ink-muted">
        Volume
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(e.target.valueAsNumber)}
          aria-label="Ambient volume"
          className="flex-1 accent-accent"
        />
      </label>
    </section>
  )
}
