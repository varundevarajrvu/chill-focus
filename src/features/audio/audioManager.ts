import { Howl } from 'howler'
import { useAudioStore } from '../../stores/audioStore'
import { brownNoiseEngine } from '../../lib/brownNoise'
import { getTrack } from './tracks'
import type { TrackDef, TrackId } from './tracks'

/**
 * Single module-level manager — mirrors the timerStore ticker pattern
 * (one shared instance, not a hook, not React state). Owns exactly one
 * playback engine at a time: a Howl for file tracks (Web Audio buffer
 * mode — html5:false loops more gaplessly than html5 streaming), or the
 * brown-noise engine for the synth track. Subscribes to audioStore and
 * reconciles the engine to whatever the store says should be happening.
 *
 * Imported for its side effect (the subscribe call below) from AppShell —
 * mounted once, globally, so audio keeps playing across Chill/Focus mode
 * switches even though AmbientPanel itself only renders in Focus mode.
 */

let currentHowl: Howl | null = null
let currentTrack: TrackDef | null = null

function teardownActiveEngine(): void {
  if (currentHowl) {
    currentHowl.unload()
    currentHowl = null
  }
  brownNoiseEngine.stop()
  currentTrack = null
}

function adoptTrack(trackId: TrackId, volume: number): void {
  const track = getTrack(trackId)
  currentTrack = track
  if (track.kind === 'file') {
    currentHowl = new Howl({
      src: [track.src],
      loop: true,
      html5: false,
      volume,
    })
  }
  // Synth (brown-noise) engine is stateless until start() is called below —
  // nothing to construct here.
}

function reconcile(): void {
  const { trackId, playing, volume } = useAudioStore.getState()

  // Selection changed underneath us (including "cleared") — tear down
  // whichever engine was active and adopt the new one, regardless of
  // playing state, so a switch made while paused doesn't leave a stale
  // Howl loaded for the old track.
  if (trackId !== currentTrack?.id) {
    teardownActiveEngine()
    if (trackId) adoptTrack(trackId, volume)
  }

  if (!currentTrack) return

  if (playing) {
    if (currentTrack.kind === 'file') {
      currentHowl?.volume(volume)
      if (!currentHowl?.playing()) currentHowl?.play()
    } else {
      if (!brownNoiseEngine.isRunning) brownNoiseEngine.start(volume)
      else brownNoiseEngine.setVolume(volume)
    }
  } else {
    if (currentTrack.kind === 'file') {
      currentHowl?.pause()
    } else {
      // AudioBufferSourceNode has no pause/resume — stop is the only
      // option; a fresh buffer is synthesized on the next start(), which
      // is inaudible for noise (there's no meaningful "position").
      brownNoiseEngine.stop()
    }
  }
}

useAudioStore.subscribe(reconcile)
