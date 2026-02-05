/**
 * UML Lifeline Shape Renderer
 *
 * Renders a UML lifeline for sequence diagrams.
 * Consists of a rectangle (object) on top with a dashed vertical line below.
 *
 * @module board/shapes/renderers/UmlLifelineRenderer
 */

import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Proportions for the lifeline shape.
 */
const LIFELINE_PROPORTIONS = {
  headHeight: 0.2,
  dashLength: 8,
  dashGap: 6,
};

/**
 * Renders a UML lifeline shape for sequence diagrams.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with rect and dashed line
 */
function UmlLifelineRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const headHeight = height * LIFELINE_PROPORTIONS.headHeight;
  const centerX = width / 2;
  const lineStartY = headHeight;

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
      {/* Object/participant head rectangle */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={headHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Dashed lifeline */}
      <Line
        points={[centerX, lineStartY, centerX, height]}
        stroke={stroke}
        strokeWidth={strokeWidth}
        dash={[LIFELINE_PROPORTIONS.dashLength, LIFELINE_PROPORTIONS.dashGap]}
        lineCap="round"
      />
    </Group>
  );
}

/**
 * UML Lifeline shape definition for the registry.
 */
export const umlLifelineDefinition: ShapeDefinition = {
  type: 'uml-lifeline',
  label: 'Lifeline',
  icon: '┃',
  category: 'uml',
  defaultSize: { width: 80, height: 200 },
  render: UmlLifelineRenderer,
  description: 'UML lifeline for sequence diagrams',
};
