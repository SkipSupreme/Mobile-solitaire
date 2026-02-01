import { Pile } from './Pile';
import { Card } from './Card';
import { DRAW_COUNT } from '../utils/constants';

export class StockPile extends Pile {
  readonly drawCount: number;

  constructor(drawCount: number = DRAW_COUNT) {
    super('stock', 0);
    this.drawCount = drawCount;
  }

  /**
   * Cannot pick up cards from stock - must draw to waste
   */
  canPickUp(_card: Card): boolean {
    return false;
  }

  /**
   * Cannot place cards on stock pile
   */
  canPlace(_cards: Card[]): boolean {
    return false;
  }

  /**
   * Draw cards from stock
   * Returns the drawn cards (face-up)
   */
  draw(): Card[] {
    const count = Math.min(this.drawCount, this.length);
    const drawn: Card[] = [];

    for (let i = 0; i < count; i++) {
      const card = this.pop();
      if (card) {
        card.faceUp = true;
        drawn.push(card);
      }
    }

    return drawn;
  }

  /**
   * Recycle waste pile back to stock
   * Cards are flipped face-down and reversed
   */
  recycleFromWaste(wasteCards: Card[]): void {
    // Reverse the waste pile so the first drawn becomes the last in stock
    const reversed = [...wasteCards].reverse();
    reversed.forEach(card => {
      card.faceUp = false;
      this.addCard(card);
    });
  }
}
