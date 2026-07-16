import { Howl } from 'howler'
import { useMusicStore } from '../../stores/musicStore'
import { getTrackByIndex } from './playlist'

/**
 * Single module-level manager — mirrors features/audio/audioManager.ts.
 * Owns exactly one Howl at a time (Web Audio buffer mode — html5:false
 * loops/advances more gaplessly than html5 streaming). Subscribes to
 * musicStore and reconciles the engine to whatever the store says should
 * be happening.
 *
 * Imported for its side effect (the subscribe call below) by
 * features/music/MusicPlayer.tsx, so importing the panel is enough to
 * activate playback — no separate wiring needed beyond that one import.
 */

let currentHowl: Howl | null = null
let currentIndex: number | null = null

function teardownActiveEngine(): void {
  if (currentHowl) {
    currentHowl.unload()
    currentHowl = null
  }
  currentIndex = null
}

function adoptTrack(index: number, volume: number): void {
  const track = getTrackByIndex(index)
  currentIndex = index
  currentHowl = new Howl({
    src: [track.src],
    // Not a per-track loop: playlist continuity is handled by `onend`
    // advancing the store to the next track (wrapping after the last one),
    // which is what makes this a continuous *playlist* rather than one
    // track looping forever.
    loop: false,
    html5: false,
    volume,
    onend: () => {
      // Track finished on its own — advance the playlist. `playing` stays
      // true in the store, so the next reconcile pass (triggered by this
      // very state change) adopts and immediately plays the next track.
      useMusicStore.getState().next()
    },
  })
}

function reconcile(): void {
  const { trackIndex, playing, volume } = useMusicStore.getState()

  // Selection changed underneath us (skip, playlist click, or auto-advance
  // on track end) — tear down whichever Howl was active and adopt the new
  // one, regardless of playing state, so a switch made while paused
  // doesn't leave a stale Howl loaded for the old track.
  if (trackIndex !== currentIndex) {
    teardownActiveEngine()
    adoptTrack(trackIndex, volume)
  }

  if (!currentHowl) return

  if (playing) {
    currentHowl.volume(volume)
    if (!currentHowl.playing()) currentHowl.play()
  } else {
    currentHowl.pause()
  }
}

useMusicStore.subscribe(reconcile)
