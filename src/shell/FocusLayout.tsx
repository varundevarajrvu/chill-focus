export function FocusLayout() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section className="flex min-h-48 flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-surface p-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Timer</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Focus/break durations, start/pause/reset, session counter.
          </p>
        </div>
        <p className="text-xs text-ink-muted/70">Wired up in Phase 2.</p>
      </section>

      <section className="flex min-h-48 flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-surface p-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Notes &amp; to-do</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Scratchpad and a small to-do list will live here.
          </p>
        </div>
        <p className="text-xs text-ink-muted/70">Not wired up yet.</p>
      </section>
    </div>
  )
}
