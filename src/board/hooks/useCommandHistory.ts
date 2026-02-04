/**
 * useCommandHistory Hook
 *
 * React hook for managing undo/redo with the Command pattern.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ICommand,
  ICommandHistory,
  CommandHistoryState,
  CommandHistoryOptions,
  CommandHistoryChangeEvent,
} from '../interfaces/ICommand';
import { CommandHistory } from '../services/CommandHistory';

/**
 * Command history hook return type.
 */
export interface UseCommandHistoryReturn {
  /** Current history state */
  state: CommandHistoryState;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Description of next undo operation */
  undoDescription: string | null;
  /** Description of next redo operation */
  redoDescription: string | null;
  /** Execute a command */
  execute: (command: ICommand) => void;
  /** Undo the most recent command */
  undo: () => ICommand | null;
  /** Redo the most recently undone command */
  redo: () => ICommand | null;
  /** Clear all history */
  clear: () => void;
  /** The underlying command history service */
  history: ICommandHistory;
}

/**
 * Hook for managing command history with undo/redo.
 *
 * @param options - Command history configuration options
 * @returns Command history state and functions
 *
 * @example
 * ```typescript
 * const {
 *   canUndo,
 *   canRedo,
 *   execute,
 *   undo,
 *   redo,
 * } = useCommandHistory();
 *
 * // Execute a command
 * execute(new CreateObjectCommand(object, addToBoard, removeFromBoard, userId));
 *
 * // Undo with keyboard shortcut
 * useEffect(() => {
 *   const handleKeyDown = (e: KeyboardEvent) => {
 *     if (e.ctrlKey || e.metaKey) {
 *       if (e.key === 'z' && !e.shiftKey) {
 *         e.preventDefault();
 *         undo();
 *       } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
 *         e.preventDefault();
 *         redo();
 *       }
 *     }
 *   };
 *   window.addEventListener('keydown', handleKeyDown);
 *   return () => window.removeEventListener('keydown', handleKeyDown);
 * }, [undo, redo]);
 * ```
 */
export function useCommandHistory(
  options?: CommandHistoryOptions
): UseCommandHistoryReturn {
  const historyRef = useRef<ICommandHistory>(new CommandHistory(options));
  const [state, setState] = useState<CommandHistoryState>(
    historyRef.current.state
  );

  useEffect(() => {
    const unsubscribe = historyRef.current.onChange(
      (event: CommandHistoryChangeEvent) => {
        setState(event.state);
      }
    );

    return unsubscribe;
  }, []);

  const execute = useCallback((command: ICommand) => {
    historyRef.current.execute(command);
  }, []);

  const undo = useCallback(() => {
    return historyRef.current.undo();
  }, []);

  const redo = useCallback(() => {
    return historyRef.current.redo();
  }, []);

  const clear = useCallback(() => {
    historyRef.current.clear();
  }, []);

  return {
    state,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undoDescription: state.undoDescription,
    redoDescription: state.redoDescription,
    execute,
    undo,
    redo,
    clear,
    history: historyRef.current,
  };
}
