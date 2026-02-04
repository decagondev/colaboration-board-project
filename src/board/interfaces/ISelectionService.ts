/**
 * Selection Service Interface
 *
 * Defines the contract for managing object selection on the board.
 */

import type { BoundingBox, Position } from './IBoardObject';
import type { SelectionHandle } from './ISelectable';

/**
 * Selection mode determines how new selections interact with existing ones.
 */
export type SelectionMode = 'replace' | 'add' | 'toggle' | 'remove';

/**
 * Lasso selection state during drag operation.
 */
export interface LassoState {
  /** Whether lasso selection is active */
  isActive: boolean;
  /** Starting point of the lasso */
  startPoint: Position | null;
  /** Current end point of the lasso */
  endPoint: Position | null;
  /** Calculated bounding box of the lasso */
  bounds: BoundingBox | null;
}

/**
 * Selection change event data.
 */
export interface SelectionChangeEvent {
  /** Previously selected object IDs */
  previousSelection: Set<string>;
  /** Currently selected object IDs */
  currentSelection: Set<string>;
  /** IDs that were added to selection */
  added: string[];
  /** IDs that were removed from selection */
  removed: string[];
}

/**
 * Selection Service Interface
 *
 * Manages selection state for board objects including:
 * - Single and multi-selection
 * - Lasso (marquee) selection
 * - Selection change notifications
 */
export interface ISelectionService {
  /**
   * Currently selected object IDs.
   */
  readonly selectedIds: Set<string>;

  /**
   * The primary selected object ID (first or most recent selection).
   */
  readonly primarySelectedId: string | null;

  /**
   * Whether any objects are currently selected.
   */
  readonly hasSelection: boolean;

  /**
   * Current lasso selection state.
   */
  readonly lassoState: LassoState;

  /**
   * Select a single object.
   *
   * @param objectId - ID of the object to select
   * @param mode - How to combine with existing selection (default: replace)
   */
  select(objectId: string, mode?: SelectionMode): void;

  /**
   * Select multiple objects.
   *
   * @param objectIds - IDs of objects to select
   * @param mode - How to combine with existing selection (default: replace)
   */
  selectMultiple(objectIds: string[], mode?: SelectionMode): void;

  /**
   * Deselect a single object.
   *
   * @param objectId - ID of the object to deselect
   */
  deselect(objectId: string): void;

  /**
   * Clear all selections.
   */
  clearSelection(): void;

  /**
   * Check if an object is selected.
   *
   * @param objectId - ID of the object to check
   * @returns True if the object is selected
   */
  isSelected(objectId: string): boolean;

  /**
   * Start lasso selection.
   *
   * @param startPoint - Starting point of the lasso
   */
  startLasso(startPoint: Position): void;

  /**
   * Update lasso selection during drag.
   *
   * @param currentPoint - Current mouse/pointer position
   */
  updateLasso(currentPoint: Position): void;

  /**
   * End lasso selection and return the selected bounds.
   *
   * @param mode - How to combine with existing selection
   * @returns The final lasso bounds
   */
  endLasso(mode?: SelectionMode): BoundingBox | null;

  /**
   * Cancel lasso selection without applying.
   */
  cancelLasso(): void;

  /**
   * Get objects within a bounding box.
   *
   * @param bounds - Bounding box to test
   * @param objectIds - Available object IDs to test
   * @param intersectionTest - Function to test if an object intersects bounds
   * @returns Array of object IDs within bounds
   */
  getObjectsInBounds(
    bounds: BoundingBox,
    objectIds: string[],
    intersectionTest: (objectId: string, bounds: BoundingBox) => boolean
  ): string[];

  /**
   * Subscribe to selection changes.
   *
   * @param callback - Function called when selection changes
   * @returns Unsubscribe function
   */
  onSelectionChange(
    callback: (event: SelectionChangeEvent) => void
  ): () => void;

  /**
   * Get the combined bounding box of all selected objects.
   *
   * @param getBounds - Function to get bounds for an object ID
   * @returns Combined bounds, or null if nothing selected
   */
  getSelectionBounds(
    getBounds: (objectId: string) => BoundingBox | null
  ): BoundingBox | null;
}

/**
 * Selection handle being dragged.
 */
export interface DraggedHandle {
  /** The handle being dragged */
  handle: SelectionHandle;
  /** Object ID the handle belongs to */
  objectId: string;
  /** Starting position of the drag */
  startPosition: Position;
}

/**
 * Default lasso state.
 */
export const DEFAULT_LASSO_STATE: LassoState = {
  isActive: false,
  startPoint: null,
  endPoint: null,
  bounds: null,
};
