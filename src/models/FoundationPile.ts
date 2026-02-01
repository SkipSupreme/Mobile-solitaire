import { Pile } from './Pile';
import { Card, Suit } from './Card';

export class FoundationPile extends Pile {
  private _suit: Suit | null = null;

  constructor(index: number) {
    super('foundation', index);
  }

  get suit(): Suit | null {
    return this._suit;
  }

  /**
   * Can only pick up the top card from foundation
   * (Usually you don't pick up from foundation, but it's allowed)
   */
  canPickUp(card: Card): boolean {
    return this.topCard?.id === card.id;
  }

  /**
   * Cards can be placed on foundation if:
   * - Pile is empty and card is an Ace (establishes the suit)
   * - Card matches suit and is one rank higher than top card
   */
  canPlace(cards: Card[]): boolean {
    // Only single cards can go to foundation
    if (cards.length !== 1) return false;

    const card = cards[0];

    if (this.isEmpty) {
      // Only Aces can start a foundation
      return card.isAce;
    }

    const topCard = this.topCard!;

    // Must be same suit and one rank higher
    return (
      card.suit === topCard.suit &&
      card.rank === topCard.rank + 1
    );
  }

  addCard(card: Card): void {
    if (this.isEmpty) {
      this._suit = card.suit;
    }
    super.addCard(card);
  }

  clear(): void {
    super.clear();
    this._suit = null;
  }

  /**
   * Check if foundation is complete (has all 13 cards)
   */
  get isComplete(): boolean {
    return this.length === 13;
  }
}
