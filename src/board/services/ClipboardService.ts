/**
 * Clipboard Service
 *
 * Manages copy/paste operations for board objects.
 */

import type { IBoardObject, Position, BoundingBox } from '../interfaces/IBoardObject';

/**
 * Clipboard content with metadata.
 */
export interface ClipboardContent {
  /** The copied objects */
  objects: IBoardObject[];
  /** Original bounding box of the copied content */
  originalBounds: BoundingBox;
  /** Timestamp when copied */
  copiedAt: number;
  /** Source board ID (for cross-board paste detection) */
  sourceBoardId?: string;
}

/**
 * Clipboard change event.
 */
export interface ClipboardChangeEvent {
  /** Whether clipboard has content */
  hasContent: boolean;
  /** Number of objects in clipboard */
  objectCount: number;
}

/**
 * Clipboard Service Interface
 */
export interface IClipboardService {
  /** Whether clipboard has content */
  readonly hasContent: boolean;
  /** Number of objects in clipboard */
  readonly objectCount: number;

  /**
   * Copy objects to clipboard.
   *
   * @param objects - Objects to copy
   * @param boardId - Optional source board ID
   */
  copy(objects: IBoardObject[], boardId?: string): void;

  /**
   * Cut objects to clipboard (copy for later delete).
   *
   * @param objects - Objects to cut
   * @param boardId - Optional source board ID
   */
  cut(objects: IBoardObject[], boardId?: string): void;

  /**
   * Get objects from clipboard for pasting.
   *
   * @param pastePosition - Position to paste at
   * @param offset - Offset from original position (default: use pastePosition as center)
   * @returns Cloned objects with new IDs positioned at paste location
   */
  paste(pastePosition: Position, offset?: Position): IBoardObject[] | null;

  /**
   * Check if last operation was cut.
   */
  isCutOperation(): boolean;

  /**
   * Get clipboard content without modifying it.
   */
  peek(): ClipboardContent | null;

  /**
   * Clear clipboard.
   */
  clear(): void;

  /**
   * Subscribe to clipboard changes.
   *
   * @param callback - Function called when clipboard changes
   * @returns Unsubscribe function
   */
  onChange(callback: (event: ClipboardChangeEvent) => void): () => void;
}

/**
 * Clipboard Service Implementation
 */
export class ClipboardService implements IClipboardService {
  private _content: ClipboardContent | null = null;
  private _isCut = false;
  private _pasteCount = 0;
  private _listeners: Set<(event: ClipboardChangeEvent) => void> = new Set();

  /**
   * Whether clipboard has content.
   */
  get hasContent(): boolean {
    return this._content !== null && this._content.objects.length > 0;
  }

  /**
   * Number of objects in clipboard.
   */
  get objectCount(): number {
    return this._content?.objects.length ?? 0;
  }

  /**
   * Copy objects to clipboard.
   *
   * @param objects - Objects to copy
   * @param boardId - Optional source board ID
   */
  copy(objects: IBoardObject[], boardId?: string): void {
    if (objects.length === 0) return;

    const clonedObjects = objects.map((obj) => obj.clone());
    const bounds = this.calculateBounds(clonedObjects);

    this._content = {
      objects: clonedObjects,
      originalBounds: bounds,
      copiedAt: Date.now(),
      sourceBoardId: boardId,
    };
    this._isCut = false;
    this._pasteCount = 0;

    this.notifyListeners();
  }

  /**
   * Cut objects to clipboard.
   *
   * @param objects - Objects to cut
   * @param boardId - Optional source board ID
   */
  cut(objects: IBoardObject[], boardId?: string): void {
    this.copy(objects, boardId);
    this._isCut = true;
  }

  /**
   * Get objects from clipboard for pasting.
   *
   * @param pastePosition - Position to paste at
   * @param offset - Offset from original position
   * @returns Cloned objects with new IDs positioned at paste location
   */
  paste(pastePosition: Position, offset?: Position): IBoardObject[] | null {
    if (!this._content || this._content.objects.length === 0) {
      return null;
    }

    const originalBounds = this._content.originalBounds;
    const originalCenter = {
      x: originalBounds.x + originalBounds.width / 2,
      y: originalBounds.y + originalBounds.height / 2,
    };

    this._pasteCount++;
    const stackOffset = this._isCut && this._pasteCount === 1 ? 0 : 20 * this._pasteCount;

    const pastedObjects = this._content.objects.map((obj) => {
      const clone = obj.clone();
      const relativePos = {
        x: obj.position.x - originalCenter.x,
        y: obj.position.y - originalCenter.y,
      };

      if (offset) {
        clone.position = {
          x: obj.position.x + offset.x + stackOffset,
          y: obj.position.y + offset.y + stackOffset,
        };
      } else {
        clone.position = {
          x: pastePosition.x + relativePos.x + stackOffset,
          y: pastePosition.y + relativePos.y + stackOffset,
        };
      }

      return clone;
    });

    if (this._isCut && this._pasteCount === 1) {
      this._isCut = false;
    }

    return pastedObjects;
  }

  /**
   * Check if last operation was cut.
   */
  isCutOperation(): boolean {
    return this._isCut && this._pasteCount === 0;
  }

  /**
   * Get clipboard content without modifying it.
   */
  peek(): ClipboardContent | null {
    return this._content;
  }

  /**
   * Clear clipboard.
   */
  clear(): void {
    this._content = null;
    this._isCut = false;
    this._pasteCount = 0;
    this.notifyListeners();
  }

  /**
   * Subscribe to clipboard changes.
   *
   * @param callback - Function called when clipboard changes
   * @returns Unsubscribe function
   */
  onChange(callback: (event: ClipboardChangeEvent) => void): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Calculate bounding box of objects.
   *
   * @param objects - Objects to calculate bounds for
   * @returns Combined bounding box
   */
  private calculateBounds(objects: IBoardObject[]): BoundingBox {
    if (objects.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const obj of objects) {
      const bounds = obj.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Notify listeners of clipboard change.
   */
  private notifyListeners(): void {
    const event: ClipboardChangeEvent = {
      hasContent: this.hasContent,
      objectCount: this.objectCount,
    };

    for (const listener of this._listeners) {
      listener(event);
    }
  }
}

/**
 * Create a new ClipboardService instance.
 *
 * @returns New ClipboardService
 */
export function createClipboardService(): IClipboardService {
  return new ClipboardService();
}
