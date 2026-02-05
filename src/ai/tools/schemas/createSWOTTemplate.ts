/**
 * Create SWOT Template Tool Schema
 *
 * Defines the schema for creating a SWOT analysis template on the board.
 * SWOT = Strengths, Weaknesses, Opportunities, Threats
 */

import type { ToolSchema } from './ToolSchema';

/**
 * SWOT quadrant configuration.
 */
export const SWOT_QUADRANTS = [
  { name: 'Strengths', color: '#22c55e', position: { row: 0, col: 0 } },
  { name: 'Weaknesses', color: '#ef4444', position: { row: 0, col: 1 } },
  { name: 'Opportunities', color: '#3b82f6', position: { row: 1, col: 0 } },
  { name: 'Threats', color: '#f97316', position: { row: 1, col: 1 } },
] as const;

/**
 * Default values for SWOT template.
 */
export const CREATE_SWOT_TEMPLATE_DEFAULTS = {
  x: 100,
  y: 100,
  quadrantWidth: 300,
  quadrantHeight: 250,
  gap: 10,
} as const;

/**
 * Schema for the createSWOTTemplate tool.
 */
export const createSWOTTemplateSchema: ToolSchema = {
  name: 'createSWOTTemplate',
  description:
    'Create a SWOT analysis template with 4 frames arranged in a 2x2 grid. Frames are labeled Strengths (green), Weaknesses (red), Opportunities (blue), and Threats (orange).',
  parameters: [
    {
      name: 'x',
      type: 'number',
      description: 'X position for the top-left corner of the template. Default is 100',
      required: false,
      default: CREATE_SWOT_TEMPLATE_DEFAULTS.x,
    },
    {
      name: 'y',
      type: 'number',
      description: 'Y position for the top-left corner of the template. Default is 100',
      required: false,
      default: CREATE_SWOT_TEMPLATE_DEFAULTS.y,
    },
    {
      name: 'quadrantWidth',
      type: 'number',
      description: 'Width of each quadrant in pixels. Default is 300',
      required: false,
      default: CREATE_SWOT_TEMPLATE_DEFAULTS.quadrantWidth,
    },
    {
      name: 'quadrantHeight',
      type: 'number',
      description: 'Height of each quadrant in pixels. Default is 250',
      required: false,
      default: CREATE_SWOT_TEMPLATE_DEFAULTS.quadrantHeight,
    },
  ],
};
