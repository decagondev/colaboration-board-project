/**
 * Space Evenly Tool Schema
 *
 * Defines the schema for spacing objects evenly along a line.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Spacing direction types.
 */
export const SPACING_DIRECTIONS = ['horizontal', 'vertical'] as const;
export type SpacingDirection = (typeof SPACING_DIRECTIONS)[number];

/**
 * Default values for space evenly.
 */
export const SPACE_EVENLY_DEFAULTS = {
  direction: 'horizontal' as SpacingDirection,
  spacing: 30,
} as const;

/**
 * Schema for the spaceEvenly tool.
 */
export const spaceEvenlySchema: ToolSchema = {
  name: 'spaceEvenly',
  description:
    'Distribute objects evenly along a horizontal or vertical line. Maintains their relative order while adjusting spacing.',
  parameters: [
    {
      name: 'objectIds',
      type: 'array',
      description: 'Array of object IDs to space evenly',
      required: true,
      items: { type: 'string' },
    },
    {
      name: 'direction',
      type: 'string',
      description: 'Direction to space objects: horizontal or vertical',
      required: false,
      enum: [...SPACING_DIRECTIONS],
      default: SPACE_EVENLY_DEFAULTS.direction,
    },
    {
      name: 'spacing',
      type: 'number',
      description: 'Spacing between objects in pixels. Default is 30',
      required: false,
      default: SPACE_EVENLY_DEFAULTS.spacing,
    },
  ],
};
