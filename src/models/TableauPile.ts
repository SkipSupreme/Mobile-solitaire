import { Pile } from './Pile';
import { Card } from './Card';

export class TableauPile extends Pile {
  constructor(index: number) {
    super('tableau', index);
  }

  /**
   * Can pick up a card if it's face-up
   * (All cards on top of it will also be picked up)
   */
  canPickUp(card: Card): boolean {
    const index = this.getCardIndex(card);
    if (index === -1) return false;
    return card.faceUp;
  }

  /**
   * Cards can be placed on tableau if:
   * - Pile is empty and bottom card is a King
   * - Top card is opposite color and one rank higher than card being placed
   */
  canPlace(cards: Card[]): boolean {
    if (cards.length === 0) return false;

    const cardToPlace = cards[0]; // Bottom card of the stack being moved

    if (this.isEmpty) {
      // Only Kings can go on empty tableau piles
      return cardToPlace.isKing;
    }

    const topCard = this.topCard!;

    // Must be opposite color and one rank lower
    return (
      cardToPlace.color !== topCard.color &&
      cardToPlace.rank === topCard.rank - 1
    );
  }

  /**
   * After removing cards, flip the new top card if it's face-down
   * Returns the card that was flipped, or undefined if none
   */
  revealTopCard(): Card | undefined {
    if (this.isEmpty) return undefined;

    const topCard = this.topCard!;
    if (!topCard.faceUp) {
      topCard.faceUp = true;
      return topCard;
    }
    return undefined;
  }

  /**
   * Get face-up cards (for rendering stacked display)
   */
  getFaceUpCards(): Card[] {
    return this.cards.filter(c => c.faceUp);
  }

  /**
   * Get count of face-down cards
   */
  get faceDownCount(): number {
    return this.cards.filter(c => !c.faceUp).length;
  }
}
