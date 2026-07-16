import rainUrl from './tracks/rain.mp3'
import forestUrl from './tracks/forest.mp3'
import oceanUrl from './tracks/ocean.mp3'
import fireplaceUrl from './tracks/fireplace.mp3'

export type TrackId = 'rain' | 'forest' | 'ocean' | 'fireplace' | 'brown-noise'

export interface FileTrackDef {
  id: TrackId
  label: string
  kind: 'file'
  /** Vite-resolved asset URL — bundled/hashed at build time, served on demand. */
  src: string
}

export interface SynthTrackDef {
  id: TrackId
  label: string
  kind: 'synth'
}

export type TrackDef = FileTrackDef | SynthTrackDef

// Rain/Forest/Ocean/Fireplace are bundled Pixabay-licensed MP3s (see
// features/audio/tracks/LICENSES.md — do not modify/re-source). Brown Noise
// has no file: it's synthesized live via lib/brownNoise.ts, per master-prompt
// Section 5.2 ("true Brown Noise ... zero licensing risk").
export const TRACKS: TrackDef[] = [
  { id: 'rain', label: 'Rain', kind: 'file', src: rainUrl },
  { id: 'forest', label: 'Forest', kind: 'file', src: forestUrl },
  { id: 'ocean', label: 'Ocean Waves', kind: 'file', src: oceanUrl },
  { id: 'fireplace', label: 'Fireplace', kind: 'file', src: fireplaceUrl },
  { id: 'brown-noise', label: 'Brown Noise', kind: 'synth' },
]

export function getTrack(id: TrackId): TrackDef {
  const track = TRACKS.find((t) => t.id === id)
  if (!track) throw new Error(`Unknown track id: ${id}`)
  return track
}
