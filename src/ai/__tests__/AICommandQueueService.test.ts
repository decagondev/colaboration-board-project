/**
 * Unit tests for AICommandQueueService.
 *
 * Tests the Firebase RTDB-based command queue service including
 * enqueueing, status updates, subscriptions, and error handling.
 */

import {
  ref,
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  remove,
  DataSnapshot,
  Database,
} from 'firebase/database';
import { AICommandQueueService } from '../services/AICommandQueueService';
import type { CommandQueueStatus } from '../interfaces/IAICommandQueue';

jest.mock('firebase/database');
jest.mock('@shared/config/firebase', () => ({
  database: {},
}));

const mockRef = ref as jest.MockedFunction<typeof ref>;
const mockPush = push as jest.MockedFunction<typeof push>;
const mockSet = set as jest.MockedFunction<typeof set>;
const mockGet = get as jest.MockedFunction<typeof get>;
const mockUpdate = update as jest.MockedFunction<typeof update>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockOrderByChild = orderByChild as jest.MockedFunction<
  typeof orderByChild
>;
const mockEqualTo = equalTo as jest.MockedFunction<typeof equalTo>;
const mockLimitToLast = limitToLast as jest.MockedFunction<typeof limitToLast>;
const mockOnValue = onValue as jest.MockedFunction<typeof onValue>;
const mockRemove = remove as jest.MockedFunction<typeof remove>;

/**
 * Creates a mock DataSnapshot for testing.
 *
 * @param val - Value to return from val()
 * @param key - Key for the snapshot
 * @returns Mock DataSnapshot
 */
function createMockSnapshot(
  val: unknown,
  key: string | null = null
): DataSnapshot {
  return {
    exists: () => val !== null,
    val: () => val,
    key,
    forEach: (callback: (child: DataSnapshot) => boolean | void) => {
      if (val && typeof val === 'object') {
        for (const [childKey, childVal] of Object.entries(
          val as Record<string, unknown>
        )) {
          const childSnapshot = createMockSnapshot(childVal, childKey);
          if (callback(childSnapshot) === true) {
            return true;
          }
        }
      }
      return false;
    },
  } as DataSnapshot;
}

