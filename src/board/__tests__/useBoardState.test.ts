/**
 * Tests for useBoardState hook
 *
 * Verifies the comprehensive board state hook API.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useBoardState } from '../hooks/useBoardState';
import type { BoardMetadata } from '../context/BoardContext';
import type { SyncableObject, SyncResult } from '@sync/interfaces/ISyncService';
import React from 'react';

/**
 * Mock objects for testing.
 */
const mockObjects: SyncableObject[] = [
  {
    id: 'obj-1',
    type: 'sticky-note',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    zIndex: 1,
    createdBy: 'user-1',
    createdAt: Date.now(),
    modifiedBy: 'user-1',
    modifiedAt: Date.now(),
    data: { text: 'Note 1' },
  },
  {
    id: 'obj-2',
    type: 'shape',
    x: 300,
    y: 200,
    width: 100,
    height: 100,
    zIndex: 2,
    createdBy: 'user-1',
    createdAt: Date.now(),
    modifiedBy: 'user-1',
    modifiedAt: Date.now(),
  },
];

/**
 * Mock board context.
 */
const mockBoardContext = {
  board: {
    id: 'board-123',
    name: 'Test Board',
    createdBy: 'user-1',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
  } as BoardMetadata,
  viewport: { x: 0, y: 0, scale: 1 },
  selectedObjectIds: new Set<string>(),
  objects: mockObjects,
  isLoading: false,
  syncStatus: {
    isConnected: true,
    pendingCount: 0,
    lastSyncAt: Date.now(),
  },
  setViewport: jest.fn(),
  resetViewport: jest.fn(),
  selectObject: jest.fn(),
  selectObjects: jest.fn(),
  deselectObject: jest.fn(),
  clearSelection: jest.fn(),
  isObjectSelected: jest.fn().mockReturnValue(false),
  createObject: jest.fn().mockResolvedValue({ success: true } as SyncResult),
  updateObject: jest.fn().mockResolvedValue({ success: true } as SyncResult),
  deleteObject: jest.fn().mockResolvedValue({ success: true } as SyncResult),
  getObject: jest.fn((id: string) => mockObjects.find((o) => o.id === id)),
  getSelectedObjects: jest.fn().mockReturnValue([]),
  updateBoardMetadata: jest.fn(),
};

jest.mock('../context/BoardContext', () => ({
  useBoard: () => mockBoardContext,
}));

