/**
 * Tool Schemas Module
 *
 * Exports all AI tool schemas and related types.
 */

import { createStickyNoteSchema, CREATE_STICKY_NOTE_DEFAULTS } from './createStickyNote';
import { createShapeSchema, CREATE_SHAPE_DEFAULTS, SHAPE_TYPES } from './createShape';
import type { ShapeType } from './createShape';
import { createTextSchema, CREATE_TEXT_DEFAULTS } from './createText';
import { getBoardStateSchema } from './getBoardState';
import { moveObjectsSchema } from './moveObjects';
import { resizeObjectsSchema } from './resizeObjects';
import { changeColorSchema } from './changeColor';
import { deleteObjectsSchema } from './deleteObjects';

export type {
  ToolSchema,
  ToolParameter,
  SchemaParameterType,
} from './ToolSchema';
export { toOpenAITool } from './ToolSchema';

export {
  createStickyNoteSchema,
  CREATE_STICKY_NOTE_DEFAULTS,
  createShapeSchema,
  CREATE_SHAPE_DEFAULTS,
  SHAPE_TYPES,
  createTextSchema,
  CREATE_TEXT_DEFAULTS,
  getBoardStateSchema,
  moveObjectsSchema,
  resizeObjectsSchema,
  changeColorSchema,
  deleteObjectsSchema,
};
export type { ShapeType };

/**
 * All tool schemas in the system.
 */
export const ALL_TOOL_SCHEMAS = [
  createStickyNoteSchema,
  createShapeSchema,
  createTextSchema,
  getBoardStateSchema,
  moveObjectsSchema,
  resizeObjectsSchema,
  changeColorSchema,
  deleteObjectsSchema,
] as const;
