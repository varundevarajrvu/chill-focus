# Chill/Focus Study Companion

The full spec is `master-prompt-chill-focus-site.md` at the repo root — **it is law**. Read it before doing anything.

Non-negotiables (details in the spec):

- **Phase gates:** after each phase, report Shipped / Deviations / Next / Blockers and wait for Chief's explicit go-ahead. Never chain phases automatically.
- **Feasibility flags (Section 3) are hard constraints:** zero cost — every dependency, service, and hosting tier must be free forever (Spotify SDK is out of scope, no paid-only paths, stop and flag instead of picking one); no copyrighted music bundled in the repo; Level 3 "blocking" is friction, never claimed enforcement.
- **Scope:** nothing beyond the spec without flagging it first. Assumptions get stated out loud, never baked in silently.
- **QA:** `qa-reviewer` runs before any phase is marked done. It can fail a phase; it cannot fix one.
- **Delegation:** structural calls → `architect`; UI/shell/animation → `ui-builder`; games → `game-builder`; timer/audio/notes/todo → `focus-engine-builder`.
