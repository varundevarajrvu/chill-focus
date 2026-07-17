import { useEffect } from 'react'
import { useModeStore } from '../stores/modeStore'
import { useTimerStore } from '../stores/timerStore'
import { useTabTitle } from '../hooks/useTabTitle'
import { AppreciationOverlay } from '../features/appreciation/AppreciationOverlay'
import { BackgroundAmbience } from './BackgroundAmbience'
import { ModeHeader } from './ModeHeader'
import { ModeStage } from './ModeStage'
// Side-effect import: activates the module-level audio manager's store
// subscription. Mounted here (not in FocusLayout/AmbientPanel) so ambient
// audio keeps playing across Chill/Focus mode switches — the manager is
// global, only the panel UI is focus-only.
import '../features/audio/audioManager'
// Side-effect import: keeps chill music and focus ambient audio mutually
// exclusive — starting one pauses the other. Global for the same reason.
import '../lib/audioExclusivity'

export function AppShell() {
  const mode = useModeStore((s) => s.mode)
  const level = useTimerStore((s) => s.level)

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
  }, [mode])

  // data-level only carries meaning in focus mode, so it's only ever set
  // while mode === 'focus' — chill mode's chrome is untouched by level CSS.
  useEffect(() => {
    if (mode === 'focus') {
      document.documentElement.setAttribute('data-level', String(level))
    } else {
      document.documentElement.removeAttribute('data-level')
    }
  }, [mode, level])

  useTabTitle()

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
      <BackgroundAmbience />
      <ModeHeader />
      {/* Focus stays vertically centered (its content is a fixed-height hero +
          rail, shorter than the viewport on most screens). Chill's new
          scrolling layout is naturally tall/variable-height — centering it
          would fight the scroll journey (e.g. yank the Games section upward
          into view before the user scrolls), so chill flows top-down instead.
          Gated off modeStore rather than a content-height measurement: it's
          the simplest correct rule given chill/focus are structurally fixed
          per mode (Section 6), not something to detect at runtime. */}
      <main
        className={`flex flex-1 flex-col px-6 py-10 sm:px-10 sm:py-16 ${
          mode === 'focus' ? 'justify-center' : 'justify-start'
        }`}
      >
        <ModeStage />
      </main>
      <AppreciationOverlay />
    </div>
  )
}
