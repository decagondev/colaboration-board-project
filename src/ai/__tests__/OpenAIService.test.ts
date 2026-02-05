/**
 * OpenAIService Unit Tests
 */

import { OpenAIService } from '../services/OpenAIService';
import { AIServiceError } from '../interfaces/IAIService';
import type { IBoardStateService, ToolCall } from '../interfaces/IAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('AIServiceError', () => {
  it('should create an error with message and code', () => {
    const error = new AIServiceError('Test error', 'TEST_CODE');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('AIServiceError');
  });

  it('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new AIServiceError('Test error', 'TEST_CODE', cause);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.cause).toBe(cause);
  });
});

describe('OpenAIService', () => {
  describe('constructor', () => {
    it('should throw AIServiceError when API key is missing', () => {
      expect(() => {
        new OpenAIService({ apiKey: '' });
      }).toThrow(AIServiceError);
    });

    it('should throw with MISSING_API_KEY code', () => {
      try {
        new OpenAIService({ apiKey: '' });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).code).toBe('MISSING_API_KEY');
      }
    });

    it('should create service with valid API key', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      expect(service).toBeDefined();
      expect(service.isReady()).toBe(true);
    });

    it('should use default config values', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      expect(service.isReady()).toBe(true);
    });

    it('should accept custom config', () => {
      const service = new OpenAIService({
        apiKey: 'test-api-key',
        model: 'gpt-4',
        maxTokens: 2048,
        temperature: 0.5,
      });
      expect(service.isReady()).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return true when configured', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      expect(service.isReady()).toBe(true);
    });
  });

  describe('getAvailableTools', () => {
    it('should return array of tool definitions', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      const tools = service.getAvailableTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should include createStickyNote tool', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      const tools = service.getAvailableTools();

      const stickyNoteTool = tools.find((t) => t.name === 'createStickyNote');
      expect(stickyNoteTool).toBeDefined();
      expect(stickyNoteTool?.description).toContain('sticky note');
    });

    it('should include createShape tool', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      const tools = service.getAvailableTools();

      const shapeTool = tools.find((t) => t.name === 'createShape');
      expect(shapeTool).toBeDefined();
      expect(shapeTool?.parameters.some((p) => p.name === 'shapeType')).toBe(
        true
      );
    });

    it('should include all expected tools', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      const tools = service.getAvailableTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain('createStickyNote');
      expect(toolNames).toContain('createShape');
      expect(toolNames).toContain('createText');
      expect(toolNames).toContain('getBoardState');
      expect(toolNames).toContain('moveObjects');
      expect(toolNames).toContain('resizeObjects');
      expect(toolNames).toContain('changeColor');
      expect(toolNames).toContain('deleteObjects');
    });

    it('should return a copy of tools array', () => {
      const service = new OpenAIService({ apiKey: 'test-api-key' });
      const tools1 = service.getAvailableTools();
      const tools2 = service.getAvailableTools();

      expect(tools1).not.toBe(tools2);
      expect(tools1).toEqual(tools2);
    });
  });

  describe('executeTool', () => {
    let service: OpenAIService;
    let mockBoardService: IBoardStateService;
    let mockObjects: SyncableObject[];

    beforeEach(() => {
      service = new OpenAIService({ apiKey: 'test-api-key' });

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

    it('should return error for unknown tool', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'unknownTool',
        arguments: {},
      };

      const result = await service.executeTool(toolCall, mockBoardService);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Tool "unknownTool" is not registered');
    });

    describe('createStickyNote', () => {
      it('should create a sticky note with text', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createStickyNote',
          arguments: { text: 'Hello World' },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Hello World');
        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sticky-note',
            data: expect.objectContaining({
              text: 'Hello World',
            }),
          })
        );
      });

      it('should use custom position and color', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createStickyNote',
          arguments: { text: 'Test', x: 300, y: 400, color: '#ff0000' },
        };

        await service.executeTool(toolCall, mockBoardService);

        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            x: 300,
            y: 400,
            data: expect.objectContaining({
              color: '#ff0000',
            }),
          })
        );
      });

      it('should return affected object IDs', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createStickyNote',
          arguments: { text: 'Test' },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.affectedObjects).toContain('new-obj-id');
      });
    });

    describe('createShape', () => {
      it('should create a rectangle shape', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createShape',
          arguments: { shapeType: 'rectangle' },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'shape',
            data: expect.objectContaining({
              shapeType: 'rectangle',
            }),
          })
        );
      });

      it('should create an ellipse with custom dimensions', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createShape',
          arguments: { shapeType: 'ellipse', width: 300, height: 200 },
        };

        await service.executeTool(toolCall, mockBoardService);

        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            width: 300,
            height: 200,
          })
        );
      });
    });

    describe('createText', () => {
      it('should create a text element', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createText',
          arguments: { text: 'Hello' },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text',
            data: expect.objectContaining({
              text: 'Hello',
            }),
          })
        );
      });

      it('should use custom font size', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createText',
          arguments: { text: 'Large', fontSize: 32 },
        };

        await service.executeTool(toolCall, mockBoardService);

        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              fontSize: 32,
            }),
          })
        );
      });
    });

    describe('getBoardState', () => {
      it('should return board state summary', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'getBoardState',
          arguments: {},
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(result.message).toContain('1 objects');
        expect(mockBoardService.getObjects).toHaveBeenCalled();
      });

      it('should handle empty board', async () => {
        (mockBoardService.getObjects as jest.Mock).mockReturnValue([]);

        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'getBoardState',
          arguments: {},
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(result.message).toContain('empty');
      });
    });

    describe('moveObjects', () => {
      it('should move objects by delta', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'moveObjects',
          arguments: { objectIds: ['obj-1'], deltaX: 50, deltaY: 100 },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledWith('obj-1', {
          x: 150,
          y: 200,
        });
      });

      it('should skip non-existent objects', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'moveObjects',
          arguments: {
            objectIds: ['obj-1', 'non-existent'],
            deltaX: 50,
            deltaY: 100,
          },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledTimes(1);
      });
    });

    describe('resizeObjects', () => {
      it('should resize objects to new dimensions', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'resizeObjects',
          arguments: { objectIds: ['obj-1'], width: 300, height: 250 },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledWith('obj-1', {
          width: 300,
          height: 250,
        });
      });
    });

    describe('changeColor', () => {
      it('should change object color', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'changeColor',
          arguments: { objectIds: ['obj-1'], color: '#ff0000' },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledWith('obj-1', {
          data: expect.objectContaining({
            color: '#ff0000',
          }),
        });
      });
    });

    describe('deleteObjects', () => {
      it('should delete specified objects', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'deleteObjects',
          arguments: { objectIds: ['obj-1'] },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.deleteObjects).toHaveBeenCalledWith(['obj-1']);
      });

      it('should report deleted count in message', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'deleteObjects',
          arguments: { objectIds: ['obj-1', 'obj-2'] },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.message).toContain('2 object');
      });
    });

    describe('error handling', () => {
      it('should handle execution errors gracefully', async () => {
        (mockBoardService.createObject as jest.Mock).mockRejectedValue(
          new Error('Database error')
        );

        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createStickyNote',
          arguments: { text: 'Test' },
        };

        const result = await service.executeTool(toolCall, mockBoardService);

        expect(result.success).toBe(false);
        expect(result.errors).toContain('Database error');
      });
    });
  });

  describe('processCommand', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return empty array when no tool calls', async () => {
      const OpenAI = require('openai').default;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'I cannot help with that.',
            },
          },
        ],
      });
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const newService = new OpenAIService({ apiKey: 'test-api-key' });
      const result = await newService.processCommand('What is 2+2?', []);

      expect(result).toEqual([]);
    });

    it('should parse tool calls from response', async () => {
      const OpenAI = require('openai').default;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'createStickyNote',
                    arguments: '{"text":"Hello","color":"#ff0000"}',
                  },
                },
              ],
            },
          },
        ],
      });
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const newService = new OpenAIService({ apiKey: 'test-api-key' });
      const result = await newService.processCommand(
        'Create a red sticky note that says Hello',
        []
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('call_123');
      expect(result[0].name).toBe('createStickyNote');
      expect(result[0].arguments).toEqual({ text: 'Hello', color: '#ff0000' });
    });

    it('should handle multiple tool calls', async () => {
      const OpenAI = require('openai').default;
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: 'assistant',
              tool_calls: [
                {
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'createStickyNote',
                    arguments: '{"text":"Note 1"}',
                  },
                },
                {
                  id: 'call_2',
                  type: 'function',
                  function: {
                    name: 'createStickyNote',
                    arguments: '{"text":"Note 2"}',
                  },
                },
              ],
            },
          },
        ],
      });
      OpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      }));

      const newService = new OpenAIService({ apiKey: 'test-api-key' });
      const result = await newService.processCommand('Create two notes', []);

      expect(result).toHaveLength(2);
    });
  });
});

describe('IAIService interface', () => {
  it('should define all required methods', () => {
    const mockAIService = {
      processCommand: jest.fn(),
      executeTool: jest.fn(),
      getAvailableTools: jest.fn(),
      isReady: jest.fn(),
    };

    expect(mockAIService.processCommand).toBeDefined();
    expect(mockAIService.executeTool).toBeDefined();
    expect(mockAIService.getAvailableTools).toBeDefined();
    expect(mockAIService.isReady).toBeDefined();
  });
});

describe('IBoardStateService interface', () => {
  it('should define all required methods', () => {
    const mockBoardService = {
      getObjects: jest.fn(),
      getObject: jest.fn(),
      createObject: jest.fn(),
      updateObject: jest.fn(),
      deleteObject: jest.fn(),
      deleteObjects: jest.fn(),
    };

    expect(mockBoardService.getObjects).toBeDefined();
    expect(mockBoardService.getObject).toBeDefined();
    expect(mockBoardService.createObject).toBeDefined();
    expect(mockBoardService.updateObject).toBeDefined();
    expect(mockBoardService.deleteObject).toBeDefined();
    expect(mockBoardService.deleteObjects).toBeDefined();
  });
});
