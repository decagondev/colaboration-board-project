/**
 * Board Context Module
 *
 * Provides centralized board state management including:
 * - Current board metadata
 * - Viewport state (position, zoom)
 * - Object management via sync service
 * - Selection state
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import type {
  SyncableObject,
  ObjectUpdate,
  SyncResult,
  SyncStatus,
} from '@sync/interfaces/ISyncService';
import { SyncProvider, useSync } from '@sync/context/SyncContext';
import type { ViewportState } from '../hooks/useViewport';

/**
 * Board metadata interface.
 */
export interface BoardMetadata {
  /** Unique board identifier */
  id: string;
  /** Board display name */
  name: string;
  /** Board description */
  description?: string;
  /** User ID who created the board */
  createdBy: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
}

/**
 * Board state managed by the context.
 */
export interface BoardState {
  /** Current board metadata */
  board: BoardMetadata | null;
  /** Current viewport state */
  viewport: ViewportState;
  /** Currently selected object IDs */
  selectedObjectIds: Set<string>;
  /** Objects currently on the board */
  objects: SyncableObject[];
  /** Whether board is loading */
  isLoading: boolean;
  /** Sync status */
  syncStatus: SyncStatus;
}

/**
 * Board actions available through the context.
 */
export interface BoardActions {
  /** Set the current viewport state */
  setViewport: (viewport: Partial<ViewportState>) => void;
  /** Reset viewport to default */
  resetViewport: () => void;
  /** Select an object (optionally add to selection) */
  selectObject: (objectId: string, addToSelection?: boolean) => void;
  /** Select multiple objects */
  selectObjects: (objectIds: string[]) => void;
  /** Deselect an object */
  deselectObject: (objectId: string) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if an object is selected */
  isObjectSelected: (objectId: string) => boolean;
  /** Create a new object */
  createObject: (object: SyncableObject) => Promise<SyncResult>;
  /** Update an object */
  updateObject: (objectId: string, update: ObjectUpdate) => Promise<SyncResult>;
  /** Delete an object */
  deleteObject: (objectId: string) => Promise<SyncResult>;
  /** Get an object by ID */
  getObject: (objectId: string) => SyncableObject | undefined;
  /** Get all selected objects */
  getSelectedObjects: () => SyncableObject[];
  /** Update the board metadata */
  updateBoardMetadata: (metadata: Partial<BoardMetadata>) => void;
}

/**
 * Combined board context value.
 */
export type BoardContextValue = BoardState & BoardActions;

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

/**
 * Default viewport state.
 */
const DEFAULT_VIEWPORT: ViewportState = {
  x: 0,
  y: 0,
  scale: 1,
};

/**
 * Internal board provider that has access to sync context.
 */
function InternalBoardProvider({
  children,
  board: initialBoard,
}: {
  children: React.ReactNode;
  board: BoardMetadata;
}): React.ReactNode {
  const sync = useSync();

  const [board, setBoard] = useState<BoardMetadata>(initialBoard);
  const [viewport, setViewportState] =
    useState<ViewportState>(DEFAULT_VIEWPORT);
  const [selectedObjectIds, setSelectedObjectIds] = useState<Set<string>>(
    new Set()
  );

  /**
   * Update viewport state, merging with current state.
   */
  const setViewport = useCallback((update: Partial<ViewportState>): void => {
    setViewportState((prev) => ({
      ...prev,
      ...update,
    }));
  }, []);

  /**
   * Reset viewport to default values.
   */
  const resetViewport = useCallback((): void => {
    setViewportState(DEFAULT_VIEWPORT);
  }, []);

  /**
   * Select an object, optionally adding to existing selection.
   */
  const selectObject = useCallback(
    (objectId: string, addToSelection: boolean = false): void => {
      setSelectedObjectIds((prev) => {
        if (addToSelection) {
          const newSet = new Set(prev);
          newSet.add(objectId);
          return newSet;
        }
        return new Set([objectId]);
      });
    },
    []
  );

  /**
   * Select multiple objects (replaces current selection).
   */
  const selectObjects = useCallback((objectIds: string[]): void => {
    setSelectedObjectIds(new Set(objectIds));
  }, []);

  /**
   * Deselect a specific object.
   */
  const deselectObject = useCallback((objectId: string): void => {
    setSelectedObjectIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(objectId);
      return newSet;
    });
  }, []);

  /**
   * Clear all selections.
   */
  const clearSelection = useCallback((): void => {
    setSelectedObjectIds(new Set());
  }, []);

  /**
   * Check if an object is currently selected.
   */
  const isObjectSelected = useCallback(
    (objectId: string): boolean => {
      return selectedObjectIds.has(objectId);
    },
    [selectedObjectIds]
  );

  /**
   * Get all currently selected objects.
   */
  const getSelectedObjects = useCallback((): SyncableObject[] => {
    return sync.objects.filter((obj) => selectedObjectIds.has(obj.id));
  }, [sync.objects, selectedObjectIds]);

  /**
   * Update board metadata.
   */
  const updateBoardMetadata = useCallback(
    (metadata: Partial<BoardMetadata>): void => {
      setBoard((prev) => ({
        ...prev,
        ...metadata,
        modifiedAt: Date.now(),
      }));
    },
    []
  );

  /**
   * Clean up selection when objects are deleted.
   */
  useEffect(() => {
    const objectIds = new Set(sync.objects.map((obj) => obj.id));
    setSelectedObjectIds((prev) => {
      const filtered = new Set<string>();
      prev.forEach((id) => {
        if (objectIds.has(id)) {
          filtered.add(id);
        }
      });
      if (filtered.size !== prev.size) {
        return filtered;
      }
      return prev;
    });
  }, [sync.objects]);

  const value = useMemo<BoardContextValue>(
    () => ({
      board,
      viewport,
      selectedObjectIds,
      objects: sync.objects,
      isLoading: sync.isLoading,
      syncStatus: sync.status,
      setViewport,
      resetViewport,
      selectObject,
      selectObjects,
      deselectObject,
      clearSelection,
      isObjectSelected,
      createObject: sync.createObject,
      updateObject: sync.updateObject,
      deleteObject: sync.deleteObject,
      getObject: sync.getObject,
      getSelectedObjects,
      updateBoardMetadata,
    }),
    [
      board,
      viewport,
      selectedObjectIds,
      sync.objects,
      sync.isLoading,
      sync.status,
      sync.createObject,
      sync.updateObject,
      sync.deleteObject,
      sync.getObject,
      setViewport,
      resetViewport,
      selectObject,
      selectObjects,
      deselectObject,
      clearSelection,
      isObjectSelected,
      getSelectedObjects,
      updateBoardMetadata,
    ]
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}

