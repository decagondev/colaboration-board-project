/**
 * UML Component Shape Renderer
 *
 * Renders a UML component shape with two small rectangles on the left side.
 * Represents a modular, deployable part of a system.
 *
 * @module board/shapes/renderers/UmlComponentRenderer
 */

import React from 'react';
import { Group, Rect } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Proportions for the component shape.
 */
const COMPONENT_PROPORTIONS = {
  plugWidth: 0.12,
  plugHeight: 0.15,
  plugIndent: 0.06,
};

/**
 * Renders a UML component shape with interface plugs.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with rectangles
 */
function UmlComponentRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const plugWidth = width * COMPONENT_PROPORTIONS.plugWidth;
  const plugHeight = height * COMPONENT_PROPORTIONS.plugHeight;
  const plugIndent = width * COMPONENT_PROPORTIONS.plugIndent;

  const plug1Y = height * 0.25 - plugHeight / 2;
  const plug2Y = height * 0.55 - plugHeight / 2;

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
      {/* Main component body */}
      <Rect
        x={plugIndent}
        y={0}
        width={width - plugIndent}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Top plug (interface socket) */}
      <Rect
        x={0}
        y={plug1Y}
        width={plugWidth}
        height={plugHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Bottom plug (interface socket) */}
      <Rect
        x={0}
        y={plug2Y}
        width={plugWidth}
        height={plugHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}

/**
 * UML Component shape definition for the registry.
 */
export const umlComponentDefinition: ShapeDefinition = {
  type: 'uml-component',
  label: 'Component',
  icon: '🧩',
  category: 'uml',
  defaultSize: { width: 120, height: 80 },
  render: UmlComponentRenderer,
  description: 'UML component representing a modular system part',
};
