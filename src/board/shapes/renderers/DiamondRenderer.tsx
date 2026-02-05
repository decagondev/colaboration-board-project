/**
 * Diamond Shape Renderer
 *
 * Renders a diamond (decision) flowchart shape using Konva.
 * Used for decision/conditional branching in flowcharts.
 */

import React from 'react';
import { Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Renders a diamond shape for flowchart decision nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Line (polygon)
 */
function DiamondRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const points = [
    width / 2,
    0,
    width,
    height / 2,
    width / 2,
    height,
    0,
    height / 2,
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
 * Diamond shape definition for the registry.
 */
export const diamondDefinition: ShapeDefinition = {
  type: 'diamond',
  label: 'Diamond',
  icon: '◇',
  category: 'flowchart',
  defaultSize: { width: 100, height: 100 },
  render: DiamondRenderer,
  description: 'Decision/conditional branching node',
};
