/**
 * Container Service
 *
 * Service responsible for managing parent-child relationships between
 * containers and containable objects on the board.
 *
 * Follows Single Responsibility Principle (SRP) - only handles containment logic.
 *
 * @module board/services/ContainerService
 */

import type { IBoardObject, Position, BoundingBox } from '../interfaces/IBoardObject';
import type {
  IContainer,
  IContainable,
  ContainmentCheckResult,
  ContainerChangeEvent,
  AddChildOptions,
} from '../interfaces/IContainer';
import { AUTO_CONTAIN_THRESHOLD } from '../interfaces/IContainer';

/**
 * Listener callback for container change events.
 */
export type ContainerChangeListener = (event: ContainerChangeEvent) => void;

/**
 * Interface for the ContainerService.
 * Allows for dependency injection and testability.
 */
export interface IContainerService {
  /**
   * Register an object as a container.
   */
  registerContainer(container: IBoardObject & IContainer): void;

  /**
   * Unregister a container.
   */
  unregisterContainer(containerId: string): void;

  /**
   * Register a containable object.
   */
  registerContainable(object: IBoardObject & IContainable): void;

  /**
   * Unregister a containable object.
   */
  unregisterContainable(objectId: string): void;

  /**
   * Add an object to a container.
   */
  addToContainer(
    containerId: string,
    objectId: string,
    options?: AddChildOptions
  ): boolean;

  /**
   * Remove an object from its container.
   */
  removeFromContainer(objectId: string): boolean;

  /**
   * Get the container for an object.
   */
  getContainerFor(objectId: string): (IBoardObject & IContainer) | null;

  /**
   * Get all children of a container.
   */
  getChildren(containerId: string): (IBoardObject & IContainable)[];

  /**
   * Find containers that could contain an object at a given position.
   */
  findContainersAtPoint(
    point: Position,
    excludeIds?: string[]
  ): (IBoardObject & IContainer)[];

  /**
   * Check if an object should be auto-contained based on its bounds.
   */
  checkAutoContainment(
    objectBounds: BoundingBox,
    excludeIds?: string[]
  ): { container: IBoardObject & IContainer; result: ContainmentCheckResult } | null;

  /**
   * Handle container position change and move children accordingly.
   */
  onContainerMoved(
    containerId: string,
    oldPosition: Position,
    newPosition: Position
  ): void;

  /**
   * Add a listener for container changes.
   */
  addChangeListener(listener: ContainerChangeListener): void;

  /**
   * Remove a listener for container changes.
   */
  removeChangeListener(listener: ContainerChangeListener): void;
}

/**
 * ContainerService implementation.
 *
 * Manages the relationships between containers and containable objects.
 * Handles automatic containment detection, movement synchronization,
 * and change notifications.
 */
export class ContainerService implements IContainerService {
  private containers: Map<string, IBoardObject & IContainer> = new Map();
  private containables: Map<string, IBoardObject & IContainable> = new Map();
  private listeners: Set<ContainerChangeListener> = new Set();

  /**
   * Register an object as a container.
   *
   * @param container - Container object to register
   */
  registerContainer(container: IBoardObject & IContainer): void {
    this.containers.set(container.id, container);
  }

  /**
   * Unregister a container and release all its children.
   *
   * @param containerId - ID of container to unregister
   */
  unregisterContainer(containerId: string): void {
    const container = this.containers.get(containerId);
    if (container) {
      const childIds = [...container.childIds];
      for (const childId of childIds) {
        this.removeFromContainer(childId);
      }
      this.containers.delete(containerId);
    }
  }

  /**
   * Register a containable object.
   *
   * @param object - Containable object to register
   */
  registerContainable(object: IBoardObject & IContainable): void {
    this.containables.set(object.id, object);
  }

  /**
   * Unregister a containable object and remove it from any container.
   *
   * @param objectId - ID of object to unregister
   */
  unregisterContainable(objectId: string): void {
    this.removeFromContainer(objectId);
    this.containables.delete(objectId);
  }

  /**
   * Add an object to a container.
   *
   * @param containerId - ID of the target container
   * @param objectId - ID of the object to add
   * @param options - Optional add configuration
   * @returns True if object was added successfully
   */
  addToContainer(
    containerId: string,
    objectId: string,
    options?: AddChildOptions
  ): boolean {
    const container = this.containers.get(containerId);
    const object = this.containables.get(objectId);

    if (!container || !object) {
      return false;
    }

    if (!container.acceptsChildren || !object.isContainable) {
      return false;
    }

    if (object.containerId) {
      this.removeFromContainer(objectId);
    }

    if (container.addChild(objectId, options)) {
      object.setContainer(containerId);

      if (options?.relativePosition) {
        object.setRelativePosition(options.relativePosition);
      } else if (!options?.preservePosition) {
        const containerBounds = container.getContentBounds();
        const objectBounds = object.getBounds();
        const relativePos: Position = {
          x: objectBounds.x - containerBounds.x,
          y: objectBounds.y - containerBounds.y,
        };
        object.setRelativePosition(relativePos);
      }

      this.emitChange({
        containerId,
        changeType: 'add',
        childIds: [objectId],
      });

      return true;
    }

    return false;
  }

