import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useIntroStore } from '../stores/introStore'
import { useModeStore } from '../stores/modeStore'
import { useThemeStore } from '../stores/themeStore'
import type { Mode } from '../stores/modeStore'

/**
 * First-visit landing (added post-spec at Chief's request — the 8-phase build
 * dropped visitors straight into a mode with no framing of what the app is).
 * A once-per-device intro overlay: names the product, then lets the visitor
 * pick where they start. Picking a mode sets modeStore + marks the intro seen
 * so it never mounts again for that device.
 *
 * Motion follows the app's two languages loosely: entrance is a soft rise +
 * fade (never a bounce — this is a calm first impression), and each card
 * borrows its own mode's hover feel via whileHover/whileTap. All of it is
 * gated on prefers-reduced-motion, matching the rest of the app.
 *
 * Token discipline: each card wrapper carries BOTH data-mode (its own mode)
 * and data-theme (mirrored from themeStore) so the [data-theme][data-mode]
 * compound token blocks in styles/index.css resolve that card to its real
 * warm (chill) / cool (focus) accent — the visitor sees the actual mode
 * identity before choosing, with zero hardcoded hues.
 */

function ChillIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M9 17V6.2l10-2.2v10.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.6" cy="17" r="2.4" fill="currentColor" />
      <circle cx="16.6" cy="15.4" r="2.4" fill="currentColor" />
    </svg>
  )
}

function FocusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="13.5" r="7.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 13.5V9.4M9.6 2.8h4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M18.6 6.6l1.4-1.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface ModeCard {
  mode: Mode
  label: string
  tagline: string
  icon: () => ReactElement
}

// Tailwind's accent utilities (text-accent, bg-accent-soft, ...) read
// --color-*, which @theme resolves ONCE at :root from that scope's --accent —
// so overriding --accent on a nested card alone doesn't reach the utilities
// (the computed --color-accent is already inherited from :root). Re-pointing
// --color-* at the card's own --accent here closes that gap: combined with the
// card's data-mode/data-theme (which set --accent to the mode's warm/cool
// value via the token blocks in styles/index.css), each card previews in its
// real mode accent — still zero hardcoded hues, just re-plumbing the token.
const ACCENT_REMAP: CSSProperties = {
  '--color-accent': 'var(--accent)',
  '--color-accent-soft': 'var(--accent-soft)',
  '--color-accent-ink': 'var(--accent-ink)',
} as CSSProperties

const CARDS: ModeCard[] = [
  { mode: 'chill', label: 'Chill', tagline: 'Music & mini-games for the breaks.', icon: ChillIcon },
  {
    mode: 'focus',
    label: 'Focus',
    tagline: 'A leveled timer, ambient sound, notes & to-do.',
    icon: FocusIcon,
  },
]

export function Landing() {
  const seen = useIntroStore((s) => s.seen)
  const dismiss = useIntroStore((s) => s.dismiss)
  const setMode = useModeStore((s) => s.setMode)
  const theme = useThemeStore((s) => s.theme)
  const reduceMotion = useReducedMotion()
  const firstCardRef = useRef<HTMLButtonElement>(null)

  function enter(next: Mode) {
    setMode(next)
    dismiss()
  }

  // Lock body scroll while the intro is up (Chill mode's layout is tall and
  // scrollable — without this the page behind the overlay can be scrolled),
  // move focus to the first choice, and let Escape dismiss into the current
  // mode. All cleaned up on unmount. Guarded on `seen` so none of it runs
  // for returning visitors (the component returns null below in that case).
  useEffect(() => {
    if (seen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstCardRef.current?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [seen, dismiss])

  if (seen) return null

  const ease = [0.22, 1, 0.36, 1] as const
  const container = {
    hidden: {},
    show: { transition: reduceMotion ? {} : { staggerChildren: 0.08, delayChildren: 0.05 } },
  }
  const item = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
      }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      initial={reduceMotion ? undefined : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-surface/80 px-6 py-10 backdrop-blur-md sm:px-10"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="shadow-hero w-full max-w-2xl rounded-[28px] bg-surface-raised px-7 py-10 sm:px-12 sm:py-14"
      >
        <motion.p
          variants={item}
          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-ink-muted"
        >
          <span aria-hidden="true" className="inline-block h-0.5 w-4 shrink-0 rounded-full bg-accent" />
          Chill / Focus
        </motion.p>

        <motion.h1
          id="intro-title"
          variants={item}
          className="text-gradient font-display mt-3 text-4xl font-bold leading-tight sm:text-5xl"
        >
          Where do you want to start?
        </motion.h1>

        <motion.p variants={item} className="mt-4 max-w-lg text-base text-ink-muted sm:text-lg">
          A two-mode study companion — one tab for the deep work and the breaks in between.
        </motion.p>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.button
                key={card.mode}
                ref={i === 0 ? firstCardRef : undefined}
                type="button"
                data-mode={card.mode}
                data-theme={theme}
                style={ACCENT_REMAP}
                variants={item}
                onClick={() => enter(card.mode)}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="group flex flex-col items-start gap-4 rounded-2xl border border-ink-muted/12 bg-surface p-6 text-left outline-none transition-colors hover:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon />
                </span>
                <span>
                  <span className="font-display block text-xl font-bold text-ink">{card.label}</span>
                  <span className="mt-1 block text-sm text-ink-muted">{card.tagline}</span>
                </span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  Enter
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </span>
              </motion.button>
            )
          })}
        </div>

        <motion.p variants={item} className="mt-8 text-xs leading-relaxed text-ink-muted/80">
          No account, no tracking — everything stays on your device. You can switch modes anytime
          once you&rsquo;re in.
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
