/**
 * Firebase Cursor Service Implementation
 *
 * Implements ICursorService using Firebase Realtime Database.
 * Includes 50ms debouncing to prevent flooding the database.
 */

import {
  ref,
  set,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
  DatabaseReference,
} from 'firebase/database';
import { database } from '@shared/config/firebase';
import { debounce } from '@shared/utils/debounce';
import type { Unsubscribe } from '@shared/types';
import type {
  ICursorService,
  CursorPosition,
  CursorCallback,
} from '../interfaces/ICursorService';

/**
 * Debounce interval for cursor updates in milliseconds.
 */
const CURSOR_DEBOUNCE_MS = 50;

/**
 * Firebase implementation of ICursorService.
 *
 * Uses Firebase RTDB for real-time cursor synchronization.
 * Implements debouncing to limit update frequency to 50ms.
 */
type DebouncedCursorUpdate = (x: number, y: number) => void;

export class FirebaseCursorService implements ICursorService {
  private debouncedUpdates: Map<string, DebouncedCursorUpdate> = new Map();
  private userColors: Map<string, string> = new Map();
  private displayNames: Map<string, string> = new Map();

  /**
   * Gets the database reference for a user's cursor.
   *
   * @param boardId - Board identifier
   * @param userId - User identifier
   * @returns Firebase database reference
   */
  private getCursorRef(boardId: string, userId: string): DatabaseReference {
    return ref(database, `cursors/${boardId}/${userId}`);
  }

  /**
   * Gets the database reference for all cursors on a board.
   *
   * @param boardId - Board identifier
   * @returns Firebase database reference
   */
  private getBoardCursorsRef(boardId: string): DatabaseReference {
    return ref(database, `cursors/${boardId}`);
  }

  /**
   * Gets or creates a debounced update function for a user.
   *
   * @param userId - User identifier
   * @param boardId - Board identifier
   * @returns Debounced update function
   */
  private getDebouncedUpdate(
    userId: string,
    boardId: string
  ): DebouncedCursorUpdate {
    const key = `${boardId}:${userId}`;

    if (!this.debouncedUpdates.has(key)) {
      const updateFn = (x: number, y: number): void => {
        const cursorRef = this.getCursorRef(boardId, userId);
        const displayName = this.displayNames.get(userId) || 'Anonymous';
        const color = this.userColors.get(userId) || '#3b82f6';

        set(cursorRef, {
          userId,
          displayName,
          x,
          y,
          color,
          lastUpdated: serverTimestamp(),
        });
      };

      const debouncedFn = debounce<[number, number]>(
        updateFn,
        CURSOR_DEBOUNCE_MS
      );

      this.debouncedUpdates.set(key, debouncedFn);
    }

    return this.debouncedUpdates.get(key)!;
  }

  /**
   * Sets user metadata for cursor display.
   *
   * @param userId - User identifier
   * @param displayName - User's display name
   * @param color - User's assigned color
   */
  setUserMetadata(userId: string, displayName: string, color: string): void {
    this.displayNames.set(userId, displayName);
    this.userColors.set(userId, color);
  }

  /**
   * Updates the current user's cursor position.
   * Debounced to 50ms to prevent flooding.
   *
   * @param userId - The user's unique identifier
   * @param x - X coordinate in world space
   * @param y - Y coordinate in world space
   * @param boardId - The board ID
   */
  updatePosition(userId: string, x: number, y: number, boardId: string): void {
    const debouncedUpdate = this.getDebouncedUpdate(userId, boardId);
    debouncedUpdate(x, y);
  }

  /**
   * Subscribes to all cursor positions for a board.
   *
   * @param boardId - The board to watch
   * @param callback - Function called when cursors change
   * @returns Unsubscribe function to stop listening
   */
  subscribeToAllCursors(
    boardId: string,
    callback: CursorCallback
  ): Unsubscribe {
    const boardCursorsRef = this.getBoardCursorsRef(boardId);

    const unsubscribe = onValue(boardCursorsRef, (snapshot) => {
      const cursors: CursorPosition[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val() as CursorPosition;
          cursors.push({
            userId: data.userId,
            displayName: data.displayName,
            x: data.x,
            y: data.y,
            color: data.color,
            lastUpdated: data.lastUpdated,
          });
        });
      }

      callback(cursors);
    });

    return unsubscribe;
  }

  /**
   * Removes a user's cursor when they disconnect.
   *
   * @param userId - The user's unique identifier
   * @param boardId - The board ID
   */
  async removeCursor(userId: string, boardId: string): Promise<void> {
    const cursorRef = this.getCursorRef(boardId, userId);
    await remove(cursorRef);

    const key = `${boardId}:${userId}`;
    this.debouncedUpdates.delete(key);
  }

  /**
   * Sets up automatic cursor cleanup on disconnect.
   *
   * @param userId - The user's unique identifier
   * @param boardId - The board ID
   */
  async setupDisconnectCleanup(userId: string, boardId: string): Promise<void> {
    const cursorRef = this.getCursorRef(boardId, userId);
    await onDisconnect(cursorRef).remove();
  }
}
