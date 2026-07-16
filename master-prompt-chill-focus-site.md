# Master Build Prompt — Chill/Focus Study Companion

**How to use this:** Launch Claude Code with **Fable 5** selected as the session model (this is your orchestrator). Paste this entire document as your first message, or drop it in as `CLAUDE.md` at the repo root. Create the five subagent files in Section 7 *before* Phase 1 starts. Do not let any phase start without an explicit go-ahead from Chief — see Ground Rules.

---

## 1. Orchestration Model

| Role | Model | Job |
|---|---|---|
| Orchestrator (main session) | Fable 5 | Owns the plan, talks to Chief, delegates phases, synthesizes subagent output, enforces phase gates |
| `architect` | Opus 4.8 | Structural decisions, resolves ambiguity, breaks ties between subagents |
| `qa-reviewer` | Opus 4.8 | Reviews each phase before sign-off, read-only |
| `ui-builder` | Sonnet 5 | Layout, styling, animation implementation |
| `game-builder` | Sonnet 5 | Tic-Tac-Toe, Dino runner |
| `focus-engine-builder` | Sonnet 5 | Timer, focus levels, audio manager, notes/todo persistence |

Note: some Claude Code installs expect the short alias (`opus`, `sonnet`) instead of the full model string in agent frontmatter — check what your installed version resolves before the first run.

---

## 2. Product, One Line

A two-mode personal site: **Chill mode** (music + mini-games, low stakes, dopamine) and **Focus mode** (timer + ambient sound + notes/todo, low friction, high signal). Same shell, different soul.

---

## 3. Feasibility Flags (read before building anything)

