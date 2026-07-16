export type AppreciationVariantId = 'confetti-burst' | 'gentle-firework' | 'growing-plant' | 'star-pulse'

export interface AppreciationVariant {
  id: AppreciationVariantId
  message: string
}

// Exact spec copy (Section 5.2) — do not editorialize.
export const APPRECIATION_VARIANTS: AppreciationVariant[] = [
  { id: 'confetti-burst', message: 'Session banked.' },
  { id: 'gentle-firework', message: "That's real focus time. Logged." },
  { id: 'growing-plant', message: 'Small reps, real growth.' },
  { id: 'star-pulse', message: 'Done. On to the next one.' },
]

// In-memory only, module-level — forgetting the last-shown variant across a
// reload is fine per spec, so this is intentionally not part of any store or
// persisted state.
let lastShownId: AppreciationVariantId | null = null

/** Uniform random pick from the pool, excluding whichever variant fired last. */
export function pickAppreciationVariant(): AppreciationVariant {
  const candidates = lastShownId
    ? APPRECIATION_VARIANTS.filter((v) => v.id !== lastShownId)
    : APPRECIATION_VARIANTS
  const chosen = candidates[Math.floor(Math.random() * candidates.length)]
  lastShownId = chosen.id
  return chosen
}
