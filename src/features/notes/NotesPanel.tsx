import { useId } from 'react'
import { useNotesStore } from '../../stores/notesStore'

export function NotesPanel() {
  const text = useNotesStore((s) => s.text)
  const setText = useNotesStore((s) => s.setText)
  const inputId = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
        Notes
      </label>
      <textarea
        id={inputId}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Jot anything down…"
        rows={6}
        className="w-full resize-y rounded-xl bg-ink-muted/[0.06] p-3 text-sm text-ink outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent"
      />
    </div>
  )
}
