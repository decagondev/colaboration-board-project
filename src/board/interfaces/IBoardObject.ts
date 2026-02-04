/**
 * Board Object Interfaces
 *
 * Defines the core interfaces for all board objects following
 * Interface Segregation Principle (ISP) from SOLID.
 */

/**
 * Position in 2D space.
 */
export interface Position {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
}

/**
 * Size dimensions.
 */
export interface Size {
  /** Width */
  width: number;
  /** Height */
  height: number;
}

/**
 * Bounding box combining position and size.
 */
export interface BoundingBox extends Position, Size {}

/**
 * Base interface for all board objects.
 *
 * Every object on the board must implement this interface.
 * Additional capabilities are added through composition of
 * focused interfaces (ITransformable, IEditable, etc.).
 */
export interface IBoardObject {
  /** Unique identifier */
  readonly id: string;

  /** Object type discriminator */
  readonly type: BoardObjectType;

  /** Position on the canvas */
  position: Position;

  /** Size of the object */
  size: Size;

  /** Z-index for layering order */
  zIndex: number;

  /** Whether the object is locked from editing */
  locked: boolean;

  /** Whether the object is visible */
  visible: boolean;

  /** User ID who created the object */
  readonly createdBy: string;

  /** Creation timestamp */
  readonly createdAt: number;

  /** User ID who last modified */
  modifiedBy: string;

  /** Last modification timestamp */
  modifiedAt: number;

  /**
   * Get the bounding box of the object.
   *
   * @returns Bounding box with position and size
   */
  getBounds(): BoundingBox;

  /**
   * Check if a point is within the object bounds.
   *
   * @param point - Point to check
   * @returns True if point is within bounds
   */
  containsPoint(point: Position): boolean;

  /**
   * Check if this object intersects with another bounding box.
   *
   * @param bounds - Bounding box to check against
   * @returns True if intersects
   */
  intersects(bounds: BoundingBox): boolean;

  /**
   * Clone the object with a new ID.
   *
   * @returns New object instance
   */
  clone(): IBoardObject;

  /**
   * Serialize the object to a plain object for storage.
   *
   * @returns Serialized object data
   */
  toJSON(): BoardObjectData;
}

/**
 * Discriminated union of all board object types.
 */
export type BoardObjectType =
  | 'sticky-note'
  | 'shape'
  | 'text'
  | 'connector'
  | 'frame'
  | 'image';

/**
 * Serialized board object data for storage and sync.
 */
export interface BoardObjectData {
  /** Unique identifier */
  id: string;
  /** Object type */
  type: BoardObjectType;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Z-index */
  zIndex: number;
  /** Locked state */
  locked: boolean;
  /** Visibility */
  visible: boolean;
  /** Creator user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last modifier user ID */
  modifiedBy: string;
  /** Last modification timestamp */
  modifiedAt: number;
  /** Type-specific additional data */
  data?: Record<string, unknown>;
}
