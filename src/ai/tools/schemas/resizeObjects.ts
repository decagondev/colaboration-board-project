/**
 * Resize Objects Tool Schema
 *
 * Defines the schema for resizing objects on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Schema for the resizeObjects tool.
 */
export const resizeObjectsSchema: ToolSchema = {
  name: 'resizeObjects',
  description:
    'Resize one or more objects to specified dimensions. All specified objects will be set to the same width and height.',
  parameters: [
    {
      name: 'objectIds',
      type: 'array',
      description: 'Array of object IDs to resize',
      required: true,
      items: { type: 'string' },
    },
    {
      name: 'width',
      type: 'number',
      description: 'New width in pixels',
      required: true,
    },
    {
      name: 'height',
      type: 'number',
      description: 'New height in pixels',
      required: true,
    },
  ],
};
