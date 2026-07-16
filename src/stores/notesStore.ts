import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotesState {
  text: string
  setText: (text: string) => void
}

// One persistent scratchpad (Section 5.2 "Notes"). Plain string, no
// multi-note system. zustand persist writes to localStorage synchronously
// on every set(), so this IS the autosave — no separate debounce needed.
export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      text: '',
      setText: (text) => set({ text }),
    }),
    {
      name: 'cf-notes',
    },
  ),
)
