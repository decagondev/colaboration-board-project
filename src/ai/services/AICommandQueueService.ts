/**
 * AI Command Queue Service Implementation
 *
 * Implements IAICommandQueue using Firebase Realtime Database.
 * Synchronizes AI commands across all connected users in real-time.
 */

import {
  ref,
  set,
  get,
  remove,
  update,
  onValue,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  DatabaseReference,
  DataSnapshot,
  push,
  Database,
} from 'firebase/database';
import { database as defaultDatabase } from '@shared/config/firebase';
import type { Unsubscribe } from '@shared/types';
import type { ToolCall } from '../interfaces/IAIService';
import type {
  IAICommandQueue,
  QueuedCommand,
  CommandQueueStatus,
  QueueSubscriptionOptions,
  QueueCallback,
  CommandCallback,
} from '../interfaces/IAICommandQueue';
import { AICommandQueueError } from '../interfaces/IAICommandQueue';

/**
 * Firebase implementation of IAICommandQueue.
 *
 * Uses Firebase RTDB for real-time command queue synchronization.
 * Data structure: ai-queue/{boardId}/{commandId}
 */
export class AICommandQueueService implements IAICommandQueue {
  private database: Database;

  /**
   * Creates an instance of AICommandQueueService.
   *
   * @param database - Firebase database instance (defaults to the shared instance)
   */
  constructor(database: Database = defaultDatabase) {
    this.database = database;
  }

  /**
   * Gets the database reference for a board's command queue.
   *
   * @param boardId - Board identifier
   * @returns Firebase database reference
   */
  private getQueueRef(boardId: string): DatabaseReference {
    return ref(this.database, `ai-queue/${boardId}`);
  }

  /**
   * Gets the database reference for a specific command.
   *
   * @param boardId - Board identifier
   * @param commandId - Command identifier
   * @returns Firebase database reference
   */
  private getCommandRef(boardId: string, commandId: string): DatabaseReference {
    return ref(this.database, `ai-queue/${boardId}/${commandId}`);
  }

  /**
   * Add a new command to the queue.
   */
  async enqueue(
    boardId: string,
    userId: string,
    input: string
  ): Promise<string> {
    try {
      const queueRef = this.getQueueRef(boardId);
      const newCommandRef = push(queueRef);
      const commandId = newCommandRef.key;

      if (!commandId) {
        throw new AICommandQueueError(
          'Failed to generate command ID',
          'ENQUEUE_FAILED'
        );
      }

      const command: Omit<QueuedCommand, 'id'> = {
        boardId,
        userId,
        input,
        status: 'pending',
        createdAt: Date.now(),
      };

      await set(newCommandRef, command);

      return commandId;
    } catch (error) {
      if (error instanceof AICommandQueueError) {
        throw error;
      }
      throw new AICommandQueueError(
        'Failed to enqueue command',
        'ENQUEUE_FAILED',
        error
      );
    }
  }

