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
import { arrangeInGridSchema, ARRANGE_IN_GRID_DEFAULTS } from './arrangeInGrid';
import { spaceEvenlySchema, SPACE_EVENLY_DEFAULTS, SPACING_DIRECTIONS } from './spaceEvenly';
import type { SpacingDirection } from './spaceEvenly';
import { createSWOTTemplateSchema, CREATE_SWOT_TEMPLATE_DEFAULTS, SWOT_QUADRANTS } from './createSWOTTemplate';
import { createUserJourneyTemplateSchema, CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS, USER_JOURNEY_STAGES } from './createUserJourneyTemplate';

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
  arrangeInGridSchema,
  ARRANGE_IN_GRID_DEFAULTS,
  spaceEvenlySchema,
  SPACE_EVENLY_DEFAULTS,
  SPACING_DIRECTIONS,
  createSWOTTemplateSchema,
  CREATE_SWOT_TEMPLATE_DEFAULTS,
  SWOT_QUADRANTS,
  createUserJourneyTemplateSchema,
  CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS,
  USER_JOURNEY_STAGES,
};
export type { ShapeType, SpacingDirection };

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
  arrangeInGridSchema,
  spaceEvenlySchema,
  createSWOTTemplateSchema,
  createUserJourneyTemplateSchema,
] as const;
