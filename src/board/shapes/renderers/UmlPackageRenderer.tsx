/**
 * UML Package Shape Renderer
 *
 * Renders a UML package shape with a tab on top.
 * Represents a namespace or grouping of related elements.
 *
 * @module board/shapes/renderers/UmlPackageRenderer
 */

import React from 'react';
import { Group, Rect, Line } from 'react-konva';
import type { ShapeRenderProps, ShapeDefinition } from '../ShapeDefinition';

/**
 * Proportions for the package shape.
 */
const PACKAGE_PROPORTIONS = {
  tabWidth: 0.4,
  tabHeight: 0.15,
};

/**
 * Renders a UML package shape with a tab.
 *
 * @param props - Shape render props
 * @returns React element containing Konva Group with rectangles
 */
function UmlPackageRenderer(props: ShapeRenderProps): React.ReactElement {
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

  const tabWidth = width * PACKAGE_PROPORTIONS.tabWidth;
  const tabHeight = height * PACKAGE_PROPORTIONS.tabHeight;
  const bodyY = tabHeight;
  const bodyHeight = height - tabHeight;

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
      {/* Tab rectangle */}
      <Rect
        x={0}
        y={0}
        width={tabWidth}
        height={tabHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Main body rectangle */}
      <Rect
        x={0}
        y={bodyY}
        width={width}
        height={bodyHeight}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* Line to connect tab to body visually */}
      <Line
        points={[tabWidth, tabHeight, tabWidth, tabHeight]}
        stroke={fill}
        strokeWidth={strokeWidth + 2}
      />
    </Group>
  );
}

/**
 * UML Package shape definition for the registry.
 */
export const umlPackageDefinition: ShapeDefinition = {
  type: 'uml-package',
  label: 'Package',
  icon: '📦',
  category: 'uml',
  defaultSize: { width: 140, height: 100 },
  render: UmlPackageRenderer,
  description: 'UML package for grouping related elements',
};
