import { Card } from '../models/Card';
import { Deck } from '../models/Deck';
import { Pile, PileType } from '../models/Pile';
import { TableauPile } from '../models/TableauPile';
import { FoundationPile } from '../models/FoundationPile';
import { StockPile } from '../models/StockPile';
import { WastePile } from '../models/WastePile';
import { DRAW_COUNT } from '../utils/constants';

export interface MoveInfo {
  cards: Card[];
  fromPile: Pile;
  toPile: Pile;
  cardIndex: number;
  flippedCard?: Card;
}

export class GameState {
  readonly tableau: TableauPile[];
  readonly foundations: FoundationPile[];
  readonly stock: StockPile;
  readonly waste: WastePile;

  private _moveCount: number = 0;
  private _score: number = 0;
  private _startTime: number = 0;

  constructor(drawCount: number = DRAW_COUNT) {
    // Initialize 7 tableau piles
    this.tableau = Array.from({ length: 7 }, (_, i) => new TableauPile(i));

    // Initialize 4 foundation piles
    this.foundations = Array.from({ length: 4 }, (_, i) => new FoundationPile(i));

    // Initialize stock and waste
    this.stock = new StockPile(drawCount);
    this.waste = new WastePile();
  }

  get moveCount(): number {
    return this._moveCount;
  }

  get score(): number {
    return this._score;
  }

  get elapsedTime(): number {
    if (this._startTime === 0) return 0;
    return Math.floor((Date.now() - this._startTime) / 1000);
  }

  /**
   * Deal a new game
   */
  deal(): void {
    // Clear all piles
    this.tableau.forEach(pile => pile.clear());
    this.foundations.forEach(pile => pile.clear());
    this.stock.clear();
    this.waste.clear();

    // Create and deal a new deck
    const deck = new Deck();
    const { tableau, stock } = deck.deal();

    // Populate tableau piles
    for (let i = 0; i < 7; i++) {
      this.tableau[i].setCards(tableau[i]);
    }

    // Populate stock
    this.stock.setCards(stock);

    // Reset game stats
    this._moveCount = 0;
    this._score = 0;
    this._startTime = Date.now();
  }

  /**
   * Get a pile by type and index
   */
  getPile(type: PileType, index: number): Pile | undefined {
    switch (type) {
      case 'tableau':
        return this.tableau[index];
      case 'foundation':
        return this.foundations[index];
      case 'stock':
        return this.stock;
      case 'waste':
        return this.waste;
      default:
        return undefined;
    }
  }

  /**
   * Get all piles
   */
  getAllPiles(): Pile[] {
    return [
      ...this.tableau,
      ...this.foundations,
      this.stock,
      this.waste
    ];
  }

  /**
   * Find which pile contains a card
   */
  findCardPile(card: Card): Pile | undefined {
    return this.getAllPiles().find(pile => pile.getCardIndex(card) !== -1);
  }

  /**
   * Draw from stock to waste
   */
  drawFromStock(): Card[] {
    if (this.stock.isEmpty) {
      // Recycle waste to stock
      if (!this.waste.isEmpty) {
        const wasteCards = this.waste.takeAll();
        this.stock.recycleFromWaste(wasteCards);
        return []; // Return empty to indicate recycle
      }
      return [];
    }

    const drawnCards = this.stock.draw();
    drawnCards.forEach(card => this.waste.addCard(card));
    return drawnCards;
  }

  /**
   * Execute a move
   */
  executeMove(cards: Card[], fromPile: Pile, toPile: Pile): MoveInfo {
    const cardIndex = fromPile.getCardIndex(cards[0]);

    // Remove cards from source pile
    fromPile.removeCardsFrom(cardIndex);

    // Add cards to destination pile
    toPile.addCards(cards);

    // Flip top card if moving from tableau
    let flippedCard: Card | undefined;
    if (fromPile instanceof TableauPile) {
      flippedCard = fromPile.revealTopCard();
    }

    // Update stats
    this._moveCount++;
    this.updateScore(fromPile, toPile);

    return { cards, fromPile, toPile, cardIndex, flippedCard };
  }

  /**
   * Undo a move
   */
  undoMove(moveInfo: MoveInfo): void {
    const { cards, fromPile, toPile, cardIndex, flippedCard } = moveInfo;

    // Unflip the card that was flipped
    if (flippedCard) {
      flippedCard.faceUp = false;
    }

    // Remove cards from destination
    cards.forEach(card => toPile.removeCard(card));

    // Return cards to source at original position
    const currentCards = fromPile.getCards();
    const before = currentCards.slice(0, cardIndex);
    const after = currentCards.slice(cardIndex);
    fromPile.setCards([...before, ...cards, ...after]);

    this._moveCount++;
  }

  /**
   * Update score based on move
   */
  private updateScore(fromPile: Pile, toPile: Pile): void {
    // Moving to foundation: +10 points
    if (toPile instanceof FoundationPile) {
      this._score += 10;
    }
    // Moving from waste to tableau: +5 points
    else if (fromPile instanceof WastePile && toPile instanceof TableauPile) {
      this._score += 5;
    }
    // Moving from foundation to tableau: -15 points
    else if (fromPile instanceof FoundationPile && toPile instanceof TableauPile) {
      this._score -= 15;
    }
    // Revealing a card: +5 points (handled in revealTopCard would need separate tracking)
  }

  /**
   * Check if game is won
   */
  isWon(): boolean {
    return this.foundations.every(f => f.isComplete);
  }

  /**
   * Check if auto-complete is possible
   * (All cards are face-up)
   */
  canAutoComplete(): boolean {
    // All tableau cards are face-up
    const allTableauFaceUp = this.tableau.every(pile =>
      pile.getCards().every(card => card.faceUp)
    );

    // Stock and waste are empty
    const stockWasteEmpty = this.stock.isEmpty && this.waste.isEmpty;

    return allTableauFaceUp || stockWasteEmpty;
  }

  /**
   * Get the next card that can be moved to foundation for auto-complete
   */
  getNextAutoCompleteCard(): { card: Card; pile: Pile } | undefined {
    // Check waste first
    if (!this.waste.isEmpty) {
      const card = this.waste.topCard!;
      const targetFoundation = this.foundations.find(f => f.canPlace([card]));
      if (targetFoundation) {
        return { card, pile: this.waste };
      }
    }

    // Check tableau piles
    for (const pile of this.tableau) {
      if (!pile.isEmpty) {
        const card = pile.topCard!;
        const targetFoundation = this.foundations.find(f => f.canPlace([card]));
        if (targetFoundation) {
          return { card, pile };
        }
      }
    }

    return undefined;
  }
}
