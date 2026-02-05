/**
 * Cylinder Shape Renderer
 *
 * Renders a cylinder (database) flowchart shape using Konva.
 * Used for data storage/database in flowcharts.
 */

import React from 'react';
import { Group, Ellipse, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Ellipse height factor (percentage of total height).
 */
const ELLIPSE_HEIGHT_FACTOR = 0.15;

/**
 * Renders a cylinder shape for flowchart database nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with cylinder parts
 */
function CylinderRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const ellipseHeight = height * ELLIPSE_HEIGHT_FACTOR;
  const bodyHeight = height - ellipseHeight * 2;
  const radiusX = width / 2;
  const radiusY = ellipseHeight;

  return (
    <Group
      x={x}
      y={y}
      shadowEnabled={shadowEnabled}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    >
      {/* Body (rectangle sides) */}
      <Line
        points={[0, ellipseHeight, 0, height - ellipseHeight, width, height - ellipseHeight, width, ellipseHeight]}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        closed={false}
      />
      
      {/* Bottom ellipse */}
      <Ellipse
        x={radiusX}
        y={height - ellipseHeight}
        radiusX={radiusX}
        radiusY={radiusY}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
      
      {/* Filled body */}
      <Line
        points={[0, ellipseHeight, 0, height - ellipseHeight, width, height - ellipseHeight, width, ellipseHeight]}
        fill={fill}
        opacity={opacity}
        closed={true}
        stroke="transparent"
        strokeWidth={0}
      />
      
      {/* Top ellipse (drawn last to appear on top) */}
      <Ellipse
        x={radiusX}
        y={ellipseHeight}
        radiusX={radiusX}
        radiusY={radiusY}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    </Group>
  );
}

/**
 * Cylinder shape definition for the registry.
 */
export const cylinderDefinition: ShapeDefinition = {
  type: 'cylinder',
  label: 'Cylinder',
  icon: '⬭',
  category: 'flowchart',
  defaultSize: { width: 80, height: 100 },
  render: CylinderRenderer,
  description: 'Database/Data storage node',
};
