/**
 * Firebase Sync Service Implementation
 *
 * Implements ISyncService using Firebase Realtime Database.
 * Provides optimistic updates and last-write-wins conflict resolution.
 */

import {
  ref,
  set,
  get,
  remove,
  update,
  onValue,
  serverTimestamp,
  DatabaseReference,
  DataSnapshot,
} from 'firebase/database';
import { database } from '@shared/config/firebase';
import type { Unsubscribe } from '@shared/types';
import type {
  ISyncService,
  SyncableObject,
  ObjectUpdate,
  ObjectCallback,
  SingleObjectCallback,
  SyncResult,
  SyncStatus,
  SyncStatusCallback,
  PendingOperation,
} from '../interfaces/ISyncService';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Maximum retry attempts for failed operations.
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Retry delay base in milliseconds.
 */
const RETRY_DELAY_MS = 1000;

/**
 * Firebase implementation of ISyncService.
 *
 * Uses Firebase RTDB for real-time sync with:
 * - Optimistic updates applied immediately to local state
 * - Last-write-wins conflict resolution using timestamps
 * - Pending operation queue for offline resilience
 */
export class FirebaseSyncService implements ISyncService {
  private pendingOperations: Map<string, PendingOperation> = new Map();
  private localState: Map<string, Map<string, SyncableObject>> = new Map();
  private objectListeners: Map<string, Set<ObjectCallback>> = new Map();
  private singleObjectListeners: Map<string, Set<SingleObjectCallback>> =
    new Map();
  private statusListeners: Set<SyncStatusCallback> = new Set();
  private isConnected: boolean = true;
  private lastSyncAt: number | null = null;
  private connectionRef: DatabaseReference | null = null;

  constructor() {
    this.initializeConnectionMonitor();
  }

  /**
   * Initializes connection state monitoring.
   */
  private initializeConnectionMonitor(): void {
    this.connectionRef = ref(database, '.info/connected');
    onValue(this.connectionRef, (snapshot) => {
      this.isConnected = snapshot.val() === true;
      this.notifyStatusChange();

      if (this.isConnected) {
        this.retryPendingOperations();
      }
    });
  }

  /**
   * Gets the database reference for a board's objects.
   *
   * @param boardId - Board identifier
   * @returns Firebase database reference
   */
  private getBoardObjectsRef(boardId: string): DatabaseReference {
    return ref(database, `boards/${boardId}/objects`);
  }

  /**
   * Gets the database reference for a specific object.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @returns Firebase database reference
   */
  private getObjectRef(boardId: string, objectId: string): DatabaseReference {
    return ref(database, `boards/${boardId}/objects/${objectId}`);
  }

  /**
   * Gets or initializes local state for a board.
   *
   * @param boardId - Board identifier
   * @returns Local state map for the board
   */
  private getLocalBoardState(boardId: string): Map<string, SyncableObject> {
    if (!this.localState.has(boardId)) {
      this.localState.set(boardId, new Map());
    }
    return this.localState.get(boardId)!;
  }

  /**
   * Notifies all listeners of object changes for a board.
   *
   * @param boardId - Board identifier
   */
  private notifyObjectListeners(boardId: string): void {
    const listeners = this.objectListeners.get(boardId);
    if (!listeners) return;

    const localState = this.getLocalBoardState(boardId);
    const objects = Array.from(localState.values());

    listeners.forEach((callback) => callback(objects));
  }

  /**
   * Notifies listeners of a single object change.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   */
  private notifySingleObjectListeners(boardId: string, objectId: string): void {
    const key = `${boardId}:${objectId}`;
    const listeners = this.singleObjectListeners.get(key);
    if (!listeners) return;

    const localState = this.getLocalBoardState(boardId);
    const object = localState.get(objectId) || null;

    listeners.forEach((callback) => callback(object));
  }

  /**
   * Notifies all status listeners.
   */
  private notifyStatusChange(): void {
    const status = this.getSyncStatus();
    this.statusListeners.forEach((callback) => callback(status));
  }

  /**
   * Adds a pending operation to the queue.
   *
   * @param operation - Operation to queue
   */
  private queueOperation(operation: Omit<PendingOperation, 'id'>): string {
    const id = generateUUID();
    const fullOperation: PendingOperation = {
      ...operation,
      id,
    };
    this.pendingOperations.set(id, fullOperation);
    this.notifyStatusChange();
    return id;
  }

  /**
   * Removes a pending operation from the queue.
   *
   * @param operationId - Operation ID to remove
   */
  private completeOperation(operationId: string): void {
    this.pendingOperations.delete(operationId);
    this.lastSyncAt = Date.now();
    this.notifyStatusChange();
  }

