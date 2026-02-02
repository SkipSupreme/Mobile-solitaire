import Konva from 'konva';
import { GameState } from '../core/GameState';
import { BoardRenderer, PilePosition } from '../rendering/BoardRenderer';
import { CardSprite } from '../rendering/CardSprite';
import { Card } from '../models/Card';
import { Pile } from '../models/Pile';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  TABLEAU_OFFSET,
  MIN_OVERLAP_FOR_DROP,
  TIMING
} from '../utils/constants';

interface DragState {
  sprites: CardSprite[];
  cards: Card[];
  sourcePile: Pile;
  originalPositions: { x: number; y: number }[];
  validTargets: PilePosition[];
}

export class DragHandler {
  private state: GameState;
  private renderer: BoardRenderer;
  private pilesLayer: Konva.Layer;
  private dragLayer: Konva.Layer;
  private onMoveComplete: (cards: Card[], from: Pile, to: Pile) => void;

  private dragState: DragState | null = null;
  private lastTapTime: number = 0;

  constructor(
    state: GameState,
    renderer: BoardRenderer,
    pilesLayer: Konva.Layer,
    dragLayer: Konva.Layer,
    onMoveComplete: (cards: Card[], from: Pile, to: Pile) => void
  ) {
    this.state = state;
    this.renderer = renderer;
    this.pilesLayer = pilesLayer;
    this.dragLayer = dragLayer;
    this.onMoveComplete = onMoveComplete;
  }

  /**
   * Set up drag handlers for all moveable cards
   */
  setupDragHandlers(): void {
    // Clear existing handlers
    this.clearDragHandlers();

    // Set up handlers for waste pile (top card only)
    if (!this.state.waste.isEmpty) {
      const topCard = this.state.waste.topCard!;
      this.setupCardDrag(topCard, this.state.waste);
    }

    // Set up handlers for foundation piles (top card only)
    for (const foundation of this.state.foundations) {
      if (!foundation.isEmpty) {
        const topCard = foundation.topCard!;
        this.setupCardDrag(topCard, foundation);
      }
    }

    // Set up handlers for tableau piles (all face-up cards)
    for (const tableau of this.state.tableau) {
      const cards = tableau.getCards();
      for (const card of cards) {
        if (card.faceUp) {
          this.setupCardDrag(card, tableau);
        }
      }
    }
  }

  private clearDragHandlers(): void {
    // Remove draggable from all cards
    for (const pile of this.state.getAllPiles()) {
      for (const card of pile.getCards()) {
        const sprite = this.renderer.getSprite(card);
        if (sprite) {
          sprite.setDraggable(false);
          sprite.group.off('dragstart dragmove dragend click tap');
        }
      }
    }
  }

  private setupCardDrag(card: Card, pile: Pile): void {
    const sprite = this.renderer.getSprite(card);
    if (!sprite) return;

    sprite.setDraggable(true);

    sprite.group.on('dragstart', (e) => this.onDragStart(e, card, pile));
    sprite.group.on('dragmove', () => this.onDragMove());
    sprite.group.on('dragend', () => this.onDragEnd());
    sprite.group.on('click tap', () => this.onCardTap(card, pile));
  }

  private onDragStart(_e: Konva.KonvaEventObject<DragEvent | TouchEvent>, card: Card, pile: Pile): void {
    // Get all cards to move (card and all cards on top of it)
    const cards = pile.getCardsFrom(card);
    const sprites: CardSprite[] = [];
    const originalPositions: { x: number; y: number }[] = [];

    for (const c of cards) {
      const sprite = this.renderer.getSprite(c);
      if (sprite) {
        sprites.push(sprite);
        originalPositions.push(sprite.getPosition());

        // Move to drag layer
        sprite.group.moveTo(this.dragLayer);
        sprite.setDragHighlight(true);
      }
    }

    // Calculate valid drop targets
    const validTargets = this.findValidTargets(cards);

    this.dragState = {
      sprites,
      cards,
      sourcePile: pile,
      originalPositions,
      validTargets
    };

    // Highlight valid targets
    for (const target of validTargets) {
      this.renderer.highlightPile(target.type, target.index, true);
    }

    this.dragLayer.batchDraw();
  }

  private onDragMove(): void {
    if (!this.dragState) return;

    const mainSprite = this.dragState.sprites[0];
    const mainPos = mainSprite.getPosition();

    // Move stacked cards to follow the main card
    for (let i = 1; i < this.dragState.sprites.length; i++) {
      const offsetY = i * TABLEAU_OFFSET;
      this.dragState.sprites[i].setPosition(mainPos.x, mainPos.y + offsetY);
    }

    this.dragLayer.batchDraw();
  }

