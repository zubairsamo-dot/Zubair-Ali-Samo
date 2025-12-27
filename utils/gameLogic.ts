
import { Card, Suit, CardValue } from '../types';
import { SUITS, VALUES, VALUE_MAP } from '../constants';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, rank: VALUE_MAP[value] });
    }
  }
  return shuffle(deck);
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * Neine Nine Nawan (Authentic Standards):
 * 1. KORA (3 of a Kind) - Best
 * 2. NAWAN (3 Same Suit)
 * 3. SIANG (3 Face Cards: J, Q, K)
 * 4. POINTS (Sum % 10) - 9 is best, 0 is worst.
 * 
 * Note: Face cards (10, J, Q, K) count as 0 points for the sum.
 */

export const getHandCategory = (cards: Card[]): string => {
  if (cards.length !== 3) return "None";
  
  const isKora = cards[0].value === cards[1].value && cards[1].value === cards[2].value;
  if (isKora) return "KORA";
  
  const isNawan = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
  if (isNawan) return "NAWAN";
  
  const isSiang = cards.every(c => ['J', 'Q', 'K'].includes(c.value));
  if (isSiang) return "SIANG";
  
  return `${getDisplayPoints(cards)} Pts`;
};

export const getHandScore = (cards: Card[]): number => {
  if (cards.length !== 3) return 9999;

  const isKora = cards[0].value === cards[1].value && cards[1].value === cards[2].value;
  const isNawan = cards[0].suit === cards[1].suit && cards[1].suit === cards[2].suit;
  const isSiang = cards.every(c => ['J', 'Q', 'K'].includes(c.value));
  const points = getDisplayPoints(cards);
  const maxRank = Math.max(...cards.map(c => c.rank));

  // Score brackets (Lower is better):
  // Kora: 0 - 100
  // Nawan: 100 - 200
  // Siang: 200 - 300
  // Points: 300 - 1300
  
  if (isKora) return (14 - cards[0].rank); // Best is AAA (Rank 14), score 0.
  if (isNawan) return 100 + (14 - maxRank); 
  if (isSiang) return 200 + (14 - maxRank);
  
  // For points, 9 is best. (9 - points) * 100 ensures 9 beats 8, etc.
  return 300 + (9 - points) * 100 + (14 - maxRank);
};

export const getDisplayPoints = (cards: Card[]): number => {
  if (cards.length !== 3) return 0;
  const getPoints = (val: CardValue): number => {
    if (val === 'A') return 1;
    if (['10', 'J', 'Q', 'K'].includes(val)) return 0; // Traditional Nawan: Face cards = 0
    return parseInt(val);
  };
  return (getPoints(cards[0].value) + getPoints(cards[1].value) + getPoints(cards[2].value)) % 10;
};

export const getSuitIcon = (suit: Suit) => {
  switch (suit) {
    case 'spades': return '♠';
    case 'hearts': return '♥';
    case 'diamonds': return '♦';
    case 'clubs': return '♣';
  }
};

export const getSuitColor = (suit: Suit) => {
  return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-500' : 'text-slate-900';
};
