/**
 * Create User Journey Template Tool Schema
 *
 * Defines the schema for creating a user journey map template on the board.
 */

import type { ToolSchema } from './ToolSchema';

/**
 * User journey stages configuration.
 */
export const USER_JOURNEY_STAGES = [
  { name: 'Awareness', color: '#8b5cf6' },
  { name: 'Consideration', color: '#6366f1' },
  { name: 'Decision', color: '#3b82f6' },
  { name: 'Retention', color: '#0ea5e9' },
  { name: 'Advocacy', color: '#06b6d4' },
] as const;

/**
 * Default values for user journey template.
 */
export const CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS = {
  x: 100,
  y: 200,
  stageWidth: 200,
  stageHeight: 300,
  spacing: 40,
} as const;

/**
 * Schema for the createUserJourneyTemplate tool.
 */
export const createUserJourneyTemplateSchema: ToolSchema = {
  name: 'createUserJourneyTemplate',
  description:
    'Create a user journey map template with 5 horizontal stages: Awareness, Consideration, Decision, Retention, and Advocacy. Stages are connected with arrows.',
  parameters: [
    {
      name: 'x',
      type: 'number',
      description: 'X position for the leftmost stage. Default is 100',
      required: false,
      default: CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.x,
    },
    {
      name: 'y',
      type: 'number',
      description: 'Y position for the stages. Default is 200',
      required: false,
      default: CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.y,
    },
    {
      name: 'stageWidth',
      type: 'number',
      description: 'Width of each stage in pixels. Default is 200',
      required: false,
      default: CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.stageWidth,
    },
    {
      name: 'stageHeight',
      type: 'number',
      description: 'Height of each stage in pixels. Default is 300',
      required: false,
      default: CREATE_USER_JOURNEY_TEMPLATE_DEFAULTS.stageHeight,
    },
  ],
};
