/**
 * Shape Registry Service
 *
 * Singleton registry for managing shape definitions.
 * Implements the Registry Pattern for extensibility (Open/Closed Principle).
 */

import type {
  ShapeDefinition,
  ShapeType,
  ShapeCategory,
} from './ShapeDefinition';

/**
 * Registry interface for shape management.
 */
export interface IShapeRegistry {
  /**
   * Register a new shape definition.
   *
   * @param definition - The shape definition to register
   * @throws Error if a shape with the same type is already registered
   */
  register(definition: ShapeDefinition): void;

  /**
   * Get a shape definition by type.
   *
   * @param type - The shape type to retrieve
   * @returns The shape definition or undefined if not found
   */
  get(type: ShapeType): ShapeDefinition | undefined;

  /**
   * Get all shape definitions in a specific category.
   *
   * @param category - The category to filter by
   * @returns Array of shape definitions in the category
   */
  getByCategory(category: ShapeCategory): ShapeDefinition[];

  /**
   * Get all registered shape definitions.
   *
   * @returns Array of all shape definitions
   */
  getAll(): ShapeDefinition[];

  /**
   * Check if a shape type is registered.
   *
   * @param type - The shape type to check
   * @returns True if the shape type is registered
   */
  has(type: ShapeType): boolean;

  /**
   * Get all available shape types.
   *
   * @returns Array of registered shape types
   */
  getTypes(): ShapeType[];

  /**
   * Get all available categories.
   *
   * @returns Array of unique categories
   */
  getCategories(): ShapeCategory[];
}

/**
 * Shape Registry implementation.
 * Uses a Map for O(1) lookup by type.
 */
class ShapeRegistryImpl implements IShapeRegistry {
  private readonly definitions: Map<ShapeType, ShapeDefinition> = new Map();

  /**
   * Register a new shape definition.
   *
   * @param definition - The shape definition to register
   * @throws Error if a shape with the same type is already registered
   */
  register(definition: ShapeDefinition): void {
    if (this.definitions.has(definition.type)) {
      throw new Error(
        `Shape type "${definition.type}" is already registered. Use a different type or unregister first.`
      );
    }
    this.definitions.set(definition.type, definition);
  }

  /**
   * Get a shape definition by type.
   *
   * @param type - The shape type to retrieve
   * @returns The shape definition or undefined if not found
   */
  get(type: ShapeType): ShapeDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Get all shape definitions in a specific category.
   *
   * @param category - The category to filter by
   * @returns Array of shape definitions in the category
   */
  getByCategory(category: ShapeCategory): ShapeDefinition[] {
    return Array.from(this.definitions.values()).filter(
      (def) => def.category === category
    );
  }

  /**
   * Get all registered shape definitions.
   *
   * @returns Array of all shape definitions
   */
  getAll(): ShapeDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Check if a shape type is registered.
   *
   * @param type - The shape type to check
   * @returns True if the shape type is registered
   */
  has(type: ShapeType): boolean {
    return this.definitions.has(type);
  }

  /**
   * Get all available shape types.
   *
   * @returns Array of registered shape types
   */
  getTypes(): ShapeType[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all available categories.
   *
   * @returns Array of unique categories
   */
  getCategories(): ShapeCategory[] {
    const categories = new Set<ShapeCategory>();
    for (const def of this.definitions.values()) {
      categories.add(def.category);
    }
    return Array.from(categories);
  }

  /**
   * Clear all registered shapes.
   * Primarily for testing purposes.
   */
  clear(): void {
    this.definitions.clear();
  }
}

/**
 * Singleton instance of the ShapeRegistry.
 */
export const ShapeRegistry: IShapeRegistry & { clear: () => void } =
  new ShapeRegistryImpl();
