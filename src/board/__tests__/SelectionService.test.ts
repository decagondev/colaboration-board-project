/**
 * Unit tests for the SelectionService.
 *
 * Tests selection management including single/multi-selection,
 * lasso selection, and selection change notifications.
 */

import {
  SelectionService,
  createSelectionService,
} from '../services/SelectionService';
import type {
  SelectionChangeEvent,
  SelectionMode,
} from '../interfaces/ISelectionService';

describe('SelectionService', () => {
  let service: SelectionService;

  beforeEach(() => {
    service = new SelectionService();
  });

  describe('initial state', () => {
    it('should start with no selection', () => {
      expect(service.selectedIds.size).toBe(0);
      expect(service.primarySelectedId).toBeNull();
      expect(service.hasSelection).toBe(false);
    });

    it('should have inactive lasso state', () => {
      expect(service.lassoState.isActive).toBe(false);
      expect(service.lassoState.bounds).toBeNull();
    });
  });

  describe('single selection', () => {
    it('should select a single object', () => {
      service.select('obj-1');

      expect(service.selectedIds.has('obj-1')).toBe(true);
      expect(service.primarySelectedId).toBe('obj-1');
      expect(service.hasSelection).toBe(true);
    });

    it('should replace selection by default', () => {
      service.select('obj-1');
      service.select('obj-2');

      expect(service.selectedIds.size).toBe(1);
      expect(service.selectedIds.has('obj-2')).toBe(true);
      expect(service.selectedIds.has('obj-1')).toBe(false);
    });

    it('should add to selection with add mode', () => {
      service.select('obj-1');
      service.select('obj-2', 'add');

      expect(service.selectedIds.size).toBe(2);
      expect(service.selectedIds.has('obj-1')).toBe(true);
      expect(service.selectedIds.has('obj-2')).toBe(true);
    });

    it('should toggle selection with toggle mode', () => {
      service.select('obj-1');
      service.select('obj-1', 'toggle');

      expect(service.selectedIds.size).toBe(0);
      expect(service.hasSelection).toBe(false);
    });

    it('should toggle unselected object to selected', () => {
      service.select('obj-1', 'toggle');

      expect(service.selectedIds.has('obj-1')).toBe(true);
    });

    it('should remove from selection with remove mode', () => {
      service.select('obj-1');
      service.select('obj-2', 'add');
      service.select('obj-1', 'remove');

      expect(service.selectedIds.size).toBe(1);
      expect(service.selectedIds.has('obj-2')).toBe(true);
      expect(service.selectedIds.has('obj-1')).toBe(false);
    });
  });

  describe('multi-selection', () => {
    it('should select multiple objects at once', () => {
      service.selectMultiple(['obj-1', 'obj-2', 'obj-3']);

      expect(service.selectedIds.size).toBe(3);
      expect(service.primarySelectedId).toBe('obj-1');
    });

    it('should replace selection by default', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      service.selectMultiple(['obj-3', 'obj-4']);

      expect(service.selectedIds.size).toBe(2);
      expect(service.selectedIds.has('obj-3')).toBe(true);
      expect(service.selectedIds.has('obj-1')).toBe(false);
    });

    it('should add to selection with add mode', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      service.selectMultiple(['obj-3', 'obj-4'], 'add');

      expect(service.selectedIds.size).toBe(4);
    });

    it('should toggle selection with toggle mode', () => {
      service.selectMultiple(['obj-1', 'obj-2', 'obj-3']);
      service.selectMultiple(['obj-2', 'obj-4'], 'toggle');

      expect(service.selectedIds.size).toBe(3);
      expect(service.selectedIds.has('obj-1')).toBe(true);
      expect(service.selectedIds.has('obj-2')).toBe(false);
      expect(service.selectedIds.has('obj-3')).toBe(true);
      expect(service.selectedIds.has('obj-4')).toBe(true);
    });

    it('should remove from selection with remove mode', () => {
      service.selectMultiple(['obj-1', 'obj-2', 'obj-3']);
      service.selectMultiple(['obj-1', 'obj-3'], 'remove');

      expect(service.selectedIds.size).toBe(1);
      expect(service.selectedIds.has('obj-2')).toBe(true);
    });
  });

  describe('deselect', () => {
    it('should deselect a single object', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      service.deselect('obj-1');

      expect(service.selectedIds.size).toBe(1);
      expect(service.selectedIds.has('obj-1')).toBe(false);
    });

    it('should update primary selection when deselecting primary', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      service.deselect('obj-1');

      expect(service.primarySelectedId).toBe('obj-2');
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      service.selectMultiple(['obj-1', 'obj-2', 'obj-3']);
      service.clearSelection();

      expect(service.selectedIds.size).toBe(0);
      expect(service.primarySelectedId).toBeNull();
      expect(service.hasSelection).toBe(false);
    });
  });

  describe('isSelected', () => {
    it('should return true for selected objects', () => {
      service.select('obj-1');

      expect(service.isSelected('obj-1')).toBe(true);
    });

    it('should return false for unselected objects', () => {
      service.select('obj-1');

      expect(service.isSelected('obj-2')).toBe(false);
    });
  });

  describe('lasso selection', () => {
    it('should start lasso selection', () => {
      service.startLasso({ x: 100, y: 100 });

      expect(service.lassoState.isActive).toBe(true);
      expect(service.lassoState.startPoint).toEqual({ x: 100, y: 100 });
    });

    it('should update lasso bounds during drag', () => {
      service.startLasso({ x: 100, y: 100 });
      service.updateLasso({ x: 200, y: 300 });

      expect(service.lassoState.bounds).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 200,
      });
    });

    it('should handle lasso in negative direction', () => {
      service.startLasso({ x: 200, y: 300 });
      service.updateLasso({ x: 100, y: 100 });

      expect(service.lassoState.bounds).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 200,
      });
    });

    it('should end lasso and return bounds', () => {
      service.startLasso({ x: 100, y: 100 });
      service.updateLasso({ x: 200, y: 200 });

      const bounds = service.endLasso();

      expect(bounds).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
      expect(service.lassoState.isActive).toBe(false);
    });

    it('should cancel lasso selection', () => {
      service.startLasso({ x: 100, y: 100 });
      service.updateLasso({ x: 200, y: 200 });
      service.cancelLasso();

      expect(service.lassoState.isActive).toBe(false);
      expect(service.lassoState.bounds).toBeNull();
    });

    it('should not update lasso when not active', () => {
      service.updateLasso({ x: 200, y: 200 });

      expect(service.lassoState.bounds).toBeNull();
    });
  });

  describe('getObjectsInBounds', () => {
    it('should return objects within bounds', () => {
      const bounds = { x: 0, y: 0, width: 100, height: 100 };
      const objectIds = ['obj-1', 'obj-2', 'obj-3'];
      const intersectionTest = (id: string): boolean => {
        return id === 'obj-1' || id === 'obj-2';
      };

      const result = service.getObjectsInBounds(
        bounds,
        objectIds,
        intersectionTest
      );

      expect(result).toEqual(['obj-1', 'obj-2']);
    });
  });

  describe('selection change notifications', () => {
    it('should notify listeners on selection change', () => {
      const listener = jest.fn();
      service.onSelectionChange(listener);

      service.select('obj-1');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          added: ['obj-1'],
          removed: [],
        })
      );
    });

    it('should track added and removed items', () => {
      const listener = jest.fn();
      service.selectMultiple(['obj-1', 'obj-2']);
      service.onSelectionChange(listener);

      service.selectMultiple(['obj-2', 'obj-3']);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          added: ['obj-3'],
          removed: ['obj-1'],
        })
      );
    });

    it('should allow unsubscribing', () => {
      const listener = jest.fn();
      const unsubscribe = service.onSelectionChange(listener);

      service.select('obj-1');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      service.select('obj-2');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should not notify when selection does not change', () => {
      const listener = jest.fn();
      service.select('obj-1');
      service.onSelectionChange(listener);

      service.select('obj-1');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getSelectionBounds', () => {
    it('should return null when nothing selected', () => {
      const getBounds = jest.fn();

      const result = service.getSelectionBounds(getBounds);

      expect(result).toBeNull();
      expect(getBounds).not.toHaveBeenCalled();
    });

    it('should return bounds for single selected object', () => {
      service.select('obj-1');
      const getBounds = jest.fn().mockReturnValue({
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      });

      const result = service.getSelectionBounds(getBounds);

      expect(result).toEqual({
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      });
    });

    it('should return combined bounds for multiple selected objects', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      const getBounds = jest.fn((id: string) => {
        if (id === 'obj-1') {
          return { x: 0, y: 0, width: 100, height: 100 };
        }
        return { x: 150, y: 150, width: 50, height: 50 };
      });

      const result = service.getSelectionBounds(getBounds);

      expect(result).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });
    });

    it('should handle null bounds from getBounds', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      const getBounds = jest.fn((id: string) => {
        if (id === 'obj-1') {
          return { x: 100, y: 100, width: 50, height: 50 };
        }
        return null;
      });

      const result = service.getSelectionBounds(getBounds);

      expect(result).toEqual({
        x: 100,
        y: 100,
        width: 50,
        height: 50,
      });
    });
  });

  describe('createSelectionService', () => {
    it('should create a new SelectionService instance', () => {
      const newService = createSelectionService();

      expect(newService).toBeDefined();
      expect(newService.hasSelection).toBe(false);
    });
  });

  describe('primary selection management', () => {
    it('should maintain primary when adding to selection', () => {
      service.select('obj-1');
      service.select('obj-2', 'add');

      expect(service.primarySelectedId).toBe('obj-1');
    });

    it('should update primary when it is toggled off', () => {
      service.selectMultiple(['obj-1', 'obj-2']);
      service.select('obj-1', 'toggle');

      expect(service.primarySelectedId).toBe('obj-2');
    });

    it('should set primary to null when all deselected via toggle', () => {
      service.select('obj-1');
      service.select('obj-1', 'toggle');

      expect(service.primarySelectedId).toBeNull();
    });
  });
});
