/**
 * Tool Executor Module
 *
 * Provides the registry and execution logic for AI tools.
 * Each tool executor implements the board manipulation for a specific tool.
 */

import type {
  IBoardStateService,
  AICommandResult,
  ToolCall,
} from '../../interfaces/IAIService';
import {
  CREATE_STICKY_NOTE_DEFAULTS,
  CREATE_SHAPE_DEFAULTS,
  CREATE_TEXT_DEFAULTS,
  ARRANGE_IN_GRID_DEFAULTS,
  SPACE_EVENLY_DEFAULTS,
  CREATE_SWOT_TEMPLATE_DEFAULTS,
  SWOT_QUADRANTS,
  CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS,
  USER_JOURNEY_STAGES,
} from '../schemas';

/**
 * Tool executor function type.
 */
export type ToolExecutorFn = (
  args: Record<string, unknown>,
  boardService: IBoardStateService
) => Promise<AICommandResult>;

/**
 * Tool executor registry.
 * Maps tool names to their execution functions.
 */
export class ToolExecutorRegistry {
  private executors: Map<string, ToolExecutorFn> = new Map();

  /**
   * Creates a new ToolExecutorRegistry with all built-in executors registered.
   */
  constructor() {
    this.registerBuiltInExecutors();
  }

  /**
   * Register a tool executor.
   *
   * @param name - Tool name
   * @param executor - Executor function
   */
  register(name: string, executor: ToolExecutorFn): void {
    this.executors.set(name, executor);
  }

  /**
   * Get an executor by tool name.
   *
   * @param name - Tool name
   * @returns Executor function or undefined if not found
   */
  get(name: string): ToolExecutorFn | undefined {
    return this.executors.get(name);
  }

  /**
   * Check if a tool executor is registered.
   *
   * @param name - Tool name
   * @returns True if executor exists
   */
  has(name: string): boolean {
    return this.executors.has(name);
  }

