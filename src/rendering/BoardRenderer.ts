import Konva from 'konva';
import { GameState } from '../core/GameState';
import { CardSprite } from './CardSprite';
import { Card } from '../models/Card';
import { Pile, PileType } from '../models/Pile';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  TABLEAU_OFFSET,
  TABLEAU_OFFSET_FACE_DOWN,
  FOUNDATION_X_START,
  PILE_SPACING,
  TOP_ROW_Y,
  TABLEAU_Y,
  STOCK_X,
  WASTE_X,
  COLORS
} from '../utils/constants';

export interface PilePosition {
  x: number;
  y: number;
  type: PileType;
  index: number;
}

export class BoardRenderer {
  private layer: Konva.Layer;
  private backgroundLayer: Konva.Layer;
  private cardSprites: Map<string, CardSprite> = new Map();
  private pileOutlines: Map<string, Konva.Rect> = new Map();

  // Pile positions cache
  readonly pilePositions: PilePosition[] = [];

  constructor(backgroundLayer: Konva.Layer, pilesLayer: Konva.Layer) {
    this.backgroundLayer = backgroundLayer;
    this.layer = pilesLayer;
    this.calculatePilePositions();
  }

  private calculatePilePositions(): void {
    // Stock position
    this.pilePositions.push({
      x: STOCK_X,
      y: TOP_ROW_Y,
      type: 'stock',
      index: 0
    });

    // Waste position
    this.pilePositions.push({
      x: WASTE_X,
      y: TOP_ROW_Y,
      type: 'waste',
      index: 0
    });

    // Foundation positions (4 piles)
    for (let i = 0; i < 4; i++) {
      this.pilePositions.push({
        x: FOUNDATION_X_START + i * PILE_SPACING,
        y: TOP_ROW_Y,
        type: 'foundation',
        index: i
      });
    }

    // Tableau positions (7 piles)
    for (let i = 0; i < 7; i++) {
      this.pilePositions.push({
        x: STOCK_X + i * PILE_SPACING,
        y: TABLEAU_Y,
        type: 'tableau',
        index: i
      });
    }
  }

  /**
   * Get pile position by type and index
   */
  getPilePosition(type: PileType, index: number): PilePosition | undefined {
    return this.pilePositions.find(p => p.type === type && p.index === index);
  }

  /**
   * Render the background and empty pile outlines
   */
  renderBackground(): void {
    // Felt background
    const felt = new Konva.Rect({
      x: 0,
      y: 0,
      width: this.backgroundLayer.getStage()!.width(),
      height: this.backgroundLayer.getStage()!.height(),
      fill: COLORS.FELT_GREEN
    });
    this.backgroundLayer.add(felt);

    // Render pile outlines
    for (const pos of this.pilePositions) {
      const outline = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        stroke: COLORS.PILE_OUTLINE,
        strokeWidth: 2,
        cornerRadius: 6,
        dash: pos.type === 'stock' ? undefined : [5, 5],
        listening: false
      });

      // Add foundation suit indicator
      if (pos.type === 'foundation') {
        const suits = ['♠', '♥', '♦', '♣'];
        const colors = [COLORS.BLACK_SUIT, COLORS.RED_SUIT, COLORS.RED_SUIT, COLORS.BLACK_SUIT];
        const suitText = new Konva.Text({
          x: pos.x + CARD_WIDTH / 2,
          y: pos.y + CARD_HEIGHT / 2,
          text: suits[pos.index],
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          fill: colors[pos.index],
          opacity: 0.3,
          offsetX: 8,
          offsetY: 12,
          listening: false
        });
        this.backgroundLayer.add(suitText);
      }

