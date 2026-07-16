// Pure(ish) Dino Runner engine — physics, collision, scoring formulas live
// here so they're separable from the canvas/React glue in DinoRunner.tsx.
// `stepGame` takes an explicit rng so obstacle spawning stays swappable/
// testable even though the game itself doesn't need determinism.

// Logical coordinate space the game is authored in — DinoRunner.tsx maps
// this onto whatever CSS pixel size + devicePixelRatio the canvas actually
// renders at, so these numbers never need to know about real screen size.
export const GAME_WIDTH = 800
export const GAME_HEIGHT = 300
export const GROUND_Y = 250

export const PLAYER_X = 60
export const PLAYER_SIZE = 32

const GRAVITY = 2200 // px/s^2
const JUMP_VELOCITY = -720 // px/s
const INITIAL_SPEED = 260 // px/s
const MAX_SPEED = 720 // px/s
const SPEED_RAMP_PER_SEC = 4 // px/s gained per second, gradual difficulty ramp
const SCORE_PER_PX = 0.1

export interface PlayerState {
  y: number
  vy: number
  onGround: boolean
}

export interface Obstacle {
  x: number
  y: number
  width: number
  height: number
}

export interface GameState {
  player: PlayerState
  obstacles: Obstacle[]
  speed: number
  distance: number
  elapsed: number
  spawnTimer: number
  nextSpawnIn: number
  gameOver: boolean
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

function randomSpawnInterval(rng: () => number): number {
  return 0.9 + rng() * 1.1 // seconds between obstacles
}

export function createInitialState(rng: () => number = Math.random): GameState {
  return {
    player: { y: GROUND_Y - PLAYER_SIZE, vy: 0, onGround: true },
    obstacles: [],
    speed: INITIAL_SPEED,
    distance: 0,
    elapsed: 0,
    spawnTimer: 0,
    nextSpawnIn: randomSpawnInterval(rng),
    gameOver: false,
  }
}

export function playerRect(state: GameState): Rect {
  return { x: PLAYER_X, y: state.player.y, width: PLAYER_SIZE, height: PLAYER_SIZE }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

export function checkCollision(state: GameState): boolean {
  const player = playerRect(state)
  return state.obstacles.some((o) => rectsOverlap(player, o))
}

/** Score is a deterministic function of distance travelled — no separate counter to drift out of sync. */
export function scoreForDistance(distance: number): number {
  return Math.floor(distance * SCORE_PER_PX)
}

/** Only takes effect when grounded (no double-jump) — no-op otherwise. */
export function requestJump(state: GameState): GameState {
  if (!state.player.onGround || state.gameOver) return state
  return { ...state, player: { ...state.player, vy: JUMP_VELOCITY, onGround: false } }
}

/**
 * Advances the simulation by `dt` seconds (delta-time, not frame-count, so
 * physics stays framerate-independent). Returns a new state; the caller
 * decides what to do once `gameOver` flips true (this function keeps
 * ticking obstacles/physics right up to and including the colliding frame,
 * it just stops being useful to step further after that).
 */
export function stepGame(state: GameState, dt: number, rng: () => number = Math.random): GameState {
  if (state.gameOver) return state

  let { y, vy, onGround } = state.player
  vy += GRAVITY * dt
  y += vy * dt
  if (y >= GROUND_Y - PLAYER_SIZE) {
    y = GROUND_Y - PLAYER_SIZE
    vy = 0
    onGround = true
  }

  const speed = Math.min(MAX_SPEED, state.speed + SPEED_RAMP_PER_SEC * dt)
  const distance = state.distance + speed * dt
  const elapsed = state.elapsed + dt

  let obstacles = state.obstacles
    .map((o) => ({ ...o, x: o.x - speed * dt }))
    .filter((o) => o.x + o.width > -10)

  let spawnTimer = state.spawnTimer + dt
  let nextSpawnIn = state.nextSpawnIn
  if (spawnTimer >= nextSpawnIn) {
    spawnTimer = 0
    nextSpawnIn = randomSpawnInterval(rng)
    const height = 24 + Math.floor(rng() * 24) // 24-48px, varies obstacle silhouette
    const width = 16 + Math.floor(rng() * 16) // 16-32px
    obstacles = [...obstacles, { x: GAME_WIDTH + width, y: GROUND_Y - height, width, height }]
  }

  const next: GameState = {
    player: { y, vy, onGround },
    obstacles,
    speed,
    distance,
    elapsed,
    spawnTimer,
    nextSpawnIn,
    gameOver: false,
  }

  next.gameOver = checkCollision(next)
  return next
}
