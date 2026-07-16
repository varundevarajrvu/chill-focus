import { useEffect } from 'react'
import { useModeStore } from '../stores/modeStore'
import { useTimerStore } from '../stores/timerStore'
import { useTabTitle } from '../hooks/useTabTitle'
import { ModeHeader } from './ModeHeader'
import { ModeStage } from './ModeStage'

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
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
      <ModeHeader />
      <main className="flex-1 px-6 pb-10 sm:px-10">
        <ModeStage />
      </main>
    </div>
  )
}
