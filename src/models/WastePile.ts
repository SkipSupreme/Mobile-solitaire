import { Pile } from './Pile';
import { Card } from './Card';

export class WastePile extends Pile {
  constructor() {
    super('waste', 0);
  }

  /**
   * Can only pick up the top card from waste
   */
  canPickUp(card: Card): boolean {
    return this.topCard?.id === card.id;
  }

  /**
   * Cannot place cards directly on waste pile
   */
  canPlace(_cards: Card[]): boolean {
    return false;
  }

  /**
   * Get the top visible cards (for draw-3 display)
   * Returns up to 3 cards from the top
   */
  getVisibleCards(count: number = 3): Card[] {
    const start = Math.max(0, this.length - count);
    return this.cards.slice(start);
  }

  /**
   * Take all cards from waste (for recycling to stock)
   */
  takeAll(): Card[] {
    const cards = [...this.cards];
    this.clear();
    return cards;
  }
}
