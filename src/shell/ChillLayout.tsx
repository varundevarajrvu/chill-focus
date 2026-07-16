import { useState } from 'react'
import { GAME_LIST, GAMES } from '../features/games'
import { MusicPlayer } from '../features/music/MusicPlayer'

function GamesCard() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? GAMES[selectedId] : null

  if (selected) {
    const GameComponent = selected.component
    return (
      <section className="flex min-h-48 flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">{selected.label}</h2>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="rounded-full px-3 py-1 text-xs font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
          >
            ← Back
          </button>
        </div>
        <GameComponent />
      </section>
    )
  }

  return (
    <section className="flex min-h-48 flex-col gap-4 rounded-2xl border border-accent/30 bg-surface p-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Games</h2>
        <p className="mt-1 text-sm text-ink-muted">Pick one to play.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {GAME_LIST.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => setSelectedId(game.id)}
            className="flex flex-col items-start gap-1 rounded-xl border border-ink-muted/20 bg-white/60 p-4 text-left outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="text-sm font-medium text-ink">{game.label}</span>
            <span className="text-xs text-ink-muted">{game.description}</span>
          </button>
        ))}
      </div>
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
