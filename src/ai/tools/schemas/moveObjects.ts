/**
 * Move Objects Tool Schema
 *
 * Defines the schema for moving objects on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Schema for the moveObjects tool.
 */
export const moveObjectsSchema: ToolSchema = {
  name: 'moveObjects',
  description:
    'Move one or more objects by a specified delta amount. The objects will be moved relative to their current positions.',
  parameters: [
    {
      name: 'objectIds',
      type: 'array',
      description: 'Array of object IDs to move',
      required: true,
      items: { type: 'string' },
    },
    {
      name: 'deltaX',
      type: 'number',
      description:
        'Amount to move horizontally in pixels. Positive moves right, negative moves left',
      required: true,
    },
    {
      name: 'deltaY',
      type: 'number',
      description:
        'Amount to move vertically in pixels. Positive moves down, negative moves up',
      required: true,
    },
  ],
};
