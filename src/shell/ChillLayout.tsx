import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GAME_LIST, GAMES } from '../features/games'
import { MusicPlayer } from '../features/music/MusicPlayer'
import { chillHover, chillPop, chillSpring, chillTap } from '../lib/motion'

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
    <section className="flex min-h-48 flex-col gap-6 border-t border-ink-muted/10 pt-8 sm:border-t-0 sm:border-l sm:border-ink-muted/10 sm:pl-8 sm:pt-0">
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
            className="flex flex-col gap-4"
          >
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-ink-muted">Games</h2>
              <p className="mt-1 text-sm text-ink-muted">Pick one to play.</p>
            </div>
            <div className="flex flex-col gap-3">
              {GAME_LIST.map((game) => (
                <motion.button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                  whileHover={chillHover}
                  whileTap={chillTap}
                  transition={chillSpring}
                  className="flex items-center gap-4 rounded-2xl bg-ink-muted/[0.05] p-4 text-left outline-none transition-colors hover:bg-accent-soft/60 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-raised">
                    <GameGlyph id={game.id} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-ink">{game.label}</span>
                    <span className="text-xs text-ink-muted">{game.description}</span>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export function ChillLayout() {
  return (
    <div className="grid gap-10 sm:grid-cols-5 sm:gap-8 lg:gap-12">
      <div className="sm:col-span-3">
        <MusicPlayer />
      </div>
      <div className="sm:col-span-2">
        <GamesCard />
      </div>
    </div>
  )
}
