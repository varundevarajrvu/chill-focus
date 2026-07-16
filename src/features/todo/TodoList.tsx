import { useState } from 'react'
import { useTodoStore } from '../../stores/todoStore'

export function TodoList() {
  const items = useTodoStore((s) => s.items)
  const add = useTodoStore((s) => s.add)
  const toggle = useTodoStore((s) => s.toggle)
  const remove = useTodoStore((s) => s.remove)
  const [draft, setDraft] = useState('')

  const submit = () => {
    add(draft)
    setDraft('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">To-do</h3>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex gap-2"
      >
        <label htmlFor="todo-new-item" className="sr-only">
          New to-do item
        </label>
        <input
          id="todo-new-item"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-full border border-ink-muted/20 bg-white/60 px-4 py-1.5 text-sm text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-xs text-ink-muted">No tasks yet — add one above.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg px-1 py-1">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item.id)}
                aria-label={item.done ? `Mark "${item.text}" as not done` : `Mark "${item.text}" as done`}
                className="size-4 shrink-0 accent-accent"
              />
              <span
                className={`flex-1 text-sm ${
                  item.done ? 'text-ink-muted line-through' : 'text-ink'
                }`}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={`Delete: ${item.text}`}
                className="rounded-full px-2 py-1 text-xs font-medium text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
