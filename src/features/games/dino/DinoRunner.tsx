import { useEffect, useRef, useState } from 'react'
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GROUND_Y,
  PLAYER_SIZE,
  PLAYER_X,
  createInitialState,
  requestJump,
  scoreForDistance,
  stepGame,
  type GameState,
} from './dino'

const HIGH_SCORE_KEY = 'cf-dino-highscore'

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

function draw(ctx: CanvasRenderingContext2D, state: GameState, phase: Phase) {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

  const accent = readColor('--color-accent', '#c97b3d')
  const ink = readColor('--color-ink', '#4a4038')
  const inkMuted = readColor('--color-ink-muted', '#8a8078')

  // Ground line.
  ctx.strokeStyle = inkMuted
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y + 0.5)
  ctx.lineTo(GAME_WIDTH, GROUND_Y + 0.5)
  ctx.stroke()

  // Obstacles.
  ctx.fillStyle = ink
  for (const o of state.obstacles) {
    ctx.fillRect(o.x, o.y, o.width, o.height)
  }

  // Player — simple rounded square, charm over fidelity.
  const radius = 6
  const px = PLAYER_X
  const py = state.player.y
  ctx.fillStyle = phase === 'game-over' ? inkMuted : accent
  ctx.beginPath()
  ctx.moveTo(px + radius, py)
  ctx.arcTo(px + PLAYER_SIZE, py, px + PLAYER_SIZE, py + PLAYER_SIZE, radius)
  ctx.arcTo(px + PLAYER_SIZE, py + PLAYER_SIZE, px, py + PLAYER_SIZE, radius)
  ctx.arcTo(px, py + PLAYER_SIZE, px, py, radius)
  ctx.arcTo(px, py, px + PLAYER_SIZE, py, radius)
  ctx.closePath()
  ctx.fill()
}

export function DinoRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const gameStateRef = useRef<GameState>(createInitialState())
  const phaseRef = useRef<Phase>('ready')
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
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

  const start = () => {
    gameStateRef.current = createInitialState()
    lastTimeRef.current = null
    scoreRef.current = 0
    setScore(0)
    setPhase('running')
  }

  const handleAction = () => {
    if (phaseRef.current === 'ready') {
      start()
    } else if (phaseRef.current === 'running') {
      gameStateRef.current = requestJump(gameStateRef.current)
    } else if (phaseRef.current === 'game-over') {
      // Convenience: same input that jumps also restarts once the run has
      // ended, matching the genre convention (Chrome's offline dino does
      // this too). Not explicitly required by spec — the Restart button
      // below covers the requirement on its own.
      start()
    }
  }

  // rAF loop — always mounted while the component is, so it can keep
  // redrawing the ready/game-over frames too. Only steps physics while
  // phase === 'running' and the tab is visible.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = time

      if (phaseRef.current === 'running' && !pausedRef.current) {
        const next = stepGame(gameStateRef.current, dt)
        gameStateRef.current = next

        const newScore = scoreForDistance(next.distance)
        if (newScore !== scoreRef.current) {
          scoreRef.current = newScore
          setScore(newScore)
        }

        if (next.gameOver) {
          setPhase('game-over')
          setHighScore((prevHigh) => {
            const nextHigh = Math.max(prevHigh, newScore)
            try {
              window.localStorage.setItem(HIGH_SCORE_KEY, String(nextHigh))
            } catch {
              // Ignore write failures (e.g. storage disabled) — score still
              // shows for this session even if it can't persist.
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
  // so the next visible frame doesn't see a multi-second jump.
  useEffect(() => {
    const onVisibilityChange = () => {
      pausedRef.current = document.hidden
      if (!document.hidden) lastTimeRef.current = null
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Keyboard controls — Space / ArrowUp jump (or start/restart depending on
  // phase). Listens on window so focus doesn't have to be on the canvas
  // itself, but only while this component is mounted.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        handleAction()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Responsive canvas sizing with devicePixelRatio for crisp rendering.
  // Internal drawing commands stay in the fixed GAME_WIDTH x GAME_HEIGHT
  // logical space; this only changes the backing buffer resolution and the
  // scale factor applied before each draw.
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
      ? 'Press Space to start'
      : phase === 'running'
        ? `Score: ${score}`
        : `Game over — Score: ${score}, High score: ${highScore}`

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between px-1 text-sm text-ink-muted">
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
        onClick={handleAction}
        onTouchStart={(e) => {
          e.preventDefault()
          handleAction()
        }}
        role="button"
        aria-label="Dino runner game. Press space, tap, or click to jump."
        className="relative w-full max-w-2xl cursor-pointer overflow-hidden rounded-2xl border border-ink-muted/20 bg-white/60 outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <canvas ref={canvasRef} aria-hidden="true" />

        {phase === 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/40 text-sm font-medium text-ink">
            Press Space to start
          </div>
        )}

        {phase === 'game-over' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface/70 text-center">
            <p className="text-sm font-medium text-ink">Game over</p>
            <p className="text-xs text-ink-muted">
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
          onClick={start}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        >
          Restart
        </button>
      )}
    </div>
  )
}
