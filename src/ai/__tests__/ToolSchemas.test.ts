/**
 * Tool Schemas Unit Tests
 */

import {
  ALL_TOOL_SCHEMAS,
  toOpenAITool,
  createStickyNoteSchema,
  createShapeSchema,
  createTextSchema,
  getBoardStateSchema,
  moveObjectsSchema,
  resizeObjectsSchema,
  changeColorSchema,
  deleteObjectsSchema,
  SHAPE_TYPES,
  CREATE_STICKY_NOTE_DEFAULTS,
  CREATE_SHAPE_DEFAULTS,
  CREATE_TEXT_DEFAULTS,
} from '../tools/schemas';

describe('Tool Schemas', () => {
  describe('ALL_TOOL_SCHEMAS', () => {
    it('should contain all 8 built-in tools', () => {
      expect(ALL_TOOL_SCHEMAS).toHaveLength(8);
    });

    it('should contain unique tool names', () => {
      const names = ALL_TOOL_SCHEMAS.map((s) => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(ALL_TOOL_SCHEMAS.length);
    });
  });

  describe('createStickyNoteSchema', () => {
    it('should have correct name', () => {
      expect(createStickyNoteSchema.name).toBe('createStickyNote');
    });

    it('should have description', () => {
      expect(createStickyNoteSchema.description).toBeTruthy();
    });

    it('should require text parameter', () => {
      const textParam = createStickyNoteSchema.parameters.find(
        (p) => p.name === 'text'
      );
      expect(textParam?.required).toBe(true);
      expect(textParam?.type).toBe('string');
    });

    it('should have optional color parameter', () => {
      const colorParam = createStickyNoteSchema.parameters.find(
        (p) => p.name === 'color'
      );
      expect(colorParam?.required).toBe(false);
    });

    it('should have optional position parameters', () => {
      const xParam = createStickyNoteSchema.parameters.find(
        (p) => p.name === 'x'
      );
      const yParam = createStickyNoteSchema.parameters.find(
        (p) => p.name === 'y'
      );
      expect(xParam?.required).toBe(false);
      expect(yParam?.required).toBe(false);
    });
  });

  describe('createShapeSchema', () => {
    it('should have correct name', () => {
      expect(createShapeSchema.name).toBe('createShape');
    });

    it('should require shapeType parameter', () => {
      const shapeTypeParam = createShapeSchema.parameters.find(
        (p) => p.name === 'shapeType'
      );
      expect(shapeTypeParam?.required).toBe(true);
    });

    it('should have shapeType enum with rectangle and ellipse', () => {
      const shapeTypeParam = createShapeSchema.parameters.find(
        (p) => p.name === 'shapeType'
      );
      expect(shapeTypeParam?.enum).toContain('rectangle');
      expect(shapeTypeParam?.enum).toContain('ellipse');
    });

    it('should have optional dimension parameters', () => {
      const widthParam = createShapeSchema.parameters.find(
        (p) => p.name === 'width'
      );
      const heightParam = createShapeSchema.parameters.find(
        (p) => p.name === 'height'
      );
      expect(widthParam?.required).toBe(false);
      expect(heightParam?.required).toBe(false);
    });
  });

  describe('createTextSchema', () => {
    it('should have correct name', () => {
      expect(createTextSchema.name).toBe('createText');
    });

    it('should require text parameter', () => {
      const textParam = createTextSchema.parameters.find(
        (p) => p.name === 'text'
      );
      expect(textParam?.required).toBe(true);
    });

    it('should have optional fontSize parameter', () => {
      const fontSizeParam = createTextSchema.parameters.find(
        (p) => p.name === 'fontSize'
      );
      expect(fontSizeParam?.required).toBe(false);
      expect(fontSizeParam?.type).toBe('number');
    });
  });

  describe('getBoardStateSchema', () => {
    it('should have correct name', () => {
      expect(getBoardStateSchema.name).toBe('getBoardState');
    });

    it('should have no required parameters', () => {
      expect(getBoardStateSchema.parameters).toHaveLength(0);
    });
  });

  describe('moveObjectsSchema', () => {
    it('should have correct name', () => {
      expect(moveObjectsSchema.name).toBe('moveObjects');
    });

    it('should require objectIds array', () => {
      const objectIdsParam = moveObjectsSchema.parameters.find(
        (p) => p.name === 'objectIds'
      );
      expect(objectIdsParam?.required).toBe(true);
      expect(objectIdsParam?.type).toBe('array');
    });

    it('should require deltaX and deltaY', () => {
      const deltaX = moveObjectsSchema.parameters.find(
        (p) => p.name === 'deltaX'
      );
      const deltaY = moveObjectsSchema.parameters.find(
        (p) => p.name === 'deltaY'
      );
      expect(deltaX?.required).toBe(true);
      expect(deltaY?.required).toBe(true);
    });
  });

  describe('resizeObjectsSchema', () => {
    it('should have correct name', () => {
      expect(resizeObjectsSchema.name).toBe('resizeObjects');
    });

    it('should require all parameters', () => {
      for (const param of resizeObjectsSchema.parameters) {
        expect(param.required).toBe(true);
      }
    });
  });

  describe('changeColorSchema', () => {
    it('should have correct name', () => {
      expect(changeColorSchema.name).toBe('changeColor');
    });

    it('should require objectIds and color', () => {
      const objectIds = changeColorSchema.parameters.find(
        (p) => p.name === 'objectIds'
      );
      const color = changeColorSchema.parameters.find(
        (p) => p.name === 'color'
      );
      expect(objectIds?.required).toBe(true);
      expect(color?.required).toBe(true);
    });
  });

  describe('deleteObjectsSchema', () => {
    it('should have correct name', () => {
      expect(deleteObjectsSchema.name).toBe('deleteObjects');
    });

    it('should only require objectIds', () => {
      expect(deleteObjectsSchema.parameters).toHaveLength(1);
      expect(deleteObjectsSchema.parameters[0].name).toBe('objectIds');
      expect(deleteObjectsSchema.parameters[0].required).toBe(true);
    });
  });
});

describe('toOpenAITool', () => {
  it('should convert schema to OpenAI format', () => {
    const tool = toOpenAITool(createStickyNoteSchema);

    expect(tool.type).toBe('function');
    expect(tool.function.name).toBe('createStickyNote');
    expect(tool.function.description).toBeTruthy();
  });

  it('should include parameters in OpenAI format', () => {
    const tool = toOpenAITool(createStickyNoteSchema);

    expect(tool.function.parameters).toBeDefined();
    expect(tool.function.parameters.type).toBe('object');
    expect(tool.function.parameters.properties).toBeDefined();
  });

  it('should mark required parameters', () => {
    const tool = toOpenAITool(createStickyNoteSchema);

    expect(tool.function.parameters.required).toContain('text');
  });

  it('should include enum values', () => {
    const tool = toOpenAITool(createShapeSchema);
    const properties = tool.function.parameters.properties as Record<
      string,
      Record<string, unknown>
    >;

    expect(properties.shapeType.enum).toEqual(['rectangle', 'ellipse']);
  });

  it('should handle array parameters', () => {
    const tool = toOpenAITool(moveObjectsSchema);
    const properties = tool.function.parameters.properties as Record<
      string,
      Record<string, unknown>
    >;

    expect(properties.objectIds.type).toBe('array');
    expect(properties.objectIds.items).toEqual({ type: 'string' });
  });
});

describe('Default constants', () => {
  describe('CREATE_STICKY_NOTE_DEFAULTS', () => {
    it('should have default color', () => {
      expect(CREATE_STICKY_NOTE_DEFAULTS.color).toBe('#fef08a');
    });

    it('should have default position', () => {
      expect(CREATE_STICKY_NOTE_DEFAULTS.x).toBe(200);
      expect(CREATE_STICKY_NOTE_DEFAULTS.y).toBe(200);
    });
  });

  describe('CREATE_SHAPE_DEFAULTS', () => {
    it('should have default dimensions', () => {
      expect(CREATE_SHAPE_DEFAULTS.width).toBe(150);
      expect(CREATE_SHAPE_DEFAULTS.height).toBe(100);
    });

    it('should have default color', () => {
      expect(CREATE_SHAPE_DEFAULTS.color).toBe('#3b82f6');
    });
  });

  describe('CREATE_TEXT_DEFAULTS', () => {
    it('should have default font size', () => {
      expect(CREATE_TEXT_DEFAULTS.fontSize).toBe(20);
    });

    it('should have default color', () => {
      expect(CREATE_TEXT_DEFAULTS.color).toBe('#1f2937');
    });
  });

  describe('SHAPE_TYPES', () => {
    it('should include rectangle and ellipse', () => {
      expect(SHAPE_TYPES).toContain('rectangle');
      expect(SHAPE_TYPES).toContain('ellipse');
    });
  });
});
