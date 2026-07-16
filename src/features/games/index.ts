import type { ComponentType } from 'react'
import { TicTacToe } from './tic-tac-toe/TicTacToe'
import { DinoRunner } from './dino/DinoRunner'

export interface GameDefinition {
  id: string
  label: string
  description: string
  component: ComponentType
}

// Registry pattern (Section 5.1): id -> definition. Adding a third game
// later is a pure slot-in — build the component, add one entry here, done.
// Nothing outside this file (the picker in ChillLayout) needs to change.
export const GAMES: Record<string, GameDefinition> = {
  'tic-tac-toe': {
    id: 'tic-tac-toe',
    label: 'Tic-Tac-Toe',
    description: 'Local 2-player or play against a simple AI.',
    component: TicTacToe,
  },
  dino: {
    id: 'dino',
    label: 'Dino Runner',
    description: 'Jump obstacles in an endless runner. Beat your high score.',
    component: DinoRunner,
  },
}

export const GAME_LIST: GameDefinition[] = Object.values(GAMES)