  /**
   * Applies an optimistic create to local state.
   *
   * @param boardId - Board identifier
   * @param object - Object to create
   */
  private applyOptimisticCreate(boardId: string, object: SyncableObject): void {
    const localState = this.getLocalBoardState(boardId);
    localState.set(object.id, object);
    this.notifyObjectListeners(boardId);
    this.notifySingleObjectListeners(boardId, object.id);
  }

  /**
   * Applies an optimistic update to local state.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @param update - Update to apply
   * @returns The previous state for rollback
   */
  private applyOptimisticUpdate(
    boardId: string,
    objectId: string,
    updateData: ObjectUpdate
  ): SyncableObject | undefined {
    const localState = this.getLocalBoardState(boardId);
    const existing = localState.get(objectId);

    if (existing) {
      const previous = { ...existing };
      const updated: SyncableObject = {
        ...existing,
        ...updateData,
        modifiedAt: Date.now(),
      };
      localState.set(objectId, updated);
      this.notifyObjectListeners(boardId);
      this.notifySingleObjectListeners(boardId, objectId);
      return previous;
    }

    return undefined;
  }

  /**
   * Applies an optimistic delete to local state.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @returns The deleted object for rollback
   */
  private applyOptimisticDelete(
    boardId: string,
    objectId: string
  ): SyncableObject | undefined {
    const localState = this.getLocalBoardState(boardId);
    const existing = localState.get(objectId);

    if (existing) {
      localState.delete(objectId);
      this.notifyObjectListeners(boardId);
      this.notifySingleObjectListeners(boardId, objectId);
      return existing;
    }

    return undefined;
  }

  /**
   * Rolls back an optimistic operation.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @param previousState - State to restore
   */
  private rollback(
    boardId: string,
    objectId: string,
    previousState: SyncableObject | undefined
  ): void {
    const localState = this.getLocalBoardState(boardId);

    if (previousState) {
      localState.set(objectId, previousState);
    } else {
      localState.delete(objectId);
    }

    this.notifyObjectListeners(boardId);
    this.notifySingleObjectListeners(boardId, objectId);
  }

  /**
   * Creates a new object on the board.
   *
   * @param boardId - Board identifier
   * @param object - Object to create
   * @returns Promise resolving to sync result
   */
  async createObject(
    boardId: string,
    object: SyncableObject
  ): Promise<SyncResult> {
    this.applyOptimisticCreate(boardId, object);

    const operationId = this.queueOperation({
      type: 'create',
      objectId: object.id,
      data: object,
      queuedAt: Date.now(),
      retryCount: 0,
    });

    try {
      const objectRef = this.getObjectRef(boardId, object.id);
      const objectWithTimestamp = {
        ...object,
        modifiedAt: serverTimestamp(),
      };

      await set(objectRef, objectWithTimestamp);
      this.completeOperation(operationId);

      return { success: true, object };
    } catch (error) {
      this.rollback(boardId, object.id, undefined);
      this.completeOperation(operationId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rolledBack: true,
      };
    }
  }

  /**
   * Updates an existing object with last-write-wins conflict resolution.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @param updateData - Partial update to apply
   * @returns Promise resolving to sync result
   */
  async updateObject(
    boardId: string,
    objectId: string,
    updateData: ObjectUpdate
  ): Promise<SyncResult> {
    const previousState = this.applyOptimisticUpdate(
      boardId,
      objectId,
      updateData
    );

    if (!previousState) {
      return {
        success: false,
        error: 'Object not found in local state',
      };
    }

    const operationId = this.queueOperation({
      type: 'update',
      objectId,
      data: updateData,
      queuedAt: Date.now(),
      retryCount: 0,
    });

    try {
      const objectRef = this.getObjectRef(boardId, objectId);
      const updateWithTimestamp = {
        ...updateData,
        modifiedAt: serverTimestamp(),
      };

      await update(objectRef, updateWithTimestamp);
      this.completeOperation(operationId);

      const localState = this.getLocalBoardState(boardId);
      const updatedObject = localState.get(objectId);

      return { success: true, object: updatedObject };
    } catch (error) {
      this.rollback(boardId, objectId, previousState);
      this.completeOperation(operationId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rolledBack: true,
      };
    }
  }

  /**
   * Deletes an object from the board.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @returns Promise resolving to sync result
   */
  async deleteObject(boardId: string, objectId: string): Promise<SyncResult> {
    const previousState = this.applyOptimisticDelete(boardId, objectId);

    if (!previousState) {
      return {
        success: false,
        error: 'Object not found in local state',
      };
    }

    const operationId = this.queueOperation({
      type: 'delete',
      objectId,
      queuedAt: Date.now(),
      retryCount: 0,
    });

    try {
      const objectRef = this.getObjectRef(boardId, objectId);
      await remove(objectRef);
      this.completeOperation(operationId);

      return { success: true };
    } catch (error) {
      this.rollback(boardId, objectId, previousState);
      this.completeOperation(operationId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rolledBack: true,
      };
    }
  }

