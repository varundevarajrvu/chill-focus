import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  allMatched,
  createDeck,
  isMatch,
  type MemoryCard,
} from './memoryMatchLogic'
import { ShapeIcon } from './shapeIcons'

const BEST_KEY = 'cf-memory-best'
// How long a non-matching pair stays face-up before flipping back. This is
// game pacing (time to memorize), not decorative motion — it stays fixed
// regardless of prefers-reduced-motion, which only governs the flip *animation*.
const MISMATCH_DELAY_MS = 800

function loadBest(): number | null {
  try {
    const raw = window.localStorage.getItem(BEST_KEY)
    if (!raw) return null
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    // localStorage can throw in some privacy modes — fail soft to "no best yet".
    return null
  }
}

function saveBest(moves: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(moves))
  } catch {
    // Ignore write failures — the session's own state still shows the result.
  }
}

export function MemoryMatch() {
  const [cards, setCards] = useState<MemoryCard[]>(() => createDeck())
  const [flipped, setFlipped] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState('New game — find all 8 pairs.')

  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefersReducedMotion = useReducedMotion() ?? false

  useEffect(() => {
    setBest(loadBest())
  }, [])

  // Cancel any pending "flip back" timer on unmount so it never fires against
  // a torn-down component (and doesn't leak across a New Game reshuffle).
  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current !== null) clearTimeout(mismatchTimerRef.current)
    }
  }, [])

  const won = allMatched(cards)

  const newGame = () => {
    if (mismatchTimerRef.current !== null) {
      clearTimeout(mismatchTimerRef.current)
      mismatchTimerRef.current = null
    }
    setCards(createDeck())
    setFlipped([])
    setMoves(0)
    setStatusMessage('New game — find all 8 pairs.')
  }

  const flipCard = (index: number) => {
    // Ignore clicks on matched cards, an already-flipped card, or while a
    // resolved pair (match or mismatch) is still settling.
    if (cards[index].matched || flipped.includes(index) || flipped.length === 2) return

    if (flipped.length === 0) {
      setFlipped([index])
      return
    }

    const nextFlipped = [flipped[0], index]
    setFlipped(nextFlipped)
    const nextMoves = moves + 1
    setMoves(nextMoves)

    const [i1, i2] = nextFlipped
    if (isMatch(cards[i1], cards[i2])) {
      const nextCards = cards.map((c, idx) =>
        idx === i1 || idx === i2 ? { ...c, matched: true } : c,
      )
      setCards(nextCards)
      setFlipped([])

      if (allMatched(nextCards)) {
        setStatusMessage(`Solved in ${nextMoves} moves!`)
        setBest((prevBest) => {
          const nextBest = prevBest === null ? nextMoves : Math.min(prevBest, nextMoves)
          saveBest(nextBest)
          return nextBest
        })
      } else {
        setStatusMessage(`Match: ${cards[i1].shape}.`)
      }
    } else {
      setStatusMessage('No match — flipping back.')
      mismatchTimerRef.current = setTimeout(() => {
        setFlipped([])
        mismatchTimerRef.current = null
      }, MISMATCH_DELAY_MS)
    }
  }

  const flipDurationMs = prefersReducedMotion ? 0 : 420

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full max-w-md items-center justify-between px-1 text-sm text-ink-muted">
        <span>
          Moves: <span className="font-medium text-ink">{moves}</span>
        </span>
        <span>
          Best: <span className="font-medium text-ink">{best !== null ? `${best} moves` : '—'}</span>
        </span>
      </div>

      <div
        role="group"
        aria-label="Memory match board"
        className="grid grid-cols-4 gap-2 sm:gap-3"
      >
        {cards.map((card, index) => {
          const faceUp = card.matched || flipped.includes(index)
          const disabled = card.matched || flipped.includes(index) || flipped.length === 2
          const label = faceUp ? `Card ${index + 1}, ${card.shape}` : `Card ${index + 1}, face down`

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flipCard(index)}
              disabled={disabled}
              aria-label={label}
              aria-pressed={faceUp}
              className="size-16 cursor-pointer rounded-xl outline-none [perspective:800px] focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default sm:size-20"
            >
              <span
                className="relative block size-full [transform-style:preserve-3d] rounded-xl"
                style={{
                  transform: faceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  transitionProperty: 'transform',
                  transitionDuration: `${flipDurationMs}ms`,
                  transitionTimingFunction: 'ease-out',
                }}
              >
                {/* Back face — same design on every card, shown face-down. */}
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-xl border border-ink-muted/20 bg-surface-raised [backface-visibility:hidden]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, color-mix(in oklch, var(--color-ink-muted) 14%, transparent) 0px, color-mix(in oklch, var(--color-ink-muted) 14%, transparent) 1px, transparent 1px, transparent 8px)',
                  }}
                >
                  <span className="size-2.5 rounded-full bg-accent/50" aria-hidden="true" />
                </span>

                {/* Front face — the shape, rotated 180° so it lands right-side-up
                    once the whole card has flipped. */}
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-xl border border-ink-muted/20 bg-white/60 [backface-visibility:hidden]"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  {card.matched || flipped.includes(index) ? <ShapeIcon shape={card.shape} /> : null}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>

      {won && (
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-accent-soft px-4 py-3 text-center">
          <p className="text-sm font-medium text-ink">Solved in {moves} moves.</p>
          {best !== null && <p className="text-xs text-ink-muted">Best: {best} moves</p>}
        </div>
      )}

      <button
        type="button"
        onClick={newGame}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      >
        New game
      </button>
    </div>
  )
}
