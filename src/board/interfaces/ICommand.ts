/**
 * Command Interface
 *
 * Defines the contract for undoable commands following the Command pattern.
 */

/**
 * Command types for categorizing operations.
 */
export type CommandType =
  | 'create'
  | 'delete'
  | 'move'
  | 'resize'
  | 'rotate'
  | 'edit'
  | 'color'
  | 'duplicate'
  | 'paste'
  | 'group'
  | 'ungroup'
  | 'reorder'
  | 'batch';

/**
 * Command Interface
 *
 * All undoable operations should implement this interface to enable
 * undo/redo functionality.
 */
export interface ICommand {
  /** Unique identifier for the command */
  readonly id: string;
  /** Type of command for categorization */
  readonly type: CommandType;
  /** Human-readable description of the command */
  readonly description: string;
  /** Timestamp when command was executed */
  readonly timestamp: number;
  /** User who executed the command */
  readonly executedBy: string;

  /**
   * Execute the command.
   * Called when the command is first executed or re-executed (redo).
   */
  execute(): void;

  /**
   * Undo the command.
   * Called when the user requests to undo this command.
   */
  undo(): void;

  /**
   * Check if this command can be merged with another.
   * Used for combining rapid successive edits into one undo step.
   *
   * @param other - The other command to check for mergeability
   * @returns True if commands can be merged
   */
  canMergeWith?(other: ICommand): boolean;

  /**
   * Merge another command into this one.
   * The merged command should undo/redo both operations.
   *
   * @param other - The command to merge
   * @returns A new merged command
   */
  mergeWith?(other: ICommand): ICommand;
}

/**
 * Batch Command Interface
 *
 * A command that groups multiple commands into a single undo/redo operation.
 */
export interface IBatchCommand extends ICommand {
  readonly type: 'batch';
  /** The commands contained in this batch */
  readonly commands: ICommand[];
}

/**
 * Command history options.
 */
export interface CommandHistoryOptions {
  /** Maximum number of commands to keep in history */
  maxHistorySize?: number;
  /** Time window for merging similar commands (ms) */
  mergeTimeWindow?: number;
}

/**
 * Command history state.
 */
export interface CommandHistoryState {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Description of the next undo operation */
  undoDescription: string | null;
  /** Description of the next redo operation */
  redoDescription: string | null;
  /** Number of commands in undo stack */
  undoCount: number;
  /** Number of commands in redo stack */
  redoCount: number;
}

/**
 * Command history change event.
 */
export interface CommandHistoryChangeEvent {
  /** Current history state */
  state: CommandHistoryState;
  /** The command that caused the change */
  command?: ICommand;
  /** The action that occurred */
  action: 'execute' | 'undo' | 'redo' | 'clear';
}

/**
 * Command History Service Interface
 *
 * Manages the undo/redo stack for commands.
 */
export interface ICommandHistory {
  /** Current history state */
  readonly state: CommandHistoryState;

  /**
   * Execute a command and add it to the history.
   *
   * @param command - The command to execute
   */
  execute(command: ICommand): void;

  /**
   * Undo the most recent command.
   *
   * @returns The undone command, or null if nothing to undo
   */
  undo(): ICommand | null;

  /**
   * Redo the most recently undone command.
   *
   * @returns The redone command, or null if nothing to redo
   */
  redo(): ICommand | null;

  /**
   * Clear all history.
   */
  clear(): void;

  /**
   * Subscribe to history changes.
   *
   * @param callback - Function called when history changes
   * @returns Unsubscribe function
   */
  onChange(callback: (event: CommandHistoryChangeEvent) => void): () => void;
}

/**
 * Default command history options.
 */
export const DEFAULT_COMMAND_HISTORY_OPTIONS: Required<CommandHistoryOptions> =
  {
    maxHistorySize: 100,
    mergeTimeWindow: 500,
  };