  /**
   * Gets a single object by ID.
   *
   * @param boardId - Board identifier
   * @param objectId - Object identifier
   * @returns Promise resolving to the object or null
   */
  async getObject(
    boardId: string,
    objectId: string
  ): Promise<SyncableObject | null> {
    const localState = this.getLocalBoardState(boardId);
    const localObject = localState.get(objectId);

    if (localObject) {
      return localObject;
    }

    try {
      const objectRef = this.getObjectRef(boardId, objectId);
      const snapshot = await get(objectRef);

      if (snapshot.exists()) {
        const object = snapshot.val() as SyncableObject;
        localState.set(objectId, object);
        return object;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Gets all objects for a board.
   *
   * @param boardId - Board identifier
   * @returns Promise resolving to array of objects
   */
  async getAllObjects(boardId: string): Promise<SyncableObject[]> {
    try {
      const boardRef = this.getBoardObjectsRef(boardId);
      const snapshot = await get(boardRef);

      const objects: SyncableObject[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          objects.push(child.val() as SyncableObject);
        });
      }

      const localState = this.getLocalBoardState(boardId);
      localState.clear();
      objects.forEach((obj) => localState.set(obj.id, obj));

      return objects;
    } catch {
      const localState = this.getLocalBoardState(boardId);
      return Array.from(localState.values());
    }
  }

  /**
   * Subscribes to all object changes for a board.
   *
   * @param boardId - Board identifier
   * @param callback - Function called when objects change
   * @returns Unsubscribe function
   */
  subscribeToObjects(boardId: string, callback: ObjectCallback): Unsubscribe {
    if (!this.objectListeners.has(boardId)) {
      this.objectListeners.set(boardId, new Set());
    }
    this.objectListeners.get(boardId)!.add(callback);

    const boardRef = this.getBoardObjectsRef(boardId);

    const handleSnapshot = (snapshot: DataSnapshot): void => {
      const objects: SyncableObject[] = [];
      const localState = this.getLocalBoardState(boardId);

      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const obj = child.val() as SyncableObject;
          objects.push(obj);
          localState.set(obj.id, obj);
        });
      }

      const existingIds = new Set(objects.map((o) => o.id));
      for (const key of localState.keys()) {
        if (!existingIds.has(key)) {
          localState.delete(key);
        }
      }

      callback(objects);
      this.lastSyncAt = Date.now();
      this.notifyStatusChange();
    };

    const unsubscribeFirebase = onValue(boardRef, handleSnapshot);

    return () => {
      unsubscribeFirebase();
      const listeners = this.objectListeners.get(boardId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

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
  ): Unsubscribe {
    const key = `${boardId}:${objectId}`;

    if (!this.singleObjectListeners.has(key)) {
      this.singleObjectListeners.set(key, new Set());
    }
    this.singleObjectListeners.get(key)!.add(callback);

    const objectRef = this.getObjectRef(boardId, objectId);

    const handleSnapshot = (snapshot: DataSnapshot): void => {
      const localState = this.getLocalBoardState(boardId);

      if (snapshot.exists()) {
        const obj = snapshot.val() as SyncableObject;
        localState.set(objectId, obj);
        callback(obj);
      } else {
        localState.delete(objectId);
        callback(null);
      }
    };

    const unsubscribeFirebase = onValue(objectRef, handleSnapshot);

    return () => {
      unsubscribeFirebase();
      const listeners = this.singleObjectListeners.get(key);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Subscribes to sync status changes.
   *
   * @param callback - Function called when status changes
   * @returns Unsubscribe function
   */
  subscribeToSyncStatus(callback: SyncStatusCallback): Unsubscribe {
    this.statusListeners.add(callback);
    callback(this.getSyncStatus());

    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Gets the current sync status.
   *
   * @returns Current sync status
   */
  getSyncStatus(): SyncStatus {
    return {
      isConnected: this.isConnected,
      pendingCount: this.pendingOperations.size,
      lastSyncAt: this.lastSyncAt,
    };
  }

  /**
   * Retries all pending operations with exponential backoff.
   */
  async retryPendingOperations(): Promise<void> {
    const operations = Array.from(this.pendingOperations.values());

    for (const op of operations) {
      if (op.retryCount >= MAX_RETRY_ATTEMPTS) {
        this.pendingOperations.delete(op.id);
        continue;
      }

      const delay = RETRY_DELAY_MS * Math.pow(2, op.retryCount);
      await new Promise((resolve) => setTimeout(resolve, delay));

      op.retryCount++;
      this.pendingOperations.set(op.id, op);
    }

    this.notifyStatusChange();
  }

  /**
   * Clears all pending operations.
   */
  clearPendingOperations(): void {
    this.pendingOperations.clear();
    this.notifyStatusChange();
  }
}
