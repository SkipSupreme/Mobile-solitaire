import { MoveInfo } from './GameState';

export interface Command {
  type: 'move' | 'stockDraw' | 'stockRecycle';
  moveInfo?: MoveInfo;
  count?: number; // For stock draw/recycle
}

export class CommandManager {
  private history: Command[] = [];
  private maxHistory: number = 100;

  /**
   * Record a card move
   */
  recordMove(moveInfo: MoveInfo): void {
    this.history.push({
      type: 'move',
      moveInfo
    });
    this.trimHistory();
  }

  /**
   * Record drawing from stock
   */
  recordStockDraw(count: number): void {
    this.history.push({
      type: 'stockDraw',
      count
    });
    this.trimHistory();
  }

  /**
   * Record recycling waste to stock
   */
  recordStockRecycle(count: number): void {
    this.history.push({
      type: 'stockRecycle',
      count
    });
    this.trimHistory();
  }

  /**
   * Undo the last command
   */
  undo(): Command | undefined {
    return this.history.pop();
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.history = [];
  }

  /**
   * Get history length
   */
  get length(): number {
    return this.history.length;
  }

  /**
   * Trim history to max size
   */
  private trimHistory(): void {
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }
}
