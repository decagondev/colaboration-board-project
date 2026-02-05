/**
 * AI Tools Module
 *
 * Central registry that aggregates all tool schemas and executors.
 * This module provides a unified interface for working with AI tools.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type {
  IBoardStateService,
  AICommandResult,
  ToolCall,
} from '../interfaces/IAIService';
import type { ToolSchema } from './schemas/ToolSchema';
import { ALL_TOOL_SCHEMAS, toOpenAITool } from './schemas';
import {
  ToolExecutorRegistry,
  defaultToolExecutorRegistry,
} from './executors/ToolExecutor';
import type { ToolExecutorFn } from './executors/ToolExecutor';

/**
 * AI Tools registry.
 *
 * Provides unified access to all AI tools including their schemas
 * and execution functions.
 *
 * @example
 * ```typescript
 * const tools = new AITools();
 *
 * const openAITools = tools.getOpenAITools();
 *
 * const result = await tools.executeTool(toolCall, boardService);
 * ```
 */
export class AITools {
  private schemas: ToolSchema[];
  private executorRegistry: ToolExecutorRegistry;

  /**
   * Creates a new AITools instance.
   *
   * @param schemas - Tool schemas (defaults to all built-in schemas)
   * @param executorRegistry - Tool executor registry (defaults to built-in registry)
   */
  constructor(
    schemas: ToolSchema[] = [...ALL_TOOL_SCHEMAS],
    executorRegistry: ToolExecutorRegistry = defaultToolExecutorRegistry
  ) {
    this.schemas = schemas;
    this.executorRegistry = executorRegistry;
  }

  /**
   * Get all tool schemas.
   *
   * @returns Array of tool schemas
   */
  getSchemas(): ToolSchema[] {
    return [...this.schemas];
  }

  /**
   * Get tools in OpenAI format for chat completions API.
   *
   * @returns Array of OpenAI tool definitions
   */
  getOpenAITools(): ChatCompletionTool[] {
    return this.schemas.map(toOpenAITool);
  }

  /**
   * Get a specific tool schema by name.
   *
   * @param name - Tool name
   * @returns Tool schema or undefined if not found
   */
  getSchema(name: string): ToolSchema | undefined {
    return this.schemas.find((s) => s.name === name);
  }

  /**
   * Check if a tool exists.
   *
   * @param name - Tool name
   * @returns True if tool exists
   */
  hasTool(name: string): boolean {
    return this.schemas.some((s) => s.name === name);
  }

  /**
   * Get all tool names.
   *
   * @returns Array of tool names
   */
  getToolNames(): string[] {
    return this.schemas.map((s) => s.name);
  }

  /**
   * Execute a tool call.
   *
   * @param toolCall - Tool call to execute
   * @param boardService - Board state service
   * @returns Execution result
   */
  async executeTool(
    toolCall: ToolCall,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    return this.executorRegistry.execute(toolCall, boardService);
  }

  /**
   * Register a custom tool.
   *
   * @param schema - Tool schema
   * @param executor - Tool executor function
   */
  registerTool(schema: ToolSchema, executor: ToolExecutorFn): void {
    this.schemas.push(schema);
    this.executorRegistry.register(schema.name, executor);
  }
}

/**
 * Default AITools instance with all built-in tools.
 */
export const defaultAITools = new AITools();
