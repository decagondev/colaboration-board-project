/**
 * Delay Shape Renderer
 *
 * Renders a delay flowchart shape using Konva.
 * A D-shaped symbol representing a delay or wait in the process.
 */

import React from 'react';
import { Shape } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Renders a delay shape (D-shape) for flowchart delay nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva custom shape
 */
function DelayRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const curveWidth = width * 0.3;

  return (
    <Shape
      x={x}
      y={y}
      width={width}
      height={height}
      sceneFunc={(context, shape) => {
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(width - curveWidth, 0);
        context.quadraticCurveTo(width, 0, width, height / 2);
        context.quadraticCurveTo(width, height, width - curveWidth, height);
        context.lineTo(0, height);
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
 * Delay shape definition for the registry.
 */
export const delayDefinition: ShapeDefinition = {
  type: 'delay',
  label: 'Delay',
  icon: '⏸',
  category: 'flowchart',
  defaultSize: { width: 100, height: 60 },
  render: DelayRenderer,
  description: 'Delay/Wait operation node',
};
