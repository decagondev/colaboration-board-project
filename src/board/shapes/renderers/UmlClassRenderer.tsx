/**
 * UML Class Shape Renderer
 *
 * Renders a UML class diagram box with three sections:
 * - Class name (top section)
 * - Attributes (middle section)
 * - Methods (bottom section)
 *
 * @module board/shapes/renderers/UmlClassRenderer
 */

import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Height ratio for each section of the class box.
 */
const SECTION_RATIOS = {
  name: 0.25,
  attributes: 0.375,
  methods: 0.375,
};

/**
 * Renders a UML class diagram box shape.
 * The box is divided into three sections: name, attributes, and methods.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with rectangles and divider lines
 */
function UmlClassRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const nameHeight = height * SECTION_RATIOS.name;
  const attributesHeight = height * SECTION_RATIOS.attributes;

  return (
    <Group x={x} y={y} opacity={opacity}>
      {/* Main rectangle */}
      <Rect
        width={width}
        height={height}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        shadowEnabled={shadowEnabled}
        shadowColor={shadowColor}
        shadowBlur={shadowBlur}
        shadowOffsetX={shadowOffsetX}
        shadowOffsetY={shadowOffsetY}
      />
      {/* Divider line between name and attributes */}
      <Line
        points={[0, nameHeight, width, nameHeight]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Divider line between attributes and methods */}
      <Line
        points={[0, nameHeight + attributesHeight, width, nameHeight + attributesHeight]}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}

/**
 * UML Class shape definition for the registry.
 */
export const umlClassDefinition: ShapeDefinition = {
  type: 'uml-class',
  label: 'Class',
  icon: '▤',
  category: 'uml',
  defaultSize: { width: 150, height: 120 },
  render: UmlClassRenderer,
  description: 'UML class diagram box with name, attributes, and methods sections',
};
