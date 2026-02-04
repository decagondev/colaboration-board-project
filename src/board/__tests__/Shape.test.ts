/**
 * Unit tests for the Shape class.
 *
 * Tests shape creation, interface implementation, and various shape types.
 */

import { Shape, SHAPE_DEFAULTS } from '../objects/Shape';
import { BOARD_COLORS } from '../interfaces/IColorable';

describe('Shape', () => {
  const testUser = 'test-user';
  const defaultPosition = { x: 100, y: 200 };
  const defaultSize = { width: 150, height: 100 };

  describe('create', () => {
    it('should create a rectangle shape with default values', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      expect(shape.type).toBe('shape');
      expect(shape.shapeType).toBe('rectangle');
      expect(shape.position).toEqual(defaultPosition);
      expect(shape.size).toEqual(defaultSize);
      expect(shape.colors.fill).toBe(BOARD_COLORS.blue);
      expect(shape.colors.stroke).toBe('#333333');
    });

    it('should create an ellipse shape', () => {
      const shape = Shape.create(
        'ellipse',
        defaultPosition,
        defaultSize,
        testUser
      );

      expect(shape.shapeType).toBe('ellipse');
    });

    it('should create a line shape via createLine', () => {
      const start = { x: 0, y: 0 };
      const end = { x: 100, y: 100 };
      const shape = Shape.createLine(start, end, testUser);

      expect(shape.shapeType).toBe('line');
      expect(shape.points).toBeDefined();
      expect(shape.points?.length).toBe(4);
    });

    it('should create a triangle shape', () => {
      const shape = Shape.create(
        'triangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      expect(shape.shapeType).toBe('triangle');
    });

    it('should apply custom colors', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser,
        {
          fillColor: '#FF0000',
          strokeColor: '#00FF00',
          strokeWidth: 5,
        }
      );

      expect(shape.colors.fill).toBe('#FF0000');
      expect(shape.colors.stroke).toBe('#00FF00');
      expect(shape.strokeWidth).toBe(5);
    });
  });

  describe('factory methods', () => {
    it('createRectangle should create a rectangle', () => {
      const shape = Shape.createRectangle(
        { x: 50, y: 50 },
        { width: 100, height: 80 },
        testUser
      );

      expect(shape.shapeType).toBe('rectangle');
      expect(shape.position).toEqual({ x: 50, y: 50 });
    });

    it('createEllipse should create an ellipse', () => {
      const shape = Shape.createEllipse(
        { x: 50, y: 50 },
        { width: 100, height: 80 },
        testUser
      );

      expect(shape.shapeType).toBe('ellipse');
    });

    it('createLine should create a line', () => {
      const shape = Shape.createLine(
        { x: 0, y: 0 },
        { x: 200, y: 150 },
        testUser
      );

      expect(shape.shapeType).toBe('line');
      expect(shape.points).toBeDefined();
    });
  });

  describe('IBoardObject implementation', () => {
    it('should have a unique id', () => {
      const shape1 = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      const shape2 = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      expect(shape1.id).toBeDefined();
      expect(shape2.id).toBeDefined();
      expect(shape1.id).not.toBe(shape2.id);
    });

    it('should calculate bounds correctly', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 100, y: 200 },
        { width: 150, height: 100 },
        testUser
      );

      const bounds = shape.getBounds();

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(150);
      expect(bounds.height).toBe(100);
    });

    it('should detect point containment for rectangle', () => {
      const shape = Shape.createRectangle(
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser
      );

      expect(shape.containsPoint({ x: 50, y: 50 })).toBe(true);
      expect(shape.containsPoint({ x: 150, y: 150 })).toBe(false);
    });

    it('should detect point containment for ellipse', () => {
      const shape = Shape.createEllipse(
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser
      );

      expect(shape.containsPoint({ x: 50, y: 50 })).toBe(true);
      expect(shape.containsPoint({ x: 5, y: 5 })).toBe(false);
    });

    it('should detect bounds intersection', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 100, y: 100 },
        { width: 100, height: 100 },
        testUser
      );

      expect(shape.intersects({ x: 50, y: 50, width: 100, height: 100 })).toBe(
        true
      );
      expect(shape.intersects({ x: 300, y: 300, width: 50, height: 50 })).toBe(
        false
      );
    });

    it('should clone the shape', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      const clone = shape.clone() as Shape;

      expect(clone.id).not.toBe(shape.id);
      expect(clone.shapeType).toBe(shape.shapeType);
      expect(clone.position).toEqual(shape.position);
      expect(clone.size).toEqual(shape.size);
    });

    it('should serialize to JSON', () => {
      const shape = Shape.create(
        'ellipse',
        defaultPosition,
        defaultSize,
        testUser,
        { fillColor: '#808080' }
      );

      const json = shape.toJSON();

      expect(json.type).toBe('shape');
      expect(json.data.shapeType).toBe('ellipse');
      expect(json.x).toBe(defaultPosition.x);
      expect(json.y).toBe(defaultPosition.y);
      expect(json.data.fillColor).toBe('#808080');
    });
  });

  describe('ITransformable implementation', () => {
    it('should move to a new position', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      shape.moveTo({ x: 500, y: 500 });

      expect(shape.position).toEqual({ x: 500, y: 500 });
    });

    it('should move by a delta', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 100, y: 100 },
        defaultSize,
        testUser
      );
      shape.moveBy({ x: 50, y: -25 });

      expect(shape.position).toEqual({ x: 150, y: 75 });
    });

    it('should resize', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      shape.resizeTo({ width: 300, height: 200 });

      expect(shape.size).toEqual({ width: 300, height: 200 });
    });

    it('should rotate', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      shape.rotateTo(45);

      expect(shape.transform.rotation).toBe(45);
    });

    it('should rotate by delta', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      shape.rotateBy(90);
      shape.rotateBy(45);

      expect(shape.transform.rotation).toBe(135);
    });

    it('should apply transform', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      shape.applyTransform({
        x: 200,
        y: 300,
        scaleX: 2,
        scaleY: 1.5,
        rotation: 30,
      });

      expect(shape.position).toEqual({ x: 200, y: 300 });
      expect(shape.transform.scaleX).toBe(2);
      expect(shape.transform.scaleY).toBe(1.5);
      expect(shape.transform.rotation).toBe(30);
    });

    it('should get center point', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 50 },
        testUser
      );

      const center = shape.getCenter();

      expect(center).toEqual({ x: 50, y: 25 });
    });

    it('should enforce minimum size', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      shape.resizeTo({ width: 5, height: 5 });

      expect(shape.size.width).toBe(shape.minSize.width);
      expect(shape.size.height).toBe(shape.minSize.height);
    });
  });

  describe('ISelectable implementation', () => {
    it('should track selection state', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      expect(shape.selectionState.isSelected).toBe(false);

      shape.select();
      expect(shape.selectionState.isSelected).toBe(true);

      shape.deselect();
      expect(shape.selectionState.isSelected).toBe(false);
    });

    it('should track hover state', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      expect(shape.selectionState.isHovered).toBe(false);

      shape.setHovered(true);
      expect(shape.selectionState.isHovered).toBe(true);
    });

    it('should calculate handle positions', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser
      );

      const handles = shape.getHandlePositions();

      expect(handles.length).toBeGreaterThan(8);

      const topLeftHandle = handles.find((h) => h.handle === 'top-left');
      expect(topLeftHandle).toBeDefined();
      expect(topLeftHandle?.position.x).toBe(0);
      expect(topLeftHandle?.position.y).toBe(0);

      const rotateHandle = handles.find((h) => h.handle === 'rotation');
      expect(rotateHandle).toBeDefined();
    });
  });

  describe('IColorable implementation', () => {
    it('should set fill color', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      const newColor = '#FF0000';

      shape.setFillColor(newColor);

      expect(shape.colors.fill).toBe(newColor);
    });

    it('should set stroke color', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );
      const newColor = '#0000FF';

      shape.setStrokeColor(newColor);

      expect(shape.colors.stroke).toBe(newColor);
    });

    it('should apply color scheme', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      shape.applyColorScheme({
        fill: '#646464',
        stroke: '#323232',
      });

      expect(shape.colors.fill).toBe('#646464');
      expect(shape.colors.stroke).toBe('#323232');
    });
  });

  describe('IConnectable implementation', () => {
    it('should provide connection points', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser
      );

      const points = shape.getConnectionPoints();

      expect(points.length).toBeGreaterThan(0);

      const topPoint = points.find((p) => p.anchor === 'top');
      expect(topPoint).toBeDefined();
      expect(topPoint?.position.x).toBe(50);
      expect(topPoint?.position.y).toBe(0);
    });

    it('should find nearest connection point', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser
      );

      const nearest = shape.getNearestConnectionPoint({ x: 50, y: -10 });

      expect(nearest.anchor).toBe('top');
    });

    it('should track connector attachments', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser
      );

      shape.attachConnector('connector-1', 'top');
      shape.attachConnector('connector-2', 'bottom');

      expect(shape.connectedIds.length).toBe(2);
      expect(shape.connectedIds).toContain('connector-1');

      shape.detachConnector('connector-1');
      expect(shape.connectedIds.length).toBe(1);
    });
  });

  describe('shape-specific properties', () => {
    it('should support corner radius for rectangles', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser,
        { cornerRadius: 10 }
      );

      expect(shape.cornerRadius).toBe(10);

      const json = shape.toJSON();
      expect(json.data.cornerRadius).toBe(10);
    });

    it('should support stroke width', () => {
      const shape = Shape.create(
        'rectangle',
        defaultPosition,
        defaultSize,
        testUser,
        { strokeWidth: 4 }
      );

      expect(shape.strokeWidth).toBe(4);
    });
  });
});
