/**
 * Delete Objects Tool Schema
 *
 * Defines the schema for deleting objects from the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Schema for the deleteObjects tool.
 */
export const deleteObjectsSchema: ToolSchema = {
  name: 'deleteObjects',
  description:
    'Delete one or more objects from the board. This action cannot be undone through the AI, but may be undone through regular undo functionality.',
  parameters: [
    {
      name: 'objectIds',
      type: 'array',
      description: 'Array of object IDs to delete',
      required: true,
      items: { type: 'string' },
    },
  ],
};
