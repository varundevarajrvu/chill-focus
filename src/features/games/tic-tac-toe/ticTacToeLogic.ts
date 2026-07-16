// Pure Tic-Tac-Toe logic — no React, no DOM. Kept separate from the
// component so the win/draw/AI rules are independently testable and the
// component stays focused on rendering + interaction.

export type Player = 'X' | 'O'
export type Cell = Player | null
export type Board = Cell[] // length 9, row-major (index = row * 3 + col)

export const EMPTY_BOARD: Board = Array(9).fill(null)

// All winning triples, row-major indices.
const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

export interface WinResult {
  winner: Player
  line: readonly [number, number, number]
}

/** Returns the winner and the winning line, or null if nobody has won yet. */
export function calculateWinner(board: Board): WinResult | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    const value = board[a]
    if (value && value === board[b] && value === board[c]) {
      return { winner: value, line }
    }
  }
  return null
}

/** Board is full and nobody won — a draw. */
export function isDraw(board: Board): boolean {
  return board.every((cell) => cell !== null) && calculateWinner(board) === null
}

export function otherPlayer(player: Player): Player {
  return player === 'X' ? 'O' : 'X'
}

function emptyIndices(board: Board): number[] {
  const indices: number[] = []
  board.forEach((cell, i) => {
    if (cell === null) indices.push(i)
  })
  return indices
}

/**
 * If `player` has a move available that wins immediately, return its index.
 * Tries each empty cell, plays it hypothetically, checks for a win.
 */
function findWinningMove(board: Board, player: Player): number | null {
  for (const i of emptyIndices(board)) {
    const next = board.slice()
    next[i] = player
    if (calculateWinner(next)?.winner === player) return i
  }
  return null
}

const CENTER = 4
const CORNERS = [0, 2, 6, 8]

/**
 * Simple rule-based AI (spec: not minimax). Priority order:
 * 1. Take a winning move.
 * 2. Block the opponent's winning move.
 * 3. Take the center.
 * 4. Take a corner.
 * 5. Random remaining cell.
 */
export function getAiMove(board: Board, aiPlayer: Player): number | null {
  const empty = emptyIndices(board)
  if (empty.length === 0) return null

  const winning = findWinningMove(board, aiPlayer)
  if (winning !== null) return winning

  const blocking = findWinningMove(board, otherPlayer(aiPlayer))
  if (blocking !== null) return blocking

  if (board[CENTER] === null) return CENTER

  const openCorners = CORNERS.filter((i) => board[i] === null)
  if (openCorners.length > 0) {
    return openCorners[Math.floor(Math.random() * openCorners.length)]
  }

  return empty[Math.floor(Math.random() * empty.length)]
}
