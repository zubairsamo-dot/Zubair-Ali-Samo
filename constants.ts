
import { Suit, CardValue, Card } from './types';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const VALUES: CardValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const VALUE_MAP: Record<CardValue, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const ANTE_AMOUNT = 100;
export const MAX_POT = 10000; // Strict table limit of Rs. 10,000

export const INITIAL_PLAYERS = [
  { id: '1', name: 'You', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p1', balance: 10000 },
  { id: '2', name: 'Rohan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p2', balance: 10000 },
  { id: '3', name: 'Priya', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p3', balance: 10000 },
  { id: '4', name: 'Vikram', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p4', balance: 10000 },
  { id: '5', name: 'Anjali', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=p5', balance: 10000 },
];
