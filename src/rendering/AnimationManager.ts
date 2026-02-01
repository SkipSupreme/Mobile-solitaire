import Konva from 'konva';
import { GameState } from '../core/GameState';
import { BoardRenderer } from './BoardRenderer';
import { CardSprite } from './CardSprite';
import { TIMING, SCENE_HEIGHT } from '../utils/constants';

export class AnimationManager {
  private renderer: BoardRenderer;

  constructor(renderer: BoardRenderer) {
    this.renderer = renderer;
  }

  /**
   * Play deal animation
   */
  async playDealAnimation(state: GameState): Promise<void> {
    const delay = TIMING.DEAL_STAGGER * 1000;

    // Animate tableau cards being dealt
    for (let col = 0; col < 7; col++) {
      const pile = state.tableau[col];
      const cards = pile.getCards();

      for (let row = 0; row < cards.length; row++) {
        const card = cards[row];
        const sprite = this.renderer.getSprite(card);
        if (sprite) {
          await this.wait(delay);
          sprite.moveToTop();
        }
      }
    }
  }

  /**
   * Play win animation - cards cascade off screen
   */
  async playWinAnimation(state: GameState): Promise<void> {
    const allCards: CardSprite[] = [];

    // Collect all cards from foundations
    for (const foundation of state.foundations) {
      for (const card of foundation.getCards()) {
        const sprite = this.renderer.getSprite(card);
        if (sprite) {
          allCards.push(sprite);
        }
      }
    }

    // Animate each card flying off screen
    const staggerMs = TIMING.WIN_CARD_STAGGER * 1000;

    for (let i = 0; i < allCards.length; i++) {
      setTimeout(() => {
        const sprite = allCards[i];
        const startX = sprite.group.x();
        const randomX = startX + (Math.random() - 0.5) * 400;
        const randomRotation = (Math.random() - 0.5) * 360;

        sprite.group.to({
          y: SCENE_HEIGHT + 150,
          x: randomX,
          rotation: randomRotation,
          duration: 1,
          easing: Konva.Easings.EaseIn
        });
      }, i * staggerMs);
    }

    // Wait for all animations to complete
    await this.wait((allCards.length * staggerMs) + 1000);
  }

  /**
   * Animate card movement
   */
  async animateMove(
    sprite: CardSprite,
    targetX: number,
    targetY: number,
    duration: number = TIMING.MOVE_DURATION
  ): Promise<void> {
    return sprite.moveTo(targetX, targetY, duration);
  }

  /**
   * Animate card flip
   */
  async animateFlip(sprite: CardSprite): Promise<void> {
    return sprite.flip();
  }

  /**
   * Animate multiple cards moving together
   */
  async animateStackMove(
    sprites: CardSprite[],
    baseX: number,
    baseY: number,
    stackOffset: number = 25
  ): Promise<void> {
    const promises = sprites.map((sprite, index) => {
      const targetY = baseY + index * stackOffset;
      return sprite.moveTo(baseX, targetY);
    });

    await Promise.all(promises);
  }

  /**
   * Bounce animation for hints
   */
  async playHintBounce(sprite: CardSprite): Promise<void> {
    const originalY = sprite.group.y();

    sprite.group.to({
      y: originalY - 10,
      duration: 0.1,
      easing: Konva.Easings.EaseOut,
      onFinish: () => {
        sprite.group.to({
          y: originalY,
          duration: 0.1,
          easing: Konva.Easings.EaseIn
        });
      }
    });

    await this.wait(200);
  }

  /**
   * Highlight animation for valid moves
   */
  async playHighlight(sprite: CardSprite, duration: number = 500): Promise<void> {
    // Scale up slightly to highlight
    sprite.group.to({
      scaleX: 1.05,
      scaleY: 1.05,
      duration: duration / 2000
    });

    await this.wait(duration / 2);

    sprite.group.to({
      scaleX: 1,
      scaleY: 1,
      duration: duration / 2000
    });

    await this.wait(duration / 2);
  }

  /**
   * Utility: wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