  /**
   * Update the status of a command.
   */
  async updateStatus(
    boardId: string,
    commandId: string,
    status: CommandQueueStatus
  ): Promise<void> {
    try {
      const commandRef = this.getCommandRef(boardId, commandId);
      const updates: Partial<QueuedCommand> = { status };

      if (status === 'processing') {
        updates.startedAt = Date.now();
      }

      await update(commandRef, updates);
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to update command status',
        'UPDATE_STATUS_FAILED',
        error
      );
    }
  }

  /**
   * Mark a command as completed with results.
   */
  async complete(
    boardId: string,
    commandId: string,
    result: ToolCall[]
  ): Promise<void> {
    try {
      const commandRef = this.getCommandRef(boardId, commandId);
      await update(commandRef, {
        status: 'completed' as CommandQueueStatus,
        result,
        completedAt: Date.now(),
      });
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to complete command',
        'COMPLETE_FAILED',
        error
      );
    }
  }

  /**
   * Mark a command as failed with an error.
   */
  async fail(boardId: string, commandId: string, error: string): Promise<void> {
    try {
      const commandRef = this.getCommandRef(boardId, commandId);
      await update(commandRef, {
        status: 'failed' as CommandQueueStatus,
        error,
        completedAt: Date.now(),
      });
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to mark command as failed',
        'FAIL_FAILED',
        error
      );
    }
  }

  /**
   * Get a specific command.
   */
  async getCommand(
    boardId: string,
    commandId: string
  ): Promise<QueuedCommand | null> {
    try {
      const commandRef = this.getCommandRef(boardId, commandId);
      const snapshot = await get(commandRef);

      if (!snapshot.exists()) {
        return null;
      }

      return this.snapshotToCommand(commandId, snapshot);
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to get command',
        'GET_COMMAND_FAILED',
        error
      );
    }
  }

  /**
   * Get all commands for a board.
   */
  async getCommands(
    boardId: string,
    options: QueueSubscriptionOptions = {}
  ): Promise<QueuedCommand[]> {
    try {
      const { statusFilter, limit = 50 } = options;
      let queueQuery = query(
        this.getQueueRef(boardId),
        orderByChild('createdAt'),
        limitToLast(limit)
      );

      const snapshot = await get(queueQuery);

      if (!snapshot.exists()) {
        return [];
      }

      let commands = this.snapshotToCommands(snapshot);

      if (statusFilter && statusFilter.length > 0) {
        commands = commands.filter((cmd) => statusFilter.includes(cmd.status));
      }

      return commands.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to get commands',
        'GET_COMMANDS_FAILED',
        error
      );
    }
  }

  /**
   * Get the currently processing command for a board.
   */
  async getProcessingCommand(boardId: string): Promise<QueuedCommand | null> {
    try {
      const queueQuery = query(
        this.getQueueRef(boardId),
        orderByChild('status'),
        equalTo('processing')
      );

      const snapshot = await get(queueQuery);

      if (!snapshot.exists()) {
        return null;
      }

      const commands = this.snapshotToCommands(snapshot);
      return commands.length > 0 ? commands[0] : null;
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to get processing command',
        'GET_PROCESSING_FAILED',
        error
      );
    }
  }

  /**
   * Subscribe to queue changes for a board.
   */
  subscribe(
    boardId: string,
    callback: QueueCallback,
    options: QueueSubscriptionOptions = {}
  ): Unsubscribe {
    const { statusFilter, limit = 50 } = options;
    const queueQuery = query(
      this.getQueueRef(boardId),
      orderByChild('createdAt'),
      limitToLast(limit)
    );

    const unsubscribe = onValue(queueQuery, (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      let commands = this.snapshotToCommands(snapshot);

      if (statusFilter && statusFilter.length > 0) {
        commands = commands.filter((cmd) => statusFilter.includes(cmd.status));
      }

      commands.sort((a, b) => b.createdAt - a.createdAt);
      callback(commands);
    });

    return unsubscribe;
  }

  /**
   * Subscribe to a specific command's changes.
   */
  subscribeToCommand(
    boardId: string,
    commandId: string,
    callback: CommandCallback
  ): Unsubscribe {
    const commandRef = this.getCommandRef(boardId, commandId);

    const unsubscribe = onValue(commandRef, (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(this.snapshotToCommand(commandId, snapshot));
    });

    return unsubscribe;
  }

  /**
   * Check if a board has any commands currently processing.
   */
  async isProcessing(boardId: string): Promise<boolean> {
    const command = await this.getProcessingCommand(boardId);
    return command !== null;
  }

  /**
   * Remove old completed/failed commands.
   */
  async cleanup(boardId: string, olderThanMs: number): Promise<number> {
    try {
      const cutoffTime = Date.now() - olderThanMs;
      const commands = await this.getCommands(boardId, {
        statusFilter: ['completed', 'failed'],
        limit: 100,
      });

      const oldCommands = commands.filter(
        (cmd) => cmd.completedAt && cmd.completedAt < cutoffTime
      );

      let removedCount = 0;
      for (const cmd of oldCommands) {
        await remove(this.getCommandRef(boardId, cmd.id));
        removedCount++;
      }

      return removedCount;
    } catch (error) {
      throw new AICommandQueueError(
        'Failed to cleanup commands',
        'CLEANUP_FAILED',
        error
      );
    }
  }

  /**
   * Convert a Firebase snapshot to a QueuedCommand.
   */
  private snapshotToCommand(
    commandId: string,
    snapshot: DataSnapshot
  ): QueuedCommand {
    const data = snapshot.val();
    return {
      id: commandId,
      boardId: data.boardId,
      userId: data.userId,
      input: data.input,
      status: data.status,
      result: data.result,
      error: data.error,
      createdAt: data.createdAt,
      startedAt: data.startedAt,
      completedAt: data.completedAt,
    };
  }

  /**
   * Convert a Firebase snapshot to an array of QueuedCommands.
   */
  private snapshotToCommands(snapshot: DataSnapshot): QueuedCommand[] {
    const commands: QueuedCommand[] = [];

    snapshot.forEach((childSnapshot) => {
      const commandId = childSnapshot.key;
      if (commandId) {
        commands.push(this.snapshotToCommand(commandId, childSnapshot));
      }
    });

    return commands;
  }
}

/**
 * Default AICommandQueueService instance.
 */
export const defaultAICommandQueueService = new AICommandQueueService();
