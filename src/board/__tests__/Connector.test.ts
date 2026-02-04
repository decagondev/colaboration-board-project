/**
 * Unit tests for the Connector class.
 *
 * Tests connector creation, connection management, and interface implementation.
 */

import { Connector, CONNECTOR_DEFAULTS } from '../objects/Connector';

describe('Connector', () => {
  const testUser = 'test-user';
  const startPos = { x: 100, y: 100 };
  const endPos = { x: 300, y: 200 };

  describe('create', () => {
    it('should create a connector with default values', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(connector.type).toBe('connector');
      expect(connector.routeStyle).toBe(CONNECTOR_DEFAULTS.routeStyle);
      expect(connector.startArrow).toBe(CONNECTOR_DEFAULTS.startArrow);
      expect(connector.endArrow).toBe(CONNECTOR_DEFAULTS.endArrow);
    });

    it('should set endpoints from positions', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(connector.startPoint.position).toEqual(startPos);
      expect(connector.endPoint.position).toEqual(endPos);
      expect(connector.startPoint.objectId).toBeNull();
      expect(connector.endPoint.objectId).toBeNull();
    });

    it('should calculate bounds from endpoints', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      const bounds = connector.getBounds();

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(100);
    });

    it('should apply custom options', () => {
      const connector = Connector.create(startPos, endPos, testUser, {
        routeStyle: 'elbow',
        startArrow: 'circle',
        endArrow: 'filled-arrow',
        strokeColor: '#FF0000',
        strokeWidth: 4,
      });

      expect(connector.routeStyle).toBe('elbow');
      expect(connector.startArrow).toBe('circle');
      expect(connector.endArrow).toBe('filled-arrow');
      expect(connector.colors.stroke).toBe('#FF0000');
      expect(connector.strokeWidth).toBe(4);
    });
  });

  describe('createBetweenObjects', () => {
    it('should create a connector between objects', () => {
      const connector = Connector.createBetweenObjects(
        { objectId: 'obj-1', anchor: 'right' },
        { objectId: 'obj-2', anchor: 'left' },
        { x: 150, y: 100 },
        { x: 250, y: 100 },
        testUser
      );

      expect(connector.startPoint.objectId).toBe('obj-1');
      expect(connector.startPoint.anchor).toBe('right');
      expect(connector.endPoint.objectId).toBe('obj-2');
      expect(connector.endPoint.anchor).toBe('left');
    });
  });

  describe('getPoints', () => {
    it('should return straight line points', () => {
      const connector = Connector.create(startPos, endPos, testUser, {
        routeStyle: 'straight',
      });

      const points = connector.getPoints();

      expect(points).toEqual([100, 100, 300, 200]);
    });

    it('should return elbow line points', () => {
      const connector = Connector.create(startPos, endPos, testUser, {
        routeStyle: 'elbow',
      });

      const points = connector.getPoints();

      expect(points.length).toBe(8);
      expect(points[0]).toBe(100);
      expect(points[1]).toBe(100);
      expect(points[6]).toBe(300);
      expect(points[7]).toBe(200);
    });
  });

  describe('endpoint manipulation', () => {
    it('should update start position', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.setStartPosition({ x: 50, y: 50 });

      expect(connector.startPoint.position).toEqual({ x: 50, y: 50 });
    });

    it('should update end position', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.setEndPosition({ x: 400, y: 300 });

      expect(connector.endPoint.position).toEqual({ x: 400, y: 300 });
    });

    it('should connect start to an object', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.connectStart('obj-1', 'bottom', { x: 150, y: 150 });

      expect(connector.startPoint.objectId).toBe('obj-1');
      expect(connector.startPoint.anchor).toBe('bottom');
      expect(connector.startPoint.position).toEqual({ x: 150, y: 150 });
    });

    it('should connect end to an object', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.connectEnd('obj-2', 'top', { x: 350, y: 250 });

      expect(connector.endPoint.objectId).toBe('obj-2');
      expect(connector.endPoint.anchor).toBe('top');
      expect(connector.endPoint.position).toEqual({ x: 350, y: 250 });
    });

    it('should disconnect start from object', () => {
      const connector = Connector.createBetweenObjects(
        { objectId: 'obj-1', anchor: 'right' },
        { objectId: 'obj-2', anchor: 'left' },
        startPos,
        endPos,
        testUser
      );

      connector.disconnectStart();

      expect(connector.startPoint.objectId).toBeNull();
      expect(connector.startPoint.anchor).toBe('auto');
    });

    it('should disconnect end from object', () => {
      const connector = Connector.createBetweenObjects(
        { objectId: 'obj-1', anchor: 'right' },
        { objectId: 'obj-2', anchor: 'left' },
        startPos,
        endPos,
        testUser
      );

      connector.disconnectEnd();

      expect(connector.endPoint.objectId).toBeNull();
      expect(connector.endPoint.anchor).toBe('auto');
    });
  });

  describe('isConnectedTo', () => {
    it('should return true when start is connected', () => {
      const connector = Connector.createBetweenObjects(
        { objectId: 'obj-1', anchor: 'right' },
        { objectId: 'obj-2', anchor: 'left' },
        startPos,
        endPos,
        testUser
      );

      expect(connector.isConnectedTo('obj-1')).toBe(true);
    });

    it('should return true when end is connected', () => {
      const connector = Connector.createBetweenObjects(
        { objectId: 'obj-1', anchor: 'right' },
        { objectId: 'obj-2', anchor: 'left' },
        startPos,
        endPos,
        testUser
      );

      expect(connector.isConnectedTo('obj-2')).toBe(true);
    });

    it('should return false when not connected', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(connector.isConnectedTo('obj-1')).toBe(false);
    });
  });

  describe('IBoardObject implementation', () => {
    it('should have a unique id', () => {
      const connector1 = Connector.create(startPos, endPos, testUser);
      const connector2 = Connector.create(startPos, endPos, testUser);

      expect(connector1.id).toBeDefined();
      expect(connector2.id).toBeDefined();
      expect(connector1.id).not.toBe(connector2.id);
    });

    it('should detect point containment on the line', () => {
      const connector = Connector.create(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        testUser
      );

      expect(connector.containsPoint({ x: 50, y: 0 })).toBe(true);
      expect(connector.containsPoint({ x: 50, y: 3 })).toBe(true);
      expect(connector.containsPoint({ x: 50, y: 50 })).toBe(false);
    });

    it('should detect bounds intersection', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(
        connector.intersects({ x: 150, y: 150, width: 50, height: 50 })
      ).toBe(true);
      expect(
        connector.intersects({ x: 500, y: 500, width: 50, height: 50 })
      ).toBe(false);
    });

    it('should clone the connector', () => {
      const connector = Connector.create(startPos, endPos, testUser, {
        routeStyle: 'elbow',
      });
      const clone = connector.clone();

      expect(clone.id).not.toBe(connector.id);
      expect(clone.routeStyle).toBe(connector.routeStyle);
      expect(clone.startPoint.position).toEqual(connector.startPoint.position);
      expect(clone.endPoint.position).toEqual(connector.endPoint.position);
    });

    it('should serialize to JSON', () => {
      const connector = Connector.create(startPos, endPos, testUser, {
        routeStyle: 'elbow',
        startArrow: 'circle',
      });

      const json = connector.toJSON();

      expect(json.type).toBe('connector');
      expect(json.data.routeStyle).toBe('elbow');
      expect(json.data.startArrow).toBe('circle');
      expect(json.data.startPoint.position).toEqual(startPos);
      expect(json.data.endPoint.position).toEqual(endPos);
    });
  });

  describe('position manipulation', () => {
    it('should move connector when position is set', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      const originalStart = { ...connector.startPoint.position };
      const originalEnd = { ...connector.endPoint.position };

      connector.position = { x: 150, y: 150 };

      const dx = 150 - 100;
      const dy = 150 - 100;

      expect(connector.startPoint.position.x).toBe(originalStart.x + dx);
      expect(connector.startPoint.position.y).toBe(originalStart.y + dy);
      expect(connector.endPoint.position.x).toBe(originalEnd.x + dx);
      expect(connector.endPoint.position.y).toBe(originalEnd.y + dy);
    });
  });

  describe('IColorable implementation', () => {
    it('should set stroke color', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.setStrokeColor('#00FF00');

      expect(connector.colors.stroke).toBe('#00FF00');
    });

    it('should apply color scheme', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.applyColorScheme({ stroke: '#0000FF' });

      expect(connector.colors.stroke).toBe('#0000FF');
    });

    it('should report correct capabilities', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(connector.hasFill).toBe(false);
      expect(connector.hasStroke).toBe(true);
      expect(connector.hasTextColor).toBe(false);
    });
  });

  describe('stroke width', () => {
    it('should set stroke width', () => {
      const connector = Connector.create(startPos, endPos, testUser);
      connector.strokeWidth = 5;

      expect(connector.strokeWidth).toBe(5);
    });

    it('should clamp stroke width to valid range', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      connector.strokeWidth = 0;
      expect(connector.strokeWidth).toBe(1);

      connector.strokeWidth = 50;
      expect(connector.strokeWidth).toBe(20);
    });
  });

  describe('visibility and locking', () => {
    it('should track visibility', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(connector.visible).toBe(true);

      connector.visible = false;
      expect(connector.visible).toBe(false);
    });

    it('should track locked state', () => {
      const connector = Connector.create(startPos, endPos, testUser);

      expect(connector.locked).toBe(false);

      connector.locked = true;
      expect(connector.locked).toBe(true);
    });
  });
});
