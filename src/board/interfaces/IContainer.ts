/**
 * Container Interfaces
 *
 * Defines interfaces for container objects and containable objects.
 * Follows Interface Segregation Principle (ISP) - small, focused interfaces.
 *
 * @module board/interfaces/IContainer
 */

import type { Position, BoundingBox } from './IBoardObject';

/**
 * Snap behavior options when adding objects to a container.
 */
export type SnapBehavior = 'none' | 'center' | 'grid' | 'edges';

/**
 * Container padding configuration.
 */
export interface ContainerPadding {
  /** Top padding */
  top: number;
  /** Right padding */
  right: number;
  /** Bottom padding */
  bottom: number;
  /** Left padding */
  left: number;
}

/**
 * Options for adding a child to a container.
 */
export interface AddChildOptions {
  /** Whether to snap the child to the container grid/edges */
  snap?: boolean;
  /** Whether to maintain the child's absolute position */
  preservePosition?: boolean;
  /** Target position within the container (relative) */
  relativePosition?: Position;
}

/**
 * Result of a containment check.
 */
export interface ContainmentCheckResult {
  /** Whether the object is fully contained */
  isContained: boolean;
  /** Whether the object is partially overlapping */
  isOverlapping: boolean;
  /** Percentage of object area inside the container (0-1) */
  overlapPercentage: number;
  /** Suggested snap position if snapping is enabled */
  suggestedPosition?: Position;
}

/**
 * Event emitted when container content changes.
 */
export interface ContainerChangeEvent {
  /** Container ID */
  containerId: string;
  /** Type of change */
  changeType: 'add' | 'remove' | 'reorder';
  /** Affected child IDs */
  childIds: string[];
  /** Previous child IDs (for reorder) */
  previousChildIds?: string[];
}

/**
 * Interface for objects that can contain other objects.
 *
 * Containers manage a collection of child objects and handle:
 * - Adding/removing children
 * - Moving children when the container moves
 * - Containment boundary checks
 * - Z-index management for children
 *
 * @example
 * ```typescript
 * class Frame implements IContainer {
 *   addChild(childId: string): boolean {
 *     this._childIds.push(childId);
 *     return true;
 *   }
 * }
 * ```
 */
export interface IContainer {
  /**
   * IDs of objects contained in this container.
   */
  readonly childIds: readonly string[];

  /**
   * Whether the container is currently accepting new children.
   */
  readonly acceptsChildren: boolean;

  /**
   * The snap behavior when objects are added.
   */
  snapBehavior: SnapBehavior;

  /**
   * Padding inside the container.
   */
  readonly padding: ContainerPadding;

  /**
   * Get the content area bounds (container bounds minus padding/header).
   *
   * @returns Bounding box of the content area
   */
  getContentBounds(): BoundingBox;

  /**
   * Check if an object would be contained within this container.
   *
   * @param objectBounds - Bounds of the object to check
   * @returns Containment check result
   */
  checkContainment(objectBounds: BoundingBox): ContainmentCheckResult;

  /**
   * Add a child object to this container.
   *
   * @param childId - ID of the object to add
   * @param options - Optional add configuration
   * @returns True if child was added successfully
   */
  addChild(childId: string, options?: AddChildOptions): boolean;

  /**
   * Remove a child object from this container.
   *
   * @param childId - ID of the object to remove
   * @returns True if child was removed successfully
   */
  removeChild(childId: string): boolean;

  /**
   * Check if this container contains a specific object.
   *
   * @param childId - ID of the object to check
   * @returns True if object is a child of this container
   */
  hasChild(childId: string): boolean;

  /**
   * Get the z-index offset for children.
   * Children should render at container.zIndex + childZIndexOffset + their own index.
   *
   * @returns Z-index offset for children
   */
  getChildZIndexOffset(): number;

  /**
   * Calculate the position offset when the container moves.
   * Used to move children along with the container.
   *
   * @param oldPosition - Previous container position
   * @param newPosition - New container position
   * @returns Position delta to apply to children
   */
  calculateChildPositionDelta(
    oldPosition: Position,
    newPosition: Position
  ): Position;

  /**
   * Reorder children within the container.
   *
   * @param childId - ID of the child to reorder
   * @param newIndex - New index for the child
   * @returns True if reorder was successful
   */
  reorderChild(childId: string, newIndex: number): boolean;

  /**
   * Clear all children from the container.
   *
   * @returns Array of removed child IDs
   */
  clearChildren(): string[];
}

/**
 * Interface for objects that can be contained in a container.
 *
 * Any object that can be added to a Frame or other container
 * should implement this interface.
 */
export interface IContainable {
  /**
   * ID of the container this object belongs to, or null if not contained.
   */
  containerId: string | null;

  /**
   * Whether this object can be contained in containers.
   */
  readonly isContainable: boolean;

  /**
   * Set the parent container for this object.
   *
   * @param containerId - ID of the parent container, or null to remove
   */
  setContainer(containerId: string | null): void;

  /**
   * Get the relative position within the parent container.
   * Returns null if not contained.
   *
   * @returns Relative position or null
   */
  getRelativePosition(): Position | null;

  /**
   * Set the relative position within the parent container.
   *
   * @param position - Relative position
   */
  setRelativePosition(position: Position): void;
}

/**
 * Type guard to check if an object implements IContainer.
 *
 * @param obj - Object to check
 * @returns True if object implements IContainer
 */
export function isContainer(obj: unknown): obj is IContainer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'childIds' in obj &&
    'addChild' in obj &&
    'removeChild' in obj &&
    typeof (obj as IContainer).addChild === 'function' &&
    typeof (obj as IContainer).removeChild === 'function'
  );
}

/**
 * Type guard to check if an object implements IContainable.
 *
 * @param obj - Object to check
 * @returns True if object implements IContainable
 */
export function isContainable(obj: unknown): obj is IContainable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'containerId' in obj &&
    'isContainable' in obj &&
    'setContainer' in obj &&
    typeof (obj as IContainable).setContainer === 'function'
  );
}

/**
 * Default container padding.
 */
export const DEFAULT_CONTAINER_PADDING: ContainerPadding = {
  top: 40,
  right: 8,
  bottom: 8,
  left: 8,
};

/**
 * Minimum overlap percentage to consider an object for auto-containment.
 */
export const AUTO_CONTAIN_THRESHOLD = 0.5;
