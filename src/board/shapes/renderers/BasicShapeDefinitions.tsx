/**
 * Basic Shape Definitions
 *
 * Definitions for basic shapes (rectangle, ellipse, line, triangle).
 * These are the original shapes that are rendered by ShapeComponent.
 */

import React from 'react';
import { Rect, Ellipse, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Renders a rectangle shape.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Rect
 */
function RectangleRenderer(props: ShapeRenderProps): React.ReactElement {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    cornerRadius = 0,
    opacity = 1,
    shadowEnabled = false,
    shadowColor = 'rgba(0, 0, 0, 0.3)',
    shadowBlur = 5,
    shadowOffsetX = 2,
    shadowOffsetY = 2,
  } = props;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cornerRadius={cornerRadius}
      opacity={opacity}
      shadowEnabled={shadowEnabled}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    />
  );
}

/**
 * Renders an ellipse shape.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Ellipse
 */
function EllipseRenderer(props: ShapeRenderProps): React.ReactElement {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    opacity = 1,
    shadowEnabled = false,
    shadowColor = 'rgba(0, 0, 0, 0.3)',
    shadowBlur = 5,
    shadowOffsetX = 2,
    shadowOffsetY = 2,
  } = props;

  return (
    <Ellipse
      x={x + width / 2}
      y={y + height / 2}
      radiusX={width / 2}
      radiusY={height / 2}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      shadowEnabled={shadowEnabled}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    />
  );
}

/**
 * Renders a triangle shape.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Line (polygon)
 */
function TriangleRenderer(props: ShapeRenderProps): React.ReactElement {
  const {
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    opacity = 1,
    shadowEnabled = false,
    shadowColor = 'rgba(0, 0, 0, 0.3)',
    shadowBlur = 5,
    shadowOffsetX = 2,
    shadowOffsetY = 2,
  } = props;

  const points = [width / 2, 0, width, height, 0, height];

  return (
    <Line
      x={x}
      y={y}
      points={points}
      closed={true}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      shadowEnabled={shadowEnabled}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    />
  );
}

/**
 * Renders a line shape.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Line
 */
function LineRenderer(props: ShapeRenderProps): React.ReactElement {
  const {
    x,
    y,
    width,
    height,
    stroke,
    strokeWidth,
    opacity = 1,
    shadowEnabled = false,
    shadowColor = 'rgba(0, 0, 0, 0.3)',
    shadowBlur = 5,
    shadowOffsetX = 2,
    shadowOffsetY = 2,
  } = props;

  const points = [0, 0, width, height];

  return (
    <Line
      x={x}
      y={y}
      points={points}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      shadowEnabled={shadowEnabled}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    />
  );
}

/**
 * Rectangle shape definition.
 */
export const rectangleDefinition: ShapeDefinition = {
  type: 'rectangle',
  label: 'Rectangle',
  icon: '▢',
  category: 'basic',
  defaultSize: { width: 100, height: 80 },
  render: RectangleRenderer,
  shortcut: 'R',
  description: 'Basic rectangle shape',
};

/**
 * Ellipse shape definition.
 */
export const ellipseDefinition: ShapeDefinition = {
  type: 'ellipse',
  label: 'Ellipse',
  icon: '○',
  category: 'basic',
  defaultSize: { width: 100, height: 80 },
  render: EllipseRenderer,
  shortcut: 'O',
  description: 'Basic ellipse/circle shape',
};

/**
 * Triangle shape definition.
 */
export const triangleDefinition: ShapeDefinition = {
  type: 'triangle',
  label: 'Triangle',
  icon: '△',
  category: 'basic',
  defaultSize: { width: 100, height: 87 },
  render: TriangleRenderer,
  description: 'Basic triangle shape',
};

/**
 * Line shape definition.
 */
export const lineDefinition: ShapeDefinition = {
  type: 'line',
  label: 'Line',
  icon: '╲',
  category: 'basic',
  defaultSize: { width: 100, height: 2 },
  render: LineRenderer,
  description: 'Basic line shape',
};

/**
 * All basic shape definitions.
 */
export const basicShapeDefinitions: ShapeDefinition[] = [
  rectangleDefinition,
  ellipseDefinition,
  triangleDefinition,
  lineDefinition,
];
