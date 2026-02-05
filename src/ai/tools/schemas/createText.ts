/**
 * Create Text Tool Schema
 *
 * Defines the schema for creating text elements on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Default values for text creation.
 */
export const CREATE_TEXT_DEFAULTS = {
  x: 200,
  y: 200,
  fontSize: 20,
  color: '#1f2937',
} as const;

/**
 * Schema for the createText tool.
 */
export const createTextSchema: ToolSchema = {
  name: 'createText',
  description:
    'Create a standalone text element on the board. Text elements can be used for labels, titles, or annotations.',
  parameters: [
    {
      name: 'text',
      type: 'string',
      description: 'Text content to display',
      required: true,
    },
    {
      name: 'x',
      type: 'number',
      description:
        'X coordinate position on the board (pixels from left). Default is 200',
      required: false,
      default: CREATE_TEXT_DEFAULTS.x,
    },
    {
      name: 'y',
      type: 'number',
      description:
        'Y coordinate position on the board (pixels from top). Default is 200',
      required: false,
      default: CREATE_TEXT_DEFAULTS.y,
    },
    {
      name: 'fontSize',
      type: 'number',
      description: 'Font size in pixels. Default is 20',
      required: false,
      default: CREATE_TEXT_DEFAULTS.fontSize,
    },
    {
      name: 'color',
      type: 'string',
      description:
        'Text color (hex color code or named color). Default is dark gray (#1f2937)',
      required: false,
      default: CREATE_TEXT_DEFAULTS.color,
    },
  ],
};
