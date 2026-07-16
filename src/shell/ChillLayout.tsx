export function ChillLayout() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section className="flex min-h-48 flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-surface p-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Music player</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Play / pause / skip / volume — bundled royalty-free tracks land here.
          </p>
        </div>
        <p className="text-xs text-ink-muted/70">Coming in a later phase.</p>
      </section>

      <section className="flex min-h-48 flex-col justify-between rounded-2xl border border-dashed border-accent/40 bg-surface p-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Games</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tic-Tac-Toe and Dino Runner will slot in right here.
          </p>
        </div>
        <p className="text-xs text-ink-muted/70">Nothing to click yet — soon.</p>
      </section>
    </div>
  )
}
