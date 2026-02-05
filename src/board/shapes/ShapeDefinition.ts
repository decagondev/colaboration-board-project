/**
 * Shape Definition Interface
 *
 * Defines the contract for shape definitions used by the ShapeRegistry.
 * Follows Interface Segregation Principle (ISP) with focused responsibilities.
 */

import type { ReactElement } from 'react';

/**
 * All supported shape types.
 * Includes basic shapes and flowchart shapes.
 */
export type ShapeType =
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'triangle'
  | 'diamond'
  | 'parallelogram'
  | 'cylinder'
  | 'document'
  | 'process'
  | 'terminator'
  | 'delay'
  | 'manual-input'
  | 'display'
  | 'connector-shape';

/**
 * Shape category for grouping in the UI.
 */
export type ShapeCategory = 'basic' | 'flowchart';

/**
 * Props passed to shape render functions.
 */
export interface ShapeRenderProps {
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width of the shape */
  width: number;
  /** Height of the shape */
  height: number;
  /** Fill color */
  fill: string;
  /** Stroke color */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Corner radius (for applicable shapes) */
  cornerRadius?: number;
  /** Whether the shape is selected */
  isSelected?: boolean;
  /** Opacity */
  opacity?: number;
  /** Shadow settings */
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

/**
 * Default size for a shape type.
 */
export interface ShapeDefaultSize {
  /** Default width */
  width: number;
  /** Default height */
  height: number;
}

/**
 * Shape definition interface.
 * Defines metadata and rendering for a shape type.
 */
export interface ShapeDefinition {
  /** Unique shape type identifier */
  type: ShapeType;
  /** Human-readable label */
  label: string;
  /** Icon character or emoji */
  icon: string;
  /** Category for grouping */
  category: ShapeCategory;
  /** Default size when created */
  defaultSize: ShapeDefaultSize;
  /** Render function that returns Konva elements */
  render: (props: ShapeRenderProps) => ReactElement;
  /** Optional keyboard shortcut */
  shortcut?: string;
  /** Description for tooltips */
  description?: string;
}

/**
 * Map of shape type to definition.
 */
export type ShapeDefinitionMap = Map<ShapeType, ShapeDefinition>;
