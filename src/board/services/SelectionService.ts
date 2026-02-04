/**
 * Selection Service
 *
 * Manages selection state for board objects.
 */

import type {
  ISelectionService,
  SelectionMode,
  LassoState,
  SelectionChangeEvent,
} from '../interfaces/ISelectionService';
import type { BoundingBox, Position } from '../interfaces/IBoardObject';
import { DEFAULT_LASSO_STATE } from '../interfaces/ISelectionService';

/**
 * Selection Service Implementation
 *
 * Provides selection management functionality including:
 * - Single and multi-selection with different modes
 * - Lasso (marquee) selection
 * - Selection change notifications
 */
export class SelectionService implements ISelectionService {
  private _selectedIds: Set<string> = new Set();
  private _primarySelectedId: string | null = null;
  private _lassoState: LassoState = { ...DEFAULT_LASSO_STATE };
  private _listeners: Set<(event: SelectionChangeEvent) => void> = new Set();

  /**
   * Currently selected object IDs.
   */
  get selectedIds(): Set<string> {
    return new Set(this._selectedIds);
  }

  /**
   * The primary selected object ID.
   */
  get primarySelectedId(): string | null {
    return this._primarySelectedId;
  }

  /**
   * Whether any objects are currently selected.
   */
  get hasSelection(): boolean {
    return this._selectedIds.size > 0;
  }

  /**
   * Current lasso selection state.
   */
  get lassoState(): LassoState {
    return { ...this._lassoState };
  }

  /**
   * Select a single object.
   *
   * @param objectId - ID of the object to select
   * @param mode - How to combine with existing selection
   */
  select(objectId: string, mode: SelectionMode = 'replace'): void {
    const previous = new Set(this._selectedIds);

    switch (mode) {
      case 'replace':
        this._selectedIds.clear();
        this._selectedIds.add(objectId);
        this._primarySelectedId = objectId;
        break;

      case 'add':
        this._selectedIds.add(objectId);
        if (!this._primarySelectedId) {
          this._primarySelectedId = objectId;
        }
        break;

      case 'toggle':
        if (this._selectedIds.has(objectId)) {
          this._selectedIds.delete(objectId);
          if (this._primarySelectedId === objectId) {
            this._primarySelectedId = this._selectedIds.size > 0
              ? Array.from(this._selectedIds)[0]
              : null;
          }
        } else {
          this._selectedIds.add(objectId);
          if (!this._primarySelectedId) {
            this._primarySelectedId = objectId;
          }
        }
        break;

      case 'remove':
        this._selectedIds.delete(objectId);
        if (this._primarySelectedId === objectId) {
          this._primarySelectedId = this._selectedIds.size > 0
            ? Array.from(this._selectedIds)[0]
            : null;
        }
        break;
    }

    this.notifyListeners(previous);
  }

  /**
   * Select multiple objects.
   *
   * @param objectIds - IDs of objects to select
   * @param mode - How to combine with existing selection
   */
  selectMultiple(objectIds: string[], mode: SelectionMode = 'replace'): void {
    const previous = new Set(this._selectedIds);

    switch (mode) {
      case 'replace':
        this._selectedIds.clear();
        for (const id of objectIds) {
          this._selectedIds.add(id);
        }
        this._primarySelectedId = objectIds.length > 0 ? objectIds[0] : null;
        break;

      case 'add':
        for (const id of objectIds) {
          this._selectedIds.add(id);
        }
        if (!this._primarySelectedId && objectIds.length > 0) {
          this._primarySelectedId = objectIds[0];
        }
        break;

      case 'toggle':
        for (const id of objectIds) {
          if (this._selectedIds.has(id)) {
            this._selectedIds.delete(id);
          } else {
            this._selectedIds.add(id);
          }
        }
        if (this._primarySelectedId && !this._selectedIds.has(this._primarySelectedId)) {
          this._primarySelectedId = this._selectedIds.size > 0
            ? Array.from(this._selectedIds)[0]
            : null;
        }
        break;

      case 'remove':
        for (const id of objectIds) {
          this._selectedIds.delete(id);
        }
        if (this._primarySelectedId && !this._selectedIds.has(this._primarySelectedId)) {
          this._primarySelectedId = this._selectedIds.size > 0
            ? Array.from(this._selectedIds)[0]
            : null;
        }
        break;
    }

    this.notifyListeners(previous);
  }

