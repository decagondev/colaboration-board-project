/**
 * AI Command Processor Service
 *
 * Processes commands from the queue sequentially, ensuring only one
 * command is processed at a time across all connected users.
 */

import type { Unsubscribe } from '@shared/types';
import type { IAIService, IBoardStateService, ToolCall } from '../interfaces/IAIService';
import type { IAICommandQueue, QueuedCommand } from '../interfaces/IAICommandQueue';
import { SequentialExecutor, defaultSequentialExecutor } from './SequentialExecutor';

/**
 * Configuration for AICommandProcessor.
 */
export interface AICommandProcessorConfig {
  /** AI service for processing commands */
  aiService: IAIService;
  /** Board state service for object manipulation */
  boardService: IBoardStateService;
  /** Command queue service */
  queueService: IAICommandQueue;
  /** Sequential executor for multi-step commands */
  sequentialExecutor?: SequentialExecutor;
  /** Minimum delay between processing commands in ms (default: 100) */
  processingDelay?: number;
}

/**
 * Result of processing a command.
 */
export interface ProcessingResult {
  /** Command that was processed */
  command: QueuedCommand;
  /** Whether processing succeeded */
  success: boolean;
  /** Tool calls executed */
  toolCalls: ToolCall[];
  /** Error message if failed */
  error?: string;
}

/**
 * Callback for processing completion.
 */
export type ProcessingCallback = (result: ProcessingResult) => void;

/**
 * AI Command Processor
 *
 * Ensures commands are processed sequentially across all users by:
 * 1. Watching the queue for pending commands
 * 2. Claiming and processing one command at a time
 * 3. Updating command status in RTDB
 * 4. Notifying subscribers of results
 *
 * @example
 * ```typescript
 * const processor = new AICommandProcessor({
 *   aiService,
 *   boardService,
 *   queueService
 * });
 *
 * processor.start('board-123', (result) => {
 *   console.log(`Command ${result.command.id} processed`);
 * });
 *
 * // Later...
 * processor.stop();
 * ```
 */
export class AICommandProcessor {
  private aiService: IAIService;
  private boardService: IBoardStateService;
  private queueService: IAICommandQueue;
  private sequentialExecutor: SequentialExecutor;
  private processingDelay: number;
  private isRunning: boolean = false;
  private currentBoardId: string | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private processingCallback: ProcessingCallback | null = null;
  private isProcessingCommand: boolean = false;

  /**
   * Creates an AICommandProcessor.
   *
   * @param config - Processor configuration
   */
  constructor(config: AICommandProcessorConfig) {
    this.aiService = config.aiService;
    this.boardService = config.boardService;
    this.queueService = config.queueService;
    this.sequentialExecutor = config.sequentialExecutor ?? defaultSequentialExecutor;
    this.processingDelay = config.processingDelay ?? 100;
  }

  /**
   * Start processing commands for a board.
   *
   * Subscribes to the command queue and processes pending commands.
   * Only one command is processed at a time.
   *
   * @param boardId - Board to process commands for
   * @param onComplete - Callback when a command completes
   * @returns Unsubscribe function
   */
  start(boardId: string, onComplete?: ProcessingCallback): Unsubscribe {
    if (this.isRunning && this.currentBoardId === boardId) {
      return () => this.stop();
    }

    this.stop();

    this.isRunning = true;
    this.currentBoardId = boardId;
    this.processingCallback = onComplete ?? null;

    this.unsubscribe = this.queueService.subscribe(
      boardId,
      (commands) => this.handleQueueUpdate(commands),
      { statusFilter: ['pending'] }
    );

    return () => this.stop();
  }

  /**
   * Stop processing commands.
   *
   * Unsubscribes from the queue and stops processing.
   */
  stop(): void {
    this.isRunning = false;
    this.currentBoardId = null;
    this.processingCallback = null;

    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Check if the processor is currently running.
   *
   * @returns True if running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Handle queue updates.
   *
   * Processes the next pending command if not already processing.
   */
  private async handleQueueUpdate(commands: QueuedCommand[]): Promise<void> {
    if (!this.isRunning || this.isProcessingCommand) {
      return;
    }

    const pending = commands
      .filter((cmd) => cmd.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);

    if (pending.length === 0) {
      return;
    }

    const nextCommand = pending[0];
    await this.processCommand(nextCommand);
  }

  /**
   * Process a single command.
   *
   * @param command - Command to process
   */
  private async processCommand(command: QueuedCommand): Promise<void> {
    if (!this.currentBoardId || this.isProcessingCommand) {
      return;
    }

    this.isProcessingCommand = true;

    try {
      await this.queueService.updateStatus(
        command.boardId,
        command.id,
        'processing'
      );

      await this.delay(this.processingDelay);

      const aiResult = await this.aiService.processCommand(command.input);

      if (!aiResult.success || aiResult.errors) {
        await this.queueService.fail(
          command.boardId,
          command.id,
          aiResult.errors?.join('; ') ?? 'Command processing failed'
        );

        this.notifyCallback({
          command,
          success: false,
          toolCalls: [],
          error: aiResult.errors?.join('; ') ?? 'Command processing failed',
        });

        return;
      }

      const toolCalls = aiResult.toolCalls ?? [];

      if (toolCalls.length > 0) {
        const execResult = await this.sequentialExecutor.execute(
          toolCalls,
          this.boardService
        );

        if (!execResult.success) {
          await this.queueService.fail(
            command.boardId,
            command.id,
            execResult.errors.join('; ')
          );

          this.notifyCallback({
            command,
            success: false,
            toolCalls,
            error: execResult.errors.join('; '),
          });

          return;
        }
      }

      await this.queueService.complete(command.boardId, command.id, toolCalls);

      this.notifyCallback({
        command,
        success: true,
        toolCalls,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      try {
        await this.queueService.fail(command.boardId, command.id, errorMessage);
      } catch {
        /* Ignore failures to update queue on error */
      }

      this.notifyCallback({
        command,
        success: false,
        toolCalls: [],
        error: errorMessage,
      });
    } finally {
      this.isProcessingCommand = false;
    }
  }

  /**
   * Notify the callback if set.
   */
  private notifyCallback(result: ProcessingResult): void {
    if (this.processingCallback) {
      this.processingCallback(result);
    }
  }

  /**
   * Delay helper.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
