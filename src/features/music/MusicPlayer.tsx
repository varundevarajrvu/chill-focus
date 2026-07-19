import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMusicStore } from '../../stores/musicStore'
import { PLAYLIST } from './playlist'
import { chillHover, chillSpring, chillTap } from '../../lib/motion'
// Side-effect import (plus one named export, getMusicPosition, used below
// for the chart's live progress fill): activates the module-level music
// manager's store subscription. Importing this panel is enough to wire up
// playback — no separate import needed elsewhere, matching the
// "self-contained" ask.
//
// Note: src/lib/audioExclusivity.ts is deliberately NOT imported here. It
// needs to be active even before Chill mode (and therefore this panel) has
// ever been mounted/bundle-loaded — e.g. if ChillLayout ends up behind a
// React.lazy() split, importing exclusivity only from here would leave
// ambient-audio -> music exclusivity dormant until a user actually visits
// Chill mode once. It's wired globally in AppShell instead, alongside the
// existing audioManager import — see integration notes for this feature.
import { getMusicPosition } from './musicManager'

// Playlist chart geometry. Longest real track (Chill Pop, 154s) exceeds the
// last labeled tick (2:30 = 150s) — that's normal for a bar chart axis: the
// scale extends a little past the last gridline so the longest bar still has
// breathing room before the row ends, rather than clipping/rescaling ticks
// to an odd max. 160s gives ~4% headroom past the longest bar.
const CHART_MAX_SEC = 160
const CHART_TICKS_SEC = [0, 60, 120, 150]
// Shared column template for the axis row + every playlist row, so tick
// marks line up exactly with the bars beneath them: label | bar track | a
// fixed-width duration column (always visible, never clipped by bar length).
const CHART_GRID_COLS = 'grid-cols-[5rem_1fr_2.75rem] sm:grid-cols-[8rem_1fr_3rem]'

function formatTime(sec: number): string {
  const whole = Math.max(0, Math.round(sec))
  const m = Math.floor(whole / 60)
  const s = whole % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function pct(sec: number): string {
  // Clamped so a future track longer than the axis scale can never push a
  // bar past its rail (the rail also has overflow-hidden as backstop).
  return `${Math.min((sec / CHART_MAX_SEC) * 100, 100)}%`
}

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
  const reduceMotion = useReducedMotion()

  const current = PLAYLIST[trackIndex]

  // Live progress for the selected track's chart bar. Resets the moment the
  // selection changes (a freshly adopted Howl always starts at 0 — see
  // musicManager's adoptTrack) so the fill doesn't briefly show the previous
  // track's position, then polls only while actually playing, cleaning the
  // interval up on pause/unmount so nothing ticks in the background.
  const [position, setPosition] = useState(0)

  useEffect(() => {
    setPosition(0)
  }, [trackIndex])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setPosition(getMusicPosition()), 500)
    return () => clearInterval(id)
  }, [playing])

  return (
    <section className="shadow-hero flex flex-col gap-6 rounded-[24px_30px_24px_28px] bg-surface-raised p-6 sm:p-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Music player</h2>
        <p
          className="font-display mt-2 max-w-full truncate text-2xl font-bold leading-snug text-ink sm:text-3xl"
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

      {/*
       * Playlist as a horizontal bar chart (track length = real duration).
       * AAA pattern: every bar's duration is always shown as text in its own
       * fixed-width column — never only inside/at the end of a bar, so a
       * short track's label is never cramped or clipped, and meaning never
       * rides on color alone. Gridlines are low-contrast (ink-muted/15,
       * decorative, aria-hidden); the duration column sits on the card's
       * plain surface-raised background (not on any bar/gridline tint), same
       * ink-muted-on-surface-raised pairing already verified elsewhere in
       * this file (~6.5:1, comfortably AAA) — so its contrast holds
       * regardless of how long or short the adjacent bar is.
       */}
      <div className="flex flex-col gap-1">
        <div className={`grid ${CHART_GRID_COLS} gap-x-3`} aria-hidden="true">
          <span />
          <div className="relative h-4">
            {CHART_TICKS_SEC.map((tick) => (
              <span
                key={tick}
                className="absolute top-0 whitespace-nowrap text-[10px] font-medium text-ink-muted"
                style={{
                  left: pct(tick),
                  transform:
                    tick === 0
                      ? 'translateX(0)'
                      : tick === CHART_TICKS_SEC[CHART_TICKS_SEC.length - 1]
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                }}
              >
                {formatTime(tick)}
              </span>
            ))}
          </div>
          <span />
        </div>

        <ul aria-label="Playlist" className="flex flex-col gap-2 border-t border-ink-muted/10 pt-2">
          {PLAYLIST.map((track, index) => {
            const active = index === trackIndex
            const progressSec = active ? Math.min(position, track.durationSec) : 0
            return (
              <li key={track.id}>
                <motion.button
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectTrack(index)}
                  whileHover={chillHover}
                  whileTap={chillTap}
                  transition={chillSpring}
                  className={`grid w-full ${CHART_GRID_COLS} items-center gap-x-3 rounded-lg px-1 py-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                    active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <span className="truncate text-sm font-medium" title={track.title}>
                    {track.title}
                  </span>

                  <span className="relative block h-6 overflow-hidden">
                    {/* Low-contrast axis rail spanning the full scale width. */}
                    <span className="absolute inset-y-2 inset-x-0 rounded-full bg-ink-muted/10" aria-hidden="true" />
                    {/* Gridlines at the labeled ticks — decorative only. */}
                    {CHART_TICKS_SEC.map((tick) => (
                      <span
                        key={tick}
                        aria-hidden="true"
                        className="absolute inset-y-0 w-px bg-ink-muted/15"
                        style={{ left: pct(tick) }}
                      />
                    ))}
                    {/* The bar itself — length proportional to real duration.
                        Unselected: soft accent-tinted hint. Selected: solid
                        accent (never the only signal — aria-pressed plus the
                        left label's text color both carry "selected" too). */}
                    <span
                      className={`absolute inset-y-2 left-0 rounded-full ${active ? 'bg-accent' : 'bg-accent-soft/70'}`}
                      style={{ width: pct(track.durationSec) }}
                    />
                    {/* Live progress fill — selected + playing only, a deeper
                        tone layered over the accent bar so "played" reads
                        distinctly from "remaining". Width snaps (no CSS
                        transition) under reduced motion since this is data,
                        not decoration. */}
                    {active && (
                      <span
                        className="absolute inset-y-2 left-0 rounded-full bg-accent-ink/35"
                        style={{
                          width: pct(progressSec),
                          transition: reduceMotion ? 'none' : 'width 0.4s linear',
                        }}
                      />
                    )}
                  </span>

                  <span className="font-numeric text-right text-xs font-medium tabular-nums text-ink-muted">
                    {formatTime(track.durationSec)}
                  </span>
                </motion.button>
              </li>
            )
          })}
        </ul>
      </div>
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
