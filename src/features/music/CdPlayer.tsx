import { useMusicStore } from '../../stores/musicStore'
import { useTimerStore } from '../../stores/timerStore'
import { isTrackSelectionLocked } from '../../lib/sessionLock'
import { PLAYLIST } from './playlist'
// Side-effect import: activates the module-level music manager's store
// subscription — same reasoning as MusicPlayer.tsx (chill mode). Mounting
// this panel in focus mode is enough to wire up playback there too; the
// manager itself is a singleton, so importing it from both panels is safe
// (the second import is a cache hit, not a second subscription).
import '../music/musicManager'

const SONGS_LOCKED_MESSAGE = 'Songs locked during Level 3 session'

/**
 * Focus-mode music player — a CD-styled alternative to Chill's chart-style
 * MusicPlayer, reusing the same musicStore/musicManager/PLAYLIST underneath.
 * Focus motion language only (ease-out fades via plain CSS transitions, no
 * springs) — unlike MusicPlayer, this component intentionally does not use
 * framer-motion's whileHover/whileTap presets.
 */
export function CdPlayer() {
  const trackIndex = useMusicStore((s) => s.trackIndex)
  const playing = useMusicStore((s) => s.playing)
  const volume = useMusicStore((s) => s.volume)
  const play = useMusicStore((s) => s.play)
  const pause = useMusicStore((s) => s.pause)
  const setVolume = useMusicStore((s) => s.setVolume)
  const selectTrack = useMusicStore((s) => s.selectTrack)

  const level = useTimerStore((s) => s.level)
  const status = useTimerStore((s) => s.status)
  const locked = isTrackSelectionLocked(level, status)

  return (
    <section className="flex flex-col gap-5 border-t border-ink-muted/10 pt-6 sm:flex-row sm:items-start sm:gap-6">
      <div className="relative mx-auto flex size-40 shrink-0 items-center justify-center sm:mx-0 sm:size-44">
        <svg
          viewBox="0 0 200 200"
          className={`size-full cd-disc ${playing ? 'cd-disc-playing' : ''}`}
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="cd-player-sheen" cx="35%" cy="30%" r="75%">
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
          <circle cx="100" cy="100" r="97" fill="url(#cd-player-sheen)" />
          <circle cx="100" cy="100" r="17" fill="var(--color-surface)" stroke="var(--color-ink-muted)" strokeOpacity="0.22" />
          <circle cx="100" cy="100" r="5" fill="var(--color-ink-muted)" fillOpacity="0.35" />
        </svg>
        <button
          type="button"
          onClick={() => (playing ? pause() : play())}
          aria-pressed={playing}
          aria-label={playing ? 'Pause music' : 'Play music'}
          className="btn-primary-sheen absolute flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Music</h2>

        <div role="group" aria-label="Songs" className="flex flex-col gap-1.5">
          {PLAYLIST.map((track, index) => {
            const active = index === trackIndex
            return (
              <button
                key={track.id}
                type="button"
                aria-pressed={active}
                disabled={locked}
                title={locked ? SONGS_LOCKED_MESSAGE : undefined}
                onClick={() => selectTrack(index)}
                className={`flex min-w-0 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                  active ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-ink-muted/5 hover:text-ink'
                }`}
              >
                <span className="w-full truncate text-sm font-medium" title={track.title}>
                  {track.title}
                </span>
                <span className="w-full truncate text-xs opacity-80" title={track.artist}>
                  {track.artist}
                </span>
              </button>
            )
          })}
        </div>

        {locked && (
          <p role="status" className="text-xs text-ink-muted">
            {SONGS_LOCKED_MESSAGE}. Play, pause, and volume still work.
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
            aria-label="Music volume"
            className="flex-1 accent-accent"
          />
        </label>
      </div>
    </section>
  )
}

// Distinct glyphs from MusicPlayer's — kept local/presentational so this
// component has no import-time coupling to the chill player. Accessible
// name lives on the parent button's aria-label ("Play music"/"Pause
// music"), not on these icons.
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
