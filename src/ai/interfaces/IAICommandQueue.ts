/**
 * AI Command Queue Interface
 *
 * Defines the contract for AI command queue services.
 * Handles synchronization of AI commands across users via Firebase RTDB.
 */

import type { Unsubscribe } from '@shared/types';
import type { ToolCall } from './IAIService';

/**
 * Command in the queue.
 */
export interface QueuedCommand {
  /** Unique command identifier */
  id: string;
  /** Board this command belongs to */
  boardId: string;
  /** User who submitted the command */
  userId: string;
  /** Natural language input */
  input: string;
  /** Current status */
  status: CommandQueueStatus;
  /** Tool calls if completed */
  result?: ToolCall[];
  /** Error message if failed */
  error?: string;
  /** Timestamp when created */
  createdAt: number;
  /** Timestamp when processing started */
  startedAt?: number;
  /** Timestamp when completed/failed */
  completedAt?: number;
}

/**
 * Status of a command in the queue.
 */
export type CommandQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Options for subscribing to queue changes.
 */
export interface QueueSubscriptionOptions {
  /** Only include commands with these statuses */
  statusFilter?: CommandQueueStatus[];
  /** Maximum number of commands to return */
  limit?: number;
  /** Order by field (default: createdAt) */
  orderBy?: 'createdAt' | 'status';
}

/**
 * Callback for queue changes.
 */
export type QueueCallback = (commands: QueuedCommand[]) => void;

/**
 * Callback for single command changes.
 */
export type CommandCallback = (command: QueuedCommand | null) => void;

/**
 * AI Command Queue Interface.
 *
 * Provides methods for managing AI commands in a shared queue.
 * Commands are synchronized across all connected users via Firebase RTDB.
 *
 * @example
 * ```typescript
 * const queue: IAICommandQueue = new AICommandQueueService(database);
 *
 * const unsubscribe = queue.subscribe(boardId, (commands) => {
 *   console.log('Queue updated:', commands);
 * });
 *
 * const commandId = await queue.enqueue(boardId, userId, input);
 *
 * await queue.updateStatus(boardId, commandId, 'processing');
 *
 * await queue.complete(boardId, commandId, toolCalls);
 *
 * unsubscribe();
 * ```
 */
export interface IAICommandQueue {
  /**
   * Add a new command to the queue.
   *
   * @param boardId - Board identifier
   * @param userId - User who submitted the command
   * @param input - Natural language command input
   * @returns The ID of the created command
   */
  enqueue(boardId: string, userId: string, input: string): Promise<string>;

  /**
   * Update the status of a command.
   *
   * @param boardId - Board identifier
   * @param commandId - Command identifier
   * @param status - New status
   */
  updateStatus(
    boardId: string,
    commandId: string,
    status: CommandQueueStatus
  ): Promise<void>;

  /**
   * Mark a command as completed with results.
   *
   * @param boardId - Board identifier
   * @param commandId - Command identifier
   * @param result - Tool calls that were executed
   */
  complete(
    boardId: string,
    commandId: string,
    result: ToolCall[]
  ): Promise<void>;

  /**
   * Mark a command as failed with an error.
   *
   * @param boardId - Board identifier
   * @param commandId - Command identifier
   * @param error - Error message
   */
  fail(boardId: string, commandId: string, error: string): Promise<void>;

  /**
   * Get a specific command.
   *
   * @param boardId - Board identifier
   * @param commandId - Command identifier
   * @returns The command or null if not found
   */
  getCommand(boardId: string, commandId: string): Promise<QueuedCommand | null>;

  /**
   * Get all commands for a board.
   *
   * @param boardId - Board identifier
   * @param options - Query options
   * @returns Array of commands
   */
  getCommands(
    boardId: string,
    options?: QueueSubscriptionOptions
  ): Promise<QueuedCommand[]>;

  /**
   * Get the currently processing command for a board (if any).
   *
   * @param boardId - Board identifier
   * @returns The processing command or null
   */
  getProcessingCommand(boardId: string): Promise<QueuedCommand | null>;

  /**
   * Subscribe to queue changes for a board.
   *
   * @param boardId - Board identifier
   * @param callback - Function called when queue changes
   * @param options - Subscription options
   * @returns Unsubscribe function
   */
  subscribe(
    boardId: string,
    callback: QueueCallback,
    options?: QueueSubscriptionOptions
  ): Unsubscribe;

  /**
   * Subscribe to a specific command's changes.
   *
   * @param boardId - Board identifier
   * @param commandId - Command identifier
   * @param callback - Function called when command changes
   * @returns Unsubscribe function
   */
  subscribeToCommand(
    boardId: string,
    commandId: string,
    callback: CommandCallback
  ): Unsubscribe;

  /**
   * Check if a board has any commands currently processing.
   *
   * @param boardId - Board identifier
   * @returns True if a command is processing
   */
  isProcessing(boardId: string): Promise<boolean>;

  /**
   * Remove old completed/failed commands.
   *
   * @param boardId - Board identifier
   * @param olderThanMs - Remove commands older than this many milliseconds
   * @returns Number of commands removed
   */
  cleanup(boardId: string, olderThanMs: number): Promise<number>;
}

/**
 * AI Command Queue error class.
 */
export class AICommandQueueError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AICommandQueueError';
  }
}
