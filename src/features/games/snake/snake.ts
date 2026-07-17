// Pure Snake engine — grid movement, collision, food spawning, and the
// speed-ramp formula live here so they're independently testable and
// separated from the canvas/React glue in SnakeGame.tsx (same split as
// dino/dino.ts).

export const GRID_WIDTH = 20
export const GRID_HEIGHT = 14
export const CELL = 20
export const GAME_WIDTH = GRID_WIDTH * CELL
export const GAME_HEIGHT = GRID_HEIGHT * CELL

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Point {
  x: number
  y: number
}

export interface SnakeState {
  snake: Point[] // head first
  direction: Direction
  pendingDirection: Direction
  food: Point
  gameOver: boolean
  score: number
  tickInterval: number // seconds per grid-step; shrinks (gently) as score grows
}

const INITIAL_TICK = 0.16 // seconds per step (~6.25 steps/sec)
const MIN_TICK = 0.07 // fastest the game ever gets
const TICK_DECREASE_PER_FOOD = 0.006

const DIRECTION_DELTA: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === 'up' && b === 'down') ||
    (a === 'down' && b === 'up') ||
    (a === 'left' && b === 'right') ||
    (a === 'right' && b === 'left')
  )
}

/** Picks a free cell for food — never lands on the snake. */
export function spawnFood(snake: readonly Point[], rng: () => number = Math.random): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const free: Point[] = []
  for (let x = 0; x < GRID_WIDTH; x++) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  // Board full (snake fills every cell) — nowhere left to spawn; caller's
  // next collision check will end the run regardless.
  if (free.length === 0) return snake[0]
  return free[Math.floor(rng() * free.length)]
}

export function createInitialState(rng: () => number = Math.random): SnakeState {
  const startX = Math.floor(GRID_WIDTH / 2)
  const startY = Math.floor(GRID_HEIGHT / 2)
  const snake: Point[] = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ]
  return {
    snake,
    direction: 'right',
    pendingDirection: 'right',
    food: spawnFood(snake, rng),
    gameOver: false,
    score: 0,
    tickInterval: INITIAL_TICK,
  }
}

/**
 * Queues a direction change. Compares against `pendingDirection` (not the
 * currently-active `direction`) so two quick key presses within the same
 * tick can't queue an immediate reversal into the snake's own neck.
 */
export function setDirection(state: SnakeState, dir: Direction): SnakeState {
  if (state.gameOver) return state
  if (isOpposite(dir, state.pendingDirection)) return state
  return { ...state, pendingDirection: dir }
}

/** Advances the simulation by exactly one grid step. */
export function step(state: SnakeState, rng: () => number = Math.random): SnakeState {
  if (state.gameOver) return state

  const direction = state.pendingDirection
  const delta = DIRECTION_DELTA[direction]
  const head = state.snake[0]
  const newHead: Point = { x: head.x + delta.x, y: head.y + delta.y }

  if (newHead.x < 0 || newHead.x >= GRID_WIDTH || newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
    return { ...state, direction, pendingDirection: direction, gameOver: true }
  }

  const ateFood = newHead.x === state.food.x && newHead.y === state.food.y
  // When not growing, the tail cell vacates this same step, so colliding
  // with it isn't actually a collision. When growing, the tail stays put.
  const bodyToCheck = ateFood ? state.snake : state.snake.slice(0, -1)
  if (bodyToCheck.some((p) => p.x === newHead.x && p.y === newHead.y)) {
    return { ...state, direction, pendingDirection: direction, gameOver: true }
  }

  const newSnake = [newHead, ...state.snake]
  if (!ateFood) newSnake.pop()

  const score = ateFood ? state.score + 1 : state.score
  const tickInterval = ateFood
    ? Math.max(MIN_TICK, state.tickInterval - TICK_DECREASE_PER_FOOD)
    : state.tickInterval
  const food = ateFood ? spawnFood(newSnake, rng) : state.food

  return {
    snake: newSnake,
    direction,
    pendingDirection: direction,
    food,
    gameOver: false,
    score,
    tickInterval,
  }
}
