# Klondike Solitaire

A classic Klondike Solitaire game built with Konva.js for smooth, mobile-friendly gameplay.

![Klondike Solitaire](https://img.shields.io/badge/Game-Solitaire-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Konva](https://img.shields.io/badge/Konva.js-9.x-orange)

## Features

- Classic Klondike (Patience) rules
- Smooth drag-and-drop with touch support
- Double-tap to auto-move cards to foundations
- Full undo support
- Responsive design - works on desktop and mobile
- Win detection with celebration animation
- Move counter, score tracking, and timer

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/SkipSupreme/Mobile-solitaire.git
cd Mobile-solitaire

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.

## How to Play

### Objective
Move all 52 cards to the four foundation piles, building each from Ace to King by suit.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [Stock] [Waste]        [♠] [♥] [♦] [♣]        │
│                         (Foundations)           │
│                                                 │
│  [1] [2] [3] [4] [5] [6] [7]                   │
│  (Tableau piles - build down, alternating)     │
└─────────────────────────────────────────────────┘
```

### Rules

| Area | Rule |
|------|------|
| **Tableau** | Build down in alternating colors (red on black, black on red). Only Kings can be placed on empty piles. |
| **Foundation** | Build up by suit from Ace to King. |
| **Stock** | Click to draw card(s) to the waste pile. |
| **Waste** | Top card is playable to tableau or foundation. |

### Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Move card | Drag and drop | Drag and drop |
| Auto-move to foundation | Double-click | Double-tap |
| Draw from stock | Click stock pile | Tap stock pile |
| Undo | Click "Undo" button | Tap "Undo" button |
| New game | Click "New Game" button | Tap "New Game" button |

## Project Structure

```
src/
├── main.ts                 # Entry point, Konva stage setup
├── core/
│   ├── Game.ts             # Main game orchestrator
│   ├── GameState.ts        # State management
│   └── CommandManager.ts   # Undo system
├── models/
│   ├── Card.ts             # Card data model
│   ├── Deck.ts             # 52-card deck with shuffle
│   ├── Pile.ts             # Abstract pile base
│   ├── TableauPile.ts      # Tableau column logic
│   ├── FoundationPile.ts   # Foundation pile logic
│   ├── StockPile.ts        # Draw pile
│   └── WastePile.ts        # Discard pile
├── rendering/
│   ├── CardSprite.ts       # Konva card component
│   ├── BoardRenderer.ts    # Board layout
│   └── AnimationManager.ts # Animations
├── input/
│   └── DragHandler.ts      # Drag-drop handling
├── ui/
│   └── HUD.ts              # Score, timer, buttons
├── utils/
│   └── constants.ts        # Game constants
└── tests/
    └── game-logic.test.ts  # Unit tests
```

## Development

### Run Tests

```bash
# Run game logic tests
npx tsx src/tests/game-logic.test.ts
```

### Type Check

```bash
npx tsc --noEmit
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Configuration

Edit `src/utils/constants.ts` to customize:

```typescript
// Card draw mode (1 or 3)
export const DRAW_COUNT = 1;

// Visual dimensions
export const CARD_WIDTH = 71;
export const CARD_HEIGHT = 96;

// Animation speeds
export const TIMING = {
  MOVE_DURATION: 0.15,
  FLIP_DURATION: 0.25,
  // ...
};
```

## Tech Stack

- **[Konva.js](https://konvajs.org/)** - 2D canvas library with excellent touch support
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server

## Architecture

The game uses a clean separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐
│   Game Logic    │     │    Rendering    │
│  (models/core)  │────▶│  (rendering/)   │
└─────────────────┘     └─────────────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│           Input Handler                 │
│  (validates moves, triggers animations) │
└─────────────────────────────────────────┘
```

Konva uses a three-layer architecture for proper z-ordering:
1. **Background Layer** - Felt texture, pile outlines (non-interactive)
2. **Piles Layer** - Cards in their piles
3. **Drag Layer** - Cards being dragged (always on top)

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
