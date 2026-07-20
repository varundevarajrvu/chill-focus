import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * First-visit intro/landing gate. `seen` flips to true the moment a visitor
 * picks a mode (or dismisses), and persists — so the intro is a genuine
 * once-per-device landing, not a splash that nags on every load. Returning
 * visitors go straight into their last mode with the intro never mounting.
 *
 * Kept as its own tiny store (not folded into modeStore) so the landing is a
 * clean slot-in/slot-out: deleting Landing.tsx + this file + the one AppShell
 * line fully removes the feature with zero effect on mode state. `reset()` is
 * a dev/QA affordance for re-triggering the intro from the console
 * (`useIntroStore.getState().reset()`), mirroring how the other stores expose
 * their own escape hatches.
 */
interface IntroState {
  seen: boolean
  dismiss: () => void
  reset: () => void
}

export const useIntroStore = create<IntroState>()(
  persist(
    (set) => ({
      seen: false,
      dismiss: () => set({ seen: true }),
      reset: () => set({ seen: false }),
    }),
    {
      name: 'cf-intro',
    },
  ),
)
