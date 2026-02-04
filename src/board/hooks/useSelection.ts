/**
 * useSelection Hook
 *
 * React hook for managing object selection on the board.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ISelectionService,
  SelectionMode,
  LassoState,
  SelectionChangeEvent,
} from '../interfaces/ISelectionService';
import type { BoundingBox, Position } from '../interfaces/IBoardObject';
import { SelectionService } from '../services/SelectionService';
import { DEFAULT_LASSO_STATE } from '../interfaces/ISelectionService';

/**
 * Selection hook return type.
 */
export interface UseSelectionReturn {
  /** Currently selected object IDs */
  selectedIds: Set<string>;
  /** The primary selected object ID */
  primarySelectedId: string | null;
  /** Whether any objects are selected */
  hasSelection: boolean;
  /** Current lasso selection state */
  lassoState: LassoState;
  /** Select a single object */
  select: (objectId: string, mode?: SelectionMode) => void;
  /** Select multiple objects */
  selectMultiple: (objectIds: string[], mode?: SelectionMode) => void;
  /** Deselect a single object */
  deselect: (objectId: string) => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if an object is selected */
  isSelected: (objectId: string) => boolean;
  /** Start lasso selection */
  startLasso: (startPoint: Position) => void;
  /** Update lasso during drag */
  updateLasso: (currentPoint: Position) => void;
  /** End lasso selection */
  endLasso: (mode?: SelectionMode) => BoundingBox | null;
  /** Cancel lasso selection */
  cancelLasso: () => void;
  /** Select objects within lasso bounds */
  selectObjectsInLasso: (
    objectIds: string[],
    intersectionTest: (objectId: string, bounds: BoundingBox) => boolean,
    mode?: SelectionMode
  ) => void;
  /** Get combined bounds of selected objects */
  getSelectionBounds: (
    getBounds: (objectId: string) => BoundingBox | null
  ) => BoundingBox | null;
  /** The underlying selection service */
  service: ISelectionService;
}

/**
 * Hook for managing object selection.
 *
 * Provides selection functionality including single selection, multi-selection
 * with modifier keys, and lasso (marquee) selection.
 *
 * @returns Selection state and functions
 *
 * @example
 * ```typescript
 * const {
 *   selectedIds,
 *   select,
 *   clearSelection,
 *   startLasso,
 *   updateLasso,
 *   endLasso,
 * } = useSelection();
 *
 * // Single click selection
 * const handleClick = (objectId: string, event: MouseEvent) => {
 *   select(objectId, event.shiftKey ? 'add' : 'replace');
 * };
 *
 * // Lasso selection
 * const handleMouseDown = (e: MouseEvent) => {
 *   if (e.target === stage) {
 *     startLasso({ x: e.clientX, y: e.clientY });
 *   }
 * };
 * ```
 */
export function useSelection(): UseSelectionReturn {
  const serviceRef = useRef<ISelectionService>(new SelectionService());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [primarySelectedId, setPrimarySelectedId] = useState<string | null>(
    null
  );
  const [lassoState, setLassoState] = useState<LassoState>(DEFAULT_LASSO_STATE);

  useEffect(() => {
    const unsubscribe = serviceRef.current.onSelectionChange(
      (event: SelectionChangeEvent) => {
        setSelectedIds(new Set(event.currentSelection));
        setPrimarySelectedId(serviceRef.current.primarySelectedId);
      }
    );

    return unsubscribe;
  }, []);

  const select = useCallback((objectId: string, mode?: SelectionMode) => {
    serviceRef.current.select(objectId, mode);
  }, []);

  const selectMultiple = useCallback(
    (objectIds: string[], mode?: SelectionMode) => {
      serviceRef.current.selectMultiple(objectIds, mode);
    },
    []
  );

  const deselect = useCallback((objectId: string) => {
    serviceRef.current.deselect(objectId);
  }, []);

  const clearSelection = useCallback(() => {
    serviceRef.current.clearSelection();
  }, []);

  const isSelected = useCallback((objectId: string) => {
    return serviceRef.current.isSelected(objectId);
  }, []);

  const startLasso = useCallback((startPoint: Position) => {
    serviceRef.current.startLasso(startPoint);
    setLassoState(serviceRef.current.lassoState);
  }, []);

  const updateLasso = useCallback((currentPoint: Position) => {
    serviceRef.current.updateLasso(currentPoint);
    setLassoState(serviceRef.current.lassoState);
  }, []);

  const endLasso = useCallback((mode?: SelectionMode) => {
    const bounds = serviceRef.current.endLasso(mode);
    setLassoState(DEFAULT_LASSO_STATE);
    return bounds;
  }, []);

  const cancelLasso = useCallback(() => {
    serviceRef.current.cancelLasso();
    setLassoState(DEFAULT_LASSO_STATE);
  }, []);

  const selectObjectsInLasso = useCallback(
    (
      objectIds: string[],
      intersectionTest: (objectId: string, bounds: BoundingBox) => boolean,
      mode: SelectionMode = 'replace'
    ) => {
      const bounds = serviceRef.current.lassoState.bounds;
      if (bounds && bounds.width > 5 && bounds.height > 5) {
        const objectsInBounds = serviceRef.current.getObjectsInBounds(
          bounds,
          objectIds,
          intersectionTest
        );
        serviceRef.current.selectMultiple(objectsInBounds, mode);
      }
      serviceRef.current.endLasso(mode);
      setLassoState(DEFAULT_LASSO_STATE);
    },
    []
  );

  const getSelectionBounds = useCallback(
    (getBounds: (objectId: string) => BoundingBox | null) => {
      return serviceRef.current.getSelectionBounds(getBounds);
    },
    []
  );

  return {
    selectedIds,
    primarySelectedId,
    hasSelection: selectedIds.size > 0,
    lassoState,
    select,
    selectMultiple,
    deselect,
    clearSelection,
    isSelected,
    startLasso,
    updateLasso,
    endLasso,
    cancelLasso,
    selectObjectsInLasso,
    getSelectionBounds,
    service: serviceRef.current,
  };
}
