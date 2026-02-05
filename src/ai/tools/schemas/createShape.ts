/**
 * Create Shape Tool Schema
 *
 * Defines the schema for creating shapes on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * Supported shape types.
 */
export const SHAPE_TYPES = ['rectangle', 'ellipse'] as const;
export type ShapeType = (typeof SHAPE_TYPES)[number];

/**
 * Default values for shape creation.
 */
export const CREATE_SHAPE_DEFAULTS = {
  x: 200,
  y: 200,
  width: 150,
  height: 100,
  color: '#3b82f6',
} as const;

/**
 * Schema for the createShape tool.
 */
export const createShapeSchema: ToolSchema = {
  name: 'createShape',
  description:
    'Create a shape (rectangle or ellipse) on the board. Shapes can be used for containers, diagrams, or visual elements.',
  parameters: [
    {
      name: 'shapeType',
      type: 'string',
      description: 'Type of shape to create: rectangle or ellipse',
      required: true,
      enum: [...SHAPE_TYPES],
    },
    {
      name: 'x',
      type: 'number',
      description:
        'X coordinate position on the board (pixels from left). Default is 200',
      required: false,
      default: CREATE_SHAPE_DEFAULTS.x,
    },
    {
      name: 'y',
      type: 'number',
      description:
        'Y coordinate position on the board (pixels from top). Default is 200',
      required: false,
      default: CREATE_SHAPE_DEFAULTS.y,
    },
    {
      name: 'width',
      type: 'number',
      description: 'Width of the shape in pixels. Default is 150',
      required: false,
      default: CREATE_SHAPE_DEFAULTS.width,
    },
    {
      name: 'height',
      type: 'number',
      description: 'Height of the shape in pixels. Default is 100',
      required: false,
      default: CREATE_SHAPE_DEFAULTS.height,
    },
    {
      name: 'color',
      type: 'string',
      description:
        'Fill color of the shape (hex color code or named color). Default is blue (#3b82f6)',
      required: false,
      default: CREATE_SHAPE_DEFAULTS.color,
    },
  ],
};
