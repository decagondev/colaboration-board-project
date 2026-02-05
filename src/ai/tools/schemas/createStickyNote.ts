/**
 * Create Sticky Note Tool Schema
 *
 * Defines the schema for creating sticky notes on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Default values for sticky note creation.
 */
export const CREATE_STICKY_NOTE_DEFAULTS = {
  color: '#fef08a',
  x: 200,
  y: 200,
  width: 200,
  height: 200,
  fontSize: 16,
} as const;

/**
 * Schema for the createStickyNote tool.
 */
export const createStickyNoteSchema: ToolSchema = {
  name: 'createStickyNote',
  description:
    'Create a new sticky note on the board with text content. Sticky notes are rectangular cards that can contain text and have colored backgrounds.',
  parameters: [
    {
      name: 'text',
      type: 'string',
      description: 'Text content to display on the sticky note',
      required: true,
    },
    {
      name: 'color',
      type: 'string',
      description:
        'Background color of the sticky note (hex color code or named color). Default is yellow (#fef08a)',
      required: false,
      default: CREATE_STICKY_NOTE_DEFAULTS.color,
    },
    {
      name: 'x',
      type: 'number',
      description:
        'X coordinate position on the board (pixels from left). Default is 200',
      required: false,
      default: CREATE_STICKY_NOTE_DEFAULTS.x,
    },
    {
      name: 'y',
      type: 'number',
      description:
        'Y coordinate position on the board (pixels from top). Default is 200',
      required: false,
      default: CREATE_STICKY_NOTE_DEFAULTS.y,
    },
  ],
};
