/**
 * AITools Unit Tests
 */

import { AITools, defaultAITools } from '../tools/AITools';
import { ALL_TOOL_SCHEMAS } from '../tools/schemas';
import type { IBoardStateService, ToolCall } from '../interfaces/IAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';

describe('AITools', () => {
  let aiTools: AITools;
  let mockBoardService: IBoardStateService;
  let mockObjects: SyncableObject[];

  beforeEach(() => {
    aiTools = new AITools();

    mockObjects = [
      {
        id: 'obj-1',
        type: 'sticky-note',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        zIndex: 1,
        createdBy: 'user-1',
        createdAt: Date.now(),
        modifiedBy: 'user-1',
        modifiedAt: Date.now(),
        data: { text: 'Test note', color: '#fef08a' },
      },
    ];

    mockBoardService = {
      getObjects: jest.fn().mockReturnValue(mockObjects),
      getObject: jest.fn((id: string) => mockObjects.find((o) => o.id === id)),
      createObject: jest.fn().mockResolvedValue('new-obj-id'),
      updateObject: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn().mockResolvedValue(undefined),
      deleteObjects: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('constructor', () => {
    it('should initialize with default schemas', () => {
      const schemas = aiTools.getSchemas();
      expect(schemas).toHaveLength(ALL_TOOL_SCHEMAS.length);
    });

    it('should accept custom schemas', () => {
      const customSchemas = [ALL_TOOL_SCHEMAS[0]];
      const customTools = new AITools(customSchemas);
      expect(customTools.getSchemas()).toHaveLength(1);
    });
  });

  describe('getSchemas', () => {
    it('should return all schemas', () => {
      const schemas = aiTools.getSchemas();
      expect(schemas.length).toBe(12);
    });

    it('should return a copy of schemas', () => {
      const schemas1 = aiTools.getSchemas();
      const schemas2 = aiTools.getSchemas();
      expect(schemas1).not.toBe(schemas2);
      expect(schemas1).toEqual(schemas2);
    });
  });

  describe('getOpenAITools', () => {
    it('should return tools in OpenAI format', () => {
      const tools = aiTools.getOpenAITools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(12);

      for (const tool of tools) {
        expect(tool.type).toBe('function');
        if (tool.type === 'function') {
          expect(tool.function).toBeDefined();
          expect(tool.function.name).toBeTruthy();
          expect(tool.function.parameters).toBeDefined();
        }
      }
    });
  });

  describe('getSchema', () => {
    it('should return schema by name', () => {
      const schema = aiTools.getSchema('createStickyNote');
      expect(schema).toBeDefined();
      expect(schema?.name).toBe('createStickyNote');
    });

    it('should return undefined for non-existent schema', () => {
      const schema = aiTools.getSchema('unknownTool');
      expect(schema).toBeUndefined();
    });
  });

  describe('hasTool', () => {
    it('should return true for existing tool', () => {
      expect(aiTools.hasTool('createStickyNote')).toBe(true);
    });

    it('should return false for non-existent tool', () => {
      expect(aiTools.hasTool('unknownTool')).toBe(false);
    });
  });

  describe('getToolNames', () => {
    it('should return all tool names', () => {
      const names = aiTools.getToolNames();

      expect(names).toContain('createStickyNote');
      expect(names).toContain('createShape');
      expect(names).toContain('createText');
      expect(names).toContain('getBoardState');
      expect(names).toContain('moveObjects');
      expect(names).toContain('resizeObjects');
      expect(names).toContain('changeColor');
      expect(names).toContain('deleteObjects');
    });
  });

  describe('executeTool', () => {
    it('should execute tool successfully', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'createStickyNote',
        arguments: { text: 'Hello' },
      };

      const result = await aiTools.executeTool(toolCall, mockBoardService);

      expect(result.success).toBe(true);
      expect(mockBoardService.createObject).toHaveBeenCalled();
    });

    it('should return error for unknown tool', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'unknownTool',
        arguments: {},
      };

      const result = await aiTools.executeTool(toolCall, mockBoardService);

      expect(result.success).toBe(false);
    });
  });

  describe('registerTool', () => {
    it('should register a custom tool', () => {
      const customSchema = {
        name: 'customTool',
        description: 'A custom tool',
        parameters: [],
      };
      const customExecutor = jest.fn().mockResolvedValue({
        success: true,
        message: 'Custom done',
        toolCalls: [],
      });

      aiTools.registerTool(customSchema, customExecutor);

      expect(aiTools.hasTool('customTool')).toBe(true);
      expect(aiTools.getSchema('customTool')).toEqual(customSchema);
    });

    it('should execute registered custom tool', async () => {
      const customSchema = {
        name: 'customTool',
        description: 'A custom tool',
        parameters: [],
      };
      const customExecutor = jest.fn().mockResolvedValue({
        success: true,
        message: 'Custom executed',
        toolCalls: [],
      });

      aiTools.registerTool(customSchema, customExecutor);

      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'customTool',
        arguments: {},
      };

      const result = await aiTools.executeTool(toolCall, mockBoardService);

      expect(result.success).toBe(true);
      expect(customExecutor).toHaveBeenCalled();
    });
  });
});

describe('defaultAITools', () => {
  it('should be an AITools instance', () => {
    expect(defaultAITools).toBeInstanceOf(AITools);
  });

  it('should have all built-in tools', () => {
    expect(defaultAITools.hasTool('createStickyNote')).toBe(true);
    expect(defaultAITools.hasTool('deleteObjects')).toBe(true);
  });
});
