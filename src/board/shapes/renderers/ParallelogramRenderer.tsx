/**
 * Parallelogram Shape Renderer
 *
 * Renders a parallelogram (I/O) flowchart shape using Konva.
 * Used for input/output operations in flowcharts.
 */

import React from 'react';
import { Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Skew factor for parallelogram (percentage of width).
 */
const SKEW_FACTOR = 0.2;

/**
 * Renders a parallelogram shape for flowchart I/O nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Line (polygon)
 */
function ParallelogramRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const skewOffset = width * SKEW_FACTOR;

  const points = [
    skewOffset,
    0,
    width,
    0,
    width - skewOffset,
    height,
    0,
    height,
  ];

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
 * Parallelogram shape definition for the registry.
 */
export const parallelogramDefinition: ShapeDefinition = {
  type: 'parallelogram',
  label: 'Parallelogram',
  icon: '▱',
  category: 'flowchart',
  defaultSize: { width: 120, height: 60 },
  render: ParallelogramRenderer,
  description: 'Input/Output operation node',
};
