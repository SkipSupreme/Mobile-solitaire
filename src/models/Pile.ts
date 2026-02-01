import { Card } from './Card';

export type PileType = 'tableau' | 'foundation' | 'stock' | 'waste';

export interface PileInfo {
  type: PileType;
  index: number;
}

export abstract class Pile {
  protected cards: Card[] = [];
  readonly type: PileType;
  readonly index: number;

  constructor(type: PileType, index: number) {
    this.type = type;
    this.index = index;
  }

  get length(): number {
    return this.cards.length;
  }

  get isEmpty(): boolean {
    return this.cards.length === 0;
  }

  get topCard(): Card | undefined {
    return this.cards[this.cards.length - 1];
  }

  getCards(): Card[] {
    return [...this.cards];
  }

  getCardAt(index: number): Card | undefined {
    return this.cards[index];
  }

  getCardIndex(card: Card): number {
    return this.cards.findIndex(c => c.id === card.id);
  }

  /**
   * Get all cards from a given card to the top of the pile
   */
  getCardsFrom(card: Card): Card[] {
    const index = this.getCardIndex(card);
    if (index === -1) return [];
    return this.cards.slice(index);
  }

  addCard(card: Card): void {
    this.cards.push(card);
  }

  addCards(cards: Card[]): void {
    this.cards.push(...cards);
  }

  removeCard(card: Card): boolean {
    const index = this.getCardIndex(card);
    if (index === -1) return false;
    this.cards.splice(index, 1);
    return true;
  }

  /**
   * Remove and return cards from given index to end
   */
  removeCardsFrom(index: number): Card[] {
    return this.cards.splice(index);
  }

  /**
   * Remove and return top card
   */
  pop(): Card | undefined {
    return this.cards.pop();
  }

  clear(): void {
    this.cards = [];
  }

  setCards(cards: Card[]): void {
    this.cards = [...cards];
  }

  getInfo(): PileInfo {
    return { type: this.type, index: this.index };
  }

  /**
   * Check if a card can be picked up from this pile
   */
  abstract canPickUp(card: Card): boolean;

  /**
   * Check if cards can be placed on this pile
   */
  abstract canPlace(cards: Card[]): boolean;
}
