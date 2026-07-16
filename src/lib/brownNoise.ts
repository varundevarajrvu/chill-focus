/**
 * True Brown Noise, synthesized live via Web Audio — no file, no licensing
 * risk (master-prompt Section 5.2: "the one genuinely called 'brown' in
 * audio terms").
 *
 * Algorithm: a leaky-integrated ("random walk") white noise generator —
 * the standard brown-noise recipe. To loop it click-free with a plain
 * AudioBufferSourceNode(loop=true), the buffer is linearly detrended so its
 * last sample lands exactly on its first sample's value: the walk is
 * small-amplitude and already mean-reverting, so nudging it back to its
 * start point is inaudible in the noise texture but removes the
 * wrap-around discontinuity that would otherwise click on every loop.
 */

const DEFAULT_DURATION_SEC = 8
/** Leak coefficient for the integrator — standard brown-noise constant. */
const LEAK = 0.02
const DENOM = 1 + LEAK
/** Target peak amplitude after normalization — headroom, no clipping. */
const TARGET_PEAK = 0.7

export function createBrownNoiseBuffer(
  context: BaseAudioContext,
  durationSec = DEFAULT_DURATION_SEC,
): AudioBuffer {
  const sampleRate = context.sampleRate
  const length = Math.max(2, Math.floor(durationSec * sampleRate))
  const walk = new Float32Array(length)

  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + LEAK * white) / DENOM
    walk[i] = lastOut
  }

  // Detrend: subtract a ramp from 0 (at i=0) to the end-start gap (at the
  // last sample) so walk[length-1] === walk[0] exactly.
  const startVal = walk[0]
  const endDrift = walk[length - 1] - startVal
  let maxAbs = 0
  for (let i = 0; i < length; i++) {
    walk[i] -= (i / (length - 1)) * endDrift
    const abs = Math.abs(walk[i])
    if (abs > maxAbs) maxAbs = abs
  }

  const gain = maxAbs > 0 ? TARGET_PEAK / maxAbs : 1
  const buffer = context.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = walk[i] * gain
  }
  return buffer
}

/**
 * Owns a single AudioContext + looping AudioBufferSourceNode → GainNode →
 * destination graph. The context is created (and resumed) lazily, only
 * from start() — which is only ever called synchronously from a user
 * gesture (a click, via the audio store/manager) — so it never trips
 * autoplay-policy blocks.
 */
export class BrownNoiseEngine {
  private context: AudioContext | null = null
  private source: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null

  get isRunning(): boolean {
    return this.source !== null
  }

  start(volume: number): void {
    if (this.source) return // already running — no-op, not a restart

    if (!this.context) {
      const AudioContextCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.context = new AudioContextCtor()
    }
    if (this.context.state === 'suspended') {
      void this.context.resume()
    }

    const buffer = createBrownNoiseBuffer(this.context)
    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.loop = true

    const gainNode = this.context.createGain()
    gainNode.gain.value = volume

    source.connect(gainNode)
    gainNode.connect(this.context.destination)
    source.start()

    this.source = source
    this.gainNode = gainNode
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop()
      } catch {
        // Already stopped — nothing to clean up beyond disconnect below.
      }
      this.source.disconnect()
      this.source = null
    }
    if (this.gainNode) {
      this.gainNode.disconnect()
      this.gainNode = null
    }
  }

  setVolume(volume: number): void {
    if (this.gainNode && this.context) {
      this.gainNode.gain.setTargetAtTime(volume, this.context.currentTime, 0.02)
    }
  }
}

/** Single shared instance — the audio manager owns exactly one at a time. */
export const brownNoiseEngine = new BrownNoiseEngine()
