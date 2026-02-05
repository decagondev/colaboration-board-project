/**
 * Connector Shape Renderer
 *
 * Renders a connector (circle) flowchart shape using Konva.
 * A small circle used to connect different parts of a flowchart.
 */

import React from 'react';
import { Circle } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Renders a connector shape (circle) for flowchart connector nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Circle
 */
function ConnectorRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const radius = Math.min(width, height) / 2;

  return (
    <Circle
      x={x + width / 2}
      y={y + height / 2}
      radius={radius}
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
 * Connector shape definition for the registry.
 */
export const connectorShapeDefinition: ShapeDefinition = {
  type: 'connector-shape',
  label: 'Connector',
  icon: '○',
  category: 'flowchart',
  defaultSize: { width: 40, height: 40 },
  render: ConnectorRenderer,
  description: 'Flowchart connector node',
};