  private onDragEnd(): void {
    if (!this.dragState) return;

    const { sprites, cards, sourcePile, originalPositions, validTargets } = this.dragState;

    // Clear highlights
    this.renderer.clearHighlights();

    // Find drop target
    const mainSprite = sprites[0];
    const dropTarget = this.findDropTarget(mainSprite, validTargets);

    if (dropTarget) {
      // Valid drop - execute move
      const targetPile = this.state.getPile(dropTarget.type, dropTarget.index);
      if (targetPile) {
        // Move sprites back to piles layer
        for (const sprite of sprites) {
          sprite.group.moveTo(this.pilesLayer);
          sprite.setDragHighlight(false);
        }

        // Execute the move
        this.onMoveComplete(cards, sourcePile, targetPile);
      }
    } else {
      // Invalid drop - animate back to original positions
      for (let i = 0; i < sprites.length; i++) {
        const sprite = sprites[i];
        sprite.setDragHighlight(false);

        sprite.moveTo(originalPositions[i].x, originalPositions[i].y, TIMING.SNAP_BACK_DURATION)
          .then(() => {
            sprite.group.moveTo(this.pilesLayer);
            this.pilesLayer.batchDraw();
          });
      }
    }

    this.dragState = null;
    this.dragLayer.batchDraw();
  }

  private onCardTap(card: Card, pile: Pile): void {
    const now = Date.now();
    const isDoubleTap = now - this.lastTapTime < 300;
    this.lastTapTime = now;

    if (isDoubleTap) {
      // Double-tap: try to auto-move to foundation
      this.tryAutoMoveToFoundation(card, pile);
    }
  }

  /**
   * Try to automatically move a card to a foundation pile
   */
  private tryAutoMoveToFoundation(card: Card, pile: Pile): void {
    // Only single cards can go to foundation
    const cardsAbove = pile.getCardsFrom(card);
    if (cardsAbove.length !== 1) return;

    // Find a valid foundation
    for (const foundation of this.state.foundations) {
      if (foundation.canPlace([card])) {
        this.onMoveComplete([card], pile, foundation);
        return;
      }
    }
  }

  /**
   * Find all valid drop targets for the given cards
   */
  private findValidTargets(cards: Card[]): PilePosition[] {
    const targets: PilePosition[] = [];

    // Check foundations (only single cards)
    if (cards.length === 1) {
      for (const foundation of this.state.foundations) {
        if (foundation.canPlace(cards)) {
          const pos = this.renderer.getPilePosition('foundation', foundation.index);
          if (pos) targets.push(pos);
        }
      }
    }

    // Check tableau piles
    for (const tableau of this.state.tableau) {
      if (tableau.canPlace(cards)) {
        const pos = this.renderer.getPilePosition('tableau', tableau.index);
        if (pos) targets.push(pos);
      }
    }

    return targets;
  }

  /**
   * Find the drop target based on card position and valid targets
   */
  private findDropTarget(sprite: CardSprite, validTargets: PilePosition[]): PilePosition | undefined {
    const cardRect = {
      x: sprite.group.x(),
      y: sprite.group.y(),
      width: CARD_WIDTH,
      height: CARD_HEIGHT
    };

    let bestTarget: PilePosition | undefined;
    let bestOverlap = 0;

    for (const target of validTargets) {
      const targetRect = {
        x: target.x,
        y: target.y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT
      };

      // For tableau, extend the target area to include stacked cards
      if (target.type === 'tableau') {
        const pile = this.state.tableau[target.index];
        const stackHeight = pile.length * TABLEAU_OFFSET;
        targetRect.height += stackHeight;
        // Don't move Y - we want the hit area to cover from base to top of stack
      }

      const overlap = this.calculateOverlap(cardRect, targetRect);
      if (overlap > bestOverlap && overlap >= MIN_OVERLAP_FOR_DROP) {
        bestOverlap = overlap;
        bestTarget = target;
      }
    }

    return bestTarget;
  }

  /**
   * Calculate overlap percentage between two rectangles
   */
  private calculateOverlap(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ): number {
    const x1 = Math.max(rect1.x, rect2.x);
    const y1 = Math.max(rect1.y, rect2.y);
    const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
    const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

    if (x2 < x1 || y2 < y1) return 0;

    const intersectionArea = (x2 - x1) * (y2 - y1);
    const rect1Area = rect1.width * rect1.height;

    return intersectionArea / rect1Area;
  }
}
