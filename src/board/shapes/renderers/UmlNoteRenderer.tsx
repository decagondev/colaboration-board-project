/**
 * UML Note Shape Renderer
 *
 * Renders a UML note shape with a folded corner.
 * Used to add comments or constraints to UML diagrams.
 *
 * @module board/shapes/renderers/UmlNoteRenderer
 */

import React from 'react';
import { Group, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Size of the folded corner relative to the shape.
 */
const FOLD_SIZE_RATIO = 0.15;

/**
 * Renders a UML note shape with a folded corner.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with polygon and fold line
 */
function UmlNoteRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const foldSize = Math.min(width, height) * FOLD_SIZE_RATIO;

  const mainShapePoints = [
    0, 0,
    width - foldSize, 0,
    width, foldSize,
    width, height,
    0, height,
  ];

  const foldPoints = [
    width - foldSize, 0,
    width - foldSize, foldSize,
    width, foldSize,
  ];

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
      {/* Main note body */}
      <Line
        points={mainShapePoints}
        closed={true}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Folded corner */}
      <Line
        points={foldPoints}
        stroke={stroke}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
      />
    </Group>
  );
}

/**
 * UML Note shape definition for the registry.
 */
export const umlNoteDefinition: ShapeDefinition = {
  type: 'uml-note',
  label: 'Note',
  icon: '📝',
  category: 'uml',
  defaultSize: { width: 120, height: 80 },
  render: UmlNoteRenderer,
  description: 'UML note for comments and constraints',
};