**Zero-cost constraint (Chief's explicit call):** every dependency, service, and hosting tier in this build must be free with no paid tier required, ever. This is a hard constraint, not a preference — if a subagent hits a choice with a paid-only path, it stops and flags it rather than picking it.

Two places where the ask, taken literally, runs into a wall:

1. **"Pop music"** — actual copyrighted commercial tracks can't be bundled into a repo that gets deployed publicly; that's a takedown risk, not a coding problem. Default and *only* option given the zero-cost constraint: royalty-free/CC-licensed upbeat tracks (Pixabay Music, YouTube Audio Library) bundled as static files. The Spotify Web Playback SDK is explicitly **out of scope** — it needs a Spotify Premium subscription to play full tracks, which violates the zero-cost constraint. Do not build toward it.
2. **"Distraction-blocking" Focus Level 3** — a website cannot block other tabs, apps, or sites. No browser permission model allows it. Level 3 below is built as *friction*, not enforcement (hidden panels, confirmation nags). If Chief wants real site-blocking later, that's a browser extension — a separate project, not this one.

Both are logged here so nobody discovers them mid-build and quietly reinterprets scope without saying so.

---

## 4. Tech Stack (recommended, not a menu)

- **React + Vite + TypeScript** — fast dev loop, standard, resume-relevant.
- **Tailwind CSS** — utility styling, fast to theme two modes.
- **Zustand** — state (mode, timer, todo, notes). Overkill would be Redux; underkill would be prop-drilling. This is the boring middle.
- **Framer Motion** — animation, needed to make chill/focus motion languages genuinely different.
- **Howler.js** — audio (looping, crossfade, multi-track easier than raw `<audio>`).
- **canvas-confetti** — appreciation animation base.
- **localStorage** — all persistence. No backend, no auth, no database for v1. This is a single-device personal tool and a portfolio piece, not a SaaS — a backend is added scope with no payoff right now. Reversible later if he wants sync.
- **Deploy:** Vercel, Hobby (free) tier, static build. Deploy on Day 1 with a blank shell — don't wait for "done" to ship the pipeline. Stay on the default `*.vercel.app` subdomain — it's $0. A custom domain is the one optional real cost in this whole project (~$10–15/yr to a registrar), and it's Chief's call, not a build requirement.

---

## 5. Feature Spec

### 5.1 Chill Mode
- Background: paper-grid base (shared, see Section 6), warmer accent color, playful.
- Music player: play/pause/skip/volume, bundled royalty-free upbeat playlist (see Flag 1).
- Games: **Tic-Tac-Toe** (local 2-player + simple AI opponent) and **Dino Runner** (canvas, keyboard jump, increasing speed, high score in localStorage).
- Build games behind a small registry pattern (`games/index.ts` mapping id → component) so a third game later is a slot-in, not a refactor. Ship exactly these two for v1 — the "etc." in the brief is a future-backlog note, not a v1 checklist item. Resist the urge to add a third game before these two are actually fun to play.

### 5.2 Focus Mode

**Timer:** configurable focus/break durations, start/pause/reset, session counter.

**Ambient sound — 5 tracks** (resolving "5 brown music" into something concrete): Rain, Forest, Ocean Waves, Fireplace/Café, and true **Brown Noise** (synthesized live via Web Audio API — zero licensing risk, and it's the one genuinely called "brown" in audio terms). Single-select loop + volume slider for v1. A full multi-track mixer is a nice v2, not a v1 requirement — flagging so it doesn't quietly balloon the timer-and-audio phase.

**Focus Levels 1–3** — the differences need to be felt, not just labeled:

| | Level 1 — Light | Level 2 — Deep | Level 3 — Deep Lock |
|---|---|---|---|
| Default block | 25/5 | 50/10 | 90/15 (editable) |
| Notes/todo panel | Always visible | Collapsed, one click to expand | Hidden behind deliberate toggle |
| UI chrome | Full color | Slightly desaturated | Minimal, high-contrast, everything non-essential gone |
| Ambient track | Switchable mid-session | Switchable mid-session | Locked once session starts (kills fiddling-as-procrastination) |
| Tab away | Nothing | Tab title shows countdown | Tab title shows countdown + a `visibilitychange`-triggered "still there? X min left" nudge on return |
| Transition motion | Normal | Slower | Slowest, most minimal |

**Appreciation animation** — fires on timer completion. Pool of 4, chosen at random with no immediate repeat, each paired with a short line (skip the "you've got this, king" register entirely):
- Confetti burst + "Session banked."
- Gentle firework + "That's real focus time. Logged."
- Growing plant (SVG, sprouts over ~1.5s) + "Small reps, real growth."
- Star pulse + "Done. On to the next one."

**Notes:** one persistent scratchpad (plain textarea, autosave to localStorage). Not a multi-note system for v1 — that's backlog, not MVP.

**To-do list:** add / check / delete, persisted locally. Drag-reorder is backlog, not MVP.

---

## 6. UI/UX Spec

- **Shared base:** paper-grid background — CSS `repeating-linear-gradient`, no image assets, faint grid lines, off-white base.
- **Typography:** one clean sans (Inter or Sora), restrained sizes, muted palette as default text color.
- **Mode-specific accent:** Chill = warmer, brighter accent; Focus = cooler, muted accent. Subtle shift, not a theme swap.
- **Animation language must differ, concretely:**
  - Chill: springy easing (Framer Motion `spring`), visible micro-interactions on hover/click, a little bounce.
  - Focus: linear/ease-out fades, slow, minimal, motion reduces further at Level 3. Respect `prefers-reduced-motion` throughout — non-negotiable, not a nice-to-have.

---

## 7. Subagent Definitions

Create these as `.claude/agents/<name>.md` before Phase 1. (Done — see the files in `.claude/agents/`.)

---

## 8. Build Phases + Definition of Done

Phase gate rule: after each phase, report back (Shipped / Deviations / Next / Blockers) and **wait for Chief's go-ahead**. Do not chain phases automatically.

| Phase | Scope | Definition of Done |
|---|---|---|
| 0 | Scaffold + deploy pipeline | Vite+React+TS+Tailwind repo, blank page live on Vercel |
| 1 | Shell | Mode switcher works, paper-grid renders, layout in place for both modes |
| 2 | Timer + levels | Timer runs, pause/reset work, Level 1→3 differences are visibly present per table |
| 3 | Appreciation animation | Random animation + message fires on completion, no back-to-back repeat |
| 4 | Ambient audio | 5 tracks play/loop cleanly, volume works, Level 3 lock rule enforced |
| 5 | Notes + todo | CRUD works, survives refresh, visibility follows focus-level rules |
| 6 | Chill core | Both games playable start-to-finish, music player works with bundled royalty-free tracks |
| 7 | Animation polish | Chill vs Focus motion feels distinct side by side, `prefers-reduced-motion` respected |
| 8 | Ship | Lighthouse pass, README, final deploy |

---

## Ground Rules for Execution

- No feature beyond this spec without flagging it first — scope creep kills ship velocity, and "etc." in the original brief is not a blank check.
- Every assumption a subagent makes to fill a gap in this spec gets stated out loud in its report, not baked in silently.
- `qa-reviewer` runs before any phase is marked done — it can fail a phase, it cannot fix it.
- Feasibility Flags in Section 3 are hard constraints, not suggestions.
