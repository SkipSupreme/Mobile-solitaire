import { Card, Suit, Rank } from './Card';
import { SUITS, RANKS } from '../utils/constants';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.createDeck();
  }

  private createDeck(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(new Card(rank as Rank, suit as Suit));
      }
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   * Provides uniform random distribution
   */
  shuffle(): void {
    const cards = this.cards;
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  /**
   * Deal cards for Klondike solitaire
   * Returns: { tableau: Card[][], stock: Card[] }
   */
  deal(): { tableau: Card[][]; stock: Card[] } {
    this.shuffle();

    const tableau: Card[][] = [[], [], [], [], [], [], []];
    let cardIndex = 0;

    // Deal to tableau: column i gets i+1 cards, only top card face-up
    for (let col = 0; col < 7; col++) {
      for (let row = col; row < 7; row++) {
        const card = this.cards[cardIndex++];
        card.faceUp = (col === row); // Top card of each pile is face-up
        tableau[row].push(card);
      }
    }

    // Remaining 24 cards go to stock (face-down)
    const stock = this.cards.slice(cardIndex);
    stock.forEach(card => card.faceUp = false);

    return { tableau, stock };
  }

  /**
   * Get all cards in the deck
   */
  getCards(): Card[] {
    return [...this.cards];
  }

  /**
   * Reset deck to initial state
   */
  reset(): void {
    this.createDeck();
  }

  /**
   * Get deck size
   */
  get size(): number {
    return this.cards.length;
  }
}
