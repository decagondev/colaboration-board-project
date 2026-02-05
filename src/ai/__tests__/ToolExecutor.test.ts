/**
 * Tool Executor Unit Tests
 */

import {
  ToolExecutorRegistry,
  defaultToolExecutorRegistry,
} from '../tools/executors';
import type { IBoardStateService, ToolCall } from '../interfaces/IAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';

describe('ToolExecutorRegistry', () => {
  let registry: ToolExecutorRegistry;
  let mockBoardService: IBoardStateService;
  let mockObjects: SyncableObject[];

  beforeEach(() => {
    registry = new ToolExecutorRegistry();

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
    it('should register all built-in executors', () => {
      expect(registry.has('createStickyNote')).toBe(true);
      expect(registry.has('createShape')).toBe(true);
      expect(registry.has('createText')).toBe(true);
      expect(registry.has('getBoardState')).toBe(true);
      expect(registry.has('moveObjects')).toBe(true);
      expect(registry.has('resizeObjects')).toBe(true);
      expect(registry.has('changeColor')).toBe(true);
      expect(registry.has('deleteObjects')).toBe(true);
    });
  });

  describe('register', () => {
    it('should register a custom executor', () => {
      const customExecutor = jest.fn().mockResolvedValue({
        success: true,
        message: 'Custom executed',
        toolCalls: [],
      });

      registry.register('customTool', customExecutor);
      expect(registry.has('customTool')).toBe(true);
    });
  });

  describe('get', () => {
    it('should return executor for registered tool', () => {
      const executor = registry.get('createStickyNote');
      expect(executor).toBeDefined();
      expect(typeof executor).toBe('function');
    });

    it('should return undefined for unregistered tool', () => {
      const executor = registry.get('nonExistentTool');
      expect(executor).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for registered tool', () => {
      expect(registry.has('createStickyNote')).toBe(true);
    });

    it('should return false for unregistered tool', () => {
      expect(registry.has('nonExistentTool')).toBe(false);
    });
  });

  describe('getToolNames', () => {
    it('should return array of registered tool names', () => {
      const names = registry.getToolNames();
      expect(Array.isArray(names)).toBe(true);
      expect(names).toContain('createStickyNote');
      expect(names).toContain('deleteObjects');
    });
  });

  describe('execute', () => {
    it('should execute registered tool', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'createStickyNote',
        arguments: { text: 'Test' },
      };

      const result = await registry.execute(toolCall, mockBoardService);

      expect(result.success).toBe(true);
      expect(mockBoardService.createObject).toHaveBeenCalled();
    });

    it('should return error for unregistered tool', async () => {
      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'unknownTool',
        arguments: {},
      };

      const result = await registry.execute(toolCall, mockBoardService);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Tool "unknownTool" is not registered');
    });

    it('should handle execution errors', async () => {
      (mockBoardService.createObject as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const toolCall: ToolCall = {
        id: 'call-1',
        name: 'createStickyNote',
        arguments: { text: 'Test' },
      };

      const result = await registry.execute(toolCall, mockBoardService);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Database error');
    });
  });

  describe('tool executions', () => {
    describe('createStickyNote', () => {
      it('should create sticky note with defaults', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createStickyNote',
          arguments: { text: 'Hello' },
        };

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'sticky-note',
            x: 200,
            y: 200,
            data: expect.objectContaining({
              text: 'Hello',
              color: '#fef08a',
            }),
          })
        );
      });
    });

    describe('createShape', () => {
      it('should create shape with type', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createShape',
          arguments: { shapeType: 'rectangle' },
        };

        const result = await registry.execute(toolCall, mockBoardService);

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
    });

    describe('createText', () => {
      it('should create text element', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'createText',
          arguments: { text: 'Title' },
        };

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.createObject).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text',
            data: expect.objectContaining({
              text: 'Title',
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

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(result.message).toContain('1 objects');
      });
    });

    describe('moveObjects', () => {
      it('should move objects by delta', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'moveObjects',
          arguments: { objectIds: ['obj-1'], deltaX: 50, deltaY: 50 },
        };

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledWith('obj-1', {
          x: 150,
          y: 150,
        });
      });
    });

    describe('resizeObjects', () => {
      it('should resize objects', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'resizeObjects',
          arguments: { objectIds: ['obj-1'], width: 300, height: 200 },
        };

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledWith('obj-1', {
          width: 300,
          height: 200,
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

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.updateObject).toHaveBeenCalledWith(
          'obj-1',
          expect.objectContaining({
            data: expect.objectContaining({
              color: '#ff0000',
            }),
          })
        );
      });
    });

    describe('deleteObjects', () => {
      it('should delete objects', async () => {
        const toolCall: ToolCall = {
          id: 'call-1',
          name: 'deleteObjects',
          arguments: { objectIds: ['obj-1'] },
        };

        const result = await registry.execute(toolCall, mockBoardService);

        expect(result.success).toBe(true);
        expect(mockBoardService.deleteObjects).toHaveBeenCalledWith(['obj-1']);
      });
    });
  });
});

describe('defaultToolExecutorRegistry', () => {
  it('should be a ToolExecutorRegistry instance', () => {
    expect(defaultToolExecutorRegistry).toBeInstanceOf(ToolExecutorRegistry);
  });

  it('should have all built-in tools registered', () => {
    expect(defaultToolExecutorRegistry.has('createStickyNote')).toBe(true);
    expect(defaultToolExecutorRegistry.has('deleteObjects')).toBe(true);
  });
});
