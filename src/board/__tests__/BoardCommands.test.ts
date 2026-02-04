/**
 * Unit tests for Board Commands.
 */

import {
  CreateObjectCommand,
  DeleteObjectsCommand,
  MoveObjectsCommand,
  ResizeObjectCommand,
  RotateObjectCommand,
  EditContentCommand,
  ChangeColorCommand,
  DuplicateObjectsCommand,
  PasteObjectsCommand,
  ReorderObjectsCommand,
  BatchCommand,
} from '../services/BoardCommands';
import type { IBoardObject } from '../interfaces/IBoardObject';
import type { Position, BoundingBox } from '../../shared/types';
import type { ICommand } from '../interfaces/ICommand';

/** Counter for generating unique clone IDs in tests */
let cloneCounter = 0;

/**
 * Creates a mock board object for testing.
 * The clone method generates a new unique ID (as real clone implementations do).
 *
 * @param id - Object ID
 * @param overrides - Optional property overrides
 * @returns A mock IBoardObject
 */
function createMockBoardObject(
  id: string,
  overrides: Partial<IBoardObject> = {}
): IBoardObject {
  const defaultPosition: Position = { x: 100, y: 100 };
  const obj: IBoardObject = {
    id,
    type: overrides.type ?? 'sticky-note',
    position: overrides.position ?? { ...defaultPosition },
    width: overrides.width ?? 200,
    height: overrides.height ?? 150,
    rotation: overrides.rotation ?? 0,
    zIndex: overrides.zIndex ?? 1,
    visible: overrides.visible ?? true,
    locked: overrides.locked ?? false,
    createdAt: overrides.createdAt ?? Date.now(),
    createdBy: overrides.createdBy ?? 'test-user',
    updatedAt: overrides.updatedAt ?? Date.now(),
    updatedBy: overrides.updatedBy ?? 'test-user',
    clone: jest.fn().mockImplementation(function (this: IBoardObject) {
      cloneCounter++;
      return createMockBoardObject(`clone-${this.id}-${cloneCounter}`, {
        ...this,
        position: { ...this.position },
      });
    }),
    moveTo: jest.fn(function (this: IBoardObject, pos: Position) {
      this.position = pos;
    }),
    moveBy: jest.fn(function (this: IBoardObject, delta: Position) {
      this.position.x += delta.x;
      this.position.y += delta.y;
    }),
    getBounds: jest.fn(function (this: IBoardObject): BoundingBox {
      return {
        x: this.position.x,
        y: this.position.y,
        width: this.width,
        height: this.height,
      };
    }),
    containsPoint: jest.fn().mockReturnValue(false),
    intersectsWith: jest.fn().mockReturnValue(false),
  };
  return obj;
}

beforeEach(() => {
  cloneCounter = 0;
});

