import { motion } from 'framer-motion'
import { useMusicStore } from '../../stores/musicStore'
import { PLAYLIST } from './playlist'
import { chillHover, chillSpring, chillTap } from '../../lib/motion'
// Side-effect import: activates the module-level music manager's store
// subscription. Importing this panel is enough to wire up playback — no
// separate import needed elsewhere, matching the "self-contained" ask.
//
// Note: src/lib/audioExclusivity.ts is deliberately NOT imported here. It
// needs to be active even before Chill mode (and therefore this panel) has
// ever been mounted/bundle-loaded — e.g. if ChillLayout ends up behind a
// React.lazy() split, importing exclusivity only from here would leave
// ambient-audio -> music exclusivity dormant until a user actually visits
// Chill mode once. It's wired globally in AppShell instead, alongside the
// existing audioManager import — see integration notes for this feature.
import './musicManager'

export function MusicPlayer() {
  const trackIndex = useMusicStore((s) => s.trackIndex)
  const playing = useMusicStore((s) => s.playing)
  const volume = useMusicStore((s) => s.volume)
  const play = useMusicStore((s) => s.play)
  const pause = useMusicStore((s) => s.pause)
  const next = useMusicStore((s) => s.next)
  const prev = useMusicStore((s) => s.prev)
  const setVolume = useMusicStore((s) => s.setVolume)
  const selectTrack = useMusicStore((s) => s.selectTrack)

  const current = PLAYLIST[trackIndex]

  return (
    <section className="shadow-hero flex flex-col gap-6 rounded-[24px_30px_24px_28px] bg-surface-raised p-6 sm:p-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Music player</h2>
        <p
          className="mt-2 max-w-full truncate text-2xl font-bold text-ink sm:text-3xl"
          title={`${current.title} — ${current.artist}`}
        >
          {current.title}
        </p>
        <p className="text-sm text-ink-muted">{current.artist}</p>
      </div>

      <div className="flex items-center justify-center gap-5">
        <motion.button
          type="button"
          onClick={prev}
          aria-label="Previous track"
          whileHover={chillHover}
          whileTap={chillTap}
          transition={chillSpring}
          className="flex size-11 items-center justify-center rounded-full text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SkipBackIcon />
        </motion.button>
        <motion.button
          type="button"
          onClick={() => (playing ? pause() : play())}
          aria-pressed={playing}
          aria-label={playing ? 'Pause' : 'Play'}
          whileHover={chillHover}
          whileTap={chillTap}
          transition={chillSpring}
          className="btn-primary-sheen flex size-16 items-center justify-center rounded-full bg-accent text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </motion.button>
        <motion.button
          type="button"
          onClick={next}
          aria-label="Next track"
          whileHover={chillHover}
          whileTap={chillTap}
          transition={chillSpring}
          className="flex size-11 items-center justify-center rounded-full text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          <SkipForwardIcon />
        </motion.button>
      </div>

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

      <ul aria-label="Playlist" className="flex flex-col divide-y divide-ink-muted/10 border-t border-ink-muted/10">
        {PLAYLIST.map((track, index) => {
          const active = index === trackIndex
          return (
            <li key={track.id}>
              <motion.button
                type="button"
                aria-pressed={active}
                onClick={() => selectTrack(index)}
                whileHover={{ scale: 1.01 }}
                whileTap={chillTap}
                transition={chillSpring}
                className={`flex w-full flex-col items-start gap-0.5 border-l-[3px] px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'border-accent bg-accent-soft/70 text-ink'
                    : 'border-transparent text-ink-muted hover:bg-ink-muted/5 hover:text-ink'
                }`}
              >
                <span className="text-sm font-medium">{track.title}</span>
                <span className="text-xs text-ink-muted">{track.artist}</span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// Presentational transport glyphs. Play/Pause keep their required accessible
// names via aria-label on the parent button — only the visible glyph swaps
// from text to icon, so the a11y contract (name = "Play"/"Pause") is
// untouched.
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

function SkipBackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <rect x="5" y="5" width="2.2" height="14" rx="0.6" />
      <path d="M19 5.5v13L8.5 12 19 5.5Z" />
    </svg>
  )
}

function SkipForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <rect x="16.8" y="5" width="2.2" height="14" rx="0.6" />
      <path d="M5 5.5v13L15.5 12 5 5.5Z" />
    </svg>
  )
}
