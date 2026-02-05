/**
 * OpenAI Service Implementation
 *
 * Implements IAIService using OpenAI's chat completions API with function calling.
 * Handles natural language processing and tool execution for board manipulation.
 */

import OpenAI from 'openai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type {
  IAIService,
  IBoardStateService,
  ToolCall,
  ToolDefinition,
  AICommandResult,
} from '../interfaces/IAIService';
import { AIServiceError } from '../interfaces/IAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';

/**
 * Configuration options for OpenAIService.
 */
export interface OpenAIServiceConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Model to use (defaults to gpt-4o-mini) */
  model?: string;
  /** Maximum tokens for response */
  maxTokens?: number;
  /** Temperature for response randomness (0-2) */
  temperature?: number;
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: Partial<OpenAIServiceConfig> = {
  model: 'gpt-4o-mini',
  maxTokens: 1024,
  temperature: 0.7,
};

/**
 * System prompt for the AI assistant.
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant for a collaborative whiteboard application called CollabBoard.
Your job is to help users manipulate objects on the board using natural language commands.

You can:
- Create sticky notes with text and colors
- Create shapes (rectangles, ellipses)
- Move objects around the board
- Resize objects
- Change colors of objects
- Delete objects
- Get information about the current board state

When creating objects:
- Use appropriate default sizes if not specified
- Position objects in visible areas (x: 100-800, y: 100-600)
- Use descriptive, readable text for sticky notes

When the user asks about the board, use getBoardState to see what's there first.
Always be helpful and execute the user's requests as accurately as possible.`;

/**
 * OpenAI Service Implementation.
 *
 * Provides AI-powered board manipulation using OpenAI's function calling API.
 */
export class OpenAIService implements IAIService {
  private client: OpenAI;
  private config: Required<OpenAIServiceConfig>;
  private tools: ToolDefinition[] = [];
  private toolExecutors: Map<string, ToolExecutor> = new Map();

  /**
   * Creates a new OpenAIService instance.
   *
   * @param config - Service configuration
   * @throws AIServiceError if API key is missing
   */
  constructor(config: OpenAIServiceConfig) {
    if (!config.apiKey) {
      throw new AIServiceError(
        'OpenAI API key is required',
        'MISSING_API_KEY'
      );
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<OpenAIServiceConfig>;

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true,
    });

