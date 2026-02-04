/**
 * Object Factory
 *
 * Factory for creating and deserializing board objects.
 * Uses the Factory Pattern to decouple object creation from usage.
 */

import type {
  BoardObjectData,
  BoardObjectType,
  IBoardObject,
  Position,
  Size,
} from '../interfaces/IBoardObject';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Options for creating a new board object.
 */
export interface CreateObjectOptions {
  /** Object type */
  type: BoardObjectType;
  /** Position on the canvas */
  position: Position;
  /** Size of the object */
  size: Size;
  /** User ID creating the object */
  createdBy: string;
  /** Optional initial z-index */
  zIndex?: number;
  /** Type-specific additional data */
  data?: Record<string, unknown>;
}

/**
 * Creator function type for registering object types.
 */
export type ObjectCreator = (data: BoardObjectData) => IBoardObject;

/**
 * Object factory registry and creation utilities.
 *
 * The ObjectFactory provides:
 * - Registration of object type creators
 * - Creation of new objects with auto-generated IDs
 * - Deserialization of stored object data
 * - Default object data generation
 *
 * @example
 * ```typescript
 * const factory = ObjectFactory.getInstance();
 *
 * // Register a creator for a custom type
 * factory.registerCreator('sticky-note', (data) => new StickyNote(data));
 *
 * // Create a new object
 * const stickyNote = factory.createObject({
 *   type: 'sticky-note',
 *   position: { x: 100, y: 100 },
 *   size: { width: 200, height: 150 },
 *   createdBy: 'user-1',
 * });
 *
 * // Deserialize stored data
 * const restored = factory.fromData(storedData);
 * ```
 */
export class ObjectFactory {
  private static instance: ObjectFactory | null = null;
  private creators: Map<BoardObjectType, ObjectCreator> = new Map();

  private constructor() {}

  /**
   * Get the singleton factory instance.
   *
   * @returns ObjectFactory instance
   */
  static getInstance(): ObjectFactory {
    if (!ObjectFactory.instance) {
      ObjectFactory.instance = new ObjectFactory();
    }
    return ObjectFactory.instance;
  }

  /**
   * Reset the factory (primarily for testing).
   */
  static reset(): void {
    ObjectFactory.instance = null;
  }

  /**
   * Register a creator function for an object type.
   *
   * @param type - Object type to register
   * @param creator - Function that creates objects of this type
   */
  registerCreator(type: BoardObjectType, creator: ObjectCreator): void {
    this.creators.set(type, creator);
  }

  /**
   * Unregister a creator for an object type.
   *
   * @param type - Object type to unregister
   */
  unregisterCreator(type: BoardObjectType): void {
    this.creators.delete(type);
  }

  /**
   * Check if a creator is registered for a type.
   *
   * @param type - Object type to check
   * @returns True if creator is registered
   */
  hasCreator(type: BoardObjectType): boolean {
    return this.creators.has(type);
  }

  /**
   * Get all registered object types.
   *
   * @returns Array of registered types
   */
  getRegisteredTypes(): BoardObjectType[] {
    return Array.from(this.creators.keys());
  }

  /**
   * Create a new board object with auto-generated ID and timestamps.
   *
   * @param options - Object creation options
   * @returns Created board object
   * @throws Error if no creator is registered for the type
   */
  createObject(options: CreateObjectOptions): IBoardObject {
    const creator = this.creators.get(options.type);
    if (!creator) {
      throw new Error(`No creator registered for object type: ${options.type}`);
    }

    const now = Date.now();
    const data = this.createObjectData({
      ...options,
      zIndex: options.zIndex ?? now,
      createdAt: now,
      modifiedAt: now,
    });

    return creator(data);
  }

  /**
   * Create a board object from stored data.
   *
   * @param data - Serialized object data
   * @returns Created board object
   * @throws Error if no creator is registered for the type
   */
  fromData(data: BoardObjectData): IBoardObject {
    const creator = this.creators.get(data.type);
    if (!creator) {
      throw new Error(`No creator registered for object type: ${data.type}`);
    }

    return creator(data);
  }

  /**
   * Create multiple objects from stored data.
   *
   * @param dataArray - Array of serialized object data
   * @returns Array of created objects
   */
  fromDataArray(dataArray: BoardObjectData[]): IBoardObject[] {
    return dataArray.map((data) => this.fromData(data));
  }

  /**
   * Generate a serializable object data structure.
   *
   * @param options - Object options with timestamps
   * @returns BoardObjectData structure
   */
  createObjectData(
    options: CreateObjectOptions & { createdAt: number; modifiedAt: number }
  ): BoardObjectData {
    return {
      id: generateUUID(),
      type: options.type,
      x: options.position.x,
      y: options.position.y,
      width: options.size.width,
      height: options.size.height,
      zIndex: options.zIndex ?? Date.now(),
      locked: false,
      visible: true,
      createdBy: options.createdBy,
      createdAt: options.createdAt,
      modifiedBy: options.createdBy,
      modifiedAt: options.modifiedAt,
      data: options.data,
    };
  }
}

/**
 * Convenience function to get the factory instance.
 *
 * @returns ObjectFactory instance
 */
export function getObjectFactory(): ObjectFactory {
  return ObjectFactory.getInstance();
}
