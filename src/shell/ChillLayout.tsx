import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { GAME_LIST, GAMES } from '../features/games'
import { MusicPlayer } from '../features/music/MusicPlayer'
import { chillHover, chillPop, chillSpring, chillTap } from '../lib/motion'

// This layout only ever renders in chill mode (see ModeStage), so it reaches
// directly for the chill presets instead of going through useModeMotion.

function GamesCard() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? GAMES[selectedId] : null
  const GameComponent = selected?.component ?? null
  // MotionConfig's global reducedMotion="user" net (App.tsx) only freezes
  // transform/positional values (scale here), not opacity — this mount/exit
  // fade needs its own guard to be "effectively instant" for reduced motion.
  const reduceMotion = useReducedMotion()

  return (
    <section className="flex min-h-48 flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6">
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
              <h2 className="text-base font-semibold text-ink">{selected.label}</h2>
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
              <h2 className="text-base font-semibold text-ink">Games</h2>
              <p className="mt-1 text-sm text-ink-muted">Pick one to play.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {GAME_LIST.map((game) => (
                <motion.button
                  key={game.id}
                  type="button"
                  onClick={() => setSelectedId(game.id)}
                  whileHover={chillHover}
                  whileTap={chillTap}
                  transition={chillSpring}
                  className="flex flex-col items-start gap-1 rounded-xl border border-ink-muted/20 bg-white/60 p-4 text-left outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="text-sm font-medium text-ink">{game.label}</span>
                  <span className="text-xs text-ink-muted">{game.description}</span>
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
    <div className="grid gap-6 sm:grid-cols-2">
      <MusicPlayer />

      <GamesCard />
    </div>
  )
}
