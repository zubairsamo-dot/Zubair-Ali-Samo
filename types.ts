
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  value: CardValue;
  rank: number; // Numeric value for sorting (2=2, ..., A=14)
}

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  PACKED = 'PACKED',
  WAITING = 'WAITING'
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  cards: Card[];
  isSeen: boolean;
  status: PlayerStatus;
  isDealer: boolean;
  currentBet: number;
}

export enum GamePhase {
  IDLE = 'IDLE',
  DEALING = 'DEALING',
  BETTING = 'BETTING',
  SHOWDOWN = 'SHOWDOWN'
}

export interface GameState {
  players: Player[];
  pot: number;
  currentTurn: number;
  currentStake: number; // This is the "unit" amount for a blind player
  phase: GamePhase;
  logs: string[];
  lastAction: string;
  winnerIds: string[] | null;
}
