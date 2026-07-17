// Pure Memory Match logic — no React, no DOM. Shuffle, deck construction,
// and match evaluation live here so they're independently testable and the
// component stays focused on rendering + interaction (same split as
// tic-tac-toe/ticTacToeLogic.ts and dino/dino.ts).

export type Shape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'star'
  | 'moon'
  | 'heart'
  | 'diamond'
  | 'bolt'

// 8 distinct shapes — matching is shape-based (not color-based) so the game
// stays colorblind-safe by construction.
export const SHAPES: readonly Shape[] = [
  'circle',
  'square',
  'triangle',
  'star',
  'moon',
  'heart',
  'diamond',
  'bolt',
]

export interface MemoryCard {
  id: number
  shape: Shape
  matched: boolean
}

/** Fisher–Yates shuffle. Takes an explicit rng so it stays swappable/testable. */
export function fisherYatesShuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 8 pairs (16 cards), shuffled. `id` is the card's stable identity for React keys. */
export function createDeck(rng: () => number = Math.random): MemoryCard[] {
  const pairs = [...SHAPES, ...SHAPES]
  const shuffled = fisherYatesShuffle(pairs, rng)
  return shuffled.map((shape, index) => ({ id: index, shape, matched: false }))
}

export function isMatch(a: MemoryCard, b: MemoryCard): boolean {
  return a.shape === b.shape
}

export function allMatched(cards: readonly MemoryCard[]): boolean {
  return cards.every((c) => c.matched)
}
