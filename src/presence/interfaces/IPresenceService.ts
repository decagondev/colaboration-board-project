/**
 * Presence Service Interface Module
 *
 * Defines the contract for user presence tracking services.
 * Manages online/offline status for collaborative awareness.
 */

import type { Unsubscribe } from '@shared/types';

/**
 * Represents an online user.
 */
export interface OnlineUser {
  /** Unique identifier for the user */
  uid: string;
  /** User's display name */
  displayName: string;
  /** URL to user's profile photo */
  photoURL: string | null;
  /** Timestamp of last activity */
  lastSeen: number;
  /** Color assigned to this user */
  color: string;
}

/**
 * Callback function for presence changes.
 */
export type PresenceCallback = (users: OnlineUser[]) => void;

/**
 * Presence service interface.
 *
 * Provides methods for tracking user online/offline status
 * and subscribing to presence changes.
 *
 * @example
 * ```typescript
 * const presenceService: IPresenceService = new FirebasePresenceService();
 *
 * // Set user as online
 * await presenceService.setOnline('user-123', 'John Doe');
 *
 * // Subscribe to presence changes
 * const unsubscribe = presenceService.subscribeToPresence('board-456', (users) => {
 *   console.log('Online users:', users);
 * });
 * ```
 */
export interface IPresenceService {
  /**
   * Sets the current user as online on a board.
   *
   * @param userId - The user's unique identifier
   * @param displayName - The user's display name
   * @param boardId - The board to join
   * @returns Promise resolving when presence is set
   */
  setOnline(
    userId: string,
    displayName: string,
    boardId: string
  ): Promise<void>;

  /**
   * Sets the current user as offline.
   *
   * @param userId - The user's unique identifier
   * @param boardId - The board to leave
   * @returns Promise resolving when presence is cleared
   */
  setOffline(userId: string, boardId: string): Promise<void>;

  /**
   * Subscribes to presence changes for a board.
   *
   * @param boardId - The board to watch
   * @param callback - Function called when presence changes
   * @returns Unsubscribe function to stop listening
   */
  subscribeToPresence(boardId: string, callback: PresenceCallback): Unsubscribe;

  /**
   * Gets all currently online users for a board.
   *
   * @param boardId - The board to query
   * @returns Promise resolving to array of online users
   */
  getOnlineUsers(boardId: string): Promise<OnlineUser[]>;
}
