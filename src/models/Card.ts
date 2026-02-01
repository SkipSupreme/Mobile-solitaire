import { SUITS, RANKS } from '../utils/constants';

export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];
export type CardColor = 'red' | 'black';

export interface CardData {
  rank: Rank;
  suit: Suit;
  faceUp: boolean;
  id: string;
}

export class Card implements CardData {
  readonly rank: Rank;
  readonly suit: Suit;
  readonly id: string;
  faceUp: boolean;

  constructor(rank: Rank, suit: Suit) {
    this.rank = rank;
    this.suit = suit;
    this.faceUp = false;
    this.id = `${suit}-${rank}`;
  }

  get color(): CardColor {
    return this.suit === 'hearts' || this.suit === 'diamonds' ? 'red' : 'black';
  }

  get isRed(): boolean {
    return this.color === 'red';
  }

  get isBlack(): boolean {
    return this.color === 'black';
  }

  get isAce(): boolean {
    return this.rank === 1;
  }

  get isKing(): boolean {
    return this.rank === 13;
  }

  flip(): void {
    this.faceUp = !this.faceUp;
  }

  clone(): Card {
    const card = new Card(this.rank, this.suit);
    card.faceUp = this.faceUp;
    return card;
  }

  toString(): string {
    const rankNames = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    return `${rankNames[this.rank]}${suitSymbols[this.suit]}`;
  }
}
