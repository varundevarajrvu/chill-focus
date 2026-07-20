# Chill / Focus

A two-mode study companion. **Chill mode** is for the breaks — music and mini-games. **Focus mode** is for the work — a leveled pomodoro timer, ambient sound, and a notes/todo panel. Same shell, different soul.

First-time visitors land on a quick pick-your-mode intro; the choice is saved to `localStorage`, so returning visitors drop straight into their last mode and never see it again.

**Live:** https://chill-focus.vercel.app

## Focus mode

- **Timer** — configurable focus/break blocks, session counter, drift-free even when the tab is backgrounded (timestamp-derived, not tick-counted).
- **Three focus levels** that get progressively more serious:

  | | L1 — Light | L2 — Deep | L3 — Deep Lock |
  |---|---|---|---|
  | Default block | 25/5 | 50/10 | 90/15 |
  | Notes/todo | visible | collapsed | hidden behind a toggle |
  | Chrome | full color | desaturated | minimal, high-contrast, non-essentials gone mid-session |
  | Ambient track | switchable | switchable | locked once the session starts |
  | Tab away | — | countdown in tab title | countdown + "still there?" nudge on return |

- **Ambient sound** — rain, forest, ocean, fireplace (royalty-free, licenses documented), and true brown noise synthesized live via the Web Audio API.
- **Notes & to-do** — one autosaving scratchpad and an add/check/delete list, persisted locally.
- **Appreciation animations** — four of them, randomly picked (never the same twice in a row) when a focus session completes.

Level 3's "lock" is deliberate friction, not enforcement — a website cannot and should not claim to block other tabs or apps.

## Chill mode

- **Music player** — three bundled royalty-free tracks (lofi / chill pop / electronic), play/pause/skip/volume, auto-advancing playlist. Chill music and Focus ambient are mutually exclusive — starting one pauses the other.
- **Games** — Tic-Tac-Toe (local 2-player or vs a simple AI) and a Dino Runner (canvas, delta-time physics, persistent high score). New games slot into a small registry (`src/features/games/index.ts`).

## Tech

React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand (persisted stores) · Framer Motion · Howler.js · Web Audio API · canvas-confetti

Everything persists to `localStorage` — no backend, no accounts, no tracking, no costs. Deployed as a static build on Vercel's free tier.

The two modes have deliberately different motion languages: Chill is springy with hover/press micro-interactions; Focus is slow ease-out fades that get slower at deeper levels. `prefers-reduced-motion` is respected throughout.

## Development

```bash
npm install
npm run dev       # dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```

## Audio licensing

All bundled audio is used under the Pixabay Content License, which permits redistribution inside an app. Per-file sources, artists, and license confirmations are documented in:

- `src/features/audio/tracks/LICENSES.md` (ambient)
- `src/features/music/tracks/LICENSES.md` (music)

Brown noise is generated at runtime and has no license surface.
