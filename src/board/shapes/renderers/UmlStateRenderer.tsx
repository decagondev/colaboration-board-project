/**
 * UML State Shape Renderer
 *
 * Renders a UML state shape (rounded rectangle).
 * Used in state machine diagrams to represent states.
 *
 * @module board/shapes/renderers/UmlStateRenderer
 */

import React from 'react';
import { Rect } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Default corner radius ratio for state shapes.
 */
const STATE_CORNER_RADIUS_RATIO = 0.15;

/**
 * Renders a UML state shape (rounded rectangle).
 *
 * @param props - Shape render props
 * @returns React element containing Konva Rect with rounded corners
 */
function UmlStateRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const cornerRadius = Math.min(width, height) * STATE_CORNER_RADIUS_RATIO;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      cornerRadius={cornerRadius}
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
 * UML State shape definition for the registry.
 */
export const umlStateDefinition: ShapeDefinition = {
  type: 'uml-state',
  label: 'State',
  icon: '⬭',
  category: 'uml',
  defaultSize: { width: 120, height: 60 },
  render: UmlStateRenderer,
  description: 'UML state for state machine diagrams',
};
