import { useEffect, useRef, useState } from 'react'
import {
  CELL,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRID_HEIGHT,
  GRID_WIDTH,
  createInitialState,
  isOpposite,
  setDirection,
  step,
  type Direction,
  type SnakeState,
} from './snake'

const HIGH_SCORE_KEY = 'cf-snake-highscore'
// Physics dt is clamped like Dino's — caps the worst-case step after a stall
// (e.g. a slow frame or coming back from a background tab) so the game
// never "catches up" by simulating several steps at once in a visible jump.
const MAX_DT = 0.05

type Phase = 'ready' | 'running' | 'game-over'

function loadHighScore(): number {
  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_KEY)
    const parsed = raw ? Number.parseInt(raw, 10) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    // localStorage can throw in some privacy modes — fail soft to 0.
    return 0
  }
}

function readColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return value || fallback
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function draw(ctx: CanvasRenderingContext2D, state: SnakeState, phase: Phase) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const accent = readColor('--color-accent', '#c97b3d')
  const ink = readColor('--color-ink', '#4a4038')
  const inkMuted = readColor('--color-ink-muted', '#8a8078')

  // Faint grid, echoes the shared paper-grid background.
  ctx.strokeStyle = inkMuted
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.1
  for (let x = 0; x <= GRID_WIDTH; x++) {
    ctx.beginPath()
    ctx.moveTo(x * CELL + 0.5, 0)
    ctx.lineTo(x * CELL + 0.5, GAME_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y <= GRID_HEIGHT; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * CELL + 0.5)
    ctx.lineTo(GAME_WIDTH, y * CELL + 0.5)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // Food.
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.arc(
    state.food.x * CELL + CELL / 2,
    state.food.y * CELL + CELL / 2,
    CELL * 0.32,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  // Snake — flat accent color while running, muted once the run has ended.
  const bodyColor = phase === 'game-over' ? inkMuted : accent
  const pad = 2
  ctx.fillStyle = bodyColor
  for (const segment of state.snake) {
    roundRect(ctx, segment.x * CELL + pad, segment.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4)
    ctx.fill()
  }

  // Eye on the head, just for orientation charm.
  if (state.snake.length > 0 && phase !== 'game-over') {
    const head = state.snake[0]
    ctx.fillStyle = readColor('--color-surface', '#faf9f4')
    ctx.beginPath()
    ctx.arc(head.x * CELL + CELL / 2, head.y * CELL + CELL / 2, CELL * 0.09, 0, Math.PI * 2)
    ctx.fill()
  }
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const gameStateRef = useRef<SnakeState>(createInitialState())
  const phaseRef = useRef<Phase>('ready')
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const accumulatorRef = useRef(0)
  const pausedRef = useRef(false)
  const scoreRef = useRef(0)

  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    setHighScore(loadHighScore())
  }, [])

  const start = (initialDirection: Direction = 'right') => {
    const state = createInitialState()
    // Guard against an immediate reversal if the very first input that
    // starts the game is the opposite of the snake's initial 'right' facing.
    const direction = isOpposite(initialDirection, state.direction) ? state.direction : initialDirection
    gameStateRef.current = { ...state, direction, pendingDirection: direction }
    lastTimeRef.current = null
    accumulatorRef.current = 0
    scoreRef.current = 0
    setScore(0)
    setPhase('running')
  }

  const handleDirection = (dir: Direction) => {
    if (phaseRef.current === 'ready') {
      start(dir)
    } else if (phaseRef.current === 'running') {
      gameStateRef.current = setDirection(gameStateRef.current, dir)
    }
    // Ignore direction input during 'game-over' — the Restart button is the
    // explicit, discoverable way back in.
  }

  // rAF loop — mounted for the component's whole lifetime so it can keep
  // redrawing ready/game-over frames too. Steps the simulation with a fixed
  // tick interval via an accumulator, so speed stays framerate-independent
  // and consistent across displays.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time
      const dt = Math.min((time - lastTimeRef.current) / 1000, MAX_DT)
      lastTimeRef.current = time

      if (phaseRef.current === 'running' && !pausedRef.current) {
        accumulatorRef.current += dt

        while (
          accumulatorRef.current >= gameStateRef.current.tickInterval &&
          !gameStateRef.current.gameOver
        ) {
          accumulatorRef.current -= gameStateRef.current.tickInterval
          gameStateRef.current = step(gameStateRef.current)
        }

        const newScore = gameStateRef.current.score
        if (newScore !== scoreRef.current) {
          scoreRef.current = newScore
          setScore(newScore)
        }

        if (gameStateRef.current.gameOver) {
          accumulatorRef.current = 0
          setPhase('game-over')
          setHighScore((prevHigh) => {
            const nextHigh = Math.max(prevHigh, newScore)
            try {
              window.localStorage.setItem(HIGH_SCORE_KEY, String(nextHigh))
            } catch {
              // Ignore write failures — score still shows for this session.
            }
            return nextHigh
          })
        }
      }

      draw(ctx, gameStateRef.current, phaseRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Pause physics while the tab is hidden; resume with a fresh dt baseline
  // and a cleared accumulator so the next visible frame doesn't see a
  // multi-step jump.
  useEffect(() => {
    const onVisibilityChange = () => {
      pausedRef.current = document.hidden
      if (!document.hidden) {
        lastTimeRef.current = null
        accumulatorRef.current = 0
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Keyboard controls — arrow keys or WASD. Listens on window so focus
  // doesn't strictly have to be on the canvas, but only while mounted.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIRECTION[e.code]
      if (!dir) return
      e.preventDefault()
      handleDirection(dir)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Responsive canvas sizing with devicePixelRatio for crisp rendering.
  // Internal drawing stays in the fixed GAME_WIDTH x GAME_HEIGHT logical
  // space; this only changes the backing buffer resolution + scale factor.
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const cssWidth = container.clientWidth || GAME_WIDTH
      const cssHeight = cssWidth * (GAME_HEIGHT / GAME_WIDTH)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      canvas.width = Math.round(cssWidth * dpr)
      canvas.height = Math.round(cssHeight * dpr)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale((cssWidth * dpr) / GAME_WIDTH, (cssHeight * dpr) / GAME_HEIGHT)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Keyboard works without clicking first.
  useEffect(() => {
    containerRef.current?.focus()
  }, [])

  const statusText =
    phase === 'ready'
      ? 'Press an arrow key to start'
      : phase === 'running'
        ? `Score: ${score}`
        : `Game over — Score: ${score}, High score: ${highScore}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="font-numeric flex w-full items-center justify-between px-1 text-sm text-ink-muted">
        <span>
          Score: <span className="font-medium text-ink">{score}</span>
        </span>
        <span>
          High score: <span className="font-medium text-ink">{highScore}</span>
        </span>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        role="application"
        aria-label="Snake game. Use the arrow keys or WASD to steer."
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-muted/20 bg-white/60 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <canvas ref={canvasRef} aria-hidden="true" />

        {phase === 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/40 text-center text-sm font-medium text-ink">
            Press an arrow key to start
          </div>
        )}

        {phase === 'game-over' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/70 text-center">
            <p className="text-sm font-medium text-ink">Game over</p>
            <p className="font-numeric text-xs text-ink-muted">
              Score: {score} · High score: {highScore}
            </p>
          </div>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {statusText}
      </p>

      {phase === 'game-over' && (
        <button
          type="button"
          onClick={() => start()}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          Restart
        </button>
      )}

      {/* Touch d-pad — arrow keys/WASD aren't available on mobile. 44px+
          targets per WCAG target-size guidance. */}
      <div className="grid grid-cols-3 grid-rows-2 gap-1.5" aria-hidden={false}>
        <div />
        <button
          type="button"
          aria-label="Move up"
          onClick={() => handleDirection('up')}
          className="flex size-11 items-center justify-center rounded-lg border border-ink-muted/20 bg-white/60 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-accent-soft"
        >
          <ArrowGlyph rotation={0} />
        </button>
        <div />

        <button
          type="button"
          aria-label="Move left"
          onClick={() => handleDirection('left')}
          className="flex size-11 items-center justify-center rounded-lg border border-ink-muted/20 bg-white/60 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-accent-soft"
        >
          <ArrowGlyph rotation={-90} />
        </button>
        <button
          type="button"
          aria-label="Move down"
          onClick={() => handleDirection('down')}
          className="flex size-11 items-center justify-center rounded-lg border border-ink-muted/20 bg-white/60 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-accent-soft"
        >
          <ArrowGlyph rotation={180} />
        </button>
        <button
          type="button"
          aria-label="Move right"
          onClick={() => handleDirection('right')}
          className="flex size-11 items-center justify-center rounded-lg border border-ink-muted/20 bg-white/60 text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent active:bg-accent-soft"
        >
          <ArrowGlyph rotation={90} />
        </button>
      </div>
    </div>
  )
}

function ArrowGlyph({ rotation }: { rotation: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="currentColor"
      aria-hidden="true"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <polygon points="12,4 20,16 14,16 14,20 10,20 10,16 4,16" />
    </svg>
  )
}
