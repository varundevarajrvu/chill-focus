import track1Url from './tracks/track1.mp3'
import track2Url from './tracks/track2.mp3'
import track3Url from './tracks/track3.mp3'

export interface MusicTrack {
  id: string
  title: string
  artist: string
  /** Vite-resolved asset URL — bundled/hashed at build time, served on demand. */
  src: string
}

// Bundled Pixabay-licensed MP3s (see features/music/tracks/LICENSES.md — do
// not modify/re-source). Titles/artists below are copied verbatim from that
// file. Order here is playback order for the continuous playlist loop.
export const PLAYLIST: MusicTrack[] = [
  {
    id: 'track1',
    title: 'Good Night - Lofi Cozy Chill Music',
    artist: 'FASSounds',
    src: track1Url,
  },
  {
    id: 'track2',
    title: 'Chill Pop',
    artist: 'Kulakovka',
    src: track2Url,
  },
  {
    id: 'track3',
    title: 'Feel Good Electronic Beat',
    artist: 'Tunetank',
    src: track3Url,
  },
]

export function getTrackByIndex(index: number): MusicTrack {
  const track = PLAYLIST[index]
  if (!track) throw new Error(`Unknown playlist index: ${index}`)
  return track
}
