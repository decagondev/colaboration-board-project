/**
 * Lasso Overlay Component
 *
 * Renders a selection rectangle during lasso (marquee) selection.
 */

import React from 'react';
import { Rect } from 'react-konva';
import type { LassoState } from '../interfaces/ISelectionService';

/**
 * Props for the LassoOverlayComponent.
 */
export interface LassoOverlayComponentProps {
  /** Current lasso selection state */
  lassoState: LassoState;
  /** Fill color for the lasso rectangle */
  fillColor?: string;
  /** Stroke color for the lasso rectangle */
  strokeColor?: string;
  /** Stroke width for the lasso rectangle */
  strokeWidth?: number;
  /** Fill opacity */
  fillOpacity?: number;
}

/**
 * Default lasso overlay styles.
 */
export const LASSO_DEFAULTS = {
  fillColor: '#4A90D9',
  strokeColor: '#2563EB',
  strokeWidth: 1,
  fillOpacity: 0.1,
};

/**
 * Lasso Overlay Component
 *
 * Renders a semi-transparent rectangle during lasso selection to show
 * the selection area. Only visible when lasso selection is active.
 *
 * @param props - Component props
 * @returns Konva Rect element or null if lasso not active
 *
 * @example
 * ```typescript
 * const { lassoState } = useSelection();
 *
 * return (
 *   <Stage>
 *     <Layer>
 *       {// ... board objects ...}
 *       <LassoOverlayComponent lassoState={lassoState} />
 *     </Layer>
 *   </Stage>
 * );
 * ```
 */
export function LassoOverlayComponent({
  lassoState,
  fillColor = LASSO_DEFAULTS.fillColor,
  strokeColor = LASSO_DEFAULTS.strokeColor,
  strokeWidth = LASSO_DEFAULTS.strokeWidth,
  fillOpacity = LASSO_DEFAULTS.fillOpacity,
}: LassoOverlayComponentProps): React.ReactElement | null {
  if (!lassoState.isActive || !lassoState.bounds) {
    return null;
  }

  const { x, y, width, height } = lassoState.bounds;

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      opacity={fillOpacity}
      dash={[4, 4]}
      listening={false}
    />
  );
}
