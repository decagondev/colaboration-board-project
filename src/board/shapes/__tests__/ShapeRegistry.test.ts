/**
 * ShapeRegistry Unit Tests
 *
 * Tests for the ShapeRegistry service functionality.
 */

import React from 'react';
import { ShapeRegistry } from '../ShapeRegistry';
import type { ShapeDefinition, ShapeType, ShapeCategory } from '../ShapeDefinition';

/**
 * Create a mock shape definition for testing.
 */
function createMockDefinition(
  type: ShapeType,
  category: ShapeCategory = 'basic'
): ShapeDefinition {
  return {
    type,
    label: `Test ${type}`,
    icon: '□',
    category,
    defaultSize: { width: 100, height: 100 },
    render: () => React.createElement('div'),
    description: `Test ${type} description`,
  };
}

describe('ShapeRegistry', () => {
  beforeEach(() => {
    ShapeRegistry.clear();
  });

  describe('register', () => {
    it('should register a new shape definition', () => {
      const definition = createMockDefinition('rectangle');

      ShapeRegistry.register(definition);

      expect(ShapeRegistry.has('rectangle')).toBe(true);
    });

    it('should throw error when registering duplicate type', () => {
      const definition = createMockDefinition('rectangle');

      ShapeRegistry.register(definition);

      expect(() => ShapeRegistry.register(definition)).toThrow(
        'Shape type "rectangle" is already registered'
      );
    });
  });

  describe('get', () => {
    it('should return the registered shape definition', () => {
      const definition = createMockDefinition('ellipse');
      ShapeRegistry.register(definition);

      const result = ShapeRegistry.get('ellipse');

      expect(result).toBe(definition);
    });

    it('should return undefined for unregistered type', () => {
      const result = ShapeRegistry.get('rectangle');

      expect(result).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered type', () => {
      const definition = createMockDefinition('triangle');
      ShapeRegistry.register(definition);

      expect(ShapeRegistry.has('triangle')).toBe(true);
    });

    it('should return false for unregistered type', () => {
      expect(ShapeRegistry.has('triangle')).toBe(false);
    });
  });

  describe('getByCategory', () => {
    it('should return shapes filtered by category', () => {
      const basicShape = createMockDefinition('rectangle', 'basic');
      const flowchartShape = createMockDefinition('diamond', 'flowchart');
      ShapeRegistry.register(basicShape);
      ShapeRegistry.register(flowchartShape);

      const basicShapes = ShapeRegistry.getByCategory('basic');
      const flowchartShapes = ShapeRegistry.getByCategory('flowchart');

      expect(basicShapes).toHaveLength(1);
      expect(basicShapes[0].type).toBe('rectangle');
      expect(flowchartShapes).toHaveLength(1);
      expect(flowchartShapes[0].type).toBe('diamond');
    });

    it('should return empty array for category with no shapes', () => {
      const result = ShapeRegistry.getByCategory('flowchart');

      expect(result).toEqual([]);
    });
  });

  describe('getAll', () => {
    it('should return all registered shapes', () => {
      const shape1 = createMockDefinition('rectangle');
      const shape2 = createMockDefinition('ellipse');
      ShapeRegistry.register(shape1);
      ShapeRegistry.register(shape2);

      const all = ShapeRegistry.getAll();

      expect(all).toHaveLength(2);
      expect(all.map((s) => s.type)).toContain('rectangle');
      expect(all.map((s) => s.type)).toContain('ellipse');
    });

    it('should return empty array when no shapes registered', () => {
      const result = ShapeRegistry.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getTypes', () => {
    it('should return all registered shape types', () => {
      ShapeRegistry.register(createMockDefinition('rectangle'));
      ShapeRegistry.register(createMockDefinition('ellipse'));

      const types = ShapeRegistry.getTypes();

      expect(types).toContain('rectangle');
      expect(types).toContain('ellipse');
      expect(types).toHaveLength(2);
    });
  });

  describe('getCategories', () => {
    it('should return all unique categories', () => {
      ShapeRegistry.register(createMockDefinition('rectangle', 'basic'));
      ShapeRegistry.register(createMockDefinition('ellipse', 'basic'));
      ShapeRegistry.register(createMockDefinition('diamond', 'flowchart'));

      const categories = ShapeRegistry.getCategories();

      expect(categories).toContain('basic');
      expect(categories).toContain('flowchart');
      expect(categories).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should remove all registered shapes', () => {
      ShapeRegistry.register(createMockDefinition('rectangle'));
      ShapeRegistry.register(createMockDefinition('ellipse'));

      ShapeRegistry.clear();

      expect(ShapeRegistry.getAll()).toEqual([]);
      expect(ShapeRegistry.has('rectangle')).toBe(false);
    });
  });
});
