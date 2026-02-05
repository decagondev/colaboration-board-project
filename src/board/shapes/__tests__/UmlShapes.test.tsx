/**
 * UML Shape Renderers Unit Tests
 *
 * Tests for UML shape definitions and registration.
 * Verifies that all UML shapes are correctly defined and can be registered.
 */

import * as React from 'react';
import { isValidElement } from 'react';
import { ShapeRegistry } from '../ShapeRegistry';
import {
  umlShapeDefinitions,
  registerUmlShapes,
  umlClassDefinition,
  umlActorDefinition,
  umlInterfaceDefinition,
  umlPackageDefinition,
  umlComponentDefinition,
  umlStateDefinition,
  umlLifelineDefinition,
  umlNoteDefinition,
} from '../renderers';
import type { ShapeRenderProps } from '../ShapeDefinition';

/**
 * Default props for testing shape renderers.
 */
const defaultRenderProps: ShapeRenderProps = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  fill: '#ffffff',
  stroke: '#000000',
  strokeWidth: 2,
};

describe('UML Shape Definitions', () => {
  beforeEach(() => {
    ShapeRegistry.clear();
  });

  describe('umlShapeDefinitions array', () => {
    it('should contain all 8 UML shapes', () => {
      expect(umlShapeDefinitions).toHaveLength(8);
    });

    it('should have all shapes with category "uml"', () => {
      for (const definition of umlShapeDefinitions) {
        expect(definition.category).toBe('uml');
      }
    });

    it('should have all required properties for each shape', () => {
      for (const definition of umlShapeDefinitions) {
        expect(definition.type).toBeDefined();
        expect(definition.label).toBeDefined();
        expect(definition.icon).toBeDefined();
        expect(definition.category).toBe('uml');
        expect(definition.defaultSize).toBeDefined();
        expect(definition.defaultSize.width).toBeGreaterThan(0);
        expect(definition.defaultSize.height).toBeGreaterThan(0);
        expect(definition.render).toBeInstanceOf(Function);
      }
    });

    it('should have unique types for all shapes', () => {
      const types = umlShapeDefinitions.map((d) => d.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });

    it('should have unique labels for all shapes', () => {
      const labels = umlShapeDefinitions.map((d) => d.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });
  });

  describe('registerUmlShapes', () => {
    it('should register all UML shapes with the ShapeRegistry', () => {
      registerUmlShapes();

      expect(ShapeRegistry.has('uml-class')).toBe(true);
      expect(ShapeRegistry.has('uml-actor')).toBe(true);
      expect(ShapeRegistry.has('uml-interface')).toBe(true);
      expect(ShapeRegistry.has('uml-package')).toBe(true);
      expect(ShapeRegistry.has('uml-component')).toBe(true);
      expect(ShapeRegistry.has('uml-state')).toBe(true);
      expect(ShapeRegistry.has('uml-lifeline')).toBe(true);
      expect(ShapeRegistry.has('uml-note')).toBe(true);
    });

    it('should return UML shapes when filtering by category', () => {
      registerUmlShapes();

      const umlShapes = ShapeRegistry.getByCategory('uml');

      expect(umlShapes).toHaveLength(8);
    });

    it('should not throw when called multiple times', () => {
      expect(() => {
        registerUmlShapes();
        registerUmlShapes();
      }).not.toThrow();
    });

    it('should allow retrieving shapes after registration', () => {
      registerUmlShapes();

      const classShape = ShapeRegistry.get('uml-class');
      expect(classShape).toBeDefined();
      expect(classShape?.type).toBe('uml-class');
      expect(classShape?.category).toBe('uml');
    });
  });
});

describe('UML Class Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlClassDefinition.type).toBe('uml-class');
    expect(umlClassDefinition.label).toBe('Class');
    expect(umlClassDefinition.category).toBe('uml');
    expect(umlClassDefinition.defaultSize).toEqual({ width: 150, height: 120 });
  });

  it('should have a description', () => {
    expect(umlClassDefinition.description).toBeDefined();
    expect(umlClassDefinition.description).toContain('UML');
  });

  it('should have a render function that returns a React element', () => {
    const result = umlClassDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML Actor Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlActorDefinition.type).toBe('uml-actor');
    expect(umlActorDefinition.label).toBe('Actor');
    expect(umlActorDefinition.category).toBe('uml');
    expect(umlActorDefinition.defaultSize).toEqual({ width: 50, height: 80 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlActorDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML Interface Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlInterfaceDefinition.type).toBe('uml-interface');
    expect(umlInterfaceDefinition.label).toBe('Interface');
    expect(umlInterfaceDefinition.category).toBe('uml');
    expect(umlInterfaceDefinition.defaultSize).toEqual({ width: 40, height: 60 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlInterfaceDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML Package Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlPackageDefinition.type).toBe('uml-package');
    expect(umlPackageDefinition.label).toBe('Package');
    expect(umlPackageDefinition.category).toBe('uml');
    expect(umlPackageDefinition.defaultSize).toEqual({ width: 140, height: 100 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlPackageDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML Component Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlComponentDefinition.type).toBe('uml-component');
    expect(umlComponentDefinition.label).toBe('Component');
    expect(umlComponentDefinition.category).toBe('uml');
    expect(umlComponentDefinition.defaultSize).toEqual({ width: 120, height: 80 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlComponentDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML State Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlStateDefinition.type).toBe('uml-state');
    expect(umlStateDefinition.label).toBe('State');
    expect(umlStateDefinition.category).toBe('uml');
    expect(umlStateDefinition.defaultSize).toEqual({ width: 120, height: 60 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlStateDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML Lifeline Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlLifelineDefinition.type).toBe('uml-lifeline');
    expect(umlLifelineDefinition.label).toBe('Lifeline');
    expect(umlLifelineDefinition.category).toBe('uml');
    expect(umlLifelineDefinition.defaultSize).toEqual({ width: 80, height: 200 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlLifelineDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('UML Note Shape', () => {
  it('should have correct definition properties', () => {
    expect(umlNoteDefinition.type).toBe('uml-note');
    expect(umlNoteDefinition.label).toBe('Note');
    expect(umlNoteDefinition.category).toBe('uml');
    expect(umlNoteDefinition.defaultSize).toEqual({ width: 120, height: 80 });
  });

  it('should have a render function that returns a React element', () => {
    const result = umlNoteDefinition.render(defaultRenderProps);
    expect(isValidElement(result)).toBe(true);
  });
});

describe('All UML Shape Render Functions', () => {
  it('should return valid React elements for all shapes', () => {
    for (const definition of umlShapeDefinitions) {
      const result = definition.render(defaultRenderProps);
      expect(isValidElement(result)).toBe(true);
    }
  });

  it('should accept different width and height values', () => {
    const customProps: ShapeRenderProps = {
      ...defaultRenderProps,
      width: 200,
      height: 150,
    };

    for (const definition of umlShapeDefinitions) {
      const result = definition.render(customProps);
      expect(isValidElement(result)).toBe(true);
    }
  });

  it('should accept opacity values', () => {
    const propsWithOpacity: ShapeRenderProps = {
      ...defaultRenderProps,
      opacity: 0.5,
    };

    for (const definition of umlShapeDefinitions) {
      const result = definition.render(propsWithOpacity);
      expect(isValidElement(result)).toBe(true);
    }
  });

  it('should accept shadow properties', () => {
    const propsWithShadow: ShapeRenderProps = {
      ...defaultRenderProps,
      shadowEnabled: true,
      shadowColor: 'rgba(0, 0, 0, 0.5)',
      shadowBlur: 10,
      shadowOffsetX: 5,
      shadowOffsetY: 5,
    };

    for (const definition of umlShapeDefinitions) {
      const result = definition.render(propsWithShadow);
      expect(isValidElement(result)).toBe(true);
    }
  });
});
