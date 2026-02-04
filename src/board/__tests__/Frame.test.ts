/**
 * Unit tests for the Frame class.
 *
 * Tests frame creation, child management, and interface implementation.
 */

import { Frame, FRAME_DEFAULTS } from '../objects/Frame';

describe('Frame', () => {
  const testUser = 'test-user';
  const defaultPosition = { x: 100, y: 100 };
  const defaultSize = { width: 400, height: 300 };

  describe('create', () => {
    it('should create a frame with default values', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      expect(frame.type).toBe('frame');
      expect(frame.title).toBe(FRAME_DEFAULTS.title);
      expect(frame.showTitle).toBe(FRAME_DEFAULTS.showTitle);
      expect(frame.backgroundOpacity).toBe(FRAME_DEFAULTS.backgroundOpacity);
      expect(frame.childIds.length).toBe(0);
    });

    it('should enforce minimum size', () => {
      const frame = Frame.create(
        defaultPosition,
        { width: 50, height: 50 },
        testUser
      );

      expect(frame.size.width).toBe(FRAME_DEFAULTS.minWidth);
      expect(frame.size.height).toBe(FRAME_DEFAULTS.minHeight);
    });

    it('should apply custom options', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        title: 'My Frame',
        showTitle: false,
        backgroundOpacity: 0.5,
        fillColor: '#FF0000',
      });

      expect(frame.title).toBe('My Frame');
      expect(frame.showTitle).toBe(false);
      expect(frame.backgroundOpacity).toBe(0.5);
      expect(frame.colors.fill).toBe('#FF0000');
    });
  });

  describe('child management', () => {
    it('should add a child', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      frame.addChild('obj-1');

      expect(frame.childIds).toContain('obj-1');
      expect(frame.childIds.length).toBe(1);
    });

    it('should not add duplicate children', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      frame.addChild('obj-1');
      frame.addChild('obj-1');

      expect(frame.childIds.length).toBe(1);
    });

    it('should remove a child', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);
      frame.addChild('obj-1');
      frame.addChild('obj-2');

      frame.removeChild('obj-1');

      expect(frame.childIds).not.toContain('obj-1');
      expect(frame.childIds).toContain('obj-2');
    });

    it('should check if child exists', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);
      frame.addChild('obj-1');

      expect(frame.containsChild('obj-1')).toBe(true);
      expect(frame.containsChild('obj-2')).toBe(false);
    });

    it('should clear all children', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);
      frame.addChild('obj-1');
      frame.addChild('obj-2');
      frame.addChild('obj-3');

      frame.clearChildren();

      expect(frame.childIds.length).toBe(0);
    });
  });

  describe('content bounds', () => {
    it('should return content bounds with title', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        showTitle: true,
      });

      const contentBounds = frame.getContentBounds();

      expect(contentBounds.x).toBe(defaultPosition.x);
      expect(contentBounds.y).toBe(
        defaultPosition.y + FRAME_DEFAULTS.titleHeight
      );
      expect(contentBounds.height).toBe(
        defaultSize.height - FRAME_DEFAULTS.titleHeight
      );
    });

    it('should return content bounds without title', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        showTitle: false,
      });

      const contentBounds = frame.getContentBounds();

      expect(contentBounds.x).toBe(defaultPosition.x);
      expect(contentBounds.y).toBe(defaultPosition.y);
      expect(contentBounds.height).toBe(defaultSize.height);
    });
  });

  describe('IBoardObject implementation', () => {
    it('should have a unique id', () => {
      const frame1 = Frame.create(defaultPosition, defaultSize, testUser);
      const frame2 = Frame.create(defaultPosition, defaultSize, testUser);

      expect(frame1.id).toBeDefined();
      expect(frame2.id).toBeDefined();
      expect(frame1.id).not.toBe(frame2.id);
    });

    it('should calculate bounds correctly', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      const bounds = frame.getBounds();

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(400);
      expect(bounds.height).toBe(300);
    });

    it('should detect point containment', () => {
      const frame = Frame.create(
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        testUser
      );

      expect(frame.containsPoint({ x: 200, y: 150 })).toBe(true);
      expect(frame.containsPoint({ x: 500, y: 500 })).toBe(false);
    });

    it('should clone the frame', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        title: 'Original',
      });
      frame.addChild('obj-1');
      const clone = frame.clone();

      expect(clone.id).not.toBe(frame.id);
      expect(clone.title).toBe(frame.title);
      expect(clone.childIds).toEqual(frame.childIds);
    });

    it('should serialize to JSON', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        title: 'Test Frame',
        backgroundOpacity: 0.3,
      });
      frame.addChild('obj-1');

      const json = frame.toJSON();

      expect(json.type).toBe('frame');
      expect(json.data.title).toBe('Test Frame');
      expect(json.data.backgroundOpacity).toBe(0.3);
      expect(json.data.childIds).toContain('obj-1');
    });
  });

  describe('ITransformable implementation', () => {
    it('should move to a new position', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);
      frame.moveTo({ x: 200, y: 200 });

      expect(frame.position).toEqual({ x: 200, y: 200 });
    });

    it('should resize with minimum enforcement', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      frame.resizeTo({ width: 50, height: 50 });

      expect(frame.size.width).toBe(FRAME_DEFAULTS.minWidth);
      expect(frame.size.height).toBe(FRAME_DEFAULTS.minHeight);
    });

    it('should rotate', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);
      frame.rotateTo(45);

      expect(frame.transform.rotation).toBe(45);
    });
  });

  describe('ISelectable implementation', () => {
    it('should track selection state', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      expect(frame.selectionState.isSelected).toBe(false);

      frame.select();
      expect(frame.selectionState.isSelected).toBe(true);

      frame.deselect();
      expect(frame.selectionState.isSelected).toBe(false);
    });

    it('should calculate handle positions', () => {
      const frame = Frame.create(
        { x: 0, y: 0 },
        { width: 400, height: 300 },
        testUser
      );

      const handles = frame.getHandlePositions();

      expect(handles.length).toBeGreaterThan(8);
      expect(handles.find((h) => h.handle === 'top-left')).toBeDefined();
      expect(handles.find((h) => h.handle === 'rotation')).toBeDefined();
    });
  });

  describe('IColorable implementation', () => {
    it('should set colors', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      frame.setFillColor('#00FF00');
      frame.setStrokeColor('#0000FF');
      frame.setTextColor('#FF0000');

      expect(frame.colors.fill).toBe('#00FF00');
      expect(frame.colors.stroke).toBe('#0000FF');
      expect(frame.colors.text).toBe('#FF0000');
    });
  });

  describe('properties', () => {
    it('should update title', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      frame.title = 'New Title';

      expect(frame.title).toBe('New Title');
    });

    it('should clamp background opacity', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser);

      frame.backgroundOpacity = -0.5;
      expect(frame.backgroundOpacity).toBe(0);

      frame.backgroundOpacity = 1.5;
      expect(frame.backgroundOpacity).toBe(1);
    });
  });
});
