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
    <section className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Music player</h2>
        <p className="mt-1 truncate text-sm text-ink-muted" title={`${current.title} — ${current.artist}`}>
          {current.title} <span className="text-ink-muted">— {current.artist}</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={prev}
          aria-label="Previous track"
          whileHover={chillHover}
          whileTap={chillTap}
          transition={chillSpring}
          className="rounded-full border border-ink-muted/20 px-3 py-1.5 text-sm font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          ⏮
        </motion.button>
        <motion.button
          type="button"
          onClick={() => (playing ? pause() : play())}
          aria-pressed={playing}
          aria-label={playing ? 'Pause' : 'Play'}
          whileHover={chillHover}
          whileTap={chillTap}
          transition={chillSpring}
          className="rounded-full bg-accent px-5 py-1.5 text-sm font-medium text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          {playing ? 'Pause' : 'Play'}
        </motion.button>
        <motion.button
          type="button"
          onClick={next}
          aria-label="Next track"
          whileHover={chillHover}
          whileTap={chillTap}
          transition={chillSpring}
          className="rounded-full border border-ink-muted/20 px-3 py-1.5 text-sm font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        >
          ⏭
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

      <ul aria-label="Playlist" className="flex flex-col gap-1">
        {PLAYLIST.map((track, index) => {
          const active = index === trackIndex
          return (
            <li key={track.id}>
              <motion.button
                type="button"
                aria-pressed={active}
                onClick={() => selectTrack(index)}
                whileHover={{ scale: 1.015 }}
                whileTap={chillTap}
                transition={chillSpring}
                className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? 'bg-accent text-accent-ink' : 'border border-ink-muted/20 text-ink-muted hover:text-ink'
                }`}
              >
                <span className="text-sm font-medium">{track.title}</span>
                <span className={`text-xs ${active ? 'text-accent-ink' : 'text-ink-muted'}`}>{track.artist}</span>
              </motion.button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
