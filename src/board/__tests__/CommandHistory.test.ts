/**
 * Unit tests for CommandHistory service.
 */

import {
  CommandHistory,
  createCommandHistory,
} from '../services/CommandHistory';
import type { ICommand, CommandHistoryOptions } from '../interfaces/ICommand';

/**
 * Creates a mock command for testing.
 *
 * @param overrides - Properties to override on the mock command
 * @returns A mock ICommand implementation
 */
function createMockCommand(
  overrides: Partial<ICommand> & { id: string; type: string } = {
    id: 'test-cmd',
    type: 'create',
  }
): ICommand {
  return {
    id: overrides.id,
    type: overrides.type as ICommand['type'],
    description: overrides.description ?? 'Test command',
    timestamp: overrides.timestamp ?? Date.now(),
    executedBy: overrides.executedBy ?? 'test-user',
    execute: overrides.execute ?? jest.fn(),
    undo: overrides.undo ?? jest.fn(),
    canMergeWith: overrides.canMergeWith,
    mergeWith: overrides.mergeWith,
  };
}

describe('CommandHistory', () => {
  let commandHistory: CommandHistory;

  beforeEach(() => {
    commandHistory = new CommandHistory();
  });

  describe('initialization', () => {
    it('should create with default options', () => {
      expect(commandHistory.state.canUndo).toBe(false);
      expect(commandHistory.state.canRedo).toBe(false);
      expect(commandHistory.state.undoCount).toBe(0);
      expect(commandHistory.state.redoCount).toBe(0);
    });

    it('should create with custom options', () => {
      const options: CommandHistoryOptions = {
        maxHistorySize: 10,
        mergeTimeWindow: 500,
      };
      const customHistory = new CommandHistory(options);

      expect(customHistory.state.canUndo).toBe(false);
      expect(customHistory.state.canRedo).toBe(false);
    });

    it('should create using factory function', () => {
      const history = createCommandHistory();
      expect(history).toBeInstanceOf(CommandHistory);
    });
  });

  describe('execute', () => {
    it('should execute a command and add it to undo stack', () => {
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);

      expect(command.execute).toHaveBeenCalledTimes(1);
      expect(commandHistory.state.canUndo).toBe(true);
      expect(commandHistory.state.undoCount).toBe(1);
    });

    it('should clear redo stack when executing new command', () => {
      const command1 = createMockCommand({ id: 'cmd-1', type: 'create' });
      const command2 = createMockCommand({ id: 'cmd-2', type: 'create' });
      const command3 = createMockCommand({ id: 'cmd-3', type: 'create' });

      commandHistory.execute(command1);
      commandHistory.execute(command2);
      commandHistory.undo();

      expect(commandHistory.state.canRedo).toBe(true);

      commandHistory.execute(command3);

      expect(commandHistory.state.canRedo).toBe(false);
      expect(commandHistory.state.redoCount).toBe(0);
    });

    it('should respect maxHistorySize', () => {
      const smallHistory = new CommandHistory({ maxHistorySize: 3 });

      for (let i = 0; i < 5; i++) {
        smallHistory.execute(
          createMockCommand({ id: `cmd-${i}`, type: 'create' })
        );
      }

      expect(smallHistory.state.undoCount).toBe(3);
    });

    it('should notify listeners on execute', () => {
      const listener = jest.fn();
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.onChange(listener);
      commandHistory.execute(command);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          command,
          action: 'execute',
          state: expect.objectContaining({
            canUndo: true,
            canRedo: false,
          }),
        })
      );
    });
  });

  describe('command merging', () => {
    it('should merge commands within time window', () => {
      const baseTimestamp = Date.now();
      const mergedCommand = createMockCommand({
        id: 'merged',
        type: 'move',
        timestamp: baseTimestamp + 100,
      });

      const command1 = createMockCommand({
        id: 'cmd-1',
        type: 'move',
        timestamp: baseTimestamp,
        canMergeWith: jest.fn().mockReturnValue(true),
        mergeWith: jest.fn().mockReturnValue(mergedCommand),
      });

      const command2 = createMockCommand({
        id: 'cmd-2',
        type: 'move',
        timestamp: baseTimestamp + 100,
      });

      commandHistory.execute(command1);
      commandHistory.execute(command2);

      expect(command1.canMergeWith).toHaveBeenCalledWith(command2);
      expect(command1.mergeWith).toHaveBeenCalledWith(command2);
      expect(commandHistory.state.undoCount).toBe(1);
    });

    it('should not merge commands outside time window', () => {
      const history = new CommandHistory({ mergeTimeWindow: 100 });
      const baseTimestamp = Date.now();

      const command1 = createMockCommand({
        id: 'cmd-1',
        type: 'move',
        timestamp: baseTimestamp,
        canMergeWith: jest.fn().mockReturnValue(true),
        mergeWith: jest.fn(),
      });

      const command2 = createMockCommand({
        id: 'cmd-2',
        type: 'move',
        timestamp: baseTimestamp + 200,
      });

      history.execute(command1);
      history.execute(command2);

      expect(history.state.undoCount).toBe(2);
    });

    it('should not merge when canMergeWith returns false', () => {
      const command1 = createMockCommand({
        id: 'cmd-1',
        type: 'move',
        timestamp: Date.now(),
        canMergeWith: jest.fn().mockReturnValue(false),
        mergeWith: jest.fn(),
      });

      const command2 = createMockCommand({
        id: 'cmd-2',
        type: 'move',
        timestamp: Date.now(),
      });

      commandHistory.execute(command1);
      commandHistory.execute(command2);

      expect(command1.canMergeWith).toHaveBeenCalledWith(command2);
      expect(command1.mergeWith).not.toHaveBeenCalled();
      expect(commandHistory.state.undoCount).toBe(2);
    });
  });

  describe('undo', () => {
    it('should undo the last command', () => {
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      const undoneCommand = commandHistory.undo();

      expect(command.undo).toHaveBeenCalledTimes(1);
      expect(undoneCommand).toBe(command);
      expect(commandHistory.state.canUndo).toBe(false);
      expect(commandHistory.state.canRedo).toBe(true);
    });

    it('should return null when nothing to undo', () => {
      const result = commandHistory.undo();

      expect(result).toBeNull();
    });

    it('should move command to redo stack', () => {
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      commandHistory.undo();

      expect(commandHistory.state.undoCount).toBe(0);
      expect(commandHistory.state.redoCount).toBe(1);
    });

    it('should notify listeners on undo', () => {
      const listener = jest.fn();
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      commandHistory.onChange(listener);
      commandHistory.undo();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          command,
          action: 'undo',
          state: expect.objectContaining({
            canUndo: false,
            canRedo: true,
          }),
        })
      );
    });
  });

  describe('redo', () => {
    it('should redo the last undone command', () => {
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      commandHistory.undo();
      (command.execute as jest.Mock).mockClear();

      const redoneCommand = commandHistory.redo();

      expect(command.execute).toHaveBeenCalledTimes(1);
      expect(redoneCommand).toBe(command);
      expect(commandHistory.state.canRedo).toBe(false);
      expect(commandHistory.state.canUndo).toBe(true);
    });

    it('should return null when nothing to redo', () => {
      const result = commandHistory.redo();

      expect(result).toBeNull();
    });

    it('should move command back to undo stack', () => {
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      commandHistory.undo();
      commandHistory.redo();

      expect(commandHistory.state.undoCount).toBe(1);
      expect(commandHistory.state.redoCount).toBe(0);
    });

    it('should notify listeners on redo', () => {
      const listener = jest.fn();
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      commandHistory.undo();

      commandHistory.onChange(listener);
      commandHistory.redo();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          command,
          action: 'redo',
          state: expect.objectContaining({
            canUndo: true,
            canRedo: false,
          }),
        })
      );
    });
  });

  describe('clear', () => {
    it('should clear both stacks', () => {
      const command1 = createMockCommand({ id: 'cmd-1', type: 'create' });
      const command2 = createMockCommand({ id: 'cmd-2', type: 'create' });

      commandHistory.execute(command1);
      commandHistory.execute(command2);
      commandHistory.undo();

      expect(commandHistory.state.undoCount).toBe(1);
      expect(commandHistory.state.redoCount).toBe(1);

      commandHistory.clear();

      expect(commandHistory.state.undoCount).toBe(0);
      expect(commandHistory.state.redoCount).toBe(0);
      expect(commandHistory.state.canUndo).toBe(false);
      expect(commandHistory.state.canRedo).toBe(false);
    });

    it('should notify listeners on clear', () => {
      const listener = jest.fn();
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.execute(command);
      commandHistory.onChange(listener);
      commandHistory.clear();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'clear',
          state: expect.objectContaining({
            canUndo: false,
            canRedo: false,
          }),
        })
      );
    });
  });

  describe('state', () => {
    it('should return current state', () => {
      const command1 = createMockCommand({
        id: 'cmd-1',
        type: 'create',
        description: 'First command',
      });
      const command2 = createMockCommand({
        id: 'cmd-2',
        type: 'create',
        description: 'Second command',
      });

      commandHistory.execute(command1);
      commandHistory.execute(command2);
      commandHistory.undo();

      const state = commandHistory.state;

      expect(state.canUndo).toBe(true);
      expect(state.canRedo).toBe(true);
      expect(state.undoCount).toBe(1);
      expect(state.redoCount).toBe(1);
      expect(state.undoDescription).toBe('First command');
      expect(state.redoDescription).toBe('Second command');
    });

    it('should return empty state when no commands', () => {
      const state = commandHistory.state;

      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
      expect(state.undoCount).toBe(0);
      expect(state.redoCount).toBe(0);
      expect(state.undoDescription).toBeNull();
      expect(state.redoDescription).toBeNull();
    });
  });

  describe('listener management', () => {
    it('should unsubscribe listener', () => {
      const listener = jest.fn();
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      const unsubscribe = commandHistory.onChange(listener);
      commandHistory.execute(command);

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      commandHistory.execute(
        createMockCommand({ id: 'cmd-2', type: 'create' })
      );

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const command = createMockCommand({ id: 'cmd-1', type: 'create' });

      commandHistory.onChange(listener1);
      commandHistory.onChange(listener2);
      commandHistory.execute(command);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple undo/redo operations', () => {
    it('should handle sequential undo operations', () => {
      const commands = [
        createMockCommand({ id: 'cmd-1', type: 'create' }),
        createMockCommand({ id: 'cmd-2', type: 'create' }),
        createMockCommand({ id: 'cmd-3', type: 'create' }),
      ];

      commands.forEach((cmd) => commandHistory.execute(cmd));

      expect(commandHistory.state.undoCount).toBe(3);

      commandHistory.undo();
      commandHistory.undo();

      expect(commandHistory.state.undoCount).toBe(1);
      expect(commandHistory.state.redoCount).toBe(2);
    });

    it('should handle interleaved undo/redo', () => {
      const cmd1 = createMockCommand({
        id: 'cmd-1',
        type: 'create',
        description: 'Cmd 1',
      });
      const cmd2 = createMockCommand({
        id: 'cmd-2',
        type: 'create',
        description: 'Cmd 2',
      });

      commandHistory.execute(cmd1);
      commandHistory.execute(cmd2);

      commandHistory.undo();
      expect(commandHistory.state.undoCount).toBe(1);
      expect(commandHistory.state.undoDescription).toBe('Cmd 1');

      commandHistory.redo();
      expect(commandHistory.state.undoCount).toBe(2);
      expect(commandHistory.state.undoDescription).toBe('Cmd 2');

      commandHistory.undo();
      commandHistory.undo();
      expect(commandHistory.state.undoCount).toBe(0);
      expect(commandHistory.state.redoCount).toBe(2);
    });
  });
});