describe('CreateObjectCommand', () => {
  it('should add object on execute', () => {
    const objects: IBoardObject[] = [];
    const newObject = createMockBoardObject('new-obj');

    const command = new CreateObjectCommand(
      newObject,
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();

    expect(objects).toHaveLength(1);
    expect(objects[0]).toBe(newObject);
  });

  it('should remove object on undo', () => {
    const objects: IBoardObject[] = [];
    const newObject = createMockBoardObject('new-obj');

    const command = new CreateObjectCommand(
      newObject,
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();
    expect(objects).toHaveLength(1);

    command.undo();
    expect(objects).toHaveLength(0);
  });

  it('should have correct type and description', () => {
    const newObject = createMockBoardObject('new-obj');

    const command = new CreateObjectCommand(
      newObject,
      jest.fn(),
      jest.fn(),
      'test-user'
    );

    expect(command.type).toBe('create');
    expect(command.description).toContain('Create');
    expect(command.executedBy).toBe('test-user');
  });
});

describe('DeleteObjectsCommand', () => {
  it('should remove objects on execute', () => {
    const obj1 = createMockBoardObject('obj-1');
    const obj2 = createMockBoardObject('obj-2');
    const objects: IBoardObject[] = [obj1, obj2];

    const command = new DeleteObjectsCommand(
      [obj1],
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();

    expect(objects).toHaveLength(1);
    expect(objects[0]).toBe(obj2);
  });

  it('should restore objects on undo', () => {
    const obj1 = createMockBoardObject('obj-1');
    const objects: IBoardObject[] = [obj1];

    const command = new DeleteObjectsCommand(
      [obj1],
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();
    expect(objects).toHaveLength(0);

    command.undo();
    expect(objects).toHaveLength(1);
  });

  it('should delete multiple objects', () => {
    const obj1 = createMockBoardObject('obj-1');
    const obj2 = createMockBoardObject('obj-2');
    const obj3 = createMockBoardObject('obj-3');
    const objects: IBoardObject[] = [obj1, obj2, obj3];

    const command = new DeleteObjectsCommand(
      [obj1, obj3],
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();

    expect(objects).toHaveLength(1);
    expect(objects[0]).toBe(obj2);
  });
});

describe('MoveObjectsCommand', () => {
  it('should apply new positions on execute', () => {
    const updatePosition = jest.fn();

    const command = new MoveObjectsCommand(
      ['obj-1'],
      new Map([['obj-1', { x: 100, y: 100 }]]),
      new Map([['obj-1', { x: 150, y: 130 }]]),
      updatePosition,
      'test-user'
    );

    command.execute();

    expect(updatePosition).toHaveBeenCalledWith('obj-1', { x: 150, y: 130 });
  });

  it('should apply old positions on undo', () => {
    const updatePosition = jest.fn();

    const command = new MoveObjectsCommand(
      ['obj-1'],
      new Map([['obj-1', { x: 100, y: 100 }]]),
      new Map([['obj-1', { x: 150, y: 130 }]]),
      updatePosition,
      'test-user'
    );

    command.execute();
    updatePosition.mockClear();
    command.undo();

    expect(updatePosition).toHaveBeenCalledWith('obj-1', { x: 100, y: 100 });
  });

  it('should support command merging', () => {
    const updatePosition = jest.fn();

    const command1 = new MoveObjectsCommand(
      ['obj-1'],
      new Map([['obj-1', { x: 100, y: 100 }]]),
      new Map([['obj-1', { x: 110, y: 110 }]]),
      updatePosition,
      'user'
    );

    const command2 = new MoveObjectsCommand(
      ['obj-1'],
      new Map([['obj-1', { x: 110, y: 110 }]]),
      new Map([['obj-1', { x: 130, y: 130 }]]),
      updatePosition,
      'user'
    );

    expect(command1.canMergeWith?.(command2)).toBe(true);

    const merged = command1.mergeWith?.(command2);
    expect(merged).toBeDefined();
  });

  it('should not merge commands with different objects', () => {
    const updatePosition = jest.fn();

    const command1 = new MoveObjectsCommand(
      ['obj-1'],
      new Map([['obj-1', { x: 100, y: 100 }]]),
      new Map([['obj-1', { x: 110, y: 110 }]]),
      updatePosition,
      'user'
    );

    const command2 = new MoveObjectsCommand(
      ['obj-2'],
      new Map([['obj-2', { x: 200, y: 200 }]]),
      new Map([['obj-2', { x: 220, y: 220 }]]),
      updatePosition,
      'user'
    );

    expect(command1.canMergeWith?.(command2)).toBe(false);
  });
});

describe('ResizeObjectCommand', () => {
  it('should resize object on execute', () => {
    const updateSize = jest.fn();

    const command = new ResizeObjectCommand(
      'obj-1',
      { width: 200, height: 150 },
      { width: 300, height: 200 },
      { x: 100, y: 100 },
      { x: 100, y: 100 },
      updateSize,
      'test-user'
    );

    command.execute();

    expect(updateSize).toHaveBeenCalledWith(
      'obj-1',
      { width: 300, height: 200 },
      { x: 100, y: 100 }
    );
  });

  it('should restore original size on undo', () => {
    const updateSize = jest.fn();

    const command = new ResizeObjectCommand(
      'obj-1',
      { width: 200, height: 150 },
      { width: 300, height: 200 },
      { x: 100, y: 100 },
      { x: 100, y: 100 },
      updateSize,
      'test-user'
    );

    command.execute();
    command.undo();

    expect(updateSize).toHaveBeenLastCalledWith(
      'obj-1',
      { width: 200, height: 150 },
      { x: 100, y: 100 }
    );
  });
});

describe('RotateObjectCommand', () => {
  it('should rotate object on execute', () => {
    const updateRotation = jest.fn();

    const command = new RotateObjectCommand(
      'obj-1',
      0,
      45,
      updateRotation,
      'test-user'
    );

    command.execute();

    expect(updateRotation).toHaveBeenCalledWith('obj-1', 45);
  });

  it('should restore original rotation on undo', () => {
    const updateRotation = jest.fn();

    const command = new RotateObjectCommand(
      'obj-1',
      0,
      45,
      updateRotation,
      'test-user'
    );

    command.execute();
    command.undo();

    expect(updateRotation).toHaveBeenLastCalledWith('obj-1', 0);
  });
});

describe('EditContentCommand', () => {
  it('should update content on execute', () => {
    const updateContent = jest.fn();

    const command = new EditContentCommand(
      'obj-1',
      'Old content',
      'New content',
      updateContent,
      'test-user'
    );

    command.execute();

    expect(updateContent).toHaveBeenCalledWith('obj-1', 'New content');
  });

  it('should restore old content on undo', () => {
    const updateContent = jest.fn();

    const command = new EditContentCommand(
      'obj-1',
      'Old content',
      'New content',
      updateContent,
      'test-user'
    );

    command.execute();
    command.undo();

    expect(updateContent).toHaveBeenLastCalledWith('obj-1', 'Old content');
  });

  it('should support content merging', () => {
    const updateContent = jest.fn();

    const command1 = new EditContentCommand(
      'obj-1',
      'Old',
      'New',
      updateContent,
      'user'
    );

    const command2 = new EditContentCommand(
      'obj-1',
      'New',
      'Newer',
      updateContent,
      'user'
    );

    expect(command1.canMergeWith?.(command2)).toBe(true);

    const merged = command1.mergeWith?.(command2);
    expect(merged).toBeDefined();
  });
});

describe('ChangeColorCommand', () => {
  it('should change color on execute', () => {
    const updateColors = jest.fn();

    const command = new ChangeColorCommand(
      'obj-1',
      { backgroundColor: '#ffff00' },
      { backgroundColor: '#ff0000' },
      updateColors,
      'test-user'
    );

    command.execute();

    expect(updateColors).toHaveBeenCalledWith('obj-1', {
      backgroundColor: '#ff0000',
    });
  });

  it('should restore old color on undo', () => {
    const updateColors = jest.fn();

    const command = new ChangeColorCommand(
      'obj-1',
      { backgroundColor: '#ffff00' },
      { backgroundColor: '#ff0000' },
      updateColors,
      'test-user'
    );

    command.execute();
    command.undo();

    expect(updateColors).toHaveBeenLastCalledWith('obj-1', {
      backgroundColor: '#ffff00',
    });
  });
});

describe('DuplicateObjectsCommand', () => {
  it('should create duplicates on execute', () => {
    const original = createMockBoardObject('obj-1');
    const objects: IBoardObject[] = [original];
    const addFn = jest.fn((obj) => objects.push(obj));
    const removeFn = jest.fn();

    const command = new DuplicateObjectsCommand(
      [original],
      addFn,
      removeFn,
      'test-user'
    );

    command.execute();

    expect(addFn).toHaveBeenCalled();
    expect(original.clone).toHaveBeenCalled();
  });

  it('should remove duplicates on undo', () => {
    const original = createMockBoardObject('obj-1');
    const objects: IBoardObject[] = [original];
    const removeFn = jest.fn();

    const command = new DuplicateObjectsCommand(
      [original],
      (obj) => objects.push(obj),
      removeFn,
      'test-user'
    );

    command.execute();
    command.undo();

    expect(removeFn).toHaveBeenCalled();
  });

  it('should provide duplicated IDs', () => {
    const original = createMockBoardObject('obj-1');

    const command = new DuplicateObjectsCommand(
      [original],
      jest.fn(),
      jest.fn(),
      'test-user'
    );

    expect(command.duplicatedIds).toHaveLength(1);
    expect(command.duplicatedIds[0]).not.toBe('obj-1');
  });
});

describe('PasteObjectsCommand', () => {
  it('should add pasted objects on execute', () => {
    const pastedObj = createMockBoardObject('pasted-1');
    const objects: IBoardObject[] = [];

    const command = new PasteObjectsCommand(
      [pastedObj],
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();

    expect(objects).toContain(pastedObj);
  });

  it('should remove pasted objects on undo', () => {
    const pastedObj = createMockBoardObject('pasted-1');
    const objects: IBoardObject[] = [];

    const command = new PasteObjectsCommand(
      [pastedObj],
      (obj) => objects.push(obj),
      (id) => {
        const idx = objects.findIndex((o) => o.id === id);
        if (idx !== -1) objects.splice(idx, 1);
      },
      'test-user'
    );

    command.execute();
    command.undo();

    expect(objects).toHaveLength(0);
  });

  it('should provide pasted IDs', () => {
    const pastedObj = createMockBoardObject('pasted-1');

    const command = new PasteObjectsCommand(
      [pastedObj],
      jest.fn(),
      jest.fn(),
      'test-user'
    );

    expect(command.pastedIds).toContain('pasted-1');
  });
});

describe('ReorderObjectsCommand', () => {
  it('should apply new z-indices on execute', () => {
    const updateZIndex = jest.fn();

    const command = new ReorderObjectsCommand(
      ['obj-1', 'obj-2'],
      new Map([
        ['obj-1', 1],
        ['obj-2', 2],
      ]),
      new Map([
        ['obj-1', 2],
        ['obj-2', 1],
      ]),
      updateZIndex,
      'test-user'
    );

    command.execute();

    expect(updateZIndex).toHaveBeenCalledWith('obj-1', 2);
    expect(updateZIndex).toHaveBeenCalledWith('obj-2', 1);
  });

  it('should restore old z-indices on undo', () => {
    const updateZIndex = jest.fn();

    const command = new ReorderObjectsCommand(
      ['obj-1', 'obj-2'],
      new Map([
        ['obj-1', 1],
        ['obj-2', 2],
      ]),
      new Map([
        ['obj-1', 2],
        ['obj-2', 1],
      ]),
      updateZIndex,
      'test-user'
    );

    command.execute();
    updateZIndex.mockClear();
    command.undo();

    expect(updateZIndex).toHaveBeenCalledWith('obj-1', 1);
    expect(updateZIndex).toHaveBeenCalledWith('obj-2', 2);
  });
});

describe('BatchCommand', () => {
  it('should execute all commands in batch', () => {
    const executeFn1 = jest.fn();
    const executeFn2 = jest.fn();

    const cmd1: ICommand = {
      id: 'cmd-1',
      type: 'create',
      description: 'Test 1',
      timestamp: Date.now(),
      executedBy: 'user',
      execute: executeFn1,
      undo: jest.fn(),
    };

    const cmd2: ICommand = {
      id: 'cmd-2',
      type: 'create',
      description: 'Test 2',
      timestamp: Date.now(),
      executedBy: 'user',
      execute: executeFn2,
      undo: jest.fn(),
    };

    const batch = new BatchCommand([cmd1, cmd2], 'user', 'Batch operation');

    batch.execute();

    expect(executeFn1).toHaveBeenCalled();
    expect(executeFn2).toHaveBeenCalled();
  });

  it('should undo all commands in reverse order', () => {
    const undoOrder: string[] = [];

    const cmd1: ICommand = {
      id: 'cmd-1',
      type: 'create',
      description: 'Test 1',
      timestamp: Date.now(),
      executedBy: 'user',
      execute: jest.fn(),
      undo: () => undoOrder.push('cmd-1'),
    };

    const cmd2: ICommand = {
      id: 'cmd-2',
      type: 'create',
      description: 'Test 2',
      timestamp: Date.now(),
      executedBy: 'user',
      execute: jest.fn(),
      undo: () => undoOrder.push('cmd-2'),
    };

    const batch = new BatchCommand([cmd1, cmd2], 'user', 'Batch operation');

    batch.execute();
    batch.undo();

    expect(undoOrder).toEqual(['cmd-2', 'cmd-1']);
  });

  it('should have batch type', () => {
    const batch = new BatchCommand([], 'user', 'Empty batch');

    expect(batch.type).toBe('batch');
  });

  it('should store commands', () => {
    const cmd1: ICommand = {
      id: 'cmd-1',
      type: 'create',
      description: 'Test 1',
      timestamp: Date.now(),
      executedBy: 'user',
      execute: jest.fn(),
      undo: jest.fn(),
    };

    const batch = new BatchCommand([cmd1], 'user');

    expect(batch.commands).toHaveLength(1);
    expect(batch.commands[0]).toBe(cmd1);
  });
});
