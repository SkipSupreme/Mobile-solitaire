import Konva from 'konva';
import { Game } from './core/Game';
import { SCENE_WIDTH, SCENE_HEIGHT } from './utils/constants';

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

// Disable context menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('game-container');
  if (!container) {
    console.error('Game container not found');
    return;
  }

  // Create Konva stage with design coordinates
  const stage = new Konva.Stage({
    container: 'game-container',
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT
  });

  // Create three layers for proper z-ordering
  // Background layer: felt, pile outlines (non-interactive)
  const backgroundLayer = new Konva.Layer({ listening: false });

  // Piles layer: cards in their piles
  const pilesLayer = new Konva.Layer();

  // Drag layer: cards being dragged (always on top)
  const dragLayer = new Konva.Layer();

  stage.add(backgroundLayer, pilesLayer, dragLayer);

  // Responsive scaling
  function fitStageToContainer() {
    const containerWidth = container!.offsetWidth;
    const containerHeight = container!.offsetHeight;

    const scale = Math.min(
      containerWidth / SCENE_WIDTH,
      containerHeight / SCENE_HEIGHT
    );

    stage.width(SCENE_WIDTH * scale);
    stage.height(SCENE_HEIGHT * scale);
    stage.scale({ x: scale, y: scale });
  }

  // Initial fit
  fitStageToContainer();

  // Resize handler
  window.addEventListener('resize', fitStageToContainer);

  // Initialize and start the game
  const game = new Game(stage, backgroundLayer, pilesLayer, dragLayer);
  game.newGame();

  // Expose game to window for debugging
  (window as unknown as { game: Game }).game = game;

  console.log('Klondike Solitaire initialized!');
});
