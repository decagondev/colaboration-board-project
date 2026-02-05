/**
 * UML Actor Shape Renderer
 *
 * Renders a UML actor (stick figure) for use case diagrams.
 * Represents a user or external system interacting with the system.
 *
 * @module board/shapes/renderers/UmlActorRenderer
 */

import React from 'react';
import { Group, Circle, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Proportions for the actor stick figure.
 */
const ACTOR_PROPORTIONS = {
  headRadius: 0.15,
  bodyStart: 0.30,
  bodyEnd: 0.60,
  armsY: 0.40,
  legsStart: 0.60,
  legsEnd: 1.0,
};

/**
 * Renders a UML actor stick figure shape.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with circle and lines
 */
function UmlActorRenderer(props: ShapeRenderProps): React.ReactElement {
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
  const headRadius = height * ACTOR_PROPORTIONS.headRadius;
  const headCenterY = headRadius;
  const bodyStartY = height * ACTOR_PROPORTIONS.bodyStart;
  const bodyEndY = height * ACTOR_PROPORTIONS.bodyEnd;
  const armsY = height * ACTOR_PROPORTIONS.armsY;
  const legsStartY = height * ACTOR_PROPORTIONS.legsStart;
  const legsEndY = height * ACTOR_PROPORTIONS.legsEnd;

  const commonProps = {
    stroke,
    strokeWidth: strokeWidth + 1,
    lineCap: 'round' as const,
    lineJoin: 'round' as const,
  };

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
      {/* Head */}
      <Circle
        x={centerX}
        y={headCenterY}
        radius={headRadius}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Body */}
      <Line
        points={[centerX, bodyStartY, centerX, bodyEndY]}
        {...commonProps}
      />
      {/* Arms */}
      <Line
        points={[0, armsY, width, armsY]}
        {...commonProps}
      />
      {/* Left leg */}
      <Line
        points={[centerX, legsStartY, 0, legsEndY]}
        {...commonProps}
      />
      {/* Right leg */}
      <Line
        points={[centerX, legsStartY, width, legsEndY]}
        {...commonProps}
      />
    </Group>
  );
}

/**
 * UML Actor shape definition for the registry.
 */
export const umlActorDefinition: ShapeDefinition = {
  type: 'uml-actor',
  label: 'Actor',
  icon: '🧍',
  category: 'uml',
  defaultSize: { width: 50, height: 80 },
  render: UmlActorRenderer,
  description: 'UML actor stick figure for use case diagrams',
};
