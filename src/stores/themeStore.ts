import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

/**
 * Default (nothing persisted yet) follows the OS-level color-scheme
 * preference at first load. Once the user explicitly toggles, the persisted
 * choice always wins over the media query on subsequent loads — this getter
 * only ever runs once, as the store's initial state, not on every render.
 *
 * Guarded for non-browser environments (SSR/tests) — matchMedia may not
 * exist, in which case light is the safe fallback.
 */
function prefersDarkByDefault(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: prefersDarkByDefault() ? 'dark' : 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'cf-theme',
    },
  ),
)
