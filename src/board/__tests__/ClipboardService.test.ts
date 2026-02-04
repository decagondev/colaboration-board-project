/**
 * Unit tests for ClipboardService.
 */

import {
  ClipboardService,
  createClipboardService,
} from '../services/ClipboardService';
import type { IBoardObject } from '../interfaces/IBoardObject';
import type { Position } from '../../shared/types';

/** Counter for generating unique clone IDs in tests */
let cloneCounter = 0;

/**
 * Creates a mock board object for testing.
 *
 * @param id - Object ID
 * @param type - Object type
 * @param position - Object position
 * @param size - Object dimensions
 * @returns A mock IBoardObject
 */
function createMockBoardObject(
  id: string,
  type: string = 'sticky-note',
  position: Position = { x: 100, y: 100 },
  size: { width: number; height: number } = { width: 200, height: 150 }
): IBoardObject {
  const obj: IBoardObject = {
    id,
    type,
    position: { ...position },
    width: size.width,
    height: size.height,
    rotation: 0,
    zIndex: 1,
    visible: true,
    locked: false,
    createdAt: Date.now(),
    createdBy: 'test-user',
    updatedAt: Date.now(),
    updatedBy: 'test-user',
    clone: jest.fn().mockImplementation(function (this: IBoardObject) {
      cloneCounter++;
      return createMockBoardObject(
        `clone-${this.id}-${cloneCounter}`,
        this.type,
        { ...this.position },
        { width: this.width, height: this.height }
      );
    }),
    moveTo: jest.fn(),
    moveBy: jest.fn(),
    getBounds: jest.fn().mockImplementation(function (this: IBoardObject) {
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

  // Bind getBounds to the object
  (obj.getBounds as jest.Mock).mockReturnValue({
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  });

  return obj;
}

describe('ClipboardService', () => {
  let clipboardService: ClipboardService;

  beforeEach(() => {
    clipboardService = new ClipboardService();
    cloneCounter = 0;
  });

  describe('initialization', () => {
    it('should create with empty content', () => {
      expect(clipboardService.hasContent).toBe(false);
      expect(clipboardService.peek()).toBeNull();
    });

    it('should create using factory function', () => {
      const service = createClipboardService();
      expect(service).toBeInstanceOf(ClipboardService);
    });
  });

  describe('copy', () => {
    it('should copy a single object', () => {
      const object = createMockBoardObject('obj-1');
      const objects = [object];

      clipboardService.copy(objects);

      expect(clipboardService.hasContent).toBe(true);
      expect(clipboardService.objectCount).toBe(1);
    });

    it('should copy multiple objects', () => {
      const objects = [
        createMockBoardObject('obj-1', 'sticky-note', { x: 100, y: 100 }),
        createMockBoardObject('obj-2', 'shape', { x: 300, y: 200 }),
        createMockBoardObject('obj-3', 'text', { x: 150, y: 350 }),
      ];

      clipboardService.copy(objects);

      expect(clipboardService.objectCount).toBe(3);
    });

    it('should calculate source bounds for multiple objects', () => {
      const objects = [
        createMockBoardObject(
          'obj-1',
          'sticky-note',
          { x: 100, y: 100 },
          { width: 100, height: 100 }
        ),
        createMockBoardObject(
          'obj-2',
          'shape',
          { x: 300, y: 300 },
          { width: 100, height: 100 }
        ),
      ];

      clipboardService.copy(objects);

      const content = clipboardService.peek();
      const bounds = content?.originalBounds;
      expect(bounds?.x).toBe(100);
      expect(bounds?.y).toBe(100);
      expect(bounds?.width).toBe(300);
      expect(bounds?.height).toBe(300);
    });

    it('should notify listeners on copy', () => {
      const listener = jest.fn();
      const object = createMockBoardObject('obj-1');

      clipboardService.onChange(listener);
      clipboardService.copy([object]);

      expect(listener).toHaveBeenCalledWith({
        hasContent: true,
        objectCount: 1,
      });
    });

    it('should not copy empty array', () => {
      clipboardService.copy([]);

      expect(clipboardService.hasContent).toBe(false);
    });
  });

  describe('cut', () => {
    it('should cut objects with isCutOperation returning true', () => {
      const object = createMockBoardObject('obj-1');

      clipboardService.cut([object]);

      expect(clipboardService.hasContent).toBe(true);
      expect(clipboardService.isCutOperation()).toBe(true);
    });

    it('should notify listeners on cut', () => {
      const listener = jest.fn();
      const object = createMockBoardObject('obj-1');

      clipboardService.onChange(listener);
      clipboardService.cut([object]);

      expect(listener).toHaveBeenCalledWith({
        hasContent: true,
        objectCount: 1,
      });
    });
  });

  describe('paste', () => {
    it('should return null when clipboard is empty', () => {
      const result = clipboardService.paste({ x: 500, y: 500 });

      expect(result).toBeNull();
    });

    it('should paste objects at specified position', () => {
      const object = createMockBoardObject('obj-1', 'sticky-note', {
        x: 100,
        y: 100,
      });
      clipboardService.copy([object]);

      const pastedObjects = clipboardService.paste({ x: 500, y: 500 });

      expect(pastedObjects).not.toBeNull();
      expect(pastedObjects).toHaveLength(1);
    });

    it('should clone objects for paste', () => {
      const object = createMockBoardObject('obj-1');
      clipboardService.copy([object]);

      const pastedObjects = clipboardService.paste({ x: 500, y: 500 });

      expect(pastedObjects?.[0].id).not.toBe(object.id);
    });

    it('should maintain relative positions when pasting multiple objects', () => {
      const objects = [
        createMockBoardObject(
          'obj-1',
          'sticky-note',
          { x: 100, y: 100 },
          { width: 100, height: 100 }
        ),
        createMockBoardObject(
          'obj-2',
          'shape',
          { x: 200, y: 150 },
          { width: 100, height: 100 }
        ),
      ];

      clipboardService.copy(objects);
      const pastedObjects = clipboardService.paste({ x: 500, y: 500 });

      expect(pastedObjects).toHaveLength(2);
    });

    it('should retain content after pasting copied objects', () => {
      const object = createMockBoardObject('obj-1');
      clipboardService.copy([object]);

      clipboardService.paste({ x: 500, y: 500 });

      expect(clipboardService.hasContent).toBe(true);
    });

    it('should allow multiple pastes from copied objects', () => {
      const object = createMockBoardObject('obj-1');
      clipboardService.copy([object]);

      const paste1 = clipboardService.paste({ x: 500, y: 500 });
      const paste2 = clipboardService.paste({ x: 600, y: 600 });

      expect(paste1).not.toBeNull();
      expect(paste2).not.toBeNull();
      expect(paste1?.[0].id).not.toBe(paste2?.[0].id);
    });
  });

  describe('clear', () => {
    it('should clear clipboard content', () => {
      const object = createMockBoardObject('obj-1');
      clipboardService.copy([object]);

      expect(clipboardService.hasContent).toBe(true);

      clipboardService.clear();

      expect(clipboardService.hasContent).toBe(false);
      expect(clipboardService.peek()).toBeNull();
    });

    it('should notify listeners on clear', () => {
      const listener = jest.fn();
      const object = createMockBoardObject('obj-1');

      clipboardService.copy([object]);
      clipboardService.onChange(listener);
      clipboardService.clear();

      expect(listener).toHaveBeenCalledWith({
        hasContent: false,
        objectCount: 0,
      });
    });
  });

  describe('listener management', () => {
    it('should unsubscribe listener', () => {
      const listener = jest.fn();
      const object = createMockBoardObject('obj-1');

      const unsubscribe = clipboardService.onChange(listener);
      clipboardService.copy([object]);

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      clipboardService.copy([createMockBoardObject('obj-2')]);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const object = createMockBoardObject('obj-1');

      clipboardService.onChange(listener1);
      clipboardService.onChange(listener2);
      clipboardService.copy([object]);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle paste at origin', () => {
      const object = createMockBoardObject('obj-1', 'sticky-note', {
        x: 100,
        y: 100,
      });
      clipboardService.copy([object]);

      const pastedObjects = clipboardService.paste({ x: 0, y: 0 });

      expect(pastedObjects).not.toBeNull();
    });

    it('should handle objects with negative positions', () => {
      const object = createMockBoardObject('obj-1', 'sticky-note', {
        x: -100,
        y: -50,
      });
      clipboardService.copy([object]);

      const pastedObjects = clipboardService.paste({ x: 500, y: 500 });

      expect(pastedObjects).not.toBeNull();
    });

    it('should handle replacing clipboard content', () => {
      const object1 = createMockBoardObject('obj-1');
      const object2 = createMockBoardObject('obj-2');

      clipboardService.copy([object1]);
      expect(clipboardService.objectCount).toBe(1);

      clipboardService.copy([object2]);
      expect(clipboardService.objectCount).toBe(1);
    });

    it('should reset cut state after first paste', () => {
      const object = createMockBoardObject('obj-1');
      clipboardService.cut([object]);

      expect(clipboardService.isCutOperation()).toBe(true);

      clipboardService.paste({ x: 500, y: 500 });

      expect(clipboardService.isCutOperation()).toBe(false);
    });
  });

  describe('peek', () => {
    it('should return clipboard content without modifying it', () => {
      const object = createMockBoardObject('obj-1');
      clipboardService.copy([object]);

      const content1 = clipboardService.peek();
      const content2 = clipboardService.peek();

      expect(content1).toBe(content2);
      expect(clipboardService.hasContent).toBe(true);
    });

    it('should return null for empty clipboard', () => {
      expect(clipboardService.peek()).toBeNull();
    });
  });
});
