/**
 * Unit tests for the useCommandHistory hook.
 */

import { renderHook, act } from '@testing-library/react';
import { useCommandHistory } from '../hooks/useCommandHistory';
import type { ICommand } from '../interfaces/ICommand';

/**
 * Creates a mock command for testing.
 *
 * @param id - Command ID
 * @param description - Command description
 * @returns A mock ICommand implementation
 */
function createMockCommand(id: string, description?: string): ICommand {
  return {
    id,
    type: 'create',
    description: description ?? `Test command ${id}`,
    timestamp: Date.now(),
    executedBy: 'test-user',
    execute: jest.fn(),
    undo: jest.fn(),
  };
}

describe('useCommandHistory', () => {
  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useCommandHistory());

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.state.undoCount).toBe(0);
      expect(result.current.state.redoCount).toBe(0);
    });

    it('should provide history instance', () => {
      const { result } = renderHook(() => useCommandHistory());

      expect(result.current.history).toBeDefined();
      expect(result.current.execute).toBeDefined();
      expect(result.current.undo).toBeDefined();
      expect(result.current.redo).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute a command and update state', () => {
      const { result } = renderHook(() => useCommandHistory());
      const command = createMockCommand('cmd-1');

      act(() => {
        result.current.execute(command);
      });

      expect(command.execute).toHaveBeenCalled();
      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.state.undoCount).toBe(1);
    });

    it('should add multiple commands to undo stack', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.execute(createMockCommand('cmd-1'));
        result.current.execute(createMockCommand('cmd-2'));
        result.current.execute(createMockCommand('cmd-3'));
      });

      expect(result.current.state.undoCount).toBe(3);
    });
  });

  describe('undo', () => {
    it('should undo the last command', () => {
      const { result } = renderHook(() => useCommandHistory());
      const command = createMockCommand('cmd-1');

      act(() => {
        result.current.execute(command);
      });

      act(() => {
        result.current.undo();
      });

      expect(command.undo).toHaveBeenCalled();
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });

    it('should return null when undo stack is empty', () => {
      const { result } = renderHook(() => useCommandHistory());

      let undoneCommand: ICommand | null = null;
      act(() => {
        undoneCommand = result.current.undo();
      });

      expect(undoneCommand).toBeNull();
      expect(result.current.canUndo).toBe(false);
    });

    it('should move command to redo stack', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.execute(createMockCommand('cmd-1'));
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.undoCount).toBe(0);
      expect(result.current.state.redoCount).toBe(1);
    });
  });

  describe('redo', () => {
    it('should redo the last undone command', () => {
      const { result } = renderHook(() => useCommandHistory());
      const command = createMockCommand('cmd-1');

      act(() => {
        result.current.execute(command);
      });

      act(() => {
        result.current.undo();
      });

      (command.execute as jest.Mock).mockClear();

      act(() => {
        result.current.redo();
      });

      expect(command.execute).toHaveBeenCalled();
      expect(result.current.canRedo).toBe(false);
      expect(result.current.canUndo).toBe(true);
    });

    it('should return null when redo stack is empty', () => {
      const { result } = renderHook(() => useCommandHistory());

      let redoneCommand: ICommand | null = null;
      act(() => {
        redoneCommand = result.current.redo();
      });

      expect(redoneCommand).toBeNull();
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear both stacks', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.execute(createMockCommand('cmd-1'));
        result.current.execute(createMockCommand('cmd-2'));
        result.current.undo();
      });

      expect(result.current.state.undoCount).toBe(1);
      expect(result.current.state.redoCount).toBe(1);

      act(() => {
        result.current.clear();
      });

      expect(result.current.state.undoCount).toBe(0);
      expect(result.current.state.redoCount).toBe(0);
      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('state updates', () => {
    it('should update state after undo/redo sequence', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.execute(createMockCommand('cmd-1'));
        result.current.execute(createMockCommand('cmd-2'));
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.redo();
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });

    it('should clear redo stack when new command is executed', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.execute(createMockCommand('cmd-1'));
        result.current.execute(createMockCommand('cmd-2'));
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.state.redoCount).toBe(1);

      act(() => {
        result.current.execute(createMockCommand('cmd-3'));
      });

      expect(result.current.state.redoCount).toBe(0);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('descriptions', () => {
    it('should provide undo/redo descriptions', () => {
      const { result } = renderHook(() => useCommandHistory());

      act(() => {
        result.current.execute(createMockCommand('cmd-1', 'First command'));
        result.current.execute(createMockCommand('cmd-2', 'Second command'));
      });

      expect(result.current.undoDescription).toBe('Second command');
      expect(result.current.redoDescription).toBeNull();

      act(() => {
        result.current.undo();
      });

      expect(result.current.undoDescription).toBe('First command');
      expect(result.current.redoDescription).toBe('Second command');
    });

    it('should return null for empty history', () => {
      const { result } = renderHook(() => useCommandHistory());

      expect(result.current.undoDescription).toBeNull();
      expect(result.current.redoDescription).toBeNull();
    });
  });
});
