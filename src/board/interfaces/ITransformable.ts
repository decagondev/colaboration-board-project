/**
 * Transformable Interface
 *
 * For objects that support geometric transformations.
 */

import type { Position, Size } from './IBoardObject';

/**
 * Transformation state.
 */
export interface Transform {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** X scale factor */
  scaleX: number;
  /** Y scale factor */
  scaleY: number;
}

/**
 * Partial transform update.
 */
export type TransformUpdate = Partial<Transform>;

/**
 * Interface for objects that can be transformed.
 *
 * Transformable objects can be moved, resized, rotated, and scaled.
 * Implements geometric operations for interactive manipulation.
 */
export interface ITransformable {
  /**
   * Current transformation state.
   */
  transform: Transform;

  /**
   * Move the object to a new position.
   *
   * @param position - New position
   */
  moveTo(position: Position): void;

  /**
   * Move the object by a delta.
   *
   * @param delta - Position delta
   */
  moveBy(delta: Position): void;

  /**
   * Resize the object to a new size.
   *
   * @param size - New size
   * @param anchor - Optional anchor point for resize (default: top-left)
   */
  resizeTo(size: Size, anchor?: Position): void;

  /**
   * Rotate the object to a specific angle.
   *
   * @param degrees - Angle in degrees
   * @param center - Optional rotation center (default: object center)
   */
  rotateTo(degrees: number, center?: Position): void;

  /**
   * Rotate the object by a delta.
   *
   * @param degrees - Angle delta in degrees
   * @param center - Optional rotation center (default: object center)
   */
  rotateBy(degrees: number, center?: Position): void;

  /**
   * Apply a full transform update.
   *
   * @param transform - Transform update
   */
  applyTransform(transform: TransformUpdate): void;

  /**
   * Get the center point of the object.
   *
   * @returns Center position
   */
  getCenter(): Position;

  /**
   * Reset transform to default (no rotation, scale 1:1).
   */
  resetTransform(): void;

  /**
   * Whether rotation is supported.
   */
  readonly canRotate: boolean;

  /**
   * Whether free-form resize is supported (vs. aspect-locked).
   */
  readonly canFreeResize: boolean;

  /**
   * Minimum allowed size.
   */
  readonly minSize: Size;

  /**
   * Maximum allowed size (optional).
   */
  readonly maxSize?: Size;
}

/**
 * Default minimum size for transformable objects.
 */
export const DEFAULT_MIN_SIZE: Size = {
  width: 20,
  height: 20,
};

/**
 * Create a default transform from position and size.
 *
 * @param x - X position
 * @param y - Y position
 * @param width - Width
 * @param height - Height
 * @returns Transform with default rotation and scale
 */
export function createDefaultTransform(
  x: number,
  y: number,
  width: number,
  height: number
): Transform {
  return {
    x,
    y,
    width,
    height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  };
}
