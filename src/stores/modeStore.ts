import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Mode = 'chill' | 'focus'

interface ModeState {
  mode: Mode
  setMode: (mode: Mode) => void
  toggleMode: () => void
}

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      mode: 'chill',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'chill' ? 'focus' : 'chill' }),
    }),
    {
      name: 'cf-mode',
    },
  ),
)