  /**
   * Deselect a single object.
   *
   * @param objectId - ID of the object to deselect
   */
  deselect(objectId: string): void {
    this.select(objectId, 'remove');
  }

  /**
   * Clear all selections.
   */
  clearSelection(): void {
    const previous = new Set(this._selectedIds);
    this._selectedIds.clear();
    this._primarySelectedId = null;
    this.notifyListeners(previous);
  }

  /**
   * Check if an object is selected.
   *
   * @param objectId - ID of the object to check
   * @returns True if the object is selected
   */
  isSelected(objectId: string): boolean {
    return this._selectedIds.has(objectId);
  }

  /**
   * Start lasso selection.
   *
   * @param startPoint - Starting point of the lasso
   */
  startLasso(startPoint: Position): void {
    this._lassoState = {
      isActive: true,
      startPoint: { ...startPoint },
      endPoint: { ...startPoint },
      bounds: {
        x: startPoint.x,
        y: startPoint.y,
        width: 0,
        height: 0,
      },
    };
  }

  /**
   * Update lasso selection during drag.
   *
   * @param currentPoint - Current mouse/pointer position
   */
  updateLasso(currentPoint: Position): void {
    if (!this._lassoState.isActive || !this._lassoState.startPoint) {
      return;
    }

    const start = this._lassoState.startPoint;
    const minX = Math.min(start.x, currentPoint.x);
    const minY = Math.min(start.y, currentPoint.y);
    const maxX = Math.max(start.x, currentPoint.x);
    const maxY = Math.max(start.y, currentPoint.y);

    this._lassoState = {
      ...this._lassoState,
      endPoint: { ...currentPoint },
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    };
  }

  /**
   * End lasso selection and return the selected bounds.
   *
   * @param mode - How to combine with existing selection
   * @returns The final lasso bounds
   */
  endLasso(mode: SelectionMode = 'replace'): BoundingBox | null {
    const bounds = this._lassoState.bounds;
    this._lassoState = { ...DEFAULT_LASSO_STATE };
    return bounds;
  }

  /**
   * Cancel lasso selection without applying.
   */
  cancelLasso(): void {
    this._lassoState = { ...DEFAULT_LASSO_STATE };
  }

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
  ): string[] {
    return objectIds.filter(id => intersectionTest(id, bounds));
  }

  /**
   * Subscribe to selection changes.
   *
   * @param callback - Function called when selection changes
   * @returns Unsubscribe function
   */
  onSelectionChange(callback: (event: SelectionChangeEvent) => void): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Get the combined bounding box of all selected objects.
   *
   * @param getBounds - Function to get bounds for an object ID
   * @returns Combined bounds, or null if nothing selected
   */
  getSelectionBounds(
    getBounds: (objectId: string) => BoundingBox | null
  ): BoundingBox | null {
    if (this._selectedIds.size === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const id of this._selectedIds) {
      const bounds = getBounds(id);
      if (bounds) {
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
      }
    }

    if (minX === Infinity) {
      return null;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Notify listeners of selection change.
   *
   * @param previous - Previous selection set
   */
  private notifyListeners(previous: Set<string>): void {
    const current = new Set(this._selectedIds);
    const added: string[] = [];
    const removed: string[] = [];

    for (const id of current) {
      if (!previous.has(id)) {
        added.push(id);
      }
    }

    for (const id of previous) {
      if (!current.has(id)) {
        removed.push(id);
      }
    }

    if (added.length > 0 || removed.length > 0) {
      const event: SelectionChangeEvent = {
        previousSelection: previous,
        currentSelection: current,
        added,
        removed,
      };

      for (const listener of this._listeners) {
        listener(event);
      }
    }
  }
}

/**
 * Create a new SelectionService instance.
 *
 * @returns New SelectionService
 */
export function createSelectionService(): ISelectionService {
  return new SelectionService();
}
