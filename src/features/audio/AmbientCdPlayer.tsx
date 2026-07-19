import { isTrackSelectionLocked, useAudioStore } from '../../stores/audioStore'
import { useTimerStore } from '../../stores/timerStore'
import { TRACKS } from './tracks'

const TRACK_LOCKED_MESSAGE = 'Track locked during Level 3 session'

/**
 * Focus-mode ambient player — the CD-styled disc (formerly
 * features/music/CdPlayer.tsx, Chill's music mirror) now wired to
 * audioStore instead of musicStore. Music leaves Focus mode entirely as of
 * this change: the disc + rotation mechanics are reused verbatim, but the
 * stack next to the disc lists the five ambient tracks (tracks.ts) rather
 * than songs, and every control drives ambient playback. Replaces the old
 * AmbientPanel.tsx (chips) + CdPlayer.tsx (music) pair in FocusLayout.
 *
 * Focus motion language only (ease-out fades via plain CSS transitions, no
 * springs/whileHover/whileTap presets) — same restraint CdPlayer.tsx used
 * to observe relative to Chill's MusicPlayer.
 */
export function AmbientCdPlayer() {
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
    <section className="flex flex-col gap-5 border-t border-ink-muted/10 pt-6 sm:flex-row sm:items-start sm:gap-6">
      <div className="relative mx-auto flex size-40 shrink-0 items-center justify-center sm:mx-0 sm:size-44">
        <svg
          viewBox="0 0 200 200"
          className={`size-full cd-disc ${playing ? 'cd-disc-playing' : ''}`}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="ambient-cd-player-sheen" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="white" stopOpacity="0.35" />
              <stop offset="45%" stopColor="white" stopOpacity="0.08" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="97" fill="var(--color-surface-raised)" stroke="var(--color-ink-muted)" strokeOpacity="0.15" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="var(--color-accent-soft)" strokeWidth="2" strokeOpacity="0.55" />
          <circle cx="100" cy="100" r="71" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1" strokeOpacity="0.14" />
          <circle cx="100" cy="100" r="57" fill="none" stroke="var(--color-accent-soft)" strokeWidth="2" strokeOpacity="0.55" />
          <circle cx="100" cy="100" r="43" fill="none" stroke="var(--color-ink-muted)" strokeWidth="1" strokeOpacity="0.14" />
          <circle cx="100" cy="100" r="97" fill="url(#ambient-cd-player-sheen)" />
          <circle cx="100" cy="100" r="17" fill="var(--color-surface)" stroke="var(--color-ink-muted)" strokeOpacity="0.22" />
          <circle cx="100" cy="100" r="5" fill="var(--color-ink-muted)" fillOpacity="0.35" />
        </svg>
        <button
          type="button"
          onClick={() => (playing ? pause() : play())}
          disabled={!trackId}
          aria-pressed={playing}
          aria-label={playing ? 'Pause' : 'Play'}
          className="btn-primary-sheen absolute flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="micro-label text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Ambient sound</h2>

        <div role="group" aria-label="Ambient track" className="flex flex-col gap-1.5">
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
                className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                  active ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-ink-muted/5 hover:text-ink'
                }`}
              >
                {track.label}
              </button>
            )
          })}
        </div>

        {trackLocked && (
          <p role="status" className="text-xs text-ink-muted">
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
      </div>
    </section>
  )
}

// Distinct glyphs from MusicPlayer's — kept local/presentational so this
// component has no import-time coupling to the chill player. Accessible
// name lives on the parent button's aria-label ("Play"/"Pause"), not on
// these icons.
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5-13-7.5Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </svg>
  )
}