    this.initializeTools();
  }

  /**
   * Initialize available tools and their executors.
   */
  private initializeTools(): void {
    this.tools = [
      {
        name: 'createStickyNote',
        description: 'Create a new sticky note on the board',
        parameters: [
          { name: 'text', type: 'string', description: 'Text content of the sticky note', required: true },
          { name: 'color', type: 'string', description: 'Background color (hex or named color)', required: false, default: '#fef08a' },
          { name: 'x', type: 'number', description: 'X position on the board', required: false, default: 200 },
          { name: 'y', type: 'number', description: 'Y position on the board', required: false, default: 200 },
        ],
      },
      {
        name: 'createShape',
        description: 'Create a shape (rectangle or ellipse) on the board',
        parameters: [
          { name: 'shapeType', type: 'string', description: 'Type of shape', required: true, enum: ['rectangle', 'ellipse'] },
          { name: 'x', type: 'number', description: 'X position', required: false, default: 200 },
          { name: 'y', type: 'number', description: 'Y position', required: false, default: 200 },
          { name: 'width', type: 'number', description: 'Width of the shape', required: false, default: 150 },
          { name: 'height', type: 'number', description: 'Height of the shape', required: false, default: 100 },
          { name: 'color', type: 'string', description: 'Fill color', required: false, default: '#3b82f6' },
        ],
      },
      {
        name: 'createText',
        description: 'Create a text element on the board',
        parameters: [
          { name: 'text', type: 'string', description: 'Text content', required: true },
          { name: 'x', type: 'number', description: 'X position', required: false, default: 200 },
          { name: 'y', type: 'number', description: 'Y position', required: false, default: 200 },
          { name: 'fontSize', type: 'number', description: 'Font size in pixels', required: false, default: 20 },
          { name: 'color', type: 'string', description: 'Text color', required: false, default: '#1f2937' },
        ],
      },
      {
        name: 'getBoardState',
        description: 'Get the current state of all objects on the board',
        parameters: [],
      },
      {
        name: 'moveObjects',
        description: 'Move one or more objects by a delta amount',
        parameters: [
          { name: 'objectIds', type: 'array', description: 'Array of object IDs to move', required: true },
          { name: 'deltaX', type: 'number', description: 'Amount to move horizontally', required: true },
          { name: 'deltaY', type: 'number', description: 'Amount to move vertically', required: true },
        ],
      },
      {
        name: 'resizeObjects',
        description: 'Resize one or more objects',
        parameters: [
          { name: 'objectIds', type: 'array', description: 'Array of object IDs to resize', required: true },
          { name: 'width', type: 'number', description: 'New width', required: true },
          { name: 'height', type: 'number', description: 'New height', required: true },
        ],
      },
      {
        name: 'changeColor',
        description: 'Change the color of one or more objects',
        parameters: [
          { name: 'objectIds', type: 'array', description: 'Array of object IDs to change', required: true },
          { name: 'color', type: 'string', description: 'New color (hex or named)', required: true },
        ],
      },
      {
        name: 'deleteObjects',
        description: 'Delete one or more objects from the board',
        parameters: [
          { name: 'objectIds', type: 'array', description: 'Array of object IDs to delete', required: true },
        ],
      },
    ];

    this.registerToolExecutors();
  }

  /**
   * Register tool executor functions.
   */
  private registerToolExecutors(): void {
    this.toolExecutors.set('createStickyNote', this.executeCreateStickyNote.bind(this));
    this.toolExecutors.set('createShape', this.executeCreateShape.bind(this));
    this.toolExecutors.set('createText', this.executeCreateText.bind(this));
    this.toolExecutors.set('getBoardState', this.executeGetBoardState.bind(this));
    this.toolExecutors.set('moveObjects', this.executeMoveObjects.bind(this));
    this.toolExecutors.set('resizeObjects', this.executeResizeObjects.bind(this));
    this.toolExecutors.set('changeColor', this.executeChangeColor.bind(this));
    this.toolExecutors.set('deleteObjects', this.executeDeleteObjects.bind(this));
  }

  /**
   * Convert tool definitions to OpenAI format.
   */
  private getOpenAITools(): ChatCompletionTool[] {
    return this.tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type === 'array' ? 'array' : param.type,
              description: param.description,
              ...(param.enum ? { enum: param.enum } : {}),
              ...(param.type === 'array' ? { items: { type: 'string' } } : {}),
            };
            return acc;
          }, {} as Record<string, unknown>),
          required: tool.parameters
            .filter((p) => p.required)
            .map((p) => p.name),
        },
      },
    }));
  }

  /**
   * Process a natural language command.
   */
  async processCommand(
    command: string,
    boardState: SyncableObject[]
  ): Promise<ToolCall[]> {
    try {
      const boardContext = this.formatBoardState(boardState);

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Current board state:\n${boardContext}\n\nUser command: ${command}`,
          },
        ],
        tools: this.getOpenAITools(),
        tool_choice: 'auto',
      });

      const message = response.choices[0]?.message;
      if (!message?.tool_calls || message.tool_calls.length === 0) {
        return [];
      }

      return message.tool_calls.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments || '{}'),
      }));
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AIServiceError(
          `OpenAI API error: ${error.message}`,
          error.code || 'API_ERROR',
          error
        );
      }
      throw new AIServiceError(
        'Failed to process command',
        'PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * Format board state for the AI context.
   */
  private formatBoardState(objects: SyncableObject[]): string {
    if (objects.length === 0) {
      return 'The board is empty.';
    }

    return objects
      .map((obj) => {
        const details = [
          `ID: ${obj.id}`,
          `Type: ${obj.type}`,
          `Position: (${obj.x}, ${obj.y})`,
          `Size: ${obj.width}x${obj.height}`,
        ];

        if (obj.data?.text) {
          details.push(`Text: "${obj.data.text}"`);
        }
        if (obj.data?.color) {
          details.push(`Color: ${obj.data.color}`);
        }

        return details.join(', ');
      })
      .join('\n');
  }

  /**
   * Execute a tool call.
   */
  async executeTool(
    toolCall: ToolCall,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const executor = this.toolExecutors.get(toolCall.name);
    if (!executor) {
      return {
        success: false,
        message: `Unknown tool: ${toolCall.name}`,
        toolCalls: [toolCall],
        errors: [`Tool "${toolCall.name}" is not registered`],
      };
    }

    try {
      return await executor(toolCall.arguments, boardService);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to execute ${toolCall.name}`,
        toolCalls: [toolCall],
        errors: [errorMessage],
      };
    }
  }

  /**
   * Get available tools.
   */
  getAvailableTools(): ToolDefinition[] {
    return [...this.tools];
  }

  /**
   * Check if service is ready.
   */
  isReady(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Execute createStickyNote tool.
   */
  private async executeCreateStickyNote(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const id = await boardService.createObject({
      type: 'sticky-note',
      x: (args.x as number) ?? 200,
      y: (args.y as number) ?? 200,
      width: 200,
      height: 200,
      data: {
        text: args.text as string,
        color: args.color ?? '#fef08a',
        fontSize: 16,
      },
    });

    return {
      success: true,
      message: `Created sticky note with text "${args.text}"`,
      toolCalls: [],
      affectedObjects: [id],
    };
  }

  /**
   * Execute createShape tool.
   */
  private async executeCreateShape(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const id = await boardService.createObject({
      type: 'shape',
      x: (args.x as number) ?? 200,
      y: (args.y as number) ?? 200,
      width: (args.width as number) ?? 150,
      height: (args.height as number) ?? 100,
      data: {
        shapeType: args.shapeType as string,
        color: args.color ?? '#3b82f6',
      },
    });

    return {
      success: true,
      message: `Created ${args.shapeType} shape`,
      toolCalls: [],
      affectedObjects: [id],
    };
  }

  /**
   * Execute createText tool.
   */
  private async executeCreateText(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const id = await boardService.createObject({
      type: 'text',
      x: (args.x as number) ?? 200,
      y: (args.y as number) ?? 200,
      width: 200,
      height: 50,
      data: {
        text: args.text as string,
        color: args.color ?? '#1f2937',
        fontSize: (args.fontSize as number) ?? 20,
      },
    });

    return {
      success: true,
      message: `Created text "${args.text}"`,
      toolCalls: [],
      affectedObjects: [id],
    };
  }

  /**
   * Execute getBoardState tool.
   */
  private async executeGetBoardState(
    _args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const objects = boardService.getObjects();
    const summary = objects.length === 0
      ? 'The board is empty.'
      : `Found ${objects.length} objects on the board.`;

    return {
      success: true,
      message: summary,
      toolCalls: [],
    };
  }

  /**
   * Execute moveObjects tool.
   */
  private async executeMoveObjects(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const objectIds = args.objectIds as string[];
    const deltaX = args.deltaX as number;
    const deltaY = args.deltaY as number;

    for (const id of objectIds) {
      const obj = boardService.getObject(id);
      if (obj) {
        await boardService.updateObject(id, {
          x: obj.x + deltaX,
          y: obj.y + deltaY,
        });
      }
    }

    return {
      success: true,
      message: `Moved ${objectIds.length} object(s) by (${deltaX}, ${deltaY})`,
      toolCalls: [],
      affectedObjects: objectIds,
    };
  }

  /**
   * Execute resizeObjects tool.
   */
  private async executeResizeObjects(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const objectIds = args.objectIds as string[];
    const width = args.width as number;
    const height = args.height as number;

    for (const id of objectIds) {
      await boardService.updateObject(id, { width, height });
    }

    return {
      success: true,
      message: `Resized ${objectIds.length} object(s) to ${width}x${height}`,
      toolCalls: [],
      affectedObjects: objectIds,
    };
  }

  /**
   * Execute changeColor tool.
   */
  private async executeChangeColor(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const objectIds = args.objectIds as string[];
    const color = args.color as string;

    for (const id of objectIds) {
      const obj = boardService.getObject(id);
      if (obj) {
        await boardService.updateObject(id, {
          data: { ...obj.data, color },
        });
      }
    }

    return {
      success: true,
      message: `Changed color of ${objectIds.length} object(s) to ${color}`,
      toolCalls: [],
      affectedObjects: objectIds,
    };
  }

  /**
   * Execute deleteObjects tool.
   */
  private async executeDeleteObjects(
    args: Record<string, unknown>,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const objectIds = args.objectIds as string[];
    await boardService.deleteObjects(objectIds);

    return {
      success: true,
      message: `Deleted ${objectIds.length} object(s)`,
      toolCalls: [],
      affectedObjects: objectIds,
    };
  }
}

/**
 * Tool executor function type.
 */
type ToolExecutor = (
  args: Record<string, unknown>,
  boardService: IBoardStateService
) => Promise<AICommandResult>;

