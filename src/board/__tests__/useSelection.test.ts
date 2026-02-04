/**
 * Unit tests for the useSelection hook.
 *
 * Tests React hook for managing object selection.
 */

import { renderHook, act } from '@testing-library/react';
import { useSelection } from '../hooks/useSelection';

describe('useSelection', () => {
  describe('initial state', () => {
    it('should start with no selection', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.primarySelectedId).toBeNull();
      expect(result.current.hasSelection).toBe(false);
    });

    it('should have inactive lasso state', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.lassoState.isActive).toBe(false);
      expect(result.current.lassoState.bounds).toBeNull();
    });

    it('should provide service reference', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.service).toBeDefined();
    });
  });

  describe('select', () => {
    it('should select a single object', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      expect(result.current.selectedIds.has('obj-1')).toBe(true);
      expect(result.current.primarySelectedId).toBe('obj-1');
    });

    it('should replace selection by default', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      act(() => {
        result.current.select('obj-2');
      });

      expect(result.current.selectedIds.size).toBe(1);
      expect(result.current.selectedIds.has('obj-2')).toBe(true);
    });

    it('should add to selection with add mode', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      act(() => {
        result.current.select('obj-2', 'add');
      });

      expect(result.current.selectedIds.size).toBe(2);
    });
  });

  describe('selectMultiple', () => {
    it('should select multiple objects', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectMultiple(['obj-1', 'obj-2', 'obj-3']);
      });

      expect(result.current.selectedIds.size).toBe(3);
      expect(result.current.primarySelectedId).toBe('obj-1');
    });
  });

  describe('deselect', () => {
    it('should deselect a single object', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectMultiple(['obj-1', 'obj-2']);
      });

      act(() => {
        result.current.deselect('obj-1');
      });

      expect(result.current.selectedIds.size).toBe(1);
      expect(result.current.selectedIds.has('obj-1')).toBe(false);
    });
  });

  describe('clearSelection', () => {
    it('should clear all selections', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.selectMultiple(['obj-1', 'obj-2']);
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedIds.size).toBe(0);
      expect(result.current.hasSelection).toBe(false);
    });
  });

  describe('isSelected', () => {
    it('should return true for selected objects', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      expect(result.current.isSelected('obj-1')).toBe(true);
    });

    it('should return false for unselected objects', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      expect(result.current.isSelected('obj-2')).toBe(false);
    });
  });

  describe('lasso selection', () => {
    it('should start lasso', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.startLasso({ x: 100, y: 100 });
      });

      expect(result.current.lassoState.isActive).toBe(true);
      expect(result.current.lassoState.startPoint).toEqual({ x: 100, y: 100 });
    });

    it('should update lasso', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.startLasso({ x: 100, y: 100 });
      });

      act(() => {
        result.current.updateLasso({ x: 200, y: 200 });
      });

      expect(result.current.lassoState.bounds).toEqual({
        x: 100,
        y: 100,
        width: 100,
        height: 100,
      });
    });

    it('should end lasso and return bounds', () => {
      const { result } = renderHook(() => useSelection());
      let bounds: ReturnType<typeof result.current.endLasso>;

      act(() => {
        result.current.startLasso({ x: 0, y: 0 });
      });

      act(() => {
        result.current.updateLasso({ x: 100, y: 100 });
      });

      act(() => {
        bounds = result.current.endLasso();
      });

      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expect(result.current.lassoState.isActive).toBe(false);
    });

    it('should cancel lasso', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.startLasso({ x: 100, y: 100 });
      });

      act(() => {
        result.current.cancelLasso();
      });

      expect(result.current.lassoState.isActive).toBe(false);
    });
  });

  describe('selectObjectsInLasso', () => {
    it('should select objects within lasso bounds', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.startLasso({ x: 0, y: 0 });
      });

      act(() => {
        result.current.updateLasso({ x: 100, y: 100 });
      });

      act(() => {
        result.current.selectObjectsInLasso(
          ['obj-1', 'obj-2', 'obj-3'],
          (id) => id === 'obj-1' || id === 'obj-2'
        );
      });

      expect(result.current.selectedIds.size).toBe(2);
      expect(result.current.selectedIds.has('obj-1')).toBe(true);
      expect(result.current.selectedIds.has('obj-2')).toBe(true);
      expect(result.current.lassoState.isActive).toBe(false);
    });

    it('should not select when lasso is too small', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.startLasso({ x: 0, y: 0 });
      });

      act(() => {
        result.current.updateLasso({ x: 2, y: 2 });
      });

      act(() => {
        result.current.selectObjectsInLasso(['obj-1'], () => true);
      });

      expect(result.current.selectedIds.size).toBe(0);
    });
  });

  describe('getSelectionBounds', () => {
    it('should return null when nothing selected', () => {
      const { result } = renderHook(() => useSelection());

      const bounds = result.current.getSelectionBounds(() => ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }));

      expect(bounds).toBeNull();
    });

    it('should return bounds of selected objects', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      const bounds = result.current.getSelectionBounds(() => ({
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      }));

      expect(bounds).toEqual({
        x: 50,
        y: 50,
        width: 100,
        height: 100,
      });
    });
  });

  describe('hasSelection', () => {
    it('should be true when objects are selected', () => {
      const { result } = renderHook(() => useSelection());

      act(() => {
        result.current.select('obj-1');
      });

      expect(result.current.hasSelection).toBe(true);
    });

    it('should be false when no objects are selected', () => {
      const { result } = renderHook(() => useSelection());

      expect(result.current.hasSelection).toBe(false);
    });
  });
});
