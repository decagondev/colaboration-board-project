/**
 * UML Interface Shape Renderer
 *
 * Renders a UML interface symbol (lollipop notation).
 * Represents an interface that a class provides or requires.
 *
 * @module board/shapes/renderers/UmlInterfaceRenderer
 */

import React from 'react';
import { Group, Circle, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Proportions for the interface lollipop.
 */
const INTERFACE_PROPORTIONS = {
  circleRadius: 0.25,
  stemStart: 0.5,
};

/**
 * Renders a UML interface lollipop shape.
 * A circle connected to a vertical stem line.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with circle and line
 */
function UmlInterfaceRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const centerX = width / 2;
  const circleRadius = Math.min(width, height) * INTERFACE_PROPORTIONS.circleRadius;
  const circleCenterY = circleRadius;
  const stemStartY = circleRadius * 2;

  return (
    <Group
      x={x}
      y={y}
      opacity={opacity}
      shadowEnabled={shadowEnabled}
      shadowColor={shadowColor}
      shadowBlur={shadowBlur}
      shadowOffsetX={shadowOffsetX}
      shadowOffsetY={shadowOffsetY}
    >
      {/* Interface circle */}
      <Circle
        x={centerX}
        y={circleCenterY}
        radius={circleRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Stem line */}
      <Line
        points={[centerX, stemStartY, centerX, height]}
        stroke={stroke}
        strokeWidth={strokeWidth + 1}
        lineCap="round"
      />
    </Group>
  );
}

/**
 * UML Interface shape definition for the registry.
 */
export const umlInterfaceDefinition: ShapeDefinition = {
  type: 'uml-interface',
  label: 'Interface',
  icon: '○',
  category: 'uml',
  defaultSize: { width: 40, height: 60 },
  render: UmlInterfaceRenderer,
  description: 'UML interface lollipop notation',
};
