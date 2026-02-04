/**
 * Tests for BoardContext
 *
 * Verifies board state management, viewport, selection, and sync integration.
 */

import React, { useEffect, useRef } from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import {
  BoardProvider,
  useBoard,
  useBoardViewport,
  useBoardSelection,
  useBoardObjects,
} from '../context/BoardContext';
import type { BoardMetadata, BoardContextValue } from '../context/BoardContext';
import type { SyncableObject, SyncResult } from '@sync/interfaces/ISyncService';

/**
 * Mock sync context values.
 */
const mockCreateObject = jest
  .fn()
  .mockResolvedValue({ success: true } as SyncResult);
const mockUpdateObject = jest
  .fn()
  .mockResolvedValue({ success: true } as SyncResult);
const mockDeleteObject = jest
  .fn()
  .mockResolvedValue({ success: true } as SyncResult);
const mockGetObject = jest.fn();

/**
 * Mock the SyncContext module.
 */
jest.mock('@sync/context/SyncContext', () => ({
  SyncProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useSync: () => ({
    objects: [] as SyncableObject[],
    isLoading: false,
    status: {
      isConnected: true,
      pendingCount: 0,
      lastSyncAt: null,
    },
    createObject: mockCreateObject,
    updateObject: mockUpdateObject,
    deleteObject: mockDeleteObject,
    getObject: mockGetObject,
  }),
}));

/**
 * Test board metadata.
 */
const testBoard: BoardMetadata = {
  id: 'board-123',
  name: 'Test Board',
  description: 'A test board',
  createdBy: 'user-1',
  createdAt: Date.now(),
  modifiedAt: Date.now(),
};

/**
 * Wrapper component for hook testing.
 */
function createWrapper(): React.FC<{ children: React.ReactNode }> {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <BoardProvider board={testBoard}>{children}</BoardProvider>;
  };
}

describe('BoardContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BoardProvider', () => {
    it('provides board metadata to children', () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.board).toEqual(testBoard);
    });

    it('provides default viewport state', () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.viewport).toEqual({
        x: 0,
        y: 0,
        scale: 1,
      });
    });

    it('provides empty selection by default', () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectedObjectIds.size).toBe(0);
    });
  });

  describe('Viewport actions', () => {
    it('setViewport updates viewport state', async () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setViewport({ x: 100, y: 200 });
      });

      expect(result.current.viewport.x).toBe(100);
      expect(result.current.viewport.y).toBe(200);
      expect(result.current.viewport.scale).toBe(1);
    });

    it('setViewport merges with existing state', async () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setViewport({ x: 100, y: 200, scale: 2 });
      });

      act(() => {
        result.current.setViewport({ x: 150 });
      });

      expect(result.current.viewport.x).toBe(150);
      expect(result.current.viewport.y).toBe(200);
      expect(result.current.viewport.scale).toBe(2);
    });

    it('resetViewport restores default viewport', async () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setViewport({ x: 100, y: 200, scale: 2 });
      });

      act(() => {
        result.current.resetViewport();
      });

      expect(result.current.viewport).toEqual({ x: 0, y: 0, scale: 1 });
    });
  });

  describe('Selection actions', () => {
    it('provides selection functions', () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.selectObject).toBe('function');
      expect(typeof result.current.selectObjects).toBe('function');
      expect(typeof result.current.deselectObject).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
      expect(typeof result.current.isObjectSelected).toBe('function');
      expect(typeof result.current.getSelectedObjects).toBe('function');
    });

    it('initializes with empty selection', () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectedObjectIds.size).toBe(0);
      expect(result.current.isObjectSelected('any-id')).toBe(false);
    });
  });

  describe('Object operations', () => {
    it('createObject delegates to sync service', async () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      const testObject: SyncableObject = {
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
      };

      await act(async () => {
        await result.current.createObject(testObject);
      });

      expect(mockCreateObject).toHaveBeenCalledWith(testObject);
    });

    it('updateObject delegates to sync service', async () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.updateObject('obj-1', { x: 200 });
      });

      expect(mockUpdateObject).toHaveBeenCalledWith('obj-1', { x: 200 });
    });

    it('deleteObject delegates to sync service', async () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.deleteObject('obj-1');
      });

      expect(mockDeleteObject).toHaveBeenCalledWith('obj-1');
    });
  });

  describe('useBoard hook', () => {
    it('throws when used outside provider', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useBoard());
      }).toThrow('useBoard must be used within a BoardProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Specialized hooks', () => {
    it('useBoardViewport returns viewport state and actions', () => {
      const { result } = renderHook(() => useBoardViewport(), {
        wrapper: createWrapper(),
      });

      expect(result.current.viewport).toEqual({ x: 0, y: 0, scale: 1 });
      expect(typeof result.current.setViewport).toBe('function');
      expect(typeof result.current.resetViewport).toBe('function');
    });

    it('useBoardSelection returns selection state and actions', () => {
      const { result } = renderHook(() => useBoardSelection(), {
        wrapper: createWrapper(),
      });

      expect(result.current.selectedObjectIds.size).toBe(0);
      expect(typeof result.current.selectObject).toBe('function');
      expect(typeof result.current.clearSelection).toBe('function');
    });

    it('useBoardObjects returns objects and operations', () => {
      const { result } = renderHook(() => useBoardObjects(), {
        wrapper: createWrapper(),
      });

      expect(Array.isArray(result.current.objects)).toBe(true);
      expect(typeof result.current.createObject).toBe('function');
      expect(typeof result.current.updateObject).toBe('function');
      expect(typeof result.current.deleteObject).toBe('function');
    });
  });

  describe('Board metadata', () => {
    it('updateBoardMetadata updates the board', () => {
      const { result } = renderHook(() => useBoard(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.updateBoardMetadata({ name: 'Updated Board' });
      });

      expect(result.current.board?.name).toBe('Updated Board');
    });
  });
});
