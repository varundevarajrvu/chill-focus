export type Level = 1 | 2 | 3

export type LevelConfig = {
  focusMin: number
  breakMin: number
  notesPanel: 'visible' | 'collapsed' | 'hidden'
  motionScale: number
  canSwitchAudioMidSession: boolean
  tabTitle: 'none' | 'countdown' | 'countdown+nudge'
}

// Values per master-prompt Section 5.2 focus-levels table. motionScale and
// canSwitchAudioMidSession are rails for Phases 4/7 — not consumed yet.
export const LEVELS: Record<Level, LevelConfig> = {
  1: {
    focusMin: 25,
    breakMin: 5,
    notesPanel: 'visible',
    motionScale: 1,
    canSwitchAudioMidSession: true,
    tabTitle: 'none',
  },
  2: {
    focusMin: 50,
    breakMin: 10,
    notesPanel: 'collapsed',
    motionScale: 1.5,
    canSwitchAudioMidSession: true,
    tabTitle: 'countdown',
  },
  3: {
    focusMin: 90,
    breakMin: 15,
    notesPanel: 'hidden',
    motionScale: 2,
    canSwitchAudioMidSession: false,
    tabTitle: 'countdown+nudge',
  },
}
