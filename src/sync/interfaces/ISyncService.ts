/**
 * Sync Service Interface Module
 *
 * Defines the contract for object synchronization services.
 * Handles real-time sync, optimistic updates, and conflict resolution.
 */

import type { Unsubscribe } from '@shared/types';

/**
 * Base interface for syncable board objects.
 */
export interface SyncableObject {
  /** Unique object identifier */
  id: string;
  /** Object type (e.g., 'sticky-note', 'shape', 'text') */
  type: string;
  /** Position X coordinate */
  x: number;
  /** Position Y coordinate */
  y: number;
  /** Object width */
  width: number;
  /** Object height */
  height: number;
  /** Z-index for layering */
  zIndex: number;
  /** User ID who created the object */
  createdBy: string;
  /** Creation timestamp */
  createdAt: number;
  /** User ID who last modified */
  modifiedBy: string;
  /** Last modification timestamp (used for conflict resolution) */
  modifiedAt: number;
  /** Optional object-specific data */
  data?: Record<string, unknown>;
}

/**
 * Partial update for a syncable object.
 */
export type ObjectUpdate = Partial<
  Omit<SyncableObject, 'id' | 'type' | 'createdBy' | 'createdAt'>
>;

/**
 * Callback for object changes.
 */
export type ObjectCallback = (objects: SyncableObject[]) => void;

/**
 * Callback for a single object change.
 */
export type SingleObjectCallback = (object: SyncableObject | null) => void;

/**
 * Result of a sync operation.
 */
export interface SyncResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** The synced object (if successful) */
  object?: SyncableObject;
  /** Error message (if failed) */
  error?: string;
  /** Whether the local state was rolled back */
  rolledBack?: boolean;
}

/**
 * Pending operation waiting to be synced.
 */
export interface PendingOperation {
  /** Operation ID */
  id: string;
  /** Operation type */
  type: 'create' | 'update' | 'delete';
  /** Object ID being operated on */
  objectId: string;
  /** The object data (for create/update) */
  data?: SyncableObject | ObjectUpdate;
  /** Timestamp when operation was queued */
  queuedAt: number;
  /** Number of retry attempts */
  retryCount: number;
}

/**
 * Sync status for monitoring connection state.
 */
export interface SyncStatus {
  /** Whether currently connected to the server */
  isConnected: boolean;
  /** Number of pending operations */
  pendingCount: number;
  /** Last successful sync timestamp */
  lastSyncAt: number | null;
}

/**
 * Callback for sync status changes.
 */
export type SyncStatusCallback = (status: SyncStatus) => void;

/**
 * Sync service interface.
 *
 * Provides methods for synchronizing board objects with real-time
 * updates, optimistic UI, and conflict resolution.
 *
 * @example
 * ```typescript
 * const syncService: ISyncService = new FirebaseSyncService();
 *
 * // Subscribe to all objects
 * const unsubscribe = syncService.subscribeToObjects('board-123', (objects) => {
 *   console.log('Objects updated:', objects);
 * });
 *
 * // Create an object with optimistic update
 * const result = await syncService.createObject('board-123', {
 *   id: 'obj-1',
 *   type: 'sticky-note',
 *   x: 100,
 *   y: 100,
 *   // ... other properties
 * });
 *
 * // Update with optimistic UI
 * await syncService.updateObject('board-123', 'obj-1', { x: 200 });
 * ```
 */
export interface ISyncService {
  /**
   * Creates a new object on the board.
   * Applies optimistic update immediately.
   *
   * @param boardId - Board identifier
   * @param object - Object to create
   * @returns Promise resolving to sync result
   */
  createObject(boardId: string, object: SyncableObject): Promise<SyncResult>;

  /**
   * Updates an existing object.
   * Applies optimistic update immediately, uses last-write-wins for conflicts.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @param update - Partial update to apply
   * @returns Promise resolving to sync result
   */
  updateObject(
    boardId: string,
    objectId: string,
    update: ObjectUpdate
  ): Promise<SyncResult>;

  /**
   * Deletes an object from the board.
   * Applies optimistic delete immediately.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @returns Promise resolving to sync result
   */
  deleteObject(boardId: string, objectId: string): Promise<SyncResult>;

  /**
   * Gets a single object by ID.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @returns Promise resolving to the object or null
   */
  getObject(boardId: string, objectId: string): Promise<SyncableObject | null>;

  /**
   * Gets all objects for a board.
   *
   * @param boardId - Board identifier
   * @returns Promise resolving to array of objects
   */
  getAllObjects(boardId: string): Promise<SyncableObject[]>;

  /**
   * Subscribes to all object changes for a board.
   *
   * @param boardId - Board identifier
   * @param callback - Function called when objects change
   * @returns Unsubscribe function
   */
  subscribeToObjects(boardId: string, callback: ObjectCallback): Unsubscribe;

  /**
   * Subscribes to a single object's changes.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @param callback - Function called when object changes
   * @returns Unsubscribe function
   */
  subscribeToObject(
    boardId: string,
    objectId: string,
    callback: SingleObjectCallback
  ): Unsubscribe;

  /**
   * Subscribes to sync status changes.
   *
   * @param callback - Function called when status changes
   * @returns Unsubscribe function
   */
  subscribeToSyncStatus(callback: SyncStatusCallback): Unsubscribe;

  /**
   * Gets the current sync status.
   *
   * @returns Current sync status
   */
  getSyncStatus(): SyncStatus;

  /**
   * Retries all pending operations.
   * Useful after reconnection.
   *
   * @returns Promise resolving when retry is complete
   */
  retryPendingOperations(): Promise<void>;

  /**
   * Clears all pending operations.
   * Use with caution - may cause data loss.
   */
  clearPendingOperations(): void;
}
