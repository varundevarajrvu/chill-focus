import { MotionConfig } from 'framer-motion'
import { AppShell } from '../shell/AppShell'

function App() {
  // Global reduced-motion net: any Framer `motion` component anywhere in the
  // tree automatically neutralizes transform/positional animations (scale,
  // x, y, ...) when the OS-level prefers-reduced-motion is set. This is
  // belt-and-suspenders alongside the existing per-component
  // useReducedMotion() guards (which additionally zero out opacity-only
  // tweens and gate non-Framer things like canvas-confetti and CSS
  // @keyframes — MotionConfig's net doesn't cover either of those).
  return (
    <MotionConfig reducedMotion="user">
      <AppShell />
    </MotionConfig>
  )
}

export default App
