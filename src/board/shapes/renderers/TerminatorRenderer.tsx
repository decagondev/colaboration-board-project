/**
 * Terminator Shape Renderer
 *
 * Renders a terminator (start/end) flowchart shape using Konva.
 * A rounded rectangle/pill shape representing start or end of a process.
 */

import React from 'react';
import { Rect } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Renders a terminator shape (rounded rectangle) for flowchart start/end nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Rect with full rounded corners
 */
function TerminatorRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const cornerRadius = height / 2;

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
 * Terminator shape definition for the registry.
 */
export const terminatorDefinition: ShapeDefinition = {
  type: 'terminator',
  label: 'Terminator',
  icon: '⬭',
  category: 'flowchart',
  defaultSize: { width: 120, height: 50 },
  render: TerminatorRenderer,
  description: 'Start/End terminal node',
};
