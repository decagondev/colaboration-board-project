/**
 * Unit tests for the useConnectorCreation hook.
 *
 * Tests connector creation lifecycle including drag operations,
 * anchor proximity detection, and creation completion.
 */

import { renderHook, act } from '@testing-library/react';
import { useConnectorCreation } from '../hooks/useConnectorCreation';
import type { RenderableObject } from '../components/BoardCanvasComponent';

describe('useConnectorCreation', () => {
  const mockObjects: RenderableObject[] = [
    { id: 'obj-1', type: 'shape', x: 0, y: 0, width: 100, height: 50, data: {} },
    { id: 'obj-2', type: 'shape', x: 200, y: 100, width: 100, height: 50, data: {} },
    { id: 'obj-3', type: 'sticky-note', x: 400, y: 200, width: 200, height: 200, data: {} },
  ];

  describe('initial state', () => {
    it('should not be creating initially', () => {
      const { result } = renderHook(() => useConnectorCreation());

      expect(result.current.isCreating).toBe(false);
    });

    it('should have inactive drag state', () => {
      const { result } = renderHook(() => useConnectorCreation());

      expect(result.current.dragState.isActive).toBe(false);
      expect(result.current.dragState.connectorId).toBeNull();
    });
  });

  describe('startCreation', () => {
    it('should activate creation mode', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
      });

      expect(result.current.isCreating).toBe(true);
      expect(result.current.dragState.isActive).toBe(true);
    });

    it('should set start position', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
      });

      expect(result.current.dragState.startPosition).toEqual({ x: 100, y: 50 });
    });

    it('should set object ID and anchor when provided', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 50 }, 'obj-1', 'right');
      });

      expect(result.current.dragState.startObjectId).toBe('obj-1');
      expect(result.current.dragState.startAnchor).toBe('right');
    });
  });

  describe('updatePosition', () => {
    it('should update current position during creation', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
      });

      act(() => {
        result.current.updatePosition({ x: 200, y: 150 });
      });

      expect(result.current.dragState.currentPosition).toEqual({ x: 200, y: 150 });
    });

    it('should not update when not creating', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.updatePosition({ x: 200, y: 150 });
      });

      expect(result.current.dragState.currentPosition).toEqual({ x: 0, y: 0 });
    });
  });

  describe('checkAnchorProximity', () => {
    it('should detect nearby anchor points', () => {
      const { result } = renderHook(() => useConnectorCreation({ snapDistance: 30 }));

      act(() => {
        result.current.startCreation({ x: 0, y: 25 }, 'obj-1', 'right');
      });

      act(() => {
        result.current.checkAnchorProximity({ x: 195, y: 125 }, mockObjects, 'obj-1');
      });

      expect(result.current.dragState.hoveredObjectId).toBe('obj-2');
      expect(result.current.dragState.nearestAnchor).toBe('left');
    });

    it('should exclude the start object', () => {
      const { result } = renderHook(() => useConnectorCreation({ snapDistance: 50 }));

      act(() => {
        result.current.startCreation({ x: 100, y: 25 }, 'obj-1', 'right');
      });

      act(() => {
        result.current.checkAnchorProximity({ x: 50, y: 0 }, mockObjects, 'obj-1');
      });

      expect(result.current.dragState.hoveredObjectId).toBeNull();
    });

    it('should clear hover when no nearby anchors', () => {
      const { result } = renderHook(() => useConnectorCreation({ snapDistance: 10 }));

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
      });

      act(() => {
        result.current.checkAnchorProximity({ x: 1000, y: 1000 }, mockObjects);
      });

      expect(result.current.dragState.hoveredObjectId).toBeNull();
      expect(result.current.dragState.nearestAnchor).toBeNull();
    });
  });

  describe('completeCreation', () => {
    it('should return connector result', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 25 }, 'obj-1', 'right');
      });

      act(() => {
        result.current.updatePosition({ x: 200, y: 125 });
      });

      let connectorResult: ReturnType<typeof result.current.completeCreation>;
      act(() => {
        connectorResult = result.current.completeCreation();
      });

      expect(connectorResult).not.toBeNull();
      expect(connectorResult?.startPoint.objectId).toBe('obj-1');
      expect(connectorResult?.startPoint.anchor).toBe('right');
    });

    it('should reset creation state', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
        result.current.updatePosition({ x: 300, y: 200 });
      });

      act(() => {
        result.current.completeCreation();
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.dragState.isActive).toBe(false);
    });

    it('should apply default options', () => {
      const { result } = renderHook(() =>
        useConnectorCreation({
          defaultOptions: {
            routeStyle: 'elbow',
            endArrow: 'filled-arrow',
          },
        })
      );

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
        result.current.updatePosition({ x: 300, y: 200 });
      });

      let connectorResult: ReturnType<typeof result.current.completeCreation>;
      act(() => {
        connectorResult = result.current.completeCreation();
      });

      expect(connectorResult?.routeStyle).toBe('elbow');
      expect(connectorResult?.endArrow).toBe('filled-arrow');
    });

    it('should allow overriding options', () => {
      const { result } = renderHook(() =>
        useConnectorCreation({
          defaultOptions: { routeStyle: 'straight' },
        })
      );

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
        result.current.updatePosition({ x: 300, y: 200 });
      });

      let connectorResult: ReturnType<typeof result.current.completeCreation>;
      act(() => {
        connectorResult = result.current.completeCreation({ routeStyle: 'curved' });
      });

      expect(connectorResult?.routeStyle).toBe('curved');
    });

    it('should return null if not creating', () => {
      const { result } = renderHook(() => useConnectorCreation());

      let connectorResult: ReturnType<typeof result.current.completeCreation>;
      act(() => {
        connectorResult = result.current.completeCreation();
      });

      expect(connectorResult).toBeNull();
    });
  });

  describe('cancelCreation', () => {
    it('should reset creation state', () => {
      const { result } = renderHook(() => useConnectorCreation());

      act(() => {
        result.current.startCreation({ x: 100, y: 50 });
        result.current.updatePosition({ x: 300, y: 200 });
      });

      act(() => {
        result.current.cancelCreation();
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.dragState.isActive).toBe(false);
    });
  });

  describe('getObjectConnectionPoints', () => {
    it('should return connection points for an object', () => {
      const { result } = renderHook(() => useConnectorCreation());

      const points = result.current.getObjectConnectionPoints(mockObjects[0]);

      expect(points).toHaveLength(5);
      expect(points.find((p) => p.anchor === 'top')).toBeDefined();
      expect(points.find((p) => p.anchor === 'right')).toBeDefined();
      expect(points.find((p) => p.anchor === 'bottom')).toBeDefined();
      expect(points.find((p) => p.anchor === 'left')).toBeDefined();
      expect(points.find((p) => p.anchor === 'center')).toBeDefined();
    });
  });

  describe('findNearestAnchor', () => {
    it('should find nearest anchor within snap distance', () => {
      const { result } = renderHook(() => useConnectorCreation({ snapDistance: 30 }));

      const nearest = result.current.findNearestAnchor(
        { x: 55, y: 5 },
        mockObjects[0]
      );

      expect(nearest).not.toBeNull();
      expect(nearest?.anchor).toBe('top');
    });

    it('should return null if outside snap distance', () => {
      const { result } = renderHook(() => useConnectorCreation({ snapDistance: 5 }));

      const nearest = result.current.findNearestAnchor(
        { x: 200, y: 200 },
        mockObjects[0]
      );

      expect(nearest).toBeNull();
    });
  });

  describe('service', () => {
    it('should expose the connection service', () => {
      const { result } = renderHook(() => useConnectorCreation());

      expect(result.current.service).toBeDefined();
      expect(typeof result.current.service.startDrag).toBe('function');
    });
  });

  describe('custom snap distance', () => {
    it('should respect custom snap distance', () => {
      const { result: smallSnap } = renderHook(() =>
        useConnectorCreation({ snapDistance: 5 })
      );
      const { result: largeSnap } = renderHook(() =>
        useConnectorCreation({ snapDistance: 100 })
      );

      const nearPos = { x: 55, y: 8 };

      const smallResult = smallSnap.current.findNearestAnchor(nearPos, mockObjects[0]);
      const largeResult = largeSnap.current.findNearestAnchor(nearPos, mockObjects[0]);

      expect(smallResult).toBeNull();
      expect(largeResult).not.toBeNull();
    });
  });
});