/**
 * Board provider props.
 */
export interface BoardProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Board metadata */
  board: BoardMetadata;
}

/**
 * Board Provider Component
 *
 * Wraps children with board state management and sync integration.
 * Must be used within the application's provider hierarchy.
 *
 * @example
 * ```tsx
 * <BoardProvider board={boardData}>
 *   <BoardCanvas />
 *   <Toolbar />
 * </BoardProvider>
 * ```
 */
export function BoardProvider({
  children,
  board,
}: BoardProviderProps): React.ReactNode {
  return (
    <SyncProvider boardId={board.id}>
      <InternalBoardProvider board={board}>{children}</InternalBoardProvider>
    </SyncProvider>
  );
}

/**
 * Hook to access the full board context.
 *
 * @returns Board context value with state and actions
 * @throws Error if used outside BoardProvider
 *
 * @example
 * ```tsx
 * const { objects, viewport, createObject, selectObject } = useBoard();
 *
 * const handleAddNote = async () => {
 *   const result = await createObject({
 *     id: generateUUID(),
 *     type: 'sticky-note',
 *     x: viewport.x + 100,
 *     y: viewport.y + 100,
 *     // ... other properties
 *   });
 * };
 * ```
 */
export function useBoard(): BoardContextValue {
  const context = useContext(BoardContext);

  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }

  return context;
}

/**
 * Hook to access just the viewport state and actions.
 *
 * @returns Viewport state and setters
 *
 * @example
 * ```tsx
 * const { viewport, setViewport, resetViewport } = useBoardViewport();
 *
 * const handleZoomIn = () => {
 *   setViewport({ scale: viewport.scale * 1.2 });
 * };
 * ```
 */
export function useBoardViewport(): {
  viewport: ViewportState;
  setViewport: (viewport: Partial<ViewportState>) => void;
  resetViewport: () => void;
} {
  const { viewport, setViewport, resetViewport } = useBoard();
  return { viewport, setViewport, resetViewport };
}

/**
 * Hook to access just the selection state and actions.
 *
 * @returns Selection state and actions
 *
 * @example
 * ```tsx
 * const { selectedObjectIds, selectObject, clearSelection } = useBoardSelection();
 *
 * const handleClick = (objectId: string, shift: boolean) => {
 *   selectObject(objectId, shift);
 * };
 * ```
 */
export function useBoardSelection(): {
  selectedObjectIds: Set<string>;
  selectObject: (objectId: string, addToSelection?: boolean) => void;
  selectObjects: (objectIds: string[]) => void;
  deselectObject: (objectId: string) => void;
  clearSelection: () => void;
  isObjectSelected: (objectId: string) => boolean;
  getSelectedObjects: () => SyncableObject[];
} {
  const {
    selectedObjectIds,
    selectObject,
    selectObjects,
    deselectObject,
    clearSelection,
    isObjectSelected,
    getSelectedObjects,
  } = useBoard();

  return {
    selectedObjectIds,
    selectObject,
    selectObjects,
    deselectObject,
    clearSelection,
    isObjectSelected,
    getSelectedObjects,
  };
}

/**
 * Hook to access just the objects and object operations.
 *
 * @returns Objects array and CRUD operations
 *
 * @example
 * ```tsx
 * const { objects, createObject, updateObject, deleteObject } = useBoardObjects();
 *
 * const stickyNotes = objects.filter(obj => obj.type === 'sticky-note');
 * ```
 */
export function useBoardObjects(): {
  objects: SyncableObject[];
  isLoading: boolean;
  createObject: (object: SyncableObject) => Promise<SyncResult>;
  updateObject: (objectId: string, update: ObjectUpdate) => Promise<SyncResult>;
  deleteObject: (objectId: string) => Promise<SyncResult>;
  getObject: (objectId: string) => SyncableObject | undefined;
} {
  const {
    objects,
    isLoading,
    createObject,
    updateObject,
    deleteObject,
    getObject,
  } = useBoard();

  return {
    objects,
    isLoading,
    createObject,
    updateObject,
    deleteObject,
    getObject,
  };
}

export { BoardContext };
