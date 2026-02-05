/**
 * Change Color Tool Schema
 *
 * Defines the schema for changing object colors on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Schema for the changeColor tool.
 */
export const changeColorSchema: ToolSchema = {
  name: 'changeColor',
  description:
    'Change the color of one or more objects. For shapes and sticky notes, this changes the fill/background color. For text elements, this changes the text color.',
  parameters: [
    {
      name: 'objectIds',
      type: 'array',
      description: 'Array of object IDs to change color',
      required: true,
      items: { type: 'string' },
    },
    {
      name: 'color',
      type: 'string',
      description:
        'New color (hex color code like #ff0000, or named color like red)',
      required: true,
    },
  ],
};