  /**
   * Execute a tool call.
   *
   * @param toolCall - Tool call to execute
   * @param boardService - Board state service
   * @returns Execution result
   */
  async execute(
    toolCall: ToolCall,
    boardService: IBoardStateService
  ): Promise<AICommandResult> {
    const executor = this.executors.get(toolCall.name);

    if (!executor) {
      return {
        success: false,
        message: `Unknown tool: ${toolCall.name}`,
        toolCalls: [toolCall],
        errors: [`Tool "${toolCall.name}" is not registered`],
      };
    }

    try {
      return await executor(toolCall.arguments, boardService);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Failed to execute ${toolCall.name}`,
        toolCalls: [toolCall],
        errors: [errorMessage],
      };
    }
  }

  /**
   * Get all registered tool names.
   *
   * @returns Array of tool names
   */
  getToolNames(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Register all built-in tool executors.
   */
  private registerBuiltInExecutors(): void {
    this.register('createStickyNote', executeCreateStickyNote);
    this.register('createShape', executeCreateShape);
    this.register('createText', executeCreateText);
    this.register('getBoardState', executeGetBoardState);
    this.register('moveObjects', executeMoveObjects);
    this.register('resizeObjects', executeResizeObjects);
    this.register('changeColor', executeChangeColor);
    this.register('deleteObjects', executeDeleteObjects);
    this.register('arrangeInGrid', executeArrangeInGrid);
    this.register('spaceEvenly', executeSpaceEvenly);
    this.register('createSWOTTemplate', executeCreateSWOTTemplate);
    this.register('createUserJourneyTemplate', executeCreateUserJourneyTemplate);
  }
}

/**
 * Execute createStickyNote tool.
 */
async function executeCreateStickyNote(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const id = await boardService.createObject({
    type: 'sticky-note',
    x: (args.x as number) ?? CREATE_STICKY_NOTE_DEFAULTS.x,
    y: (args.y as number) ?? CREATE_STICKY_NOTE_DEFAULTS.y,
    width: CREATE_STICKY_NOTE_DEFAULTS.width,
    height: CREATE_STICKY_NOTE_DEFAULTS.height,
    data: {
      text: args.text as string,
      color: args.color ?? CREATE_STICKY_NOTE_DEFAULTS.color,
      fontSize: CREATE_STICKY_NOTE_DEFAULTS.fontSize,
    },
  });

  return {
    success: true,
    message: `Created sticky note with text "${args.text}"`,
    toolCalls: [],
    affectedObjects: [id],
  };
}

/**
 * Execute createShape tool.
 */
async function executeCreateShape(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const id = await boardService.createObject({
    type: 'shape',
    x: (args.x as number) ?? CREATE_SHAPE_DEFAULTS.x,
    y: (args.y as number) ?? CREATE_SHAPE_DEFAULTS.y,
    width: (args.width as number) ?? CREATE_SHAPE_DEFAULTS.width,
    height: (args.height as number) ?? CREATE_SHAPE_DEFAULTS.height,
    data: {
      shapeType: args.shapeType as string,
      color: args.color ?? CREATE_SHAPE_DEFAULTS.color,
    },
  });

  return {
    success: true,
    message: `Created ${args.shapeType} shape`,
    toolCalls: [],
    affectedObjects: [id],
  };
}

/**
 * Execute createText tool.
 */
async function executeCreateText(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const id = await boardService.createObject({
    type: 'text',
    x: (args.x as number) ?? CREATE_TEXT_DEFAULTS.x,
    y: (args.y as number) ?? CREATE_TEXT_DEFAULTS.y,
    width: 200,
    height: 50,
    data: {
      text: args.text as string,
      color: args.color ?? CREATE_TEXT_DEFAULTS.color,
      fontSize: (args.fontSize as number) ?? CREATE_TEXT_DEFAULTS.fontSize,
    },
  });

  return {
    success: true,
    message: `Created text "${args.text}"`,
    toolCalls: [],
    affectedObjects: [id],
  };
}

/**
 * Execute getBoardState tool.
 */
async function executeGetBoardState(
  _args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objects = boardService.getObjects();
  const summary =
    objects.length === 0
      ? 'The board is empty.'
      : `Found ${objects.length} objects on the board.`;

  return {
    success: true,
    message: summary,
    toolCalls: [],
  };
}

/**
 * Execute moveObjects tool.
 */
async function executeMoveObjects(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objectIds = args.objectIds as string[];
  const deltaX = args.deltaX as number;
  const deltaY = args.deltaY as number;

  for (const id of objectIds) {
    const obj = boardService.getObject(id);
    if (obj) {
      await boardService.updateObject(id, {
        x: obj.x + deltaX,
        y: obj.y + deltaY,
      });
    }
  }

  return {
    success: true,
    message: `Moved ${objectIds.length} object(s) by (${deltaX}, ${deltaY})`,
    toolCalls: [],
    affectedObjects: objectIds,
  };
}

/**
 * Execute resizeObjects tool.
 */
async function executeResizeObjects(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objectIds = args.objectIds as string[];
  const width = args.width as number;
  const height = args.height as number;

  for (const id of objectIds) {
    await boardService.updateObject(id, { width, height });
  }

  return {
    success: true,
    message: `Resized ${objectIds.length} object(s) to ${width}x${height}`,
    toolCalls: [],
    affectedObjects: objectIds,
  };
}

/**
 * Execute changeColor tool.
 */
async function executeChangeColor(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objectIds = args.objectIds as string[];
  const color = args.color as string;

  for (const id of objectIds) {
    const obj = boardService.getObject(id);
    if (obj) {
      await boardService.updateObject(id, {
        data: { ...obj.data, color },
      });
    }
  }

  return {
    success: true,
    message: `Changed color of ${objectIds.length} object(s) to ${color}`,
    toolCalls: [],
    affectedObjects: objectIds,
  };
}

/**
 * Execute deleteObjects tool.
 */
async function executeDeleteObjects(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objectIds = args.objectIds as string[];

  await boardService.deleteObjects(objectIds);

  return {
    success: true,
    message: `Deleted ${objectIds.length} object(s)`,
    toolCalls: [],
    affectedObjects: objectIds,
  };
}

/**
 * Execute arrangeInGrid tool.
 */
async function executeArrangeInGrid(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objectIds = args.objectIds as string[];
  const columns = (args.columns as number) ?? ARRANGE_IN_GRID_DEFAULTS.columns;
  const spacing = (args.spacing as number) ?? ARRANGE_IN_GRID_DEFAULTS.spacing;
  const startX = (args.startX as number) ?? ARRANGE_IN_GRID_DEFAULTS.startX;
  const startY = (args.startY as number) ?? ARRANGE_IN_GRID_DEFAULTS.startY;

  const objects = objectIds
    .map((id) => boardService.getObject(id))
    .filter((obj): obj is NonNullable<typeof obj> => obj !== undefined);

  if (objects.length === 0) {
    return {
      success: false,
      message: 'No valid objects found to arrange',
      toolCalls: [],
      errors: ['No objects found with the specified IDs'],
    };
  }

  const maxWidth = Math.max(...objects.map((obj) => obj.width));
  const maxHeight = Math.max(...objects.map((obj) => obj.height));

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const col = i % columns;
    const row = Math.floor(i / columns);

    const newX = startX + col * (maxWidth + spacing);
    const newY = startY + row * (maxHeight + spacing);

    await boardService.updateObject(obj.id, { x: newX, y: newY });
  }

  return {
    success: true,
    message: `Arranged ${objects.length} object(s) in a ${columns}-column grid`,
    toolCalls: [],
    affectedObjects: objectIds,
  };
}

/**
 * Execute spaceEvenly tool.
 */
async function executeSpaceEvenly(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const objectIds = args.objectIds as string[];
  const direction =
    (args.direction as string) ?? SPACE_EVENLY_DEFAULTS.direction;
  const spacing = (args.spacing as number) ?? SPACE_EVENLY_DEFAULTS.spacing;

  const objects = objectIds
    .map((id) => boardService.getObject(id))
    .filter((obj): obj is NonNullable<typeof obj> => obj !== undefined);

  if (objects.length < 2) {
    return {
      success: false,
      message: 'Need at least 2 objects to space evenly',
      toolCalls: [],
      errors: ['Insufficient objects for spacing'],
    };
  }

  const isHorizontal = direction === 'horizontal';
  const sortedObjects = [...objects].sort((a, b) =>
    isHorizontal ? a.x - b.x : a.y - b.y
  );

  let currentPosition = isHorizontal ? sortedObjects[0].x : sortedObjects[0].y;

  for (const obj of sortedObjects) {
    if (isHorizontal) {
      await boardService.updateObject(obj.id, { x: currentPosition });
      currentPosition += obj.width + spacing;
    } else {
      await boardService.updateObject(obj.id, { y: currentPosition });
      currentPosition += obj.height + spacing;
    }
  }

  return {
    success: true,
    message: `Spaced ${objects.length} object(s) evenly ${direction}ly`,
    toolCalls: [],
    affectedObjects: objectIds,
  };
}

/**
 * Execute createSWOTTemplate tool.
 */
async function executeCreateSWOTTemplate(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const x = (args.x as number) ?? CREATE_SWOT_TEMPLATE_DEFAULTS.x;
  const y = (args.y as number) ?? CREATE_SWOT_TEMPLATE_DEFAULTS.y;
  const quadrantWidth =
    (args.quadrantWidth as number) ?? CREATE_SWOT_TEMPLATE_DEFAULTS.quadrantWidth;
  const quadrantHeight =
    (args.quadrantHeight as number) ?? CREATE_SWOT_TEMPLATE_DEFAULTS.quadrantHeight;
  const gap = CREATE_SWOT_TEMPLATE_DEFAULTS.gap;

  const createdIds: string[] = [];

  for (const quadrant of SWOT_QUADRANTS) {
    const posX = x + quadrant.position.col * (quadrantWidth + gap);
    const posY = y + quadrant.position.row * (quadrantHeight + gap);

    const frameId = await boardService.createObject({
      type: 'shape',
      x: posX,
      y: posY,
      width: quadrantWidth,
      height: quadrantHeight,
      data: {
        shapeType: 'rectangle',
        color: quadrant.color,
        opacity: 0.2,
      },
    });
    createdIds.push(frameId);

    const labelId = await boardService.createObject({
      type: 'text',
      x: posX + 10,
      y: posY + 10,
      width: quadrantWidth - 20,
      height: 30,
      data: {
        text: quadrant.name,
        fontSize: 18,
        fontWeight: 'bold',
        color: quadrant.color,
      },
    });
    createdIds.push(labelId);
  }

  return {
    success: true,
    message: 'Created SWOT analysis template with 4 quadrants',
    toolCalls: [],
    affectedObjects: createdIds,
  };
}

/**
 * Execute createUserJourneyTemplate tool.
 */
async function executeCreateUserJourneyTemplate(
  args: Record<string, unknown>,
  boardService: IBoardStateService
): Promise<AICommandResult> {
  const x = (args.x as number) ?? CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.x;
  const y = (args.y as number) ?? CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.y;
  const stageWidth =
    (args.stageWidth as number) ?? CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.stageWidth;
  const stageHeight =
    (args.stageHeight as number) ?? CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.stageHeight;
  const spacing = CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.spacing;

  const createdIds: string[] = [];

  for (let i = 0; i < USER_JOURNEY_STAGES.length; i++) {
    const stage = USER_JOURNEY_STAGES[i];
    const stageX = x + i * (stageWidth + spacing);

    const frameId = await boardService.createObject({
      type: 'shape',
      x: stageX,
      y: y,
      width: stageWidth,
      height: stageHeight,
      data: {
        shapeType: 'rectangle',
        color: stage.color,
        opacity: 0.15,
      },
    });
    createdIds.push(frameId);

    const labelId = await boardService.createObject({
      type: 'text',
      x: stageX + 10,
      y: y + 10,
      width: stageWidth - 20,
      height: 30,
      data: {
        text: stage.name,
        fontSize: 16,
        fontWeight: 'bold',
        color: stage.color,
      },
    });
    createdIds.push(labelId);
  }

  return {
    success: true,
    message: `Created user journey template with ${USER_JOURNEY_STAGES.length} stages`,
    toolCalls: [],
    affectedObjects: createdIds,
  };
}

/**
 * Default tool executor registry instance.
 */
export const defaultToolExecutorRegistry = new ToolExecutorRegistry();
