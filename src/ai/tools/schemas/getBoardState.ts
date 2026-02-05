/**
 * Get Board State Tool Schema
 *
 * Defines the schema for querying the current board state.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Schema for the getBoardState tool.
 */
export const getBoardStateSchema: ToolSchema = {
  name: 'getBoardState',
  description:
    'Get the current state of all objects on the board. Returns information about all sticky notes, shapes, text elements, and other objects including their positions, sizes, and contents. Use this to understand what is currently on the board before making changes.',
  parameters: [],
};
