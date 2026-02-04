/**
 * Sync Context Module
 *
 * Provides sync service and status to the component tree.
 * Manages board object synchronization with optimistic updates.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import type {
  ISyncService,
  SyncableObject,
  ObjectUpdate,
  SyncResult,
  SyncStatus,
} from '../interfaces/ISyncService';
import { FirebaseSyncService } from '../services/FirebaseSyncService';

/**
 * Sync context value interface.
 */
interface SyncContextValue {
  /** Current sync status */
  status: SyncStatus;
  /** All objects on the current board */
  objects: SyncableObject[];
  /** Whether objects are loading */
  isLoading: boolean;
  /** Create a new object */
  createObject: (object: SyncableObject) => Promise<SyncResult>;
  /** Update an existing object */
  updateObject: (objectId: string, update: ObjectUpdate) => Promise<SyncResult>;
  /** Delete an object */
  deleteObject: (objectId: string) => Promise<SyncResult>;
  /** Get a single object by ID */
  getObject: (objectId: string) => SyncableObject | undefined;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * Sync provider props.
 */
interface SyncProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Board ID to sync */
  boardId: string;
  /** Optional sync service for dependency injection */
  syncService?: ISyncService;
}

/**
 * Sync Provider Component
 *
 * Manages object synchronization and provides sync status to children.
 */
export function SyncProvider({
  children,
  boardId,
  syncService,
}: SyncProviderProps): React.ReactNode {
  const [objects, setObjects] = useState<SyncableObject[]>([]);
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: true,
    pendingCount: 0,
    lastSyncAt: null,
  });
  const [hasReceivedData, setHasReceivedData] = useState(false);

  const service = useMemo(
    () => syncService ?? new FirebaseSyncService(),
    [syncService]
  );

  useEffect(() => {
    const unsubscribeObjects = service.subscribeToObjects(boardId, (objs) => {
      setObjects(objs);
      setHasReceivedData(true);
    });

    const unsubscribeStatus = service.subscribeToSyncStatus((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribeObjects();
      unsubscribeStatus();
    };
  }, [boardId, service]);

  const createObject = useCallback(
    async (object: SyncableObject): Promise<SyncResult> => {
      return service.createObject(boardId, object);
    },
    [boardId, service]
  );

  const updateObject = useCallback(
    async (objectId: string, update: ObjectUpdate): Promise<SyncResult> => {
      return service.updateObject(boardId, objectId, update);
    },
    [boardId, service]
  );

  const deleteObject = useCallback(
    async (objectId: string): Promise<SyncResult> => {
      return service.deleteObject(boardId, objectId);
    },
    [boardId, service]
  );

  const getObject = useCallback(
    (objectId: string): SyncableObject | undefined => {
      return objects.find((obj) => obj.id === objectId);
    },
    [objects]
  );

  const isLoading = !hasReceivedData;

  const value = useMemo<SyncContextValue>(
    () => ({
      status,
      objects,
      isLoading,
      createObject,
      updateObject,
      deleteObject,
      getObject,
    }),
    [
      status,
      objects,
      isLoading,
      createObject,
      updateObject,
      deleteObject,
      getObject,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

/**
 * Hook to access sync context.
 *
 * @returns Sync context value
 * @throws Error if used outside SyncProvider
 *
 * @example
 * ```tsx
 * const { objects, createObject, status } = useSync();
 *
 * const handleCreate = async () => {
 *   const result = await createObject({
 *     id: generateUUID(),
 *     type: 'sticky-note',
 *     // ... other properties
 *   });
 *   if (!result.success) {
 *     console.error('Failed to create:', result.error);
 *   }
 * };
 * ```
 */
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);

  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }

  return context;
}

/**
 * Hook to access just the sync status.
 *
 * @returns Current sync status
 *
 * @example
 * ```tsx
 * const status = useSyncStatus();
 *
 * if (!status.isConnected) {
 *   return <OfflineIndicator />;
 * }
 * ```
 */
export function useSyncStatus(): SyncStatus {
  const { status } = useSync();
  return status;
}

export { SyncContext };
