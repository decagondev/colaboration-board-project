/**
 * Display Shape Renderer
 *
 * Renders a display flowchart shape using Konva.
 * A shape with pointed left side representing information display.
 */

import React from 'react';
import { Shape } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Point width factor (percentage of total width).
 */
const POINT_WIDTH_FACTOR = 0.15;

/**
 * Renders a display shape for flowchart display nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva custom shape
 */
function DisplayRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const pointWidth = width * POINT_WIDTH_FACTOR;
  const curveWidth = width * 0.2;

  return (
    <Shape
      x={x}
      y={y}
      width={width}
      height={height}
      sceneFunc={(context, shape) => {
        context.beginPath();
        context.moveTo(pointWidth, 0);
        context.lineTo(width - curveWidth, 0);
        context.quadraticCurveTo(width, 0, width, height / 2);
        context.quadraticCurveTo(width, height, width - curveWidth, height);
        context.lineTo(pointWidth, height);
        context.lineTo(0, height / 2);
        context.closePath();
        context.fillStrokeShape(shape);
      }}
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
 * Display shape definition for the registry.
 */
export const displayDefinition: ShapeDefinition = {
  type: 'display',
  label: 'Display',
  icon: '🖥',
  category: 'flowchart',
  defaultSize: { width: 120, height: 60 },
  render: DisplayRenderer,
  description: 'Information display node',
};
