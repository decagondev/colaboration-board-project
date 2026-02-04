/**
 * Board State Hook
 *
 * Comprehensive hook for managing board state including objects,
 * viewport, selection, and sync status. Provides a unified API
 * for board interactions.
 */

import { useCallback, useMemo } from 'react';
import { useBoard } from '../context/BoardContext';
import type { BoardContextValue, BoardMetadata } from '../context/BoardContext';
import type {
  SyncableObject,
  ObjectUpdate,
  SyncResult,
  SyncStatus,
} from '@sync/interfaces/ISyncService';
import type { ViewportState } from './useViewport';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Options for creating a new board object.
 */
export interface CreateObjectOptions {
  /** Object type */
  type: string;
  /** Position X */
  x: number;
  /** Position Y */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Optional Z-index */
  zIndex?: number;
  /** Creator user ID */
  createdBy: string;
  /** Additional object data */
  data?: Record<string, unknown>;
}

/**
 * Result from the useBoardState hook.
 */
export interface UseBoardStateReturn {
  /** Current board metadata */
  board: BoardMetadata | null;

  /** Viewport state and actions */
  viewport: {
    /** Current viewport state */
    state: ViewportState;
    /** Update viewport */
    set: (update: Partial<ViewportState>) => void;
    /** Reset to default */
    reset: () => void;
  };

  /** Selection state and actions */
  selection: {
    /** Selected object IDs */
    ids: Set<string>;
    /** Select an object */
    select: (id: string, addToSelection?: boolean) => void;
    /** Select multiple objects */
    selectMultiple: (ids: string[]) => void;
    /** Deselect an object */
    deselect: (id: string) => void;
    /** Clear all selections */
    clear: () => void;
    /** Check if object is selected */
    isSelected: (id: string) => boolean;
    /** Get selected objects */
    getSelected: () => SyncableObject[];
    /** Count of selected objects */
    count: number;
  };

  /** Objects state and actions */
  objects: {
    /** All objects on the board */
    all: SyncableObject[];
    /** Whether objects are loading */
    isLoading: boolean;
    /** Create a new object */
    create: (object: SyncableObject) => Promise<SyncResult>;
    /** Create with auto-generated ID */
    createNew: (options: CreateObjectOptions) => Promise<SyncResult>;
    /** Update an object */
    update: (id: string, update: ObjectUpdate) => Promise<SyncResult>;
    /** Delete an object */
    delete: (id: string) => Promise<SyncResult>;
    /** Delete multiple objects */
    deleteMultiple: (ids: string[]) => Promise<SyncResult[]>;
    /** Get object by ID */
    get: (id: string) => SyncableObject | undefined;
    /** Get objects by type */
    getByType: (type: string) => SyncableObject[];
    /** Count of all objects */
    count: number;
  };

  /** Sync status */
  sync: {
    /** Current sync status */
    status: SyncStatus;
    /** Whether connected to server */
    isConnected: boolean;
    /** Number of pending operations */
    pendingCount: number;
  };

  /** Board metadata actions */
  boardActions: {
    /** Update board metadata */
    updateMetadata: (metadata: Partial<BoardMetadata>) => void;
  };
}

/**
 * Comprehensive hook for board state management.
 *
 * Provides a structured API for accessing and manipulating board state
 * including objects, viewport, selection, and sync status.
 *
 * @returns Organized board state and actions
 * @throws Error if used outside BoardProvider
 *
 * @example
 * ```tsx
 * const { objects, viewport, selection, sync } = useBoardState();
 *
 * // Create a new sticky note
 * const handleAddNote = async () => {
 *   await objects.createNew({
 *     type: 'sticky-note',
 *     x: 100,
 *     y: 100,
 *     width: 200,
 *     height: 150,
 *     createdBy: currentUserId,
 *     data: { text: 'New note', color: 'yellow' },
 *   });
 * };
 *
 * // Zoom in
 * const handleZoomIn = () => {
 *   viewport.set({ scale: viewport.state.scale * 1.2 });
 * };
 *
 * // Delete selected objects
 * const handleDelete = async () => {
 *   await objects.deleteMultiple([...selection.ids]);
 *   selection.clear();
 * };
 * ```
 */
export function useBoardState(): UseBoardStateReturn {
  const context: BoardContextValue = useBoard();

  /**
   * Create a new object with auto-generated ID and timestamps.
   */
  const createNew = useCallback(
    async (options: CreateObjectOptions): Promise<SyncResult> => {
      const now = Date.now();
      const object: SyncableObject = {
        id: generateUUID(),
        type: options.type,
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        zIndex: options.zIndex ?? now,
        createdBy: options.createdBy,
        createdAt: now,
        modifiedBy: options.createdBy,
        modifiedAt: now,
        data: options.data,
      };

      return context.createObject(object);
    },
    [context.createObject]
  );

  /**
   * Delete multiple objects.
   */
  const deleteMultiple = useCallback(
    async (ids: string[]): Promise<SyncResult[]> => {
      return Promise.all(ids.map((id) => context.deleteObject(id)));
    },
    [context.deleteObject]
  );

  /**
   * Get objects filtered by type.
   */
  const getByType = useCallback(
    (type: string): SyncableObject[] => {
      return context.objects.filter((obj) => obj.type === type);
    },
    [context.objects]
  );

  /**
   * Viewport state and actions.
   */
  const viewport = useMemo(
    () => ({
      state: context.viewport,
      set: context.setViewport,
      reset: context.resetViewport,
    }),
    [context.viewport, context.setViewport, context.resetViewport]
  );

  /**
   * Selection state and actions.
   */
  const selection = useMemo(
    () => ({
      ids: context.selectedObjectIds,
      select: context.selectObject,
      selectMultiple: context.selectObjects,
      deselect: context.deselectObject,
      clear: context.clearSelection,
      isSelected: context.isObjectSelected,
      getSelected: context.getSelectedObjects,
      count: context.selectedObjectIds.size,
    }),
    [
      context.selectedObjectIds,
      context.selectObject,
      context.selectObjects,
      context.deselectObject,
      context.clearSelection,
      context.isObjectSelected,
      context.getSelectedObjects,
    ]
  );

  /**
   * Objects state and actions.
   */
  const objects = useMemo(
    () => ({
      all: context.objects,
      isLoading: context.isLoading,
      create: context.createObject,
      createNew,
      update: context.updateObject,
      delete: context.deleteObject,
      deleteMultiple,
      get: context.getObject,
      getByType,
      count: context.objects.length,
    }),
    [
      context.objects,
      context.isLoading,
      context.createObject,
      context.updateObject,
      context.deleteObject,
      context.getObject,
      createNew,
      deleteMultiple,
      getByType,
    ]
  );

  /**
   * Sync state.
   */
  const sync = useMemo(
    () => ({
      status: context.syncStatus,
      isConnected: context.syncStatus.isConnected,
      pendingCount: context.syncStatus.pendingCount,
    }),
    [context.syncStatus]
  );

  /**
   * Board metadata actions.
   */
  const boardActions = useMemo(
    () => ({
      updateMetadata: context.updateBoardMetadata,
    }),
    [context.updateBoardMetadata]
  );

  return {
    board: context.board,
    viewport,
    selection,
    objects,
    sync,
    boardActions,
  };
}
