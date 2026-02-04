/**
 * Firebase Presence Service Implementation
 *
 * Implements IPresenceService using Firebase Realtime Database.
 * Handles online/offline status tracking with automatic cleanup on disconnect.
 */

import {
  ref,
  set,
  remove,
  onValue,
  onDisconnect,
  get,
  serverTimestamp,
  DatabaseReference,
} from 'firebase/database';
import { database } from '@shared/config/firebase';
import type { Unsubscribe } from '@shared/types';
import type {
  IPresenceService,
  OnlineUser,
  PresenceCallback,
} from '../interfaces/IPresenceService';

/**
 * User colors for visual distinction.
 */
const USER_COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
];

/**
 * Gets a consistent color for a user based on their ID.
 *
 * @param userId - User's unique identifier
 * @returns Hex color string
 */
function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

/**
 * Firebase implementation of IPresenceService.
 *
 * Uses Firebase RTDB for real-time presence tracking.
 * Automatically cleans up presence on disconnect using onDisconnect().
 */
export class FirebasePresenceService implements IPresenceService {
  /**
   * Gets the database reference for a user's presence.
   *
   * @param boardId - Board identifier
   * @param userId - User identifier
   * @returns Firebase database reference
   */
  private getPresenceRef(boardId: string, userId: string): DatabaseReference {
    return ref(database, `presence/${boardId}/${userId}`);
  }

  /**
   * Gets the database reference for all presence on a board.
   *
   * @param boardId - Board identifier
   * @returns Firebase database reference
   */
  private getBoardPresenceRef(boardId: string): DatabaseReference {
    return ref(database, `presence/${boardId}`);
  }

  /**
   * Sets the current user as online on a board.
   * Sets up onDisconnect to automatically remove presence when the user disconnects.
   *
   * @param userId - The user's unique identifier
   * @param displayName - The user's display name
   * @param boardId - The board to join
   */
  async setOnline(
    userId: string,
    displayName: string,
    boardId: string
  ): Promise<void> {
    const presenceRef = this.getPresenceRef(boardId, userId);

    const presenceData = {
      uid: userId,
      displayName: displayName,
      photoURL: null,
      lastSeen: serverTimestamp(),
      color: getUserColor(userId),
    };

    await onDisconnect(presenceRef).remove();

    await set(presenceRef, presenceData);
  }

  /**
   * Sets the current user as offline.
   *
   * @param userId - The user's unique identifier
   * @param boardId - The board to leave
   */
  async setOffline(userId: string, boardId: string): Promise<void> {
    const presenceRef = this.getPresenceRef(boardId, userId);
    await remove(presenceRef);
  }

  /**
   * Subscribes to presence changes for a board.
   *
   * @param boardId - The board to watch
   * @param callback - Function called when presence changes
   * @returns Unsubscribe function to stop listening
   */
  subscribeToPresence(
    boardId: string,
    callback: PresenceCallback
  ): Unsubscribe {
    const boardPresenceRef = this.getBoardPresenceRef(boardId);

    const unsubscribe = onValue(boardPresenceRef, (snapshot) => {
      const users: OnlineUser[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val() as OnlineUser;
          users.push({
            uid: data.uid,
            displayName: data.displayName,
            photoURL: data.photoURL,
            lastSeen: data.lastSeen,
            color: data.color,
          });
        });
      }

      callback(users);
    });

    return unsubscribe;
  }

  /**
   * Gets all currently online users for a board.
   *
   * @param boardId - The board to query
   * @returns Array of online users
   */
  async getOnlineUsers(boardId: string): Promise<OnlineUser[]> {
    const boardPresenceRef = this.getBoardPresenceRef(boardId);
    const snapshot = await get(boardPresenceRef);

    const users: OnlineUser[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val() as OnlineUser;
        users.push({
          uid: data.uid,
          displayName: data.displayName,
          photoURL: data.photoURL,
          lastSeen: data.lastSeen,
          color: data.color,
        });
      });
    }

    return users;
  }
}