      const key = `${pos.type}-${pos.index}`;
      this.pileOutlines.set(key, outline);
      this.backgroundLayer.add(outline);
    }

    this.backgroundLayer.batchDraw();
  }

  /**
   * Create or get card sprite
   */
  getOrCreateSprite(card: Card): CardSprite {
    let sprite = this.cardSprites.get(card.id);
    if (!sprite) {
      sprite = new CardSprite(card);
      this.cardSprites.set(card.id, sprite);
      this.layer.add(sprite.group);
    }
    return sprite;
  }

  /**
   * Get sprite for a card
   */
  getSprite(card: Card): CardSprite | undefined {
    return this.cardSprites.get(card.id);
  }

  /**
   * Calculate Y position for a card in a tableau pile
   */
  getTableauCardY(pileY: number, cardIndex: number, pile: Pile): number {
    let y = pileY;
    const cards = pile.getCards();

    for (let i = 0; i < cardIndex; i++) {
      const offset = cards[i].faceUp ? TABLEAU_OFFSET : TABLEAU_OFFSET_FACE_DOWN;
      y += offset;
    }

    return y;
  }

  /**
   * Render all cards for the current game state
   */
  render(state: GameState): void {
    // Render stock pile
    this.renderStockPile(state);

    // Render waste pile
    this.renderWastePile(state);

    // Render foundation piles
    for (let i = 0; i < 4; i++) {
      this.renderFoundationPile(state, i);
    }

    // Render tableau piles
    for (let i = 0; i < 7; i++) {
      this.renderTableauPile(state, i);
    }

    this.layer.batchDraw();
  }

  private renderStockPile(state: GameState): void {
    const pos = this.getPilePosition('stock', 0)!;
    const cards = state.stock.getCards();

    cards.forEach((card, index) => {
      const sprite = this.getOrCreateSprite(card);
      sprite.setPosition(pos.x, pos.y);
      sprite.setFaceUp(false);
      sprite.group.zIndex(index);
    });
  }

  private renderWastePile(state: GameState): void {
    const pos = this.getPilePosition('waste', 0)!;
    const cards = state.waste.getCards();

    // For draw-3, show up to 3 cards spread out
    const visibleCount = Math.min(3, cards.length);
    const spreadOffset = 15;

    cards.forEach((card, index) => {
      const sprite = this.getOrCreateSprite(card);
      const isVisible = index >= cards.length - visibleCount;
      const visibleIndex = index - (cards.length - visibleCount);

      const x = isVisible ? pos.x + visibleIndex * spreadOffset : pos.x;
      sprite.setPosition(x, pos.y);
      sprite.setFaceUp(true);
      sprite.group.zIndex(index);
    });
  }

  private renderFoundationPile(state: GameState, pileIndex: number): void {
    const pos = this.getPilePosition('foundation', pileIndex)!;
    const pile = state.foundations[pileIndex];
    const cards = pile.getCards();

    cards.forEach((card, index) => {
      const sprite = this.getOrCreateSprite(card);
      sprite.setPosition(pos.x, pos.y);
      sprite.setFaceUp(true);
      sprite.group.zIndex(index);
    });
  }

  private renderTableauPile(state: GameState, pileIndex: number): void {
    const pos = this.getPilePosition('tableau', pileIndex)!;
    const pile = state.tableau[pileIndex];
    const cards = pile.getCards();

    cards.forEach((card, index) => {
      const sprite = this.getOrCreateSprite(card);
      const y = this.getTableauCardY(pos.y, index, pile);
      sprite.setPosition(pos.x, y);
      sprite.setFaceUp(card.faceUp);
      sprite.group.zIndex(index);
    });
  }

  /**
   * Update a single pile's rendering
   */
  updatePile(state: GameState, type: PileType, index: number): void {
    switch (type) {
      case 'stock':
        this.renderStockPile(state);
        break;
      case 'waste':
        this.renderWastePile(state);
        break;
      case 'foundation':
        this.renderFoundationPile(state, index);
        break;
      case 'tableau':
        this.renderTableauPile(state, index);
        break;
    }
    this.layer.batchDraw();
  }

  /**
   * Find pile at a given position
   */
  findPileAtPosition(x: number, y: number): PilePosition | undefined {
    // Check in reverse order (tableau first, then foundations, then stock/waste)
    // Prioritize tableau because cards stack vertically

    for (const pos of this.pilePositions) {
      let hitHeight = CARD_HEIGHT;

      // Tableau piles have extended hit area due to stacking
      if (pos.type === 'tableau') {
        hitHeight = CARD_HEIGHT + 12 * TABLEAU_OFFSET; // Approximate max stack
      }

      if (
        x >= pos.x &&
        x <= pos.x + CARD_WIDTH &&
        y >= pos.y &&
        y <= pos.y + hitHeight
      ) {
        return pos;
      }
    }

    return undefined;
  }

  /**
   * Highlight a pile (for valid drop target)
   */
  highlightPile(type: PileType, index: number, highlight: boolean): void {
    const key = `${type}-${index}`;
    const outline = this.pileOutlines.get(key);
    if (outline) {
      outline.stroke(highlight ? COLORS.PILE_OUTLINE_HOVER : COLORS.PILE_OUTLINE);
      outline.strokeWidth(highlight ? 3 : 2);
      this.backgroundLayer.batchDraw();
    }
  }

  /**
   * Clear all pile highlights
   */
  clearHighlights(): void {
    this.pileOutlines.forEach(outline => {
      outline.stroke(COLORS.PILE_OUTLINE);
      outline.strokeWidth(2);
    });
    this.backgroundLayer.batchDraw();
  }

  /**
   * Remove all card sprites
   */
  clear(): void {
    this.cardSprites.forEach(sprite => sprite.destroy());
    this.cardSprites.clear();
    this.layer.batchDraw();
  }

  /**
   * Get the layer
   */
  getLayer(): Konva.Layer {
    return this.layer;
  }
}
