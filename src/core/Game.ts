import Konva from 'konva';
import { GameState } from './GameState';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { DragHandler } from '../input/DragHandler';
import { CommandManager } from './CommandManager';
import { AnimationManager } from '../rendering/AnimationManager';
import { Card } from '../models/Card';
import { Pile } from '../models/Pile';
import { HUD } from '../ui/HUD';

export class Game {
  private pilesLayer: Konva.Layer;

  private state: GameState;
  private renderer: BoardRenderer;
  private dragHandler: DragHandler;
  private commandManager: CommandManager;
  private animationManager: AnimationManager;
  private hud: HUD;

  private isAnimating: boolean = false;

  constructor(
    _stage: Konva.Stage,
    backgroundLayer: Konva.Layer,
    pilesLayer: Konva.Layer,
    dragLayer: Konva.Layer
  ) {
    this.pilesLayer = pilesLayer;

    // Initialize game state
    this.state = new GameState();

    // Initialize renderer
    this.renderer = new BoardRenderer(backgroundLayer, pilesLayer);
    this.renderer.renderBackground();

    // Initialize animation manager
    this.animationManager = new AnimationManager(this.renderer);

    // Initialize command manager (for undo)
    this.commandManager = new CommandManager();

    // Initialize drag handler
    this.dragHandler = new DragHandler(
      this.state,
      this.renderer,
      pilesLayer,
      dragLayer,
      this.handleMove.bind(this)
    );

    // Initialize HUD
    this.hud = new HUD(
      this.pilesLayer,
      this.onNewGame.bind(this),
      this.onUndo.bind(this)
    );

    // Set up stock click handler
    this.setupStockClickHandler();
  }

  /**
   * Start a new game
   */
  newGame(): void {
    this.state.deal();
    this.renderer.clear();
    this.commandManager.clear();
    this.renderer.render(this.state);
    this.dragHandler.setupDragHandlers();
    this.hud.update(this.state);
  }

  /**
   * Handle a completed move
   */
  private handleMove(cards: Card[], fromPile: Pile, toPile: Pile): void {
    // Execute the move
    const moveInfo = this.state.executeMove(cards, fromPile, toPile);

    // Record for undo
    this.commandManager.recordMove(moveInfo);

    // Update rendering
    this.renderer.updatePile(this.state, fromPile.type, fromPile.index);
    this.renderer.updatePile(this.state, toPile.type, toPile.index);

    // Animate flip if card was revealed
    if (moveInfo.flippedCard) {
      const sprite = this.renderer.getSprite(moveInfo.flippedCard);
      if (sprite) {
        sprite.flip();
      }
    }

    // Update drag handlers for new state
    this.dragHandler.setupDragHandlers();

    // Update HUD
    this.hud.update(this.state);

    // Check for win
    if (this.state.isWon()) {
      this.handleWin();
    }
  }

  /**
   * Set up stock pile click handler
   */
  private setupStockClickHandler(): void {
    const stockPos = this.renderer.getPilePosition('stock', 0);
    if (!stockPos) return;

    // Create invisible click area over stock
    const clickArea = new Konva.Rect({
      x: stockPos.x,
      y: stockPos.y,
      width: 71,
      height: 96,
      fill: 'transparent'
    });

    clickArea.on('click tap', () => {
      this.drawFromStock();
    });

    this.pilesLayer.add(clickArea);
    clickArea.moveToBottom();
  }

  /**
   * Draw card(s) from stock to waste
   */
  private async drawFromStock(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    try {
      const stockEmpty = this.state.stock.isEmpty;
      const wasteEmpty = this.state.waste.isEmpty;

      if (stockEmpty && !wasteEmpty) {
        // Recycle waste to stock
        const wasteCards = this.state.waste.getCards();

        // Record the recycle as a special move
        this.commandManager.recordStockRecycle(wasteCards.length);

        this.state.drawFromStock(); // This handles the recycle

        // Animate cards moving back
        this.renderer.updatePile(this.state, 'stock', 0);
        this.renderer.updatePile(this.state, 'waste', 0);
      } else if (!stockEmpty) {
        // Draw cards to waste
        const drawnCards = this.state.drawFromStock();

        if (drawnCards.length > 0) {
          // Record the draw
          this.commandManager.recordStockDraw(drawnCards.length);

          // Update rendering
          this.renderer.updatePile(this.state, 'stock', 0);
          this.renderer.updatePile(this.state, 'waste', 0);

          // Animate the drawn cards
          for (const card of drawnCards) {
            const sprite = this.renderer.getSprite(card);
            if (sprite) {
              await sprite.flip(0.15);
            }
          }
        }
      }

      // Update drag handlers
      this.dragHandler.setupDragHandlers();
      this.hud.update(this.state);
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Handle undo action
   */
  private async onUndo(): Promise<void> {
    if (this.isAnimating) return;

    const command = this.commandManager.undo();
    if (!command) return;

    this.isAnimating = true;

    try {
      if (command.type === 'move') {
        // Undo a card move
        this.state.undoMove(command.moveInfo!);

        // Update affected piles
        this.renderer.updatePile(this.state, command.moveInfo!.fromPile.type, command.moveInfo!.fromPile.index);
        this.renderer.updatePile(this.state, command.moveInfo!.toPile.type, command.moveInfo!.toPile.index);

        // Animate unflip if needed
        if (command.moveInfo!.flippedCard) {
          const sprite = this.renderer.getSprite(command.moveInfo!.flippedCard);
          if (sprite) {
            await sprite.flip();
          }
        }
      } else if (command.type === 'stockDraw') {
        // Undo stock draw - move cards back from waste to stock
        for (let i = 0; i < command.count!; i++) {
          const card = this.state.waste.pop();
          if (card) {
            card.faceUp = false;
            this.state.stock.addCard(card);
          }
        }

        this.renderer.updatePile(this.state, 'stock', 0);
        this.renderer.updatePile(this.state, 'waste', 0);
      } else if (command.type === 'stockRecycle') {
        // Undo stock recycle - move cards back from stock to waste
        const stockCards = this.state.stock.getCards();
        this.state.stock.clear();

        // Reverse back to waste
        stockCards.reverse().forEach(card => {
          card.faceUp = true;
          this.state.waste.addCard(card);
        });

        this.renderer.updatePile(this.state, 'stock', 0);
        this.renderer.updatePile(this.state, 'waste', 0);
      }

      this.dragHandler.setupDragHandlers();
      this.hud.update(this.state);
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Start a new game
   */
  private onNewGame(): void {
    if (this.isAnimating) return;
    this.newGame();
  }

  /**
   * Handle win condition
   */
  private async handleWin(): Promise<void> {
    console.log('You Win!');
    await this.animationManager.playWinAnimation(this.state);
    // Could show win dialog here
  }

  /**
   * Get current game state (for debugging)
   */
  getState(): GameState {
    return this.state;
  }
}
