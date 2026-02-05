/**
 * Tool Schema Base Types
 *
 * Defines the base types and interfaces for AI tool schemas.
 * These schemas are used by OpenAI's function calling API.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Parameter type for tool schemas.
 */
export type SchemaParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object';

/**
 * Parameter definition for a tool.
 */
export interface ToolParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: SchemaParameterType;
  /** Description for the AI */
  description: string;
  /** Whether the parameter is required */
  required: boolean;
  /** Enum values if applicable */
  enum?: string[];
  /** Default value if not provided */
  default?: unknown;
  /** For array types, the item type */
  items?: { type: SchemaParameterType };
}

/**
 * Tool schema definition.
 */
export interface ToolSchema {
  /** Tool name (function name) */
  name: string;
  /** Tool description for the AI */
  description: string;
  /** Tool parameters */
  parameters: ToolParameter[];
}

/**
 * Converts a ToolSchema to OpenAI's ChatCompletionTool format.
 *
 * @param schema - The tool schema to convert
 * @returns OpenAI-compatible tool definition
 */
export function toOpenAITool(schema: ToolSchema): ChatCompletionTool {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of schema.parameters) {
    const paramDef: Record<string, unknown> = {
      type: param.type,
      description: param.description,
    };

    if (param.enum) {
      paramDef.enum = param.enum;
    }

    if (param.type === 'array' && param.items) {
      paramDef.items = { type: param.items.type };
    }

    properties[param.name] = paramDef;

    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'function',
    function: {
      name: schema.name,
      description: schema.description,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    },
  };
}
