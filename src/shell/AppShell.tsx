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
      <main className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-16">
        <ModeStage />
      </main>
      <AppreciationOverlay />
    </div>
  )
}
