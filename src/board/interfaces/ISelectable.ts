/**
 * Selectable Interface
 *
 * For objects that can be selected and participate in selection operations.
 */

import type { BoundingBox, Position } from './IBoardObject';

/**
 * Selection state for an object.
 */
export interface SelectionState {
  /** Whether the object is selected */
  isSelected: boolean;
  /** Whether the object is part of a multi-selection */
  isMultiSelected: boolean;
  /** Whether the object is being hovered */
  isHovered: boolean;
  /** Whether the object is the primary selected object */
  isPrimarySelection: boolean;
}

/**
 * Selection handles for resize/rotate operations.
 */
export type SelectionHandle =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left'
  | 'rotation';

/**
 * Handle position data.
 */
export interface HandlePosition {
  /** Handle type */
  handle: SelectionHandle;
  /** Handle position */
  position: Position;
  /** Cursor style for the handle */
  cursor: string;
}

/**
 * Interface for objects that can be selected.
 *
 * Selectable objects can be clicked to select, participate in
 * lasso selection, and show selection UI (handles).
 */
export interface ISelectable {
  /**
   * Current selection state.
   */
  selectionState: SelectionState;

  /**
   * Select this object.
   *
   * @param asPrimary - Whether this is the primary selection
   */
  select(asPrimary?: boolean): void;

  /**
   * Deselect this object.
   */
  deselect(): void;

  /**
   * Set hover state.
   *
   * @param hovered - Whether the object is hovered
   */
  setHovered(hovered: boolean): void;

  /**
   * Get the selection bounds (may differ from object bounds).
   *
   * @returns Selection bounding box
   */
  getSelectionBounds(): BoundingBox;

  /**
   * Get positions for selection handles.
   *
   * @returns Array of handle positions
   */
  getHandlePositions(): HandlePosition[];

  /**
   * Check if a point hits a selection handle.
   *
   * @param point - Point to check
   * @param tolerance - Hit tolerance in pixels
   * @returns The hit handle or null
   */
  hitTestHandle(point: Position, tolerance?: number): SelectionHandle | null;

  /**
   * Whether the object can be selected.
   */
  readonly isSelectable: boolean;
}

/**
 * Default selection state (unselected).
 */
export const DEFAULT_SELECTION_STATE: SelectionState = {
  isSelected: false,
  isMultiSelected: false,
  isHovered: false,
  isPrimarySelection: false,
};

/**
 * Cursor styles for each selection handle.
 */
export const HANDLE_CURSORS: Record<SelectionHandle, string> = {
  'top-left': 'nwse-resize',
  top: 'ns-resize',
  'top-right': 'nesw-resize',
  right: 'ew-resize',
  'bottom-right': 'nwse-resize',
  bottom: 'ns-resize',
  'bottom-left': 'nesw-resize',
  left: 'ew-resize',
  rotation: 'grab',
};
