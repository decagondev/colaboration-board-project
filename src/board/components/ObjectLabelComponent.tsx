/**
 * Object Label Component
 *
 * Renders a centered text label on board objects.
 * Follows Single Responsibility Principle (SRP) - handles label rendering only.
 *
 * @module board/components/ObjectLabelComponent
 */

import React from 'react';
import { Text } from 'react-konva';
import type { LabelConfig } from '../interfaces/ILabelable';
import { DEFAULT_LABEL_CONFIG, truncateText } from '../interfaces/ILabelable';

/**
 * Props for the ObjectLabelComponent.
 */
export interface ObjectLabelComponentProps {
  /** Label configuration */
  label: Partial<LabelConfig>;
  /** Width of the parent object */
  objectWidth: number;
  /** Height of the parent object */
  objectHeight: number;
  /** Whether the parent object is selected */
  isSelected?: boolean;
  /** Offset from object's local origin (x) */
  offsetX?: number;
  /** Offset from object's local origin (y) */
  offsetY?: number;
}

/**
 * Calculate the Y position based on vertical alignment.
 *
 * @param align - Vertical alignment
 * @param height - Object height
 * @param fontSize - Font size
 * @param padding - Padding
 * @returns Y position
 */
function calculateVerticalPosition(
  align: 'top' | 'middle' | 'bottom',
  height: number,
  fontSize: number,
  padding: number
): number {
  const lineHeight = fontSize * 1.2;

  switch (align) {
    case 'top':
      return padding;
    case 'bottom':
      return height - lineHeight - padding;
    case 'middle':
    default:
      return (height - lineHeight) / 2;
  }
}

/**
 * ObjectLabelComponent renders a text label centered on a board object.
 *
 * The label is automatically positioned based on the alignment settings
 * and can be truncated if it exceeds the object's width.
 *
 * @param props - Component props
 * @returns JSX element or null if label is empty or hidden
 *
 * @example
 * ```tsx
 * <ObjectLabelComponent
 *   label={{ text: 'My Shape', fontSize: 14 }}
 *   objectWidth={120}
 *   objectHeight={80}
 * />
 * ```
 */
export function ObjectLabelComponent({
  label,
  objectWidth,
  objectHeight,
  isSelected = false,
  offsetX = 0,
  offsetY = 0,
}: ObjectLabelComponentProps): React.ReactElement | null {
  const config: LabelConfig = {
    ...DEFAULT_LABEL_CONFIG,
    ...label,
  };

  if (!config.text || !config.visible) {
    return null;
  }

  const maxTextWidth = objectWidth - config.padding * 2;
  const displayText = truncateText(config.text, maxTextWidth, config.fontSize);

  const y = calculateVerticalPosition(
    config.verticalAlign,
    objectHeight,
    config.fontSize,
    config.padding
  );

  return (
    <Text
      x={offsetX + config.padding}
      y={offsetY + y}
      width={maxTextWidth}
      height={config.fontSize * 1.2}
      text={displayText}
      fontSize={config.fontSize}
      fontFamily={config.fontFamily}
      fontStyle={config.fontWeight}
      fill={config.color}
      align={config.align}
      verticalAlign="middle"
      listening={false}
      perfectDrawEnabled={false}
      shadowColor={isSelected ? 'rgba(0, 0, 0, 0.2)' : undefined}
      shadowBlur={isSelected ? 2 : 0}
      shadowOffsetX={isSelected ? 1 : 0}
      shadowOffsetY={isSelected ? 1 : 0}
    />
  );
}

/**
 * Default export for the component.
 */
export default ObjectLabelComponent;
