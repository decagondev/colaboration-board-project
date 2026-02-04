/**
 * Cursor Service Interface Module
 *
 * Defines the contract for cursor tracking services.
 * Manages real-time cursor position synchronization across users.
 */

import type { Unsubscribe } from '@shared/types';

/**
 * Represents a user's cursor position.
 */
export interface CursorPosition {
  /** User's unique identifier */
  userId: string;
  /** User's display name */
  displayName: string;
  /** X coordinate in world space */
  x: number;
  /** Y coordinate in world space */
  y: number;
  /** User's assigned color */
  color: string;
  /** Timestamp of last update */
  lastUpdated: number;
}

/**
 * Callback function for cursor changes.
 */
export type CursorCallback = (cursors: CursorPosition[]) => void;

/**
 * Cursor service interface.
 *
 * Provides methods for tracking and synchronizing cursor positions
 * across all users in a collaborative session.
 *
 * @example
 * ```typescript
 * const cursorService: ICursorService = new FirebaseCursorService();
 *
 * // Update cursor position (debounced internally)
 * cursorService.updatePosition('user-123', 500, 300, 'default-board');
 *
 * // Subscribe to all cursor changes
 * const unsubscribe = cursorService.subscribeToAllCursors('default-board', (cursors) => {
 *   cursors.forEach(cursor => {
 *     console.log(`${cursor.displayName} is at (${cursor.x}, ${cursor.y})`);
 *   });
 * });
 * ```
 */
export interface ICursorService {
  /**
   * Updates the current user's cursor position.
   * Implementations should debounce to ~50ms to prevent flooding.
   *
   * @param userId - The user's unique identifier
   * @param x - X coordinate in world space
   * @param y - Y coordinate in world space
   * @param boardId - The board ID
   */
  updatePosition(
    userId: string,
    x: number,
    y: number,
    boardId: string
  ): void;

  /**
   * Subscribes to all cursor positions for a board.
   *
   * @param boardId - The board to watch
   * @param callback - Function called when cursors change
   * @returns Unsubscribe function to stop listening
   */
  subscribeToAllCursors(boardId: string, callback: CursorCallback): Unsubscribe;

  /**
   * Removes a user's cursor when they disconnect.
   *
   * @param userId - The user's unique identifier
   * @param boardId - The board ID
   * @returns Promise resolving when cursor is removed
   */
  removeCursor(userId: string, boardId: string): Promise<void>;

  /**
   * Sets up automatic cursor cleanup on disconnect.
   *
   * @param userId - The user's unique identifier
   * @param boardId - The board ID
   * @returns Promise resolving when cleanup is configured
   */
  setupDisconnectCleanup(userId: string, boardId: string): Promise<void>;
}
