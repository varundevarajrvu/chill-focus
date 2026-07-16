import { useEffect, useState } from 'react'
import {
  EMPTY_BOARD,
  calculateWinner,
  getAiMove,
  isDraw,
  type Board,
  type Player,
} from './ticTacToeLogic'

type GameMode = 'two-player' | 'vs-ai'

const AI_PLAYER: Player = 'O'
// Brief pause before the AI replies so its move reads as a "turn" rather
// than an instant snap-back.
const AI_MOVE_DELAY_MS = 300

function currentTurn(board: Board): Player {
  const xCount = board.filter((c) => c === 'X').length
  const oCount = board.filter((c) => c === 'O').length
  // X always moves first, so equal counts means it's X's turn.
  return xCount === oCount ? 'X' : 'O'
}

function cellLabel(index: number, value: Board[number]): string {
  const row = Math.floor(index / 3) + 1
  const col = (index % 3) + 1
  return `Row ${row} Column ${col}, ${value ?? 'empty'}`
}

export function TicTacToe() {
  const [mode, setMode] = useState<GameMode>('two-player')
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)

  const turn = currentTurn(board)
  const result = calculateWinner(board)
  const draw = !result && isDraw(board)
  const gameOver = result !== null || draw
  const aiTurn = mode === 'vs-ai' && turn === AI_PLAYER && !gameOver

  const status = result ? `${result.winner} wins` : draw ? 'Draw' : `${turn}'s turn`

  const newGame = () => setBoard(EMPTY_BOARD)

  const play = (index: number) => {
    if (gameOver || board[index] !== null || aiTurn) return
    const next = board.slice()
    next[index] = turn
    setBoard(next)
  }

  // AI's move, delayed so it feels like a turn instead of an instant snap.
  useEffect(() => {
    if (!aiTurn) return
    const timer = setTimeout(() => {
      setBoard((prev) => {
        if (calculateWinner(prev) || isDraw(prev)) return prev
        const move = getAiMove(prev, AI_PLAYER)
        if (move === null) return prev
        const next = prev.slice()
        next[move] = AI_PLAYER
        return next
      })
    }, AI_MOVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [aiTurn, board])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="group"
        aria-label="Game mode"
        className="inline-flex items-center gap-1 rounded-full border border-ink-muted/15 bg-surface p-1"
      >
        {(
          [
            { mode: 'two-player' as const, label: '2 Player' },
            { mode: 'vs-ai' as const, label: 'vs AI' },
          ]
        ).map((option) => {
          const active = mode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setMode(option.mode)
                setBoard(EMPTY_BOARD)
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                active ? 'bg-accent text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <p className="text-sm font-medium text-ink" role="status" aria-live="polite">
        {status}
      </p>

      <div className="grid grid-cols-3 gap-2" role="grid" aria-label="Tic-tac-toe board">
        {board.map((value, index) => {
          const onWinningLine = result?.line.includes(index) ?? false
          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              onClick={() => play(index)}
              disabled={gameOver || value !== null || aiTurn}
              aria-label={cellLabel(index, value)}
              className={`flex size-16 items-center justify-center rounded-xl border text-2xl font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed sm:size-20 ${
                onWinningLine
                  ? 'border-accent bg-accent-soft text-ink'
                  : 'border-ink-muted/20 bg-white/60 text-ink hover:enabled:border-accent/50'
              }`}
            >
              {value}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={newGame}
        className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      >
        New game
      </button>
    </div>
  )
}
