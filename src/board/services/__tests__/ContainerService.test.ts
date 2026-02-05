/**
 * ContainerService Tests
 *
 * Tests for the ContainerService that manages parent-child relationships
 * between containers and containable objects on the board.
 *
 * @module board/services/__tests__/ContainerService.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContainerService, createContainerService } from '../ContainerService';
import type { IContainerService, ContainerChangeListener } from '../ContainerService';
import { Frame } from '../../objects/Frame';
import { Shape } from '../../objects/Shape';
import { StickyNote } from '../../objects/StickyNote';

describe('ContainerService', () => {
  let service: IContainerService;
  let frame: Frame;
  let shape: Shape;
  let stickyNote: StickyNote;

  beforeEach(() => {
    service = createContainerService();

    frame = Frame.create(
      { x: 100, y: 100 },
      { width: 400, height: 300 },
      'test-user',
      { title: 'Test Frame' }
    );

    shape = Shape.create(
      'rectangle',
      { x: 150, y: 150 },
      { width: 100, height: 80 },
      'test-user'
    );

    stickyNote = StickyNote.create(
      { x: 200, y: 200 },
      'test-user',
      { text: 'Test Note' }
    );
  });

  describe('createContainerService', () => {
    it('should create a new ContainerService instance', () => {
      const newService = createContainerService();
      expect(newService).toBeInstanceOf(ContainerService);
    });
  });

  describe('registerContainer', () => {
    it('should register a frame as a container', () => {
      service.registerContainer(frame);
      const containers = (service as ContainerService).getAllContainers();
      expect(containers).toContainEqual(frame);
    });

    it('should allow registering multiple containers', () => {
      const frame2 = Frame.create(
        { x: 600, y: 100 },
        { width: 400, height: 300 },
        'test-user',
        { title: 'Second Frame' }
      );

      service.registerContainer(frame);
      service.registerContainer(frame2);

      const containers = (service as ContainerService).getAllContainers();
      expect(containers).toHaveLength(2);
    });
  });

  describe('unregisterContainer', () => {
    it('should unregister a container', () => {
      service.registerContainer(frame);
      service.unregisterContainer(frame.id);

      const containers = (service as ContainerService).getAllContainers();
      expect(containers).not.toContainEqual(frame);
    });

    it('should release all children when unregistering', () => {
      service.registerContainer(frame);
      service.registerContainable(shape);
      service.addToContainer(frame.id, shape.id);

      service.unregisterContainer(frame.id);

      expect(shape.containerId).toBeNull();
    });
  });

  describe('registerContainable', () => {
    it('should register a shape as containable', () => {
      service.registerContainable(shape);
      const containables = (service as ContainerService).getAllContainables();
      expect(containables).toContainEqual(shape);
    });

    it('should register a sticky note as containable', () => {
      service.registerContainable(stickyNote);
      const containables = (service as ContainerService).getAllContainables();
      expect(containables).toContainEqual(stickyNote);
    });
  });

  describe('unregisterContainable', () => {
    it('should unregister a containable object', () => {
      service.registerContainable(shape);
      service.unregisterContainable(shape.id);

      const containables = (service as ContainerService).getAllContainables();
      expect(containables).not.toContainEqual(shape);
    });

    it('should remove from container when unregistering', () => {
      service.registerContainer(frame);
      service.registerContainable(shape);
      service.addToContainer(frame.id, shape.id);

      service.unregisterContainable(shape.id);

      expect(frame.childIds).not.toContain(shape.id);
    });
  });

  describe('addToContainer', () => {
    beforeEach(() => {
      service.registerContainer(frame);
      service.registerContainable(shape);
    });

    it('should add a shape to a frame', () => {
      const result = service.addToContainer(frame.id, shape.id);

      expect(result).toBe(true);
      expect(frame.hasChild(shape.id)).toBe(true);
      expect(shape.containerId).toBe(frame.id);
    });

    it('should return false for non-existent container', () => {
      const result = service.addToContainer('non-existent', shape.id);
      expect(result).toBe(false);
    });

    it('should return false for non-existent containable', () => {
      const result = service.addToContainer(frame.id, 'non-existent');
      expect(result).toBe(false);
    });

    it('should move object from one container to another', () => {
      const frame2 = Frame.create(
        { x: 600, y: 100 },
        { width: 400, height: 300 },
        'test-user',
        { title: 'Second Frame' }
      );
      service.registerContainer(frame2);

      service.addToContainer(frame.id, shape.id);
      service.addToContainer(frame2.id, shape.id);

      expect(frame.hasChild(shape.id)).toBe(false);
      expect(frame2.hasChild(shape.id)).toBe(true);
      expect(shape.containerId).toBe(frame2.id);
    });

    it('should set relative position', () => {
      service.addToContainer(frame.id, shape.id);

      const relativePos = shape.getRelativePosition();
      expect(relativePos).not.toBeNull();
    });
  });

  describe('removeFromContainer', () => {
    beforeEach(() => {
      service.registerContainer(frame);
      service.registerContainable(shape);
      service.addToContainer(frame.id, shape.id);
    });

    it('should remove a shape from a frame', () => {
      const result = service.removeFromContainer(shape.id);

      expect(result).toBe(true);
      expect(frame.hasChild(shape.id)).toBe(false);
      expect(shape.containerId).toBeNull();
    });

    it('should return false for object not in a container', () => {
      service.removeFromContainer(shape.id);
      const result = service.removeFromContainer(shape.id);

      expect(result).toBe(false);
    });
  });

  describe('getContainerFor', () => {
    beforeEach(() => {
      service.registerContainer(frame);
      service.registerContainable(shape);
    });

    it('should return the container for a contained object', () => {
      service.addToContainer(frame.id, shape.id);
      const container = service.getContainerFor(shape.id);

      expect(container).toBe(frame);
    });

    it('should return null for object not in container', () => {
      const container = service.getContainerFor(shape.id);
      expect(container).toBeNull();
    });

    it('should return null for unregistered object', () => {
      const container = service.getContainerFor('non-existent');
      expect(container).toBeNull();
    });
  });

  describe('getChildren', () => {
    beforeEach(() => {
      service.registerContainer(frame);
      service.registerContainable(shape);
      service.registerContainable(stickyNote);
    });

    it('should return all children of a container', () => {
      service.addToContainer(frame.id, shape.id);
      service.addToContainer(frame.id, stickyNote.id);

      const children = service.getChildren(frame.id);

      expect(children).toHaveLength(2);
      expect(children).toContainEqual(shape);
      expect(children).toContainEqual(stickyNote);
    });

    it('should return empty array for container with no children', () => {
      const children = service.getChildren(frame.id);
      expect(children).toHaveLength(0);
    });

    it('should return empty array for non-existent container', () => {
      const children = service.getChildren('non-existent');
      expect(children).toHaveLength(0);
    });
  });

  describe('findContainersAtPoint', () => {
    it('should find containers at a given point', () => {
      service.registerContainer(frame);

      const containers = service.findContainersAtPoint({ x: 200, y: 200 });

      expect(containers).toContainEqual(frame);
    });

    it('should return empty array for point outside containers', () => {
      service.registerContainer(frame);

      const containers = service.findContainersAtPoint({ x: 10, y: 10 });

      expect(containers).toHaveLength(0);
    });

    it('should exclude specified containers', () => {
      service.registerContainer(frame);

      const containers = service.findContainersAtPoint(
        { x: 200, y: 200 },
        [frame.id]
      );

      expect(containers).not.toContainEqual(frame);
    });
  });

  describe('checkAutoContainment', () => {
    beforeEach(() => {
      service.registerContainer(frame);
    });

    it('should return container when object is sufficiently overlapping', () => {
      const objectBounds = { x: 150, y: 180, width: 100, height: 80 };
      const result = service.checkAutoContainment(objectBounds);

      expect(result).not.toBeNull();
      expect(result?.container).toBe(frame);
    });

    it('should return null when object is not overlapping enough', () => {
      const objectBounds = { x: 50, y: 50, width: 100, height: 80 };
      const result = service.checkAutoContainment(objectBounds);

      expect(result).toBeNull();
    });

    it('should return null when all containers are excluded', () => {
      const objectBounds = { x: 150, y: 180, width: 100, height: 80 };
      const result = service.checkAutoContainment(objectBounds, [frame.id]);

      expect(result).toBeNull();
    });
  });

  describe('onContainerMoved', () => {
    beforeEach(() => {
      service.registerContainer(frame);
      service.registerContainable(shape);
      service.addToContainer(frame.id, shape.id);
    });

    it('should move children when container moves', () => {
      const originalShapePosition = { ...shape.position };

      service.onContainerMoved(
        frame.id,
        { x: 100, y: 100 },
        { x: 200, y: 150 }
      );

      expect(shape.position.x).toBe(originalShapePosition.x + 100);
      expect(shape.position.y).toBe(originalShapePosition.y + 50);
    });

    it('should not move children if delta is zero', () => {
      const originalShapePosition = { ...shape.position };

      service.onContainerMoved(
        frame.id,
        { x: 100, y: 100 },
        { x: 100, y: 100 }
      );

      expect(shape.position).toEqual(originalShapePosition);
    });
  });

  describe('change listeners', () => {
    let listener: ContainerChangeListener;

    beforeEach(() => {
      listener = vi.fn();
      service.registerContainer(frame);
      service.registerContainable(shape);
    });

    it('should notify listeners when child is added', () => {
      service.addChangeListener(listener);
      service.addToContainer(frame.id, shape.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          containerId: frame.id,
          changeType: 'add',
          childIds: [shape.id],
        })
      );
    });

    it('should notify listeners when child is removed', () => {
      service.addToContainer(frame.id, shape.id);
      service.addChangeListener(listener);
      service.removeFromContainer(shape.id);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          containerId: frame.id,
          changeType: 'remove',
          childIds: [shape.id],
        })
      );
    });

    it('should not notify after listener is removed', () => {
      service.addChangeListener(listener);
      service.removeChangeListener(listener);
      service.addToContainer(frame.id, shape.id);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all registrations', () => {
      service.registerContainer(frame);
      service.registerContainable(shape);

      (service as ContainerService).clear();

      expect((service as ContainerService).getAllContainers()).toHaveLength(0);
      expect((service as ContainerService).getAllContainables()).toHaveLength(0);
    });
  });
});

describe('Frame IContainer implementation', () => {
  let frame: Frame;

  beforeEach(() => {
    frame = Frame.create(
      { x: 100, y: 100 },
      { width: 400, height: 300 },
      'test-user',
      { title: 'Test Frame' }
    );
  });

  describe('addChild', () => {
    it('should add child and return true', () => {
      const result = frame.addChild('child-1');

      expect(result).toBe(true);
      expect(frame.hasChild('child-1')).toBe(true);
    });

    it('should not add duplicate child and return false', () => {
      frame.addChild('child-1');
      const result = frame.addChild('child-1');

      expect(result).toBe(false);
      expect(frame.childIds).toHaveLength(1);
    });
  });

  describe('removeChild', () => {
    it('should remove child and return true', () => {
      frame.addChild('child-1');
      const result = frame.removeChild('child-1');

      expect(result).toBe(true);
      expect(frame.hasChild('child-1')).toBe(false);
    });

    it('should return false for non-existent child', () => {
      const result = frame.removeChild('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('reorderChild', () => {
    beforeEach(() => {
      frame.addChild('child-1');
      frame.addChild('child-2');
      frame.addChild('child-3');
    });

    it('should reorder child to new index', () => {
      const result = frame.reorderChild('child-1', 2);

      expect(result).toBe(true);
      expect([...frame.childIds]).toEqual(['child-2', 'child-3', 'child-1']);
    });

    it('should return false for non-existent child', () => {
      const result = frame.reorderChild('non-existent', 0);
      expect(result).toBe(false);
    });

    it('should clamp index to valid range', () => {
      frame.reorderChild('child-1', 100);
      expect([...frame.childIds]).toEqual(['child-2', 'child-3', 'child-1']);

      frame.reorderChild('child-1', -5);
      expect([...frame.childIds]).toEqual(['child-1', 'child-2', 'child-3']);
    });
  });

  describe('clearChildren', () => {
    it('should remove all children and return their IDs', () => {
      frame.addChild('child-1');
      frame.addChild('child-2');

      const removed = frame.clearChildren();

      expect(removed).toEqual(['child-1', 'child-2']);
      expect(frame.childIds).toHaveLength(0);
    });
  });

  describe('checkContainment', () => {
    it('should return isContained true when object is fully inside', () => {
      const contentBounds = frame.getContentBounds();
      const objectBounds = {
        x: contentBounds.x + 10,
        y: contentBounds.y + 10,
        width: 50,
        height: 50,
      };

      const result = frame.checkContainment(objectBounds);

      expect(result.isContained).toBe(true);
      expect(result.isOverlapping).toBe(true);
      expect(result.overlapPercentage).toBe(1);
    });

    it('should return isOverlapping true when object partially overlaps', () => {
      const bounds = frame.getBounds();
      const objectBounds = {
        x: bounds.x + bounds.width - 50,
        y: bounds.y + bounds.height - 50,
        width: 100,
        height: 100,
      };

      const result = frame.checkContainment(objectBounds);

      expect(result.isContained).toBe(false);
      expect(result.isOverlapping).toBe(true);
      expect(result.overlapPercentage).toBeGreaterThan(0);
      expect(result.overlapPercentage).toBeLessThan(1);
    });

    it('should return isOverlapping false when object is outside', () => {
      const objectBounds = { x: 1000, y: 1000, width: 50, height: 50 };

      const result = frame.checkContainment(objectBounds);

      expect(result.isContained).toBe(false);
      expect(result.isOverlapping).toBe(false);
      expect(result.overlapPercentage).toBe(0);
    });
  });

  describe('acceptsChildren', () => {
    it('should return true when frame is not locked', () => {
      expect(frame.acceptsChildren).toBe(true);
    });

    it('should return false when frame is locked', () => {
      frame.locked = true;
      expect(frame.acceptsChildren).toBe(false);
    });
  });

  describe('snapBehavior', () => {
    it('should default to none', () => {
      expect(frame.snapBehavior).toBe('none');
    });

    it('should be settable', () => {
      frame.snapBehavior = 'grid';
      expect(frame.snapBehavior).toBe('grid');
    });
  });

  describe('padding', () => {
    it('should have default padding', () => {
      const padding = frame.padding;
      expect(padding.top).toBe(40);
      expect(padding.right).toBe(8);
      expect(padding.bottom).toBe(8);
      expect(padding.left).toBe(8);
    });
  });

  describe('getContentBounds', () => {
    it('should return content area accounting for title and padding', () => {
      const contentBounds = frame.getContentBounds();
      const bounds = frame.getBounds();
      const padding = frame.padding;

      expect(contentBounds.x).toBe(bounds.x + padding.left);
      expect(contentBounds.y).toBe(bounds.y + 32 + padding.top);
      expect(contentBounds.width).toBe(bounds.width - padding.left - padding.right);
      expect(contentBounds.height).toBe(bounds.height - 32 - padding.top - padding.bottom);
    });
  });
});

describe('IContainable implementation', () => {
  describe('Shape', () => {
    let shape: Shape;

    beforeEach(() => {
      shape = Shape.create(
        'rectangle',
        { x: 100, y: 100 },
        { width: 80, height: 60 },
        'test-user'
      );
    });

    it('should have isContainable true', () => {
      expect(shape.isContainable).toBe(true);
    });

    it('should initially have null containerId', () => {
      expect(shape.containerId).toBeNull();
    });

    it('should setContainer correctly', () => {
      shape.setContainer('frame-123');
      expect(shape.containerId).toBe('frame-123');
    });

    it('should clear relative position when removing from container', () => {
      shape.setContainer('frame-123');
      shape.setRelativePosition({ x: 50, y: 50 });

      shape.setContainer(null);

      expect(shape.containerId).toBeNull();
      expect(shape.getRelativePosition()).toBeNull();
    });

    it('should set and get relative position', () => {
      shape.setRelativePosition({ x: 30, y: 40 });
      expect(shape.getRelativePosition()).toEqual({ x: 30, y: 40 });
    });
  });

  describe('StickyNote', () => {
    let note: StickyNote;

    beforeEach(() => {
      note = StickyNote.create({ x: 100, y: 100 }, 'test-user');
    });

    it('should have isContainable true', () => {
      expect(note.isContainable).toBe(true);
    });

    it('should setContainer correctly', () => {
      note.setContainer('frame-456');
      expect(note.containerId).toBe('frame-456');
    });
  });
});