describe('useBoardState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBoardContext.objects = [...mockObjects];
    mockBoardContext.selectedObjectIds = new Set();
  });

  describe('Initial state', () => {
    it('returns board metadata', () => {
      const { result } = renderHook(() => useBoardState());

      expect(result.current.board).toEqual(mockBoardContext.board);
    });

    it('returns viewport state and actions', () => {
      const { result } = renderHook(() => useBoardState());

      expect(result.current.viewport.state).toEqual({ x: 0, y: 0, scale: 1 });
      expect(typeof result.current.viewport.set).toBe('function');
      expect(typeof result.current.viewport.reset).toBe('function');
    });

    it('returns selection state and actions', () => {
      const { result } = renderHook(() => useBoardState());

      expect(result.current.selection.ids.size).toBe(0);
      expect(result.current.selection.count).toBe(0);
      expect(typeof result.current.selection.select).toBe('function');
      expect(typeof result.current.selection.clear).toBe('function');
    });

    it('returns objects state and actions', () => {
      const { result } = renderHook(() => useBoardState());

      expect(result.current.objects.all).toEqual(mockObjects);
      expect(result.current.objects.count).toBe(2);
      expect(result.current.objects.isLoading).toBe(false);
    });

    it('returns sync status', () => {
      const { result } = renderHook(() => useBoardState());

      expect(result.current.sync.isConnected).toBe(true);
      expect(result.current.sync.pendingCount).toBe(0);
    });
  });

  describe('Viewport actions', () => {
    it('calls setViewport through viewport.set', () => {
      const { result } = renderHook(() => useBoardState());

      act(() => {
        result.current.viewport.set({ x: 100 });
      });

      expect(mockBoardContext.setViewport).toHaveBeenCalledWith({ x: 100 });
    });

    it('calls resetViewport through viewport.reset', () => {
      const { result } = renderHook(() => useBoardState());

      act(() => {
        result.current.viewport.reset();
      });

      expect(mockBoardContext.resetViewport).toHaveBeenCalled();
    });
  });

  describe('Selection actions', () => {
    it('calls selectObject through selection.select', () => {
      const { result } = renderHook(() => useBoardState());

      act(() => {
        result.current.selection.select('obj-1');
      });

      expect(mockBoardContext.selectObject).toHaveBeenCalledWith('obj-1');
    });

    it('calls selectObjects through selection.selectMultiple', () => {
      const { result } = renderHook(() => useBoardState());

      act(() => {
        result.current.selection.selectMultiple(['obj-1', 'obj-2']);
      });

      expect(mockBoardContext.selectObjects).toHaveBeenCalledWith([
        'obj-1',
        'obj-2',
      ]);
    });

    it('calls clearSelection through selection.clear', () => {
      const { result } = renderHook(() => useBoardState());

      act(() => {
        result.current.selection.clear();
      });

      expect(mockBoardContext.clearSelection).toHaveBeenCalled();
    });
  });

  describe('Object actions', () => {
    it('creates object with createNew', async () => {
      const { result } = renderHook(() => useBoardState());

      await act(async () => {
        await result.current.objects.createNew({
          type: 'sticky-note',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          createdBy: 'user-1',
          data: { text: 'New note' },
        });
      });

      expect(mockBoardContext.createObject).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sticky-note',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          createdBy: 'user-1',
          data: { text: 'New note' },
        })
      );
    });

    it('updates object with objects.update', async () => {
      const { result } = renderHook(() => useBoardState());

      await act(async () => {
        await result.current.objects.update('obj-1', { x: 200 });
      });

      expect(mockBoardContext.updateObject).toHaveBeenCalledWith('obj-1', {
        x: 200,
      });
    });

    it('deletes object with objects.delete', async () => {
      const { result } = renderHook(() => useBoardState());

      await act(async () => {
        await result.current.objects.delete('obj-1');
      });

      expect(mockBoardContext.deleteObject).toHaveBeenCalledWith('obj-1');
    });

    it('deletes multiple objects with objects.deleteMultiple', async () => {
      const { result } = renderHook(() => useBoardState());

      await act(async () => {
        await result.current.objects.deleteMultiple(['obj-1', 'obj-2']);
      });

      expect(mockBoardContext.deleteObject).toHaveBeenCalledTimes(2);
      expect(mockBoardContext.deleteObject).toHaveBeenCalledWith('obj-1');
      expect(mockBoardContext.deleteObject).toHaveBeenCalledWith('obj-2');
    });

    it('gets object by ID with objects.get', () => {
      const { result } = renderHook(() => useBoardState());

      const obj = result.current.objects.get('obj-1');

      expect(mockBoardContext.getObject).toHaveBeenCalledWith('obj-1');
    });

    it('filters objects by type with objects.getByType', () => {
      const { result } = renderHook(() => useBoardState());

      const stickyNotes = result.current.objects.getByType('sticky-note');

      expect(stickyNotes).toHaveLength(1);
      expect(stickyNotes[0].type).toBe('sticky-note');
    });
  });

  describe('Board metadata actions', () => {
    it('updates board metadata', () => {
      const { result } = renderHook(() => useBoardState());

      act(() => {
        result.current.boardActions.updateMetadata({ name: 'Updated Board' });
      });

      expect(mockBoardContext.updateBoardMetadata).toHaveBeenCalledWith({
        name: 'Updated Board',
      });
    });
  });
});
