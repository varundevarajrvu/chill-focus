import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: number
}

interface TodoState {
  items: TodoItem[]
  /** Trims whitespace and refuses empty text (no-op). Appends to the end. */
  add: (text: string) => void
  toggle: (id: string) => void
  remove: (id: string) => void
}

// Section 5.2 "To-do list": add / check / delete, persisted locally. No
// drag-reorder, no edit-in-place — both explicitly backlog, not MVP.
export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      items: [],

      add: (text) => {
        const trimmed = text.trim()
        if (!trimmed) return
        set((s) => ({
          items: [
            ...s.items,
            { id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() },
          ],
        }))
      },

      toggle: (id) =>
        set((s) => ({
          items: s.items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
        })),

      remove: (id) =>
        set((s) => ({
          items: s.items.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'cf-todos',
    },
  ),
)
