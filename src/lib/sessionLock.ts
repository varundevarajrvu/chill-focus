import { LEVELS } from '../features/timer/levels'
import type { Level } from '../features/timer/levels'
import type { Status } from '../stores/timerStore'

/**
 * Level 3 lock rule (master-prompt Section 5.2 table, "Ambient track" row):
 * once a Level-3 ("Deep Lock") session is running, track SELECTION is
 * locked — kills fiddling-as-procrastination. Volume and play/pause are
 * untouched by this; only selectTrack consults it.
 *
 * Shared between stores/audioStore.ts (ambient sounds) and
 * stores/musicStore.ts (focus-mode CD player) so both features' lock rule
 * stay byte-for-byte identical instead of drifting. audioStore re-exports
 * this so existing imports (`from '../../stores/audioStore'`, e.g.
 * AmbientPanel.tsx) keep working unchanged.
 */
export function isTrackSelectionLocked(level: Level, status: Status): boolean {
  return LEVELS[level].canSwitchAudioMidSession === false && status === 'running'
}
