import { useModeStore } from '../stores/modeStore'
import { useThemeStore } from '../stores/themeStore'
import { ModeSwitcher } from './ModeSwitcher'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path
        d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M20.2 14.7A8.6 8.6 0 0 1 9.3 3.8a8.6 8.6 0 1 0 10.9 10.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex size-9 items-center justify-center rounded-full text-ink-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

export function ModeHeader() {
  const mode = useModeStore((s) => s.mode)

  return (
    <header className="flex items-center justify-between px-6 pt-8 pb-4 sm:px-10 sm:pt-12">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-ink-muted">
          Chill / Focus
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[2rem]">
          {mode === 'chill' ? 'Chill mode' : 'Focus mode'}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <ModeSwitcher />
      </div>
    </header>
  )
}
