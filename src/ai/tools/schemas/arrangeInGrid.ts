/**
 * Arrange In Grid Tool Schema
 *
 * Defines the schema for arranging objects in a grid pattern.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Default values for grid arrangement.
 */
export const ARRANGE_IN_GRID_DEFAULTS = {
  columns: 3,
  spacing: 20,
  startX: 100,
  startY: 100,
} as const;

/**
 * Schema for the arrangeInGrid tool.
 */
export const arrangeInGridSchema: ToolSchema = {
  name: 'arrangeInGrid',
  description:
    'Arrange selected objects in a grid pattern with specified columns and spacing. Objects are arranged left-to-right, top-to-bottom.',
  parameters: [
    {
      name: 'objectIds',
      type: 'array',
      description: 'Array of object IDs to arrange',
      required: true,
      items: { type: 'string' },
    },
    {
      name: 'columns',
      type: 'number',
      description: 'Number of columns in the grid. Default is 3',
      required: false,
      default: ARRANGE_IN_GRID_DEFAULTS.columns,
    },
    {
      name: 'spacing',
      type: 'number',
      description: 'Spacing between objects in pixels. Default is 20',
      required: false,
      default: ARRANGE_IN_GRID_DEFAULTS.spacing,
    },
    {
      name: 'startX',
      type: 'number',
      description: 'Starting X position for the grid. Default is 100',
      required: false,
      default: ARRANGE_IN_GRID_DEFAULTS.startX,
    },
    {
      name: 'startY',
      type: 'number',
      description: 'Starting Y position for the grid. Default is 100',
      required: false,
      default: ARRANGE_IN_GRID_DEFAULTS.startY,
    },
  ],
};
