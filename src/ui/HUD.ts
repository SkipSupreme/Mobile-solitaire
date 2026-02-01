import Konva from 'konva';
import { GameState } from '../core/GameState';
import { SCENE_WIDTH } from '../utils/constants';

export class HUD {
  private layer: Konva.Layer;
  private group: Konva.Group;

  private moveCountText: Konva.Text;
  private scoreText: Konva.Text;
  private timerText: Konva.Text;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  private onNewGame: () => void;
  private onUndo: () => void;

  constructor(
    layer: Konva.Layer,
    onNewGame: () => void,
    onUndo: () => void
  ) {
    this.layer = layer;
    this.onNewGame = onNewGame;
    this.onUndo = onUndo;

    this.group = new Konva.Group({
      x: 0,
      y: 0
    });

    // Initialize HUD elements
    this.moveCountText = this.createText('Moves: 0', SCENE_WIDTH - 200, 10);
    this.scoreText = this.createText('Score: 0', SCENE_WIDTH - 200, 30);
    this.timerText = this.createText('Time: 0:00', SCENE_WIDTH - 200, 50);

    // Create buttons
    this.createButton('New Game', SCENE_WIDTH - 95, 85, this.onNewGame);
    this.createButton('Undo', SCENE_WIDTH - 95, 115, this.onUndo);

    this.layer.add(this.group);
  }

  private createText(text: string, x: number, y: number): Konva.Text {
    const textNode = new Konva.Text({
      x,
      y,
      text,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fill: '#fff',
      shadowColor: 'black',
      shadowBlur: 2,
      shadowOffset: { x: 1, y: 1 },
      shadowOpacity: 0.5
    });

    this.group.add(textNode);
    return textNode;
  }

  private createButton(text: string, x: number, y: number, onClick: () => void): void {
    const buttonWidth = 80;
    const buttonHeight = 24;

    const buttonGroup = new Konva.Group({
      x,
      y
    });

    const background = new Konva.Rect({
      width: buttonWidth,
      height: buttonHeight,
      fill: 'rgba(255, 255, 255, 0.2)',
      stroke: 'rgba(255, 255, 255, 0.4)',
      strokeWidth: 1,
      cornerRadius: 4
    });

    const buttonText = new Konva.Text({
      text,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fill: '#fff',
      width: buttonWidth,
      height: buttonHeight,
      align: 'center',
      verticalAlign: 'middle',
      padding: 5
    });

    buttonGroup.add(background, buttonText);

    // Hover effects
    buttonGroup.on('mouseenter', () => {
      background.fill('rgba(255, 255, 255, 0.3)');
      this.layer.batchDraw();
      document.body.style.cursor = 'pointer';
    });

    buttonGroup.on('mouseleave', () => {
      background.fill('rgba(255, 255, 255, 0.2)');
      this.layer.batchDraw();
      document.body.style.cursor = 'default';
    });

    buttonGroup.on('click tap', onClick);

    this.group.add(buttonGroup);
  }

  /**
   * Update HUD with current game state
   */
  update(state: GameState): void {
    this.moveCountText.text(`Moves: ${state.moveCount}`);
    this.scoreText.text(`Score: ${state.score}`);

    // Start/restart timer
    this.startTimer(state);

    this.layer.batchDraw();
  }

  private startTimer(state: GameState): void {
    // Clear existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Update timer every second
    this.timerInterval = setInterval(() => {
      const elapsed = state.elapsedTime;
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.timerText.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
      this.layer.batchDraw();
    }, 1000);
  }

  /**
   * Stop the timer
   */
  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Show win message
   */
  showWinMessage(): void {
    this.stopTimer();

    const winText = new Konva.Text({
      x: SCENE_WIDTH / 2,
      y: 300,
      text: '🎉 You Win! 🎉',
      fontSize: 48,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      fill: '#ffd700',
      stroke: '#000',
      strokeWidth: 2,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: { x: 3, y: 3 },
      shadowOpacity: 0.5,
      offsetX: 120
    });

    this.group.add(winText);
    this.layer.batchDraw();

    // Animate win text
    winText.to({
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 0.5,
      easing: Konva.Easings.EaseInOut,
      onFinish: () => {
        winText.to({
          scaleX: 1,
          scaleY: 1,
          duration: 0.5,
          easing: Konva.Easings.EaseInOut
        });
      }
    });
  }

  /**
   * Destroy HUD
   */
  destroy(): void {
    this.stopTimer();
    this.group.destroy();
  }
}
