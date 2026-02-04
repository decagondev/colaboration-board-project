/**
 * Unit tests for the StandaloneText class.
 *
 * Tests text creation, editing, and interface implementation.
 */

import { StandaloneText, TEXT_DEFAULTS } from '../objects/StandaloneText';

describe('StandaloneText', () => {
  const testUser = 'test-user';
  const defaultPosition = { x: 100, y: 100 };

  describe('create', () => {
    it('should create text with default values', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      expect(text.type).toBe('text');
      expect(text.content).toBe(TEXT_DEFAULTS.content);
      expect(text.fontFamily).toBe(TEXT_DEFAULTS.fontFamily);
      expect(text.fontSize).toBe(TEXT_DEFAULTS.fontSize);
      expect(text.fontStyle).toBe(TEXT_DEFAULTS.fontStyle);
      expect(text.align).toBe(TEXT_DEFAULTS.align);
      expect(text.verticalAlign).toBe(TEXT_DEFAULTS.verticalAlign);
    });

    it('should apply custom options', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Hello World',
        fontFamily: 'Helvetica',
        fontSize: 24,
        fontStyle: 'bold',
        align: 'center',
        verticalAlign: 'middle',
        textColor: '#FF0000',
      });

      expect(text.content).toBe('Hello World');
      expect(text.fontFamily).toBe('Helvetica');
      expect(text.fontSize).toBe(24);
      expect(text.fontStyle).toBe('bold');
      expect(text.align).toBe('center');
      expect(text.verticalAlign).toBe('middle');
      expect(text.colors.text).toBe('#FF0000');
    });

    it('should set custom size', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        size: { width: 300, height: 100 },
      });

      expect(text.size.width).toBe(300);
      expect(text.size.height).toBe(100);
    });
  });

  describe('font properties', () => {
    it('should update font family', () => {
      const text = StandaloneText.create(defaultPosition, testUser);
      text.fontFamily = 'Georgia, serif';

      expect(text.fontFamily).toBe('Georgia, serif');
    });

    it('should clamp font size to valid range', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.fontSize = 5;
      expect(text.fontSize).toBe(8);

      text.fontSize = 300;
      expect(text.fontSize).toBe(200);
    });

    it('should update font style', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.fontStyle = 'bold italic';

      expect(text.fontStyle).toBe('bold italic');
    });

    it('should clamp line height to valid range', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.lineHeight = 0.2;
      expect(text.lineHeight).toBe(0.5);

      text.lineHeight = 5;
      expect(text.lineHeight).toBe(3);
    });
  });

  describe('alignment', () => {
    it('should update horizontal alignment', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.align = 'right';

      expect(text.align).toBe('right');
    });

    it('should update vertical alignment', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.verticalAlign = 'bottom';

      expect(text.verticalAlign).toBe('bottom');
    });
  });

  describe('IBoardObject implementation', () => {
    it('should have a unique id', () => {
      const text1 = StandaloneText.create(defaultPosition, testUser);
      const text2 = StandaloneText.create(defaultPosition, testUser);

      expect(text1.id).toBeDefined();
      expect(text2.id).toBeDefined();
      expect(text1.id).not.toBe(text2.id);
    });

    it('should calculate bounds correctly', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        size: { width: 200, height: 50 },
      });

      const bounds = text.getBounds();

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(100);
      expect(bounds.width).toBe(200);
      expect(bounds.height).toBe(50);
    });

    it('should detect point containment', () => {
      const text = StandaloneText.create({ x: 0, y: 0 }, testUser, {
        size: { width: 200, height: 50 },
      });

      expect(text.containsPoint({ x: 100, y: 25 })).toBe(true);
      expect(text.containsPoint({ x: 300, y: 100 })).toBe(false);
    });

    it('should clone the text', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Original Text',
        fontSize: 20,
      });
      const clone = text.clone();

      expect(clone.id).not.toBe(text.id);
      expect(clone.content).toBe(text.content);
      expect(clone.fontSize).toBe(text.fontSize);
    });

    it('should serialize to JSON', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test Content',
        fontStyle: 'italic',
      });

      const json = text.toJSON();

      expect(json.type).toBe('text');
      expect(json.data.content).toBe('Test Content');
      expect(json.data.fontStyle).toBe('italic');
    });
  });

  describe('ITransformable implementation', () => {
    it('should move to a new position', () => {
      const text = StandaloneText.create(defaultPosition, testUser);
      text.moveTo({ x: 200, y: 200 });

      expect(text.position).toEqual({ x: 200, y: 200 });
    });

    it('should resize with minimum enforcement', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.resizeTo({ width: 10, height: 5 });

      expect(text.size.width).toBe(TEXT_DEFAULTS.minWidth);
      expect(text.size.height).toBe(TEXT_DEFAULTS.minHeight);
    });

    it('should rotate', () => {
      const text = StandaloneText.create(defaultPosition, testUser);
      text.rotateTo(90);

      expect(text.transform.rotation).toBe(90);
    });
  });

  describe('ISelectable implementation', () => {
    it('should track selection state', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      expect(text.selectionState.isSelected).toBe(false);

      text.select();
      expect(text.selectionState.isSelected).toBe(true);

      text.deselect();
      expect(text.selectionState.isSelected).toBe(false);
    });

    it('should calculate handle positions', () => {
      const text = StandaloneText.create({ x: 0, y: 0 }, testUser, {
        size: { width: 200, height: 50 },
      });

      const handles = text.getHandlePositions();

      expect(handles.length).toBe(8);
      expect(handles.find((h) => h.handle === 'top-left')).toBeDefined();
    });
  });

  describe('IEditable implementation', () => {
    it('should start in view mode', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      expect(text.editMode).toBe('view');
    });

    it('should enter editing mode', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.startEditing();

      expect(text.editMode).toBe('editing');
    });

    it('should not enter editing mode when locked', () => {
      const text = StandaloneText.create(defaultPosition, testUser);
      text.locked = true;

      text.startEditing();

      expect(text.editMode).toBe('view');
    });

    it('should update content while editing', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Original',
      });

      text.startEditing();
      text.updateContent('Updated');

      expect(text.content).toBe('Updated');
    });

    it('should cancel editing and restore original content', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Original',
      });

      text.startEditing();
      text.updateContent('Changed');
      text.cancelEditing();

      expect(text.content).toBe('Original');
      expect(text.editMode).toBe('view');
    });

    it('should finish editing and keep changes', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Original',
      });

      text.startEditing();
      text.updateContent('Changed');
      text.finishEditing();

      expect(text.content).toBe('Changed');
      expect(text.editMode).toBe('view');
    });

    it('should detect unsaved changes', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Original',
      });

      text.startEditing();
      expect(text.hasUnsavedChanges()).toBe(false);

      text.updateContent('Changed');
      expect(text.hasUnsavedChanges()).toBe(true);
    });

    it('should provide original content', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Original',
      });

      text.startEditing();
      text.updateContent('Changed');

      expect(text.getOriginalContent()).toBe('Original');
    });
  });

  describe('IColorable implementation', () => {
    it('should set text color', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.setTextColor('#FF0000');

      expect(text.colors.text).toBe('#FF0000');
    });

    it('should apply color scheme', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      text.applyColorScheme({
        text: '#00FF00',
        fill: '#FFFFFF',
      });

      expect(text.colors.text).toBe('#00FF00');
      expect(text.colors.fill).toBe('#FFFFFF');
    });

    it('should report correct capabilities', () => {
      const text = StandaloneText.create(defaultPosition, testUser);

      expect(text.hasFill).toBe(true);
      expect(text.hasStroke).toBe(true);
      expect(text.hasTextColor).toBe(true);
    });
  });
});
