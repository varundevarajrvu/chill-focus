import { useEffect } from 'react'
import { useModeStore } from '../stores/modeStore'
import { ModeHeader } from './ModeHeader'
import { ModeStage } from './ModeStage'

export function AppShell() {
  const mode = useModeStore((s) => s.mode)

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
  }, [mode])

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col">
      <ModeHeader />
      <main className="flex-1 px-6 pb-10 sm:px-10">
        <ModeStage />
      </main>
    </div>
  )
}
