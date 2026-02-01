// Scene dimensions (design coordinates - will scale to fit screen)
export const SCENE_WIDTH = 1000;
export const SCENE_HEIGHT = 650;

// Card dimensions
export const CARD_WIDTH = 71;
export const CARD_HEIGHT = 96;
export const CARD_ASPECT_RATIO = CARD_HEIGHT / CARD_WIDTH;

// Layout constants
export const TABLEAU_OFFSET = 25;      // Vertical offset for stacked cards in tableau
export const TABLEAU_OFFSET_FACE_DOWN = 15; // Smaller offset for face-down cards
export const FOUNDATION_X_START = 350; // X position for first foundation pile
export const PILE_SPACING = 95;        // Horizontal spacing between piles
export const TOP_ROW_Y = 20;           // Y position for top row (stock, waste, foundations)
export const TABLEAU_Y = 140;          // Y position for tableau piles
export const STOCK_X = 20;             // X position for stock pile
export const WASTE_X = 120;            // X position for waste pile

// Animation timing
export const TIMING = {
  MOVE_DURATION: 0.15,
  FLIP_DURATION: 0.25,
  DEAL_STAGGER: 0.05,
  SNAP_BACK_DURATION: 0.2,
  WIN_CARD_STAGGER: 0.05
};

// Colors
export const COLORS = {
  FELT_GREEN: '#1a472a',
  FELT_DARK: '#143d23',
  CARD_BACK: '#1e40af',
  CARD_BACK_PATTERN: '#1a3a8a',
  CARD_FACE: '#ffffff',
  PILE_OUTLINE: 'rgba(255, 255, 255, 0.3)',
  PILE_OUTLINE_HOVER: 'rgba(255, 255, 255, 0.6)',
  RED_SUIT: '#dc2626',
  BLACK_SUIT: '#1f2937',
  SHADOW: 'rgba(0, 0, 0, 0.3)'
};

// Suits and ranks
export const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const;

// Suit symbols for rendering
export const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

// Rank display values
export const RANK_DISPLAY: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K'
};

// Game settings
export const DRAW_COUNT = 1; // Number of cards to draw from stock (1 or 3)
export const MIN_OVERLAP_FOR_DROP = 0.3; // 30% minimum overlap for valid drop
