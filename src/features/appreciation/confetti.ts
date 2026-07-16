import confetti from 'canvas-confetti'

/** Confetti burst — punchy, upward, lots of particles. */
export function fireConfettiBurst() {
  confetti({
    particleCount: 120,
    spread: 70,
    startVelocity: 45,
    gravity: 1,
    origin: { y: 0.6 },
  })
}

/**
 * Gentle firework — visually distinct from the burst: far fewer particles,
 * slower gravity so they drift rather than fall, smaller scalar.
 */
export function fireGentleFirework() {
  confetti({
    particleCount: 28,
    spread: 100,
    startVelocity: 18,
    gravity: 0.35,
    decay: 0.94,
    scalar: 0.8,
    ticks: 220,
    origin: { y: 0.5 },
  })
}
