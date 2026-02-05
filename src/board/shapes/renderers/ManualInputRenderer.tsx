/**
 * Manual Input Shape Renderer
 *
 * Renders a manual input flowchart shape using Konva.
 * A trapezoid with slanted top edge representing manual data entry.
 */

import React from 'react';
import { Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Slant height factor (percentage of total height).
 */
const SLANT_FACTOR = 0.2;

/**
 * Renders a manual input shape (slanted top trapezoid) for flowchart nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Line (polygon)
 */
function ManualInputRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const slantHeight = height * SLANT_FACTOR;

  const points = [
    0,
    slantHeight,
    width,
    0,
    width,
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
 * Manual input shape definition for the registry.
 */
export const manualInputDefinition: ShapeDefinition = {
  type: 'manual-input',
  label: 'Manual Input',
  icon: '⌨',
  category: 'flowchart',
  defaultSize: { width: 120, height: 60 },
  render: ManualInputRenderer,
  description: 'Manual data entry node',
};
