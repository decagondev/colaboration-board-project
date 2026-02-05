/**
 * Process Shape Renderer
 *
 * Renders a process flowchart shape using Konva.
 * A simple rectangle representing a process step.
 */

import React from 'react';
import { Rect } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Renders a process shape (rectangle) for flowchart process nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Rect
 */
function ProcessRenderer(props: ShapeRenderProps): React.ReactElement {
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
 * Process shape definition for the registry.
 */
export const processDefinition: ShapeDefinition = {
  type: 'process',
  label: 'Process',
  icon: '▭',
  category: 'flowchart',
  defaultSize: { width: 120, height: 60 },
  render: ProcessRenderer,
  description: 'Process/Action step node',
};
