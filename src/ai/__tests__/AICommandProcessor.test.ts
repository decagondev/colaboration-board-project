/**
 * Unit tests for AICommandProcessor.
 *
 * Tests the sequential processing of commands from the queue.
 */

import { AICommandProcessor } from '../services/AICommandProcessor';
import type { AICommandProcessorConfig, ProcessingResult } from '../services/AICommandProcessor';
import type { IAIService, IBoardStateService, AICommandResult, ToolCall } from '../interfaces/IAIService';
import type { IAICommandQueue, QueuedCommand, CommandQueueStatus, QueueCallback } from '../interfaces/IAICommandQueue';
import type { Unsubscribe } from '@shared/types';

describe('AICommandProcessor', () => {
  let mockAIService: jest.Mocked<IAIService>;
  let mockBoardService: jest.Mocked<IBoardStateService>;
  let mockQueueService: jest.Mocked<IAICommandQueue>;
  let processor: AICommandProcessor;
  let capturedCallback: QueueCallback | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedCallback = null;

    mockAIService = {
      processCommand: jest.fn(),
      executeTool: jest.fn(),
      getAvailableTools: jest.fn(),
      isReady: jest.fn().mockReturnValue(true),
    };

    mockBoardService = {
      createObject: jest.fn(),
      updateObject: jest.fn(),
      deleteObject: jest.fn(),
      getObject: jest.fn(),
      getAllObjects: jest.fn(),
    };

    mockQueueService = {
      enqueue: jest.fn(),
      updateStatus: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
      getCommand: jest.fn(),
      getCommands: jest.fn(),
      getProcessingCommand: jest.fn(),
      subscribe: jest.fn((boardId, callback, options) => {
        capturedCallback = callback;
        return jest.fn();
      }),
      subscribeToCommand: jest.fn(),
      isProcessing: jest.fn(),
      cleanup: jest.fn(),
    };

    const config: AICommandProcessorConfig = {
      aiService: mockAIService,
      boardService: mockBoardService,
      queueService: mockQueueService,
      processingDelay: 0,
    };

    processor = new AICommandProcessor(config);
  });

  afterEach(() => {
    processor.stop();
  });

  describe('constructor', () => {
    it('creates processor with config', () => {
      expect(processor).toBeInstanceOf(AICommandProcessor);
    });
  });

  describe('start', () => {
    it('subscribes to the queue for pending commands', () => {
      processor.start('board-1');

      expect(mockQueueService.subscribe).toHaveBeenCalledWith(
        'board-1',
        expect.any(Function),
        { statusFilter: ['pending'] }
      );
    });

    it('returns an unsubscribe function', () => {
      const unsubscribe = processor.start('board-1');

      expect(typeof unsubscribe).toBe('function');
    });

    it('sets isActive to true', () => {
      processor.start('board-1');

      expect(processor.isActive()).toBe(true);
    });

    it('stops previous subscription when starting with a different board', () => {
      const mockUnsubscribe1 = jest.fn();
      mockQueueService.subscribe.mockReturnValueOnce(mockUnsubscribe1);

      processor.start('board-1');
      processor.start('board-2');

      expect(mockUnsubscribe1).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('unsubscribes from the queue', () => {
      const mockUnsubscribe = jest.fn();
      mockQueueService.subscribe.mockReturnValue(mockUnsubscribe);

      processor.start('board-1');
      processor.stop();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('sets isActive to false', () => {
      processor.start('board-1');
      processor.stop();

      expect(processor.isActive()).toBe(false);
    });
  });

  describe('isActive', () => {
    it('returns false initially', () => {
      expect(processor.isActive()).toBe(false);
    });

    it('returns true when running', () => {
      processor.start('board-1');

      expect(processor.isActive()).toBe(true);
    });

    it('returns false after stopping', () => {
      processor.start('board-1');
      processor.stop();

      expect(processor.isActive()).toBe(false);
    });
  });

  describe('command processing', () => {
    const mockCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'pending',
      createdAt: Date.now(),
    };

    const mockToolCall: ToolCall = {
      name: 'createStickyNote',
      arguments: { text: 'Test note' },
    };

    it('processes pending commands from the queue', async () => {
      mockAIService.processCommand.mockResolvedValue({
        success: true,
        message: 'Created sticky note',
        toolCalls: [mockToolCall],
      });

      processor.start('board-1');

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueueService.updateStatus).toHaveBeenCalledWith(
        'board-1',
        'cmd-1',
        'processing'
      );
      expect(mockAIService.processCommand).toHaveBeenCalledWith(
        'Create a sticky note'
      );
    });

    it('marks command as completed on success', async () => {
      mockAIService.processCommand.mockResolvedValue({
        success: true,
        message: 'Created sticky note',
        toolCalls: [mockToolCall],
      });

      processor.start('board-1');

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockQueueService.complete).toHaveBeenCalledWith(
        'board-1',
        'cmd-1',
        [mockToolCall]
      );
    });

    it('marks command as failed on AI error', async () => {
      mockAIService.processCommand.mockResolvedValue({
        success: false,
        message: 'Failed',
        errors: ['Invalid command'],
      });

      processor.start('board-1');

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueueService.fail).toHaveBeenCalledWith(
        'board-1',
        'cmd-1',
        'Invalid command'
      );
    });

    it('marks command as failed on exception', async () => {
      mockAIService.processCommand.mockRejectedValue(new Error('Network error'));

      processor.start('board-1');

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueueService.fail).toHaveBeenCalledWith(
        'board-1',
        'cmd-1',
        'Network error'
      );
    });

    it('processes commands in order (oldest first)', async () => {
      const oldCommand: QueuedCommand = {
        ...mockCommand,
        id: 'cmd-old',
        createdAt: 1000,
      };
      const newCommand: QueuedCommand = {
        ...mockCommand,
        id: 'cmd-new',
        createdAt: 2000,
      };

      mockAIService.processCommand.mockResolvedValue({
        success: true,
        message: 'Done',
        toolCalls: [],
      });

      processor.start('board-1');

      if (capturedCallback) {
        await capturedCallback([newCommand, oldCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueueService.updateStatus).toHaveBeenCalledWith(
        'board-1',
        'cmd-old',
        'processing'
      );
    });

    it('calls onComplete callback with results', async () => {
      const onComplete = jest.fn();
      mockAIService.processCommand.mockResolvedValue({
        success: true,
        message: 'Done',
        toolCalls: [mockToolCall],
      });

      processor.start('board-1', onComplete);

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          command: mockCommand,
          success: true,
          toolCalls: [mockToolCall],
        })
      );
    });

    it('calls onComplete callback with error on failure', async () => {
      const onComplete = jest.fn();
      mockAIService.processCommand.mockResolvedValue({
        success: false,
        message: 'Failed',
        errors: ['Something went wrong'],
      });

      processor.start('board-1', onComplete);

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          command: mockCommand,
          success: false,
          error: 'Something went wrong',
        })
      );
    });

    it('ignores commands when not running', async () => {
      processor.start('board-1');
      processor.stop();

      if (capturedCallback) {
        await capturedCallback([mockCommand]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueueService.updateStatus).not.toHaveBeenCalled();
    });

    it('ignores empty command arrays', async () => {
      processor.start('board-1');

      if (capturedCallback) {
        await capturedCallback([]);
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueueService.updateStatus).not.toHaveBeenCalled();
    });

    it('does not process if already processing a command', async () => {
      let resolveFirst: ((value: AICommandResult) => void) | null = null;
      const processingPromise = new Promise<AICommandResult>((resolve) => {
        resolveFirst = resolve;
      });

      mockAIService.processCommand.mockReturnValueOnce(processingPromise);

      processor.start('board-1');

      const command1: QueuedCommand = { ...mockCommand, id: 'cmd-1' };
      const command2: QueuedCommand = { ...mockCommand, id: 'cmd-2' };

      if (capturedCallback) {
        capturedCallback([command1]);
        await new Promise((resolve) => setTimeout(resolve, 20));
        capturedCallback([command1, command2]);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      expect(mockQueueService.updateStatus).toHaveBeenCalledTimes(1);
      expect(mockQueueService.updateStatus).toHaveBeenCalledWith(
        'board-1',
        'cmd-1',
        'processing'
      );

      if (resolveFirst) {
        resolveFirst({
          success: true,
          message: 'Done',
          toolCalls: [],
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    });
  });
});
