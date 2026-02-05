/**
 * Unit tests for the ConnectionService.
 *
 * Tests connector drag operations, anchor point finding,
 * and connection change notifications.
 */

import {
  ConnectionService,
  createConnectionService,
} from '../services/ConnectionService';
import type { ConnectionChangeEvent } from '../interfaces/IConnectionService';
import { DEFAULT_CONNECTOR_DRAG_STATE } from '../interfaces/IConnectionService';

describe('ConnectionService', () => {
  let service: ConnectionService;

  beforeEach(() => {
    service = new ConnectionService();
  });

  describe('initial state', () => {
    it('should start with inactive drag state', () => {
      expect(service.dragState.isActive).toBe(false);
      expect(service.dragState.connectorId).toBeNull();
      expect(service.dragState.startObjectId).toBeNull();
    });

    it('should have default positions', () => {
      expect(service.dragState.startPosition).toEqual({ x: 0, y: 0 });
      expect(service.dragState.currentPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('startDrag', () => {
    it('should activate drag state', () => {
      service.startDrag({ x: 100, y: 200 });

      expect(service.dragState.isActive).toBe(true);
      expect(service.dragState.startPosition).toEqual({ x: 100, y: 200 });
      expect(service.dragState.currentPosition).toEqual({ x: 100, y: 200 });
    });

    it('should set object ID and anchor when provided', () => {
      service.startDrag({ x: 100, y: 200 }, 'obj-1', 'top');

      expect(service.dragState.startObjectId).toBe('obj-1');
      expect(service.dragState.startAnchor).toBe('top');
    });

    it('should use auto anchor when not specified', () => {
      service.startDrag({ x: 100, y: 200 }, 'obj-1');

      expect(service.dragState.startAnchor).toBe('auto');
    });

    it('should set endpoint to end for new connections', () => {
      service.startDrag({ x: 100, y: 200 });

      expect(service.dragState.endpoint).toBe('end');
    });
  });

  describe('updateDrag', () => {
    it('should update current position during active drag', () => {
      service.startDrag({ x: 100, y: 200 });
      service.updateDrag({ x: 300, y: 400 });

      expect(service.dragState.currentPosition).toEqual({ x: 300, y: 400 });
      expect(service.dragState.startPosition).toEqual({ x: 100, y: 200 });
    });

    it('should not update when drag is not active', () => {
      service.updateDrag({ x: 300, y: 400 });

      expect(service.dragState.currentPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('updateHover', () => {
    it('should update hover state during active drag', () => {
      service.startDrag({ x: 100, y: 200 });
      service.updateHover('obj-2', 'bottom', { x: 150, y: 250 });

      expect(service.dragState.hoveredObjectId).toBe('obj-2');
      expect(service.dragState.nearestAnchor).toBe('bottom');
      expect(service.dragState.currentPosition).toEqual({ x: 150, y: 250 });
    });

    it('should clear hover state when passed null', () => {
      service.startDrag({ x: 100, y: 200 });
      service.updateHover('obj-2', 'bottom');
      service.updateHover(null, null);

      expect(service.dragState.hoveredObjectId).toBeNull();
      expect(service.dragState.nearestAnchor).toBeNull();
    });

    it('should not update when drag is not active', () => {
      service.updateHover('obj-2', 'bottom');

      expect(service.dragState.hoveredObjectId).toBeNull();
    });
  });

  describe('completeDrag', () => {
    it('should return connector result with endpoints', () => {
      service.startDrag({ x: 100, y: 100 }, 'obj-1', 'right');
      service.updateDrag({ x: 300, y: 200 });
      service.updateHover('obj-2', 'left', { x: 300, y: 200 });

      const result = service.completeDrag();

      expect(result).not.toBeNull();
      expect(result?.startPoint.objectId).toBe('obj-1');
      expect(result?.startPoint.anchor).toBe('right');
      expect(result?.endPoint.objectId).toBe('obj-2');
      expect(result?.endPoint.anchor).toBe('left');
    });

    it('should reset drag state after completion', () => {
      service.startDrag({ x: 100, y: 100 });
      service.updateDrag({ x: 300, y: 200 });
      service.completeDrag();

      expect(service.dragState.isActive).toBe(false);
      expect(service.dragState).toEqual(DEFAULT_CONNECTOR_DRAG_STATE);
    });

    it('should return null if drag is not active', () => {
      const result = service.completeDrag();

      expect(result).toBeNull();
    });

    it('should return null if distance is too small', () => {
      service.startDrag({ x: 100, y: 100 });
      service.updateDrag({ x: 105, y: 105 });

      const result = service.completeDrag();

      expect(result).toBeNull();
    });

    it('should apply custom options', () => {
      service.startDrag({ x: 100, y: 100 });
      service.updateDrag({ x: 300, y: 200 });

      const result = service.completeDrag({
        routeStyle: 'elbow',
        startArrow: 'circle',
        endArrow: 'filled-arrow',
        strokeColor: '#ff0000',
        strokeWidth: 4,
      });

      expect(result?.routeStyle).toBe('elbow');
      expect(result?.startArrow).toBe('circle');
      expect(result?.endArrow).toBe('filled-arrow');
      expect(result?.strokeColor).toBe('#ff0000');
      expect(result?.strokeWidth).toBe(4);
    });
  });

  describe('cancelDrag', () => {
    it('should reset drag state', () => {
      service.startDrag({ x: 100, y: 100 });
      service.updateDrag({ x: 300, y: 200 });
      service.cancelDrag();

      expect(service.dragState.isActive).toBe(false);
      expect(service.dragState).toEqual(DEFAULT_CONNECTOR_DRAG_STATE);
    });
  });

  describe('startEndpointDrag', () => {
    it('should set up drag for existing connector endpoint', () => {
      service.startEndpointDrag(
        'connector-1',
        'end',
        { x: 200, y: 150 },
        'obj-2',
        'left'
      );

      expect(service.dragState.isActive).toBe(true);
      expect(service.dragState.connectorId).toBe('connector-1');
      expect(service.dragState.endpoint).toBe('end');
      expect(service.dragState.startPosition).toEqual({ x: 200, y: 150 });
    });
  });

  describe('getConnectionPoints', () => {
    it('should return 5 connection points for a rectangle', () => {
      const points = service.getConnectionPoints(0, 0, 100, 50);

      expect(points).toHaveLength(5);
    });

    it('should calculate correct positions', () => {
      const points = service.getConnectionPoints(0, 0, 100, 50);

      const topPoint = points.find((p) => p.anchor === 'top');
      expect(topPoint?.position).toEqual({ x: 50, y: 0 });

      const rightPoint = points.find((p) => p.anchor === 'right');
      expect(rightPoint?.position).toEqual({ x: 100, y: 25 });

      const bottomPoint = points.find((p) => p.anchor === 'bottom');
      expect(bottomPoint?.position).toEqual({ x: 50, y: 50 });

      const leftPoint = points.find((p) => p.anchor === 'left');
      expect(leftPoint?.position).toEqual({ x: 0, y: 25 });

      const centerPoint = points.find((p) => p.anchor === 'center');
      expect(centerPoint?.position).toEqual({ x: 50, y: 25 });
    });
  });

  describe('findNearestConnectionPoint', () => {
    it('should find the nearest point', () => {
      const points = service.getConnectionPoints(0, 0, 100, 50);

      const nearest = service.findNearestConnectionPoint(points, { x: 48, y: 5 });

      expect(nearest.anchor).toBe('top');
    });

    it('should return center point for empty array', () => {
      const nearest = service.findNearestConnectionPoint([], { x: 50, y: 50 });

      expect(nearest.anchor).toBe('center');
      expect(nearest.position).toEqual({ x: 50, y: 50 });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate Euclidean distance', () => {
      const distance = service.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });

      expect(distance).toBe(5);
    });

    it('should return 0 for same points', () => {
      const distance = service.calculateDistance({ x: 10, y: 20 }, { x: 10, y: 20 });

      expect(distance).toBe(0);
    });
  });

  describe('onConnectionChange', () => {
    it('should notify listeners on connection creation', () => {
      const listener = jest.fn();
      service.onConnectionChange(listener);

      service.startDrag({ x: 100, y: 100 });
      service.updateDrag({ x: 300, y: 200 });
      service.completeDrag();

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'created',
        })
      );
    });

    it('should allow unsubscribing', () => {
      const listener = jest.fn();
      const unsubscribe = service.onConnectionChange(listener);

      unsubscribe();

      service.startDrag({ x: 100, y: 100 });
      service.updateDrag({ x: 300, y: 200 });
      service.completeDrag();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const listener = jest.fn();
      service.onConnectionChange(listener);
      service.startDrag({ x: 100, y: 100 });

      service.reset();

      expect(service.dragState).toEqual(DEFAULT_CONNECTOR_DRAG_STATE);

      service.startDrag({ x: 200, y: 200 });
      service.updateDrag({ x: 400, y: 400 });
      service.completeDrag();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('createConnectionService factory', () => {
    it('should create a new instance', () => {
      const newService = createConnectionService();

      expect(newService).toBeInstanceOf(ConnectionService);
      expect(newService.dragState.isActive).toBe(false);
    });
  });
});
