import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GAME_LIST, GAMES } from '../features/games'
import { MusicPlayer } from '../features/music/MusicPlayer'
import { chillHover, chillPop, chillSpring, chillTap } from '../lib/motion'
import { ScrollRocket } from './ScrollRocket'

// This layout only ever renders in chill mode (see ModeStage), so it reaches
// directly for the chill presets instead of going through useModeMotion.

// Purely decorative per-game glyphs for the picker tiles — presentational
// only, keyed off the existing game id, so the games registry itself
// (features/games/index.ts) stays untouched. `currentColor`/CSS vars only,
// so these still ride the mode token system rather than hardcoding color.
function GameGlyph({ id }: { id: string }) {
  if (id === 'dino') {
    return (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--color-accent)" />
        <rect x="7" y="8" width="3" height="3" fill="var(--color-surface-raised)" />
      </svg>
    )
  }
  if (id === 'memory-match') {
    return (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <rect x="3" y="5" width="12" height="12" rx="3" fill="var(--color-accent-soft)" />
        <rect x="9" y="9" width="12" height="12" rx="3" fill="var(--color-accent)" />
      </svg>
    )
  }
  if (id === 'snake') {
    return (
      <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
        <rect x="2.5" y="4" width="4.5" height="4.5" rx="1.2" fill="var(--color-accent)" />
        <rect x="7" y="4" width="4.5" height="4.5" rx="1.2" fill="var(--color-accent)" />
        <rect x="7" y="8.5" width="4.5" height="4.5" rx="1.2" fill="var(--color-accent)" />
        <rect x="11.5" y="8.5" width="4.5" height="4.5" rx="1.2" fill="var(--color-accent)" />
        <rect x="11.5" y="13" width="4.5" height="4.5" rx="1.2" fill="var(--color-accent)" />
        <rect x="16" y="13" width="4.5" height="4.5" rx="1.2" fill="var(--color-accent)" />
      </svg>
    )
  }
  // Fallback — covers 'tic-tac-toe' plus any future game id added without a
  // dedicated glyph case (registry stays the single source of truth; this
  // switch is purely presentational and never blocks a new game from
  // rendering, just falls back to a generic mark).
  return (
    <span aria-hidden="true" className="flex items-center gap-1 text-xl font-bold leading-none">
      <span className="text-ink">✕</span>
      <span className="text-accent">○</span>
    </span>
  )
}

function GamesCard() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? GAMES[selectedId] : null
  const GameComponent = selected?.component ?? null
  // MotionConfig's global reducedMotion="user" net (App.tsx) only freezes
  // transform/positional values (scale here), not opacity — this mount/exit
  // fade needs its own guard to be "effectively instant" for reduced motion.
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex min-h-48 flex-col gap-6">
      <AnimatePresence mode="wait" initial={false}>
        {selected && GameComponent ? (
          <motion.div
            key={selected.id}
            initial={reduceMotion ? undefined : chillPop.initial}
            animate={chillPop.animate}
            exit={reduceMotion ? undefined : chillPop.exit}
            transition={reduceMotion ? { duration: 0 } : chillSpring}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">
                {selected.label}
              </h2>
              <motion.button
                type="button"
                onClick={() => setSelectedId(null)}
                whileHover={chillHover}
                whileTap={chillTap}
                transition={chillSpring}
                className="rounded-full px-3 py-1 text-xs font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              >
                ← Back
              </motion.button>
            </div>
            <GameComponent />
          </motion.div>
        ) : (
          <motion.div
            key="picker"
            initial={reduceMotion ? undefined : chillPop.initial}
            animate={chillPop.animate}
            exit={reduceMotion ? undefined : chillPop.exit}
            transition={reduceMotion ? { duration: 0 } : chillSpring}
            className="flex flex-col gap-5"
          >
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Games</h2>
              <p className="mt-1 text-sm text-ink-muted">Pick one to play.</p>
            </div>
            {/* 2x2 tile grid — springy tiles, same picker semantics as before
                (click selects, selected game mounts in place with Back).
                grid-cols-2 reads correctly whether the registry currently
                holds 2 or 4 entries (a partial last row is fine). */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {GAME_LIST.map((game) => (
                <motion.button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                  whileHover={chillHover}
                  whileTap={chillTap}
                  transition={chillSpring}
                  className="flex flex-col items-center gap-3 rounded-2xl bg-ink-muted/[0.05] p-5 text-center outline-none transition-colors hover:bg-accent-soft/60 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-raised">
                    <GameGlyph id={game.id} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-display text-sm font-semibold text-ink">{game.label}</span>
                    <span className="line-clamp-2 text-xs text-ink-muted">{game.description}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Wraps a chill section so it pops in the first time it scrolls into view
 * (`whileInView`, `viewport={{ once: true }}` — never re-triggers on
 * scroll-back-up). Reduced motion renders the section in its final state
 * immediately: no initial/whileInView props at all, so there's nothing to
 * animate from.
 */
function ScrollSection({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <section className="w-full">{children}</section>
  }

  return (
    <motion.section
      className="w-full"
      initial={chillPop.initial}
      whileInView={chillPop.animate}
      viewport={{ once: true, margin: '-80px' }}
      transition={chillSpring}
    >
      {children}
    </motion.section>
  )
}

export function ChillLayout() {
  return (
    <div className="flex flex-col gap-20 pb-40 pt-2 sm:gap-28">
      <ScrollSection>
        <MusicPlayer />
      </ScrollSection>
      <ScrollSection>
        <GamesCard />
      </ScrollSection>
      <ScrollRocket />
    </div>
  )
}
