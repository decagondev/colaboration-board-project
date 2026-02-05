/**
 * Document Shape Renderer
 *
 * Renders a document flowchart shape using Konva.
 * Used for document/report outputs in flowcharts.
 */

import React from 'react';
import { Shape } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Wave height factor (percentage of total height).
 */
const WAVE_HEIGHT_FACTOR = 0.1;

/**
 * Renders a document shape for flowchart document nodes.
 *
 * @param props - Shape render props
 * @returns React element containing Konva custom shape
 */
function DocumentRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const waveHeight = height * WAVE_HEIGHT_FACTOR;

  return (
    <Shape
      x={x}
      y={y}
      sceneFunc={(context, shape) => {
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(width, 0);
        context.lineTo(width, height - waveHeight);
        context.quadraticCurveTo(
          width * 0.75,
          height - waveHeight * 2,
          width / 2,
          height - waveHeight
        );
        context.quadraticCurveTo(
          width * 0.25,
          height,
          0,
          height - waveHeight
        );
        context.closePath();
        context.fillStrokeShape(shape);
      }}
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
 * Document shape definition for the registry.
 */
export const documentDefinition: ShapeDefinition = {
  type: 'document',
  label: 'Document',
  icon: '📄',
  category: 'flowchart',
  defaultSize: { width: 100, height: 80 },
  render: DocumentRenderer,
  description: 'Document/Report output node',
};
