import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
// Chill's mode font (see --app-font in styles/index.css) — rounded,
// friendly numerals/letterforms matching the bubbles/plane illustration
// style. Focus stays 100% Inter, so only these four weights are needed.
import '@fontsource/quicksand/400.css'
import '@fontsource/quicksand/500.css'
import '@fontsource/quicksand/600.css'
import '@fontsource/quicksand/700.css'
// Display-font layer (v6 pass) — a distinct, chunkier face reserved for a
// short list of "personality" spots (wordmark, track title, tile labels,
// appreciation message, focus phase label) via --display-font/.font-display
// in styles/index.css. Only the weights those spots actually use are
// imported, same discipline as Quicksand above.
import '@fontsource/baloo-2/500.css'
import '@fontsource/baloo-2/600.css'
import '@fontsource/baloo-2/700.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/700.css'
import '../styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
