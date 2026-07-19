import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useTimerStore } from '../../stores/timerStore'
import { pickAppreciationVariant, type AppreciationVariant } from './pool'
import { fireConfettiBurst, fireGentleFirework } from './confetti'
import { GrowingPlant } from './GrowingPlant'
import { StarPulse } from './StarPulse'

const AUTO_DISMISS_MS = 4000

/**
 * Mounted once, globally, in AppShell — not FocusLayout — so a focus
 * completion still celebrates even if Chief has switched to Chill mid-
 * session (the timer keeps running via the module-level ticker either way).
 *
 * Fires only on a NEW focus-phase completion while the app is open. Break
 * completions get nothing. `lastCompletionAt` is intentionally not
 * persisted (see timerStore), so on mount/reload it's always null and this
 * effect can't misfire from stale state.
 */
export function AppreciationOverlay() {
  const lastCompletionAt = useTimerStore((s) => s.lastCompletionAt)
  const lastCompletedPhase = useTimerStore((s) => s.lastCompletedPhase)
  const [variant, setVariant] = useState<AppreciationVariant | null>(null)
  const processedRef = useRef<number | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (lastCompletionAt === null || lastCompletedPhase !== 'focus') return
    if (processedRef.current === lastCompletionAt) return
    processedRef.current = lastCompletionAt

    const chosen = pickAppreciationVariant()
    setVariant(chosen)

    if (!reducedMotion) {
      if (chosen.id === 'confetti-burst') fireConfettiBurst()
      if (chosen.id === 'gentle-firework') fireGentleFirework()
    }
  }, [lastCompletionAt, lastCompletedPhase, reducedMotion])

  useEffect(() => {
    if (!variant) return
    const timer = window.setTimeout(() => setVariant(null), AUTO_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [variant])

  useEffect(() => {
    if (!variant) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setVariant(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [variant])

  if (!variant) return null

  return (
    <div
      role="status"
      onClick={() => setVariant(null)}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/10 backdrop-blur-[1px] ${reducedMotion ? '' : 'appreciation-backdrop-fade'}`}
    >
      <div
        className={`flex flex-col items-center gap-4 rounded-2xl bg-surface px-8 py-6 shadow-lg ${reducedMotion ? '' : 'appreciation-card-fade'}`}
      >
        {!reducedMotion && variant.id === 'growing-plant' && <GrowingPlant />}
        {!reducedMotion && variant.id === 'star-pulse' && <StarPulse />}
        <p className="text-gradient font-display max-w-xs text-center text-xl font-semibold leading-snug sm:text-2xl">
          {variant.message}
        </p>
      </div>
    </div>
  )
}
