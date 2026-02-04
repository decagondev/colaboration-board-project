/**
 * Command History Service
 *
 * Manages the undo/redo stack for commands.
 */

import type {
  ICommand,
  ICommandHistory,
  CommandHistoryOptions,
  CommandHistoryState,
  CommandHistoryChangeEvent,
} from '../interfaces/ICommand';
import { DEFAULT_COMMAND_HISTORY_OPTIONS } from '../interfaces/ICommand';

/**
 * Command History Implementation
 *
 * Provides undo/redo functionality using the Command pattern.
 */
export class CommandHistory implements ICommandHistory {
  private _undoStack: ICommand[] = [];
  private _redoStack: ICommand[] = [];
  private _options: Required<CommandHistoryOptions>;
  private _listeners: Set<(event: CommandHistoryChangeEvent) => void> =
    new Set();

  /**
   * Create a new CommandHistory instance.
   *
   * @param options - Configuration options
   */
  constructor(options: CommandHistoryOptions = {}) {
    this._options = {
      ...DEFAULT_COMMAND_HISTORY_OPTIONS,
      ...options,
    };
  }

  /**
   * Current history state.
   */
  get state(): CommandHistoryState {
    return {
      canUndo: this._undoStack.length > 0,
      canRedo: this._redoStack.length > 0,
      undoDescription:
        this._undoStack.length > 0
          ? this._undoStack[this._undoStack.length - 1].description
          : null,
      redoDescription:
        this._redoStack.length > 0
          ? this._redoStack[this._redoStack.length - 1].description
          : null,
      undoCount: this._undoStack.length,
      redoCount: this._redoStack.length,
    };
  }

  /**
   * Execute a command and add it to the history.
   *
   * @param command - The command to execute
   */
  execute(command: ICommand): void {
    const lastCommand = this._undoStack[this._undoStack.length - 1];
    const canMerge =
      lastCommand &&
      lastCommand.canMergeWith &&
      lastCommand.canMergeWith(command) &&
      command.timestamp - lastCommand.timestamp < this._options.mergeTimeWindow;

    if (canMerge && lastCommand.mergeWith) {
      const mergedCommand = lastCommand.mergeWith(command);
      this._undoStack.pop();
      this._undoStack.push(mergedCommand);
    } else {
      command.execute();
      this._undoStack.push(command);
    }

    this._redoStack = [];

    if (this._undoStack.length > this._options.maxHistorySize) {
      this._undoStack.shift();
    }

    this.notifyListeners(command, 'execute');
  }

  /**
   * Undo the most recent command.
   *
   * @returns The undone command, or null if nothing to undo
   */
  undo(): ICommand | null {
    if (this._undoStack.length === 0) {
      return null;
    }

    const command = this._undoStack.pop()!;
    command.undo();
    this._redoStack.push(command);

    this.notifyListeners(command, 'undo');
    return command;
  }

  /**
   * Redo the most recently undone command.
   *
   * @returns The redone command, or null if nothing to redo
   */
  redo(): ICommand | null {
    if (this._redoStack.length === 0) {
      return null;
    }

    const command = this._redoStack.pop()!;
    command.execute();
    this._undoStack.push(command);

    this.notifyListeners(command, 'redo');
    return command;
  }

  /**
   * Clear all history.
   */
  clear(): void {
    this._undoStack = [];
    this._redoStack = [];
    this.notifyListeners(undefined, 'clear');
  }

  /**
   * Subscribe to history changes.
   *
   * @param callback - Function called when history changes
   * @returns Unsubscribe function
   */
  onChange(callback: (event: CommandHistoryChangeEvent) => void): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Notify listeners of history change.
   *
   * @param command - The command involved
   * @param action - The action that occurred
   */
  private notifyListeners(
    command: ICommand | undefined,
    action: CommandHistoryChangeEvent['action']
  ): void {
    const event: CommandHistoryChangeEvent = {
      state: this.state,
      command,
      action,
    };

    for (const listener of this._listeners) {
      listener(event);
    }
  }
}

/**
 * Create a new CommandHistory instance.
 *
 * @param options - Configuration options
 * @returns New CommandHistory instance
 */
export function createCommandHistory(
  options?: CommandHistoryOptions
): ICommandHistory {
  return new CommandHistory(options);
}