  /**
   * Remove an object from its container.
   *
   * @param objectId - ID of the object to remove
   * @returns True if object was removed successfully
   */
  removeFromContainer(objectId: string): boolean {
    const object = this.containables.get(objectId);
    if (!object || !object.containerId) {
      return false;
    }

    const container = this.containers.get(object.containerId);
    if (!container) {
      object.setContainer(null);
      return true;
    }

    const containerId = object.containerId;
    if (container.removeChild(objectId)) {
      object.setContainer(null);

      this.emitChange({
        containerId,
        changeType: 'remove',
        childIds: [objectId],
      });

      return true;
    }

    return false;
  }

  /**
   * Get the container for an object.
   *
   * @param objectId - ID of the object
   * @returns Container or null if not contained
   */
  getContainerFor(objectId: string): (IBoardObject & IContainer) | null {
    const object = this.containables.get(objectId);
    if (!object || !object.containerId) {
      return null;
    }
    return this.containers.get(object.containerId) ?? null;
  }

  /**
   * Get all children of a container.
   *
   * @param containerId - ID of the container
   * @returns Array of child objects
   */
  getChildren(containerId: string): (IBoardObject & IContainable)[] {
    const container = this.containers.get(containerId);
    if (!container) {
      return [];
    }

    return container.childIds
      .map((id) => this.containables.get(id))
      .filter((obj): obj is IBoardObject & IContainable => obj !== undefined);
  }

  /**
   * Find containers that could contain an object at a given position.
   *
   * @param point - Point to check
   * @param excludeIds - IDs to exclude from search
   * @returns Array of containers at the point, sorted by z-index (highest first)
   */
  findContainersAtPoint(
    point: Position,
    excludeIds: string[] = []
  ): (IBoardObject & IContainer)[] {
    const excludeSet = new Set(excludeIds);
    const matchingContainers: (IBoardObject & IContainer)[] = [];

    for (const container of this.containers.values()) {
      if (excludeSet.has(container.id)) continue;
      if (!container.acceptsChildren) continue;

      const contentBounds = container.getContentBounds();
      if (
        point.x >= contentBounds.x &&
        point.x <= contentBounds.x + contentBounds.width &&
        point.y >= contentBounds.y &&
        point.y <= contentBounds.y + contentBounds.height
      ) {
        matchingContainers.push(container);
      }
    }

    return matchingContainers.sort((a, b) => b.zIndex - a.zIndex);
  }

  /**
   * Check if an object should be auto-contained based on its bounds.
   *
   * @param objectBounds - Bounds of the object to check
   * @param excludeIds - IDs to exclude from container search
   * @returns Best matching container and containment result, or null
   */
  checkAutoContainment(
    objectBounds: BoundingBox,
    excludeIds: string[] = []
  ): { container: IBoardObject & IContainer; result: ContainmentCheckResult } | null {
    const excludeSet = new Set(excludeIds);
    let bestMatch: {
      container: IBoardObject & IContainer;
      result: ContainmentCheckResult;
    } | null = null;

    for (const container of this.containers.values()) {
      if (excludeSet.has(container.id)) continue;
      if (!container.acceptsChildren) continue;

      const result = container.checkContainment(objectBounds);

      if (result.overlapPercentage >= AUTO_CONTAIN_THRESHOLD) {
        if (
          !bestMatch ||
          result.overlapPercentage > bestMatch.result.overlapPercentage ||
          (result.overlapPercentage === bestMatch.result.overlapPercentage &&
            container.zIndex > bestMatch.container.zIndex)
        ) {
          bestMatch = { container, result };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Handle container position change and move children accordingly.
   *
   * @param containerId - ID of the moved container
   * @param oldPosition - Previous position
   * @param newPosition - New position
   */
  onContainerMoved(
    containerId: string,
    oldPosition: Position,
    newPosition: Position
  ): void {
    const container = this.containers.get(containerId);
    if (!container) return;

    const delta = container.calculateChildPositionDelta(oldPosition, newPosition);
    if (delta.x === 0 && delta.y === 0) return;

    const children = this.getChildren(containerId);
    for (const child of children) {
      const currentPosition = child.position;
      child.position = {
        x: currentPosition.x + delta.x,
        y: currentPosition.y + delta.y,
      };
    }
  }

  /**
   * Add a listener for container changes.
   *
   * @param listener - Callback function for changes
   */
  addChangeListener(listener: ContainerChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a listener for container changes.
   *
   * @param listener - Callback function to remove
   */
  removeChangeListener(listener: ContainerChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emit a container change event to all listeners.
   *
   * @param event - Change event to emit
   */
  private emitChange(event: ContainerChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Container change listener error:', error);
      }
    }
  }

  /**
   * Get all registered containers.
   *
   * @returns Array of all containers
   */
  getAllContainers(): (IBoardObject & IContainer)[] {
    return Array.from(this.containers.values());
  }

  /**
   * Get all registered containable objects.
   *
   * @returns Array of all containable objects
   */
  getAllContainables(): (IBoardObject & IContainable)[] {
    return Array.from(this.containables.values());
  }

  /**
   * Clear all registrations.
   */
  clear(): void {
    this.containers.clear();
    this.containables.clear();
    this.listeners.clear();
  }
}

/**
 * Create a new ContainerService instance.
 *
 * @returns New ContainerService instance
 */
export function createContainerService(): IContainerService {
  return new ContainerService();
}
