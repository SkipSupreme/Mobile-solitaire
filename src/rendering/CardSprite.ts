import Konva from 'konva';
import { Card } from '../models/Card';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  COLORS,
  SUIT_SYMBOLS,
  RANK_DISPLAY,
  TIMING
} from '../utils/constants';

export class CardSprite {
  readonly group: Konva.Group;
  readonly card: Card;

  private background: Konva.Rect;
  private faceGroup: Konva.Group;
  private backGroup: Konva.Group;

  constructor(card: Card, x: number = 0, y: number = 0) {
    this.card = card;

    this.group = new Konva.Group({
      x,
      y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      draggable: false // Controlled by DragHandler
    });

    // Store reference to sprite on group for easy lookup
    this.group.setAttr('cardSprite', this);
    this.group.setAttr('cardData', card);

    // Create card background (shadow and base)
    this.background = new Konva.Rect({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fill: COLORS.CARD_FACE,
      cornerRadius: 6,
      stroke: '#aaa',
      strokeWidth: 1,
      shadowColor: COLORS.SHADOW,
      shadowBlur: 4,
      shadowOffset: { x: 2, y: 2 },
      shadowOpacity: 0.3
    });
    this.group.add(this.background);

    // Create face and back groups
    this.faceGroup = this.createFaceGroup();
    this.backGroup = this.createBackGroup();

    this.group.add(this.faceGroup);
    this.group.add(this.backGroup);

    // Set initial visibility
    this.updateVisibility();
  }

  private createFaceGroup(): Konva.Group {
    const group = new Konva.Group();
    const color = this.card.isRed ? COLORS.RED_SUIT : COLORS.BLACK_SUIT;
    const symbol = SUIT_SYMBOLS[this.card.suit];
    const rankText = RANK_DISPLAY[this.card.rank];

    // Top-left rank and suit
    const topRank = new Konva.Text({
      x: 4,
      y: 4,
      text: rankText,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      fill: color
    });

    const topSuit = new Konva.Text({
      x: 4,
      y: 18,
      text: symbol,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fill: color
    });

    // Bottom-right rank and suit (rotated)
    const bottomRank = new Konva.Text({
      x: CARD_WIDTH - 4,
      y: CARD_HEIGHT - 4,
      text: rankText,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      fill: color,
      rotation: 180
    });

    const bottomSuit = new Konva.Text({
      x: CARD_WIDTH - 4,
      y: CARD_HEIGHT - 18,
      text: symbol,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fill: color,
      rotation: 180
    });

    // Center suit symbol (larger)
    const centerSuit = new Konva.Text({
      x: CARD_WIDTH / 2,
      y: CARD_HEIGHT / 2,
      text: symbol,
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      fill: color,
      offsetX: 10,
      offsetY: 16
    });

    group.add(topRank, topSuit, bottomRank, bottomSuit, centerSuit);
    return group;
  }

  private createBackGroup(): Konva.Group {
    const group = new Konva.Group();

    // Back background
    const back = new Konva.Rect({
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fill: COLORS.CARD_BACK,
      cornerRadius: 6
    });

    // Pattern on back
    const pattern = new Konva.Rect({
      x: 6,
      y: 6,
      width: CARD_WIDTH - 12,
      height: CARD_HEIGHT - 12,
      fill: COLORS.CARD_BACK_PATTERN,
      cornerRadius: 4,
      stroke: '#fff',
      strokeWidth: 1,
      opacity: 0.3
    });

    // Diamond pattern in center
    const diamond = new Konva.Line({
      points: [
        CARD_WIDTH / 2, 15,           // top
        CARD_WIDTH - 15, CARD_HEIGHT / 2, // right
        CARD_WIDTH / 2, CARD_HEIGHT - 15, // bottom
        15, CARD_HEIGHT / 2           // left
      ],
      closed: true,
      fill: COLORS.CARD_BACK,
      stroke: 'rgba(255,255,255,0.4)',
      strokeWidth: 2
    });

    group.add(back, pattern, diamond);
    return group;
  }

  private updateVisibility(): void {
    this.faceGroup.visible(this.card.faceUp);
    this.backGroup.visible(!this.card.faceUp);
    this.background.visible(this.card.faceUp);
  }

  /**
   * Set face-up state and update visibility
   */
  setFaceUp(faceUp: boolean): void {
    this.card.faceUp = faceUp;
    this.updateVisibility();
  }

  /**
   * Animate card flip
   */
  flip(duration: number = TIMING.FLIP_DURATION): Promise<void> {
    return new Promise((resolve) => {
      // Set transform origin to center
      const centerX = CARD_WIDTH / 2;
      this.group.offsetX(centerX);
      this.group.x(this.group.x() + centerX);

      // Scale to 0 on X axis
      this.group.to({
        scaleX: 0,
        duration: duration / 2,
        easing: Konva.Easings.EaseIn,
        onFinish: () => {
          // Toggle face up/down
          this.card.faceUp = !this.card.faceUp;
          this.updateVisibility();

          // Scale back
          this.group.to({
            scaleX: 1,
            duration: duration / 2,
            easing: Konva.Easings.EaseOut,
            onFinish: () => {
              // Reset transform origin
              this.group.x(this.group.x() - centerX);
              this.group.offsetX(0);
              resolve();
            }
          });
        }
      });
    });
  }

  /**
   * Animate movement to new position
   */
  moveTo(x: number, y: number, duration: number = TIMING.MOVE_DURATION): Promise<void> {
    return new Promise((resolve) => {
      this.group.to({
        x,
        y,
        duration,
        easing: Konva.Easings.EaseOut,
        onFinish: resolve
      });
    });
  }

  /**
   * Set position immediately
   */
  setPosition(x: number, y: number): void {
    this.group.x(x);
    this.group.y(y);
  }

  /**
   * Get current position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.group.x(), y: this.group.y() };
  }

  /**
   * Enable/disable dragging
   */
  setDraggable(draggable: boolean): void {
    this.group.draggable(draggable);
  }

  /**
   * Set visual highlight for drag state
   */
  setDragHighlight(highlight: boolean): void {
    if (highlight) {
      this.group.opacity(0.85);
      this.background.shadowBlur(8);
      this.background.shadowOpacity(0.5);
    } else {
      this.group.opacity(1);
      this.background.shadowBlur(4);
      this.background.shadowOpacity(0.3);
    }
  }

  /**
   * Move to top of layer (z-index)
   */
  moveToTop(): void {
    this.group.moveToTop();
  }

  /**
   * Cache the group for better performance
   */
  cache(): void {
    this.group.cache({ pixelRatio: 2 });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.group.clearCache();
  }

  /**
   * Destroy the sprite
   */
  destroy(): void {
    this.group.destroy();
  }
}