describe('AICommandQueueService', () => {
  let service: AICommandQueueService;
  const mockDatabase = {} as Database;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AICommandQueueService(mockDatabase);

    mockRef.mockReturnValue({} as never);
    mockQuery.mockReturnValue({} as never);
    mockOrderByChild.mockReturnValue({} as never);
    mockEqualTo.mockReturnValue({} as never);
    mockLimitToLast.mockReturnValue({} as never);
  });

  describe('constructor', () => {
    it('creates service with database reference', () => {
      expect(service).toBeInstanceOf(AICommandQueueService);
    });
  });

  describe('enqueue', () => {
    it('adds a command to the queue and returns the command ID', async () => {
      const mockCommandRef = { key: 'cmd-123' };
      mockPush.mockReturnValue(mockCommandRef as never);
      mockSet.mockResolvedValue(undefined);

      const result = await service.enqueue(
        'board-1',
        'user-1',
        'Create a sticky note'
      );

      expect(mockRef).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(result).toBe('cmd-123');
    });

    it('throws AICommandQueueError when push returns null key', async () => {
      mockPush.mockReturnValue({ key: null } as never);

      await expect(
        service.enqueue('board-1', 'user-1', 'Create a note')
      ).rejects.toThrow('Failed to generate command ID');
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockPush.mockReturnValue({ key: 'cmd-123' } as never);
      mockSet.mockRejectedValue(new Error('Firebase error'));

      await expect(
        service.enqueue('board-1', 'user-1', 'Create a note')
      ).rejects.toThrow('Failed to enqueue command');
    });
  });

  describe('updateStatus', () => {
    it('updates the status of a command', async () => {
      mockUpdate.mockResolvedValue(undefined);

      await service.updateStatus('board-1', 'cmd-123', 'processing');

      expect(mockRef).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        status: 'processing',
        startedAt: expect.any(Number),
      });
    });

    it('does not add startedAt for non-processing status', async () => {
      mockUpdate.mockResolvedValue(undefined);

      await service.updateStatus('board-1', 'cmd-123', 'pending');

      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        status: 'pending',
      });
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockUpdate.mockRejectedValue(new Error('Firebase error'));

      await expect(
        service.updateStatus('board-1', 'cmd-123', 'processing')
      ).rejects.toThrow('Failed to update command status');
    });
  });

  describe('complete', () => {
    it('marks a command as completed with result', async () => {
      mockUpdate.mockResolvedValue(undefined);
      const toolCalls = [{ name: 'createStickyNote', arguments: { text: 'test' } }];

      await service.complete('board-1', 'cmd-123', toolCalls);

      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        status: 'completed',
        result: toolCalls,
        completedAt: expect.any(Number),
      });
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockUpdate.mockRejectedValue(new Error('Firebase error'));

      await expect(
        service.complete('board-1', 'cmd-123', [])
      ).rejects.toThrow('Failed to complete command');
    });
  });

  describe('fail', () => {
    it('marks a command as failed with error message', async () => {
      mockUpdate.mockResolvedValue(undefined);

      await service.fail('board-1', 'cmd-123', 'Something went wrong');

      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), {
        status: 'failed',
        error: 'Something went wrong',
        completedAt: expect.any(Number),
      });
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockUpdate.mockRejectedValue(new Error('Firebase error'));

      await expect(
        service.fail('board-1', 'cmd-123', 'Error message')
      ).rejects.toThrow('Failed to mark command as failed');
    });
  });

  describe('getCommand', () => {
    it('retrieves a specific command by ID', async () => {
      const commandData = {
        boardId: 'board-1',
        input: 'Create a note',
        userId: 'user-1',
        status: 'pending' as CommandQueueStatus,
        createdAt: 1000,
      };
      mockGet.mockResolvedValue(createMockSnapshot(commandData, 'cmd-123'));

      const result = await service.getCommand('board-1', 'cmd-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cmd-123');
      expect(result?.input).toBe('Create a note');
    });

    it('returns null when command does not exist', async () => {
      mockGet.mockResolvedValue(createMockSnapshot(null));

      const result = await service.getCommand('board-1', 'nonexistent');

      expect(result).toBeNull();
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockGet.mockRejectedValue(new Error('Firebase error'));

      await expect(service.getCommand('board-1', 'cmd-123')).rejects.toThrow(
        'Failed to get command'
      );
    });
  });

  describe('getCommands', () => {
    it('retrieves all commands for a board', async () => {
      const commandsData = {
        'cmd-1': {
          boardId: 'board-1',
          input: 'Command 1',
          userId: 'user-1',
          status: 'completed',
          createdAt: 1000,
        },
        'cmd-2': {
          boardId: 'board-1',
          input: 'Command 2',
          userId: 'user-2',
          status: 'pending',
          createdAt: 2000,
        },
      };
      mockGet.mockResolvedValue(createMockSnapshot(commandsData));

      const result = await service.getCommands('board-1');

      expect(result).toHaveLength(2);
    });

    it('returns empty array when no commands exist', async () => {
      mockGet.mockResolvedValue(createMockSnapshot(null));

      const result = await service.getCommands('board-1');

      expect(result).toEqual([]);
    });

    it('filters commands by status', async () => {
      const commandsData = {
        'cmd-1': {
          boardId: 'board-1',
          input: 'Command 1',
          status: 'pending',
          createdAt: 1000,
        },
        'cmd-2': {
          boardId: 'board-1',
          input: 'Command 2',
          status: 'completed',
          createdAt: 2000,
        },
      };
      mockGet.mockResolvedValue(createMockSnapshot(commandsData));

      const result = await service.getCommands('board-1', {
        statusFilter: ['pending'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('limits number of commands returned via options', async () => {
      const commandsData = {
        'cmd-1': {
          boardId: 'board-1',
          input: 'Command 1',
          status: 'completed',
          createdAt: 1000,
        },
        'cmd-2': {
          boardId: 'board-1',
          input: 'Command 2',
          status: 'completed',
          createdAt: 2000,
        },
      };
      mockGet.mockResolvedValue(createMockSnapshot(commandsData));

      await service.getCommands('board-1', { limit: 10 });

      expect(mockLimitToLast).toHaveBeenCalledWith(10);
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockGet.mockRejectedValue(new Error('Firebase error'));

      await expect(service.getCommands('board-1')).rejects.toThrow(
        'Failed to get commands'
      );
    });
  });

  describe('getProcessingCommand', () => {
    it('returns the currently processing command', async () => {
      const commandData = {
        boardId: 'board-1',
        input: 'Processing command',
        status: 'processing',
        createdAt: 1000,
        startedAt: 2000,
      };
      const snapshotData = { 'cmd-processing': commandData };
      mockGet.mockResolvedValue(createMockSnapshot(snapshotData));

      const result = await service.getProcessingCommand('board-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('processing');
    });

    it('returns null when no command is processing', async () => {
      mockGet.mockResolvedValue(createMockSnapshot(null));

      const result = await service.getProcessingCommand('board-1');

      expect(result).toBeNull();
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockGet.mockRejectedValue(new Error('Firebase error'));

      await expect(service.getProcessingCommand('board-1')).rejects.toThrow(
        'Failed to get processing command'
      );
    });
  });

  describe('subscribe', () => {
    it('subscribes to command updates and returns unsubscribe function', () => {
      const mockUnsubscribe = jest.fn();
      mockOnValue.mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = service.subscribe('board-1', callback);

      expect(mockOnValue).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('calls callback with commands when snapshot changes', () => {
      const commandsData = {
        'cmd-1': {
          boardId: 'board-1',
          input: 'Test command',
          status: 'pending',
          createdAt: 1000,
        },
      };

      mockOnValue.mockImplementation((_, callback) => {
        const typedCallback = callback as (snapshot: DataSnapshot) => void;
        typedCallback(createMockSnapshot(commandsData));
        return jest.fn();
      });

      const callback = jest.fn();
      service.subscribe('board-1', callback);

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'cmd-1',
            input: 'Test command',
          }),
        ])
      );
    });

    it('calls callback with empty array when no commands exist', () => {
      mockOnValue.mockImplementation((_, callback) => {
        const typedCallback = callback as (snapshot: DataSnapshot) => void;
        typedCallback(createMockSnapshot(null));
        return jest.fn();
      });

      const callback = jest.fn();
      service.subscribe('board-1', callback);

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe('subscribeToCommand', () => {
    it('subscribes to a specific command updates', () => {
      const mockUnsubscribe = jest.fn();
      mockOnValue.mockReturnValue(mockUnsubscribe);

      const callback = jest.fn();
      const unsubscribe = service.subscribeToCommand(
        'board-1',
        'cmd-123',
        callback
      );

      expect(mockOnValue).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('calls callback with command when snapshot changes', () => {
      const commandData = {
        boardId: 'board-1',
        input: 'Test command',
        status: 'processing',
        createdAt: 1000,
        startedAt: 2000,
      };

      mockOnValue.mockImplementation((_, callback) => {
        const typedCallback = callback as (snapshot: DataSnapshot) => void;
        typedCallback(createMockSnapshot(commandData, 'cmd-123'));
        return jest.fn();
      });

      const callback = jest.fn();
      service.subscribeToCommand('board-1', 'cmd-123', callback);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'cmd-123',
          status: 'processing',
        })
      );
    });

    it('calls callback with null when command does not exist', () => {
      mockOnValue.mockImplementation((_, callback) => {
        const typedCallback = callback as (snapshot: DataSnapshot) => void;
        typedCallback(createMockSnapshot(null));
        return jest.fn();
      });

      const callback = jest.fn();
      service.subscribeToCommand('board-1', 'cmd-123', callback);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('isProcessing', () => {
    it('returns true when a command is processing', async () => {
      const commandData = {
        boardId: 'board-1',
        input: 'Processing',
        status: 'processing',
        createdAt: 1000,
        startedAt: 2000,
      };
      const snapshotData = { 'cmd-1': commandData };
      mockGet.mockResolvedValue(createMockSnapshot(snapshotData));

      const result = await service.isProcessing('board-1');

      expect(result).toBe(true);
    });

    it('returns false when no command is processing', async () => {
      mockGet.mockResolvedValue(createMockSnapshot(null));

      const result = await service.isProcessing('board-1');

      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes commands older than specified time', async () => {
      const now = Date.now();
      const oldTime = now - 25 * 60 * 60 * 1000;
      const commandsData = {
        'cmd-old': {
          boardId: 'board-1',
          input: 'Old command',
          status: 'completed',
          createdAt: oldTime,
          completedAt: oldTime,
        },
        'cmd-new': {
          boardId: 'board-1',
          input: 'New command',
          status: 'completed',
          createdAt: now,
          completedAt: now,
        },
      };
      mockGet.mockResolvedValue(createMockSnapshot(commandsData));
      mockRemove.mockResolvedValue(undefined);

      const deleted = await service.cleanup('board-1', 24 * 60 * 60 * 1000);

      expect(deleted).toBe(1);
      expect(mockRemove).toHaveBeenCalledTimes(1);
    });

    it('returns 0 when no commands to clean up', async () => {
      mockGet.mockResolvedValue(createMockSnapshot(null));

      const deleted = await service.cleanup('board-1', 24 * 60 * 60 * 1000);

      expect(deleted).toBe(0);
    });

    it('throws AICommandQueueError on Firebase error', async () => {
      mockGet.mockRejectedValue(new Error('Firebase error'));

      await expect(
        service.cleanup('board-1', 24 * 60 * 60 * 1000)
      ).rejects.toThrow('Failed to cleanup commands');
    });
  });
});
