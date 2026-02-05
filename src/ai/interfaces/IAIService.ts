/**
 * AI Service Interface
 *
 * Defines the contract for AI-powered board manipulation services.
 * Follows Dependency Inversion Principle (DIP) from SOLID.
 */

import type { SyncableObject } from '@sync/interfaces/ISyncService';

/**
 * Tool call returned by the AI model.
 */
export interface ToolCall {
  /** Unique identifier for this tool call */
  id: string;
  /** Name of the tool to execute */
  name: string;
  /** Arguments passed to the tool */
  arguments: Record<string, unknown>;
}

/**
 * Tool parameter definition.
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;
  /** Parameter type (string, number, boolean, array, object) */
  type: string;
  /** Parameter description for the AI */
  description: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Enum values if applicable */
  enum?: string[];
  /** Default value if not provided */
  default?: unknown;
}

/**
 * Tool definition for OpenAI function calling.
 */
export interface ToolDefinition {
  /** Tool name (function name) */
  name: string;
  /** Tool description for the AI */
  description: string;
  /** Tool parameters */
  parameters: ToolParameter[];
}

/**
 * Result of an AI command execution.
 */
export interface AICommandResult {
  /** Whether the command was successful */
  success: boolean;
  /** Human-readable message about the result */
  message: string;
  /** Tool calls that were executed */
  toolCalls: ToolCall[];
  /** Any errors that occurred */
  errors?: string[];
  /** Objects that were created or modified */
  affectedObjects?: string[];
}

/**
 * AI processing status.
 */
export type AIStatus = 'idle' | 'processing' | 'completed' | 'error';

/**
 * AI command in the queue.
 */
export interface AICommand {
  /** Unique command identifier */
  id: string;
  /** User ID who submitted the command */
  userId: string;
  /** Natural language input */
  input: string;
  /** Current status */
  status: AIStatus;
  /** Result if completed */
  result?: AICommandResult;
  /** Error message if failed */
  error?: string;
  /** Timestamp when command was created */
  createdAt: number;
  /** Timestamp when command was completed */
  completedAt?: number;
}

/**
 * Board state service interface for tool execution.
 * Abstracts the board manipulation operations.
 */
export interface IBoardStateService {
  /** Get all objects on the board */
  getObjects(): SyncableObject[];
  /** Get object by ID */
  getObject(id: string): SyncableObject | undefined;
  /** Create a new object */
  createObject(object: Partial<SyncableObject>): Promise<string>;
  /** Update an existing object */
  updateObject(id: string, updates: Partial<SyncableObject>): Promise<void>;
  /** Delete an object */
  deleteObject(id: string): Promise<void>;
  /** Delete multiple objects */
  deleteObjects(ids: string[]): Promise<void>;
}

/**
 * AI Service Interface.
 *
 * Provides AI-powered natural language processing for board manipulation.
 * Implementations should handle:
 * - Parsing natural language commands
 * - Generating appropriate tool calls
 * - Executing tools against the board state
 *
 * @example
 * ```typescript
 * const aiService: IAIService = new OpenAIService(config);
 * const toolCalls = await aiService.processCommand(
 *   "Create a blue sticky note that says 'Hello'",
 *   boardObjects
 * );
 * for (const call of toolCalls) {
 *   await aiService.executeTool(call, boardService);
 * }
 * ```
 */
export interface IAIService {
  /**
   * Process a natural language command and return tool calls.
   *
   * @param command - Natural language command from the user
   * @param boardState - Current state of board objects
   * @returns Array of tool calls to execute
   * @throws AIServiceError if processing fails
   */
  processCommand(
    command: string,
    boardState: SyncableObject[]
  ): Promise<ToolCall[]>;

  /**
   * Execute a single tool call against the board.
   *
   * @param toolCall - Tool call to execute
   * @param boardService - Board state service for modifications
   * @returns Result of the tool execution
   * @throws AIServiceError if execution fails
   */
  executeTool(
    toolCall: ToolCall,
    boardService: IBoardStateService
  ): Promise<AICommandResult>;

  /**
   * Get all available tool definitions.
   *
   * @returns Array of tool definitions
   */
  getAvailableTools(): ToolDefinition[];

  /**
   * Check if the service is properly configured and ready.
   *
   * @returns True if service is ready
   */
  isReady(): boolean;
}

/**
 * AI Service error class.
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}
