import { useAudioStore } from '../stores/audioStore'
import { useMusicStore } from '../stores/musicStore'

/**
 * Cross-store coordinator: Chill music (musicStore/musicManager.ts) and
 * Focus ambient audio (audioStore/audioManager.ts) are two independent
 * Howl-backed engines that would otherwise happily play on top of each
 * other if a user left one running while starting the other. This module
 * enforces "only one audio source plays at a time" from the outside,
 * without editing either existing store.
 *
 * Loop guard: each `pause()` call below is itself a state change that
 * would normally re-trigger these very subscriptions. The condition only
 * fires on a false -> true edge (`state.playing && !prevState.playing`);
 * the pause() calls only ever produce a (true -> false) or (false ->
 * false) transition on the *other* store, so they can never re-satisfy
 * this condition and re-trigger the opposite pause. No cycle is possible.
 *
 * Side-effect module — import it once, e.g. alongside the existing
 * `import '../features/audio/audioManager'` in AppShell, so exclusivity
 * holds globally across Chill/Focus mode switches.
 */

useMusicStore.subscribe((state, prevState) => {
  if (state.playing && !prevState.playing) {
    useAudioStore.getState().pause()
  }
})

useAudioStore.subscribe((state, prevState) => {
  if (state.playing && !prevState.playing) {
    useMusicStore.getState().pause()
  }
})
