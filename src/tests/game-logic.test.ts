/**
 * Test script for Klondike Solitaire game logic
 * Run with: npx tsx src/tests/game-logic.test.ts
 */

import { Card, Suit, Rank } from '../models/Card';
import { Deck } from '../models/Deck';
import { TableauPile } from '../models/TableauPile';
import { FoundationPile } from '../models/FoundationPile';
import { StockPile } from '../models/StockPile';
import { WastePile } from '../models/WastePile';
import { GameState } from '../core/GameState';

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${(error as Error).message}`);
    testsFailed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n=== Card Tests ===\n');

test('Card: should create card with correct properties', () => {
  const card = new Card(1, 'hearts');
  assert(card.rank === 1, 'Rank should be 1');
  assert(card.suit === 'hearts', 'Suit should be hearts');
  assert(card.id === 'hearts-1', 'ID should be hearts-1');
  assert(card.faceUp === false, 'Card should start face-down');
});

test('Card: should have correct color', () => {
  const hearts = new Card(1, 'hearts');
  const diamonds = new Card(1, 'diamonds');
  const clubs = new Card(1, 'clubs');
  const spades = new Card(1, 'spades');

  assert(hearts.isRed === true, 'Hearts should be red');
  assert(diamonds.isRed === true, 'Diamonds should be red');
  assert(clubs.isBlack === true, 'Clubs should be black');
  assert(spades.isBlack === true, 'Spades should be black');
});

test('Card: should identify Ace and King', () => {
  const ace = new Card(1, 'hearts');
  const king = new Card(13, 'spades');
  const seven = new Card(7, 'clubs');

  assert(ace.isAce === true, 'Ace should be identified');
  assert(king.isKing === true, 'King should be identified');
  assert(seven.isAce === false, '7 is not an Ace');
  assert(seven.isKing === false, '7 is not a King');
});

test('Card: flip should toggle faceUp', () => {
  const card = new Card(1, 'hearts');
  assert(card.faceUp === false, 'Card should start face-down');
  card.flip();
  assert(card.faceUp === true, 'Card should be face-up after flip');
  card.flip();
  assert(card.faceUp === false, 'Card should be face-down after second flip');
});

console.log('\n=== Deck Tests ===\n');

test('Deck: should create 52 cards', () => {
  const deck = new Deck();
  assert(deck.size === 52, 'Deck should have 52 cards');
});

test('Deck: should have all unique cards', () => {
  const deck = new Deck();
  const ids = new Set(deck.getCards().map(c => c.id));
  assert(ids.size === 52, 'All 52 cards should be unique');
});

test('Deck: deal should distribute cards correctly', () => {
  const deck = new Deck();
  const { tableau, stock } = deck.deal();

  // Check tableau pile counts: 1, 2, 3, 4, 5, 6, 7 = 28 cards
  assert(tableau[0].length === 1, 'Tableau 0 should have 1 card');
  assert(tableau[1].length === 2, 'Tableau 1 should have 2 cards');
  assert(tableau[2].length === 3, 'Tableau 2 should have 3 cards');
  assert(tableau[3].length === 4, 'Tableau 3 should have 4 cards');
  assert(tableau[4].length === 5, 'Tableau 4 should have 5 cards');
  assert(tableau[5].length === 6, 'Tableau 5 should have 6 cards');
  assert(tableau[6].length === 7, 'Tableau 6 should have 7 cards');

  // Stock should have 24 cards
  assert(stock.length === 24, 'Stock should have 24 cards');

  // Total should be 52
  const tableauTotal = tableau.reduce((sum, pile) => sum + pile.length, 0);
  assert(tableauTotal + stock.length === 52, 'Total cards should be 52');
});

test('Deck: only top card of each tableau pile should be face-up', () => {
  const deck = new Deck();
  const { tableau } = deck.deal();

  for (let i = 0; i < 7; i++) {
    const pile = tableau[i];
    for (let j = 0; j < pile.length; j++) {
      const isTopCard = (j === pile.length - 1);
      assert(pile[j].faceUp === isTopCard,
        `Pile ${i}, card ${j}: should be ${isTopCard ? 'face-up' : 'face-down'}`);
    }
  }
});

console.log('\n=== Tableau Pile Tests ===\n');

test('TableauPile: canPlace - Kings on empty pile', () => {
  const pile = new TableauPile(0);
  const king = new Card(13, 'hearts');
  const queen = new Card(12, 'hearts');

  assert(pile.canPlace([king]) === true, 'King should be placeable on empty pile');
  assert(pile.canPlace([queen]) === false, 'Queen should not be placeable on empty pile');
});

test('TableauPile: canPlace - alternating colors, descending rank', () => {
  const pile = new TableauPile(0);
  const redKing = new Card(13, 'hearts');
  redKing.faceUp = true;
  pile.addCard(redKing);

  const blackQueen = new Card(12, 'spades');
  const redQueen = new Card(12, 'diamonds');
  const blackJack = new Card(11, 'clubs');

  assert(pile.canPlace([blackQueen]) === true, 'Black Queen on red King should be valid');
  assert(pile.canPlace([redQueen]) === false, 'Red Queen on red King should be invalid');
  assert(pile.canPlace([blackJack]) === false, 'Black Jack on red King should be invalid (wrong rank)');
});

test('TableauPile: canPickUp - only face-up cards', () => {
  const pile = new TableauPile(0);
  const card1 = new Card(13, 'hearts');
  card1.faceUp = false;
  const card2 = new Card(12, 'spades');
  card2.faceUp = true;

  pile.addCard(card1);
  pile.addCard(card2);

  assert(pile.canPickUp(card1) === false, 'Cannot pick up face-down card');
  assert(pile.canPickUp(card2) === true, 'Can pick up face-up card');
});

test('TableauPile: revealTopCard flips face-down card', () => {
  const pile = new TableauPile(0);
  const card1 = new Card(13, 'hearts');
  card1.faceUp = false;
  const card2 = new Card(12, 'spades');
  card2.faceUp = true;

  pile.addCard(card1);
  pile.addCard(card2);

  // Remove top card
  pile.pop();

  // Reveal should flip card1
  const revealed = pile.revealTopCard();
  assert(revealed === card1, 'Should return the flipped card');
  assert(card1.faceUp === true, 'Card should now be face-up');
});

console.log('\n=== Foundation Pile Tests ===\n');

test('FoundationPile: canPlace - only Aces on empty', () => {
  const pile = new FoundationPile(0);
  const ace = new Card(1, 'hearts');
  const two = new Card(2, 'hearts');

  assert(pile.canPlace([ace]) === true, 'Ace should be placeable on empty foundation');
  assert(pile.canPlace([two]) === false, 'Two should not be placeable on empty foundation');
});

test('FoundationPile: canPlace - same suit ascending', () => {
  const pile = new FoundationPile(0);
  const aceHearts = new Card(1, 'hearts');
  pile.addCard(aceHearts);

  const twoHearts = new Card(2, 'hearts');
  const twoSpades = new Card(2, 'spades');
  const threeHearts = new Card(3, 'hearts');

  assert(pile.canPlace([twoHearts]) === true, '2 of hearts on Ace of hearts is valid');
  assert(pile.canPlace([twoSpades]) === false, '2 of spades on hearts foundation is invalid');
  assert(pile.canPlace([threeHearts]) === false, '3 of hearts on Ace is invalid (skips rank)');
});

test('FoundationPile: canPlace - only single cards', () => {
  const pile = new FoundationPile(0);
  const aceHearts = new Card(1, 'hearts');
  pile.addCard(aceHearts);

  const twoHearts = new Card(2, 'hearts');
  const threeHearts = new Card(3, 'hearts');

  assert(pile.canPlace([twoHearts, threeHearts]) === false, 'Cannot place multiple cards on foundation');
});

test('FoundationPile: isComplete when has 13 cards', () => {
  const pile = new FoundationPile(0);

  for (let rank = 1; rank <= 13; rank++) {
    pile.addCard(new Card(rank as Rank, 'hearts'));
  }

  assert(pile.isComplete === true, 'Foundation with 13 cards should be complete');
});

console.log('\n=== Stock and Waste Tests ===\n');

test('StockPile: draw moves cards to face-up', () => {
  const stock = new StockPile(1);
  const card = new Card(1, 'hearts');
  card.faceUp = false;
  stock.addCard(card);

  const drawn = stock.draw();
  assert(drawn.length === 1, 'Should draw 1 card');
  assert(drawn[0].faceUp === true, 'Drawn card should be face-up');
  assert(stock.isEmpty === true, 'Stock should be empty after draw');
});

test('StockPile: draw respects drawCount', () => {
  const stock = new StockPile(3);
  for (let i = 0; i < 5; i++) {
    const card = new Card((i + 1) as Rank, 'hearts');
    stock.addCard(card);
  }

  const drawn = stock.draw();
  assert(drawn.length === 3, 'Should draw 3 cards');
  assert(stock.length === 2, 'Stock should have 2 cards remaining');
});

test('WastePile: canPickUp only top card', () => {
  const waste = new WastePile();
  const card1 = new Card(1, 'hearts');
  const card2 = new Card(2, 'hearts');
  card1.faceUp = true;
  card2.faceUp = true;

  waste.addCard(card1);
  waste.addCard(card2);

  assert(waste.canPickUp(card2) === true, 'Can pick up top card');
  assert(waste.canPickUp(card1) === false, 'Cannot pick up non-top card');
});

console.log('\n=== GameState Tests ===\n');

test('GameState: deal creates valid initial state', () => {
  const state = new GameState();
  state.deal();

  // Count all cards
  let total = 0;
  total += state.stock.length;
  total += state.waste.length;
  for (const pile of state.tableau) {
    total += pile.length;
  }
  for (const pile of state.foundations) {
    total += pile.length;
  }

  assert(total === 52, 'Total cards should be 52');
  assert(state.stock.length === 24, 'Stock should have 24 cards');
  assert(state.waste.isEmpty === true, 'Waste should be empty');

  for (let i = 0; i < 4; i++) {
    assert(state.foundations[i].isEmpty === true, `Foundation ${i} should be empty`);
  }
});

test('GameState: executeMove transfers cards correctly', () => {
  const state = new GameState();

  // Create a controlled test scenario
  const sourcePile = state.tableau[0];
  sourcePile.clear();
  const aceHearts = new Card(1, 'hearts');
  aceHearts.faceUp = true;
  sourcePile.addCard(aceHearts);

  const targetFoundation = state.foundations[0];
  const moveInfo = state.executeMove([aceHearts], sourcePile, targetFoundation);

  assert(sourcePile.isEmpty === true, 'Source pile should be empty after move');
  assert(targetFoundation.length === 1, 'Target should have 1 card');
  assert(moveInfo.cards[0] === aceHearts, 'MoveInfo should contain moved card');
});

test('GameState: isWon returns true when all foundations complete', () => {
  const state = new GameState();

  // Manually fill all foundations
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  for (let i = 0; i < 4; i++) {
    for (let rank = 1; rank <= 13; rank++) {
      state.foundations[i].addCard(new Card(rank as Rank, suits[i]));
    }
  }

  assert(state.isWon() === true, 'Game should be won when all foundations are complete');
});

test('GameState: drawFromStock works correctly', () => {
  const state = new GameState();
  state.deal();

  const initialStockCount = state.stock.length;
  const drawnCards = state.drawFromStock();

  assert(drawnCards.length === 1, 'Should draw 1 card (default draw count)');
  assert(state.stock.length === initialStockCount - 1, 'Stock should have 1 fewer card');
  assert(state.waste.length === 1, 'Waste should have 1 card');
});

test('GameState: drawFromStock recycles when stock empty', () => {
  const state = new GameState();
  state.deal();

  // Draw all cards from stock
  while (!state.stock.isEmpty) {
    state.drawFromStock();
  }

  assert(state.stock.isEmpty === true, 'Stock should be empty');
  assert(state.waste.length === 24, 'Waste should have all 24 cards');

  // Draw again should recycle
  state.drawFromStock();

  assert(state.stock.length === 24, 'Stock should have 24 cards after recycle');
  assert(state.waste.isEmpty === true, 'Waste should be empty after recycle');
});

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total:  ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  throw new Error(`${testsFailed} tests failed`);
}
