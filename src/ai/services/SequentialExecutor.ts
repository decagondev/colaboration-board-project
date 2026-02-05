/**
 * Sequential Executor Service
 *
 * Handles sequential execution of multiple tool calls.
 * Ensures tool calls are executed in order with proper error handling.
 */

import type {
  IBoardStateService,
  AICommandResult,
  ToolCall,
} from '../interfaces/IAIService';
import { AITools, defaultAITools } from '../tools/AITools';

/**
 * Result of sequential execution.
 */
export interface SequentialExecutionResult {
  /** Overall success (all steps succeeded) */
  success: boolean;
  /** Summary message */
  message: string;
  /** Results from each step */
  stepResults: StepResult[];
  /** All affected object IDs */
  affectedObjects: string[];
  /** Any errors encountered */
  errors: string[];
}

/**
 * Result of a single step.
 */
export interface StepResult {
  /** Step index (0-based) */
  index: number;
  /** Tool call that was executed */
  toolCall: ToolCall;
  /** Whether this step succeeded */
  success: boolean;
  /** Result message */
  message: string;
  /** Objects affected by this step */
  affectedObjects: string[];
  /** Error if step failed */
  error?: string;
}

/**
 * Options for sequential execution.
 */
export interface SequentialExecutionOptions {
  /** Stop execution on first error (default: false) */
  stopOnError?: boolean;
  /** Delay between steps in milliseconds (default: 0) */
  delayBetweenSteps?: number;
  /** Callback for progress updates */
  onProgress?: (completed: number, total: number, current: StepResult) => void;
}

/**
 * Sequential Executor class.
 *
 * Executes multiple tool calls in sequence with configurable behavior.
 *
 * @example
 * ```typescript
 * const executor = new SequentialExecutor();
 * const result = await executor.execute(toolCalls, boardService, {
 *   stopOnError: true,
 *   onProgress: (completed, total) => console.log(`${completed}/${total}`)
 * });
 * ```
 */
export class SequentialExecutor {
  private aiTools: AITools;

  /**
   * Creates a new SequentialExecutor.
   *
   * @param aiTools - AI tools instance (defaults to built-in tools)
   */
  constructor(aiTools: AITools = defaultAITools) {
    this.aiTools = aiTools;
  }

  /**
   * Execute tool calls sequentially.
   *
   * @param toolCalls - Array of tool calls to execute
   * @param boardService - Board service for object manipulation
   * @param options - Execution options
   * @returns Sequential execution result
   */
  async execute(
    toolCalls: ToolCall[],
    boardService: IBoardStateService,
    options: SequentialExecutionOptions = {}
  ): Promise<SequentialExecutionResult> {
    const { stopOnError = false, delayBetweenSteps = 0, onProgress } = options;

    const stepResults: StepResult[] = [];
    const allAffectedObjects: string[] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < toolCalls.length; i++) {
      const toolCall = toolCalls[i];

      if (delayBetweenSteps > 0 && i > 0) {
        await this.delay(delayBetweenSteps);
      }

      const stepResult = await this.executeStep(i, toolCall, boardService);
      stepResults.push(stepResult);

      if (stepResult.affectedObjects.length > 0) {
        allAffectedObjects.push(...stepResult.affectedObjects);
      }

      if (!stepResult.success && stepResult.error) {
        allErrors.push(`Step ${i + 1}: ${stepResult.error}`);
      }

      onProgress?.(i + 1, toolCalls.length, stepResult);

      if (!stepResult.success && stopOnError) {
        break;
      }
    }

    const successCount = stepResults.filter((r) => r.success).length;
    const success = successCount === toolCalls.length;

    return {
      success,
      message: success
        ? `Successfully executed ${toolCalls.length} step(s)`
        : `Completed ${successCount}/${toolCalls.length} steps with ${allErrors.length} error(s)`,
      stepResults,
      affectedObjects: [...new Set(allAffectedObjects)],
      errors: allErrors,
    };
  }

  /**
   * Execute a single step.
   */
  private async executeStep(
    index: number,
    toolCall: ToolCall,
    boardService: IBoardStateService
  ): Promise<StepResult> {
    try {
      const result: AICommandResult = await this.aiTools.executeTool(
        toolCall,
        boardService
      );

      return {
        index,
        toolCall,
        success: result.success,
        message: result.message,
        affectedObjects: result.affectedObjects ?? [],
        error: result.success ? undefined : result.errors?.join('; '),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        index,
        toolCall,
        success: false,
        message: `Failed to execute ${toolCall.name}`,
        affectedObjects: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Delay helper.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default sequential executor instance.
 */
export const defaultSequentialExecutor = new SequentialExecutor();
