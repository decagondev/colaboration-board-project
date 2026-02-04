/**
 * Grid Overlay Component
 *
 * Renders a configurable grid pattern on the canvas.
 * Supports major and minor grid lines with customizable spacing and colors.
 */

import React, { useMemo } from 'react';
import { Group, Line } from 'react-konva';
import type { ViewportState } from './BoardCanvasComponent';

/**
 * Configuration options for the grid overlay.
 */
export interface GridConfig {
  /** Size of minor grid cells in pixels */
  minorGridSize: number;
  /** Number of minor cells per major cell */
  majorGridInterval: number;
  /** Color of minor grid lines */
  minorLineColor: string;
  /** Color of major grid lines */
  majorLineColor: string;
  /** Width of minor grid lines */
  minorLineWidth: number;
  /** Width of major grid lines */
  majorLineWidth: number;
  /** Opacity of the grid (0-1) */
  opacity: number;
}

/**
 * Default grid configuration values.
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  minorGridSize: 20,
  majorGridInterval: 5,
  minorLineColor: '#e5e7eb',
  majorLineColor: '#d1d5db',
  minorLineWidth: 0.5,
  majorLineWidth: 1,
  opacity: 1,
};

/**
 * Props for the GridOverlayComponent.
 */
export interface GridOverlayComponentProps {
  /** Whether the grid is visible */
  visible: boolean;
  /** Current viewport state for positioning */
  viewport: ViewportState;
  /** Canvas dimensions */
  canvasSize: { width: number; height: number };
  /** Grid configuration (optional, uses defaults if not provided) */
  config?: Partial<GridConfig>;
}

/**
 * Grid Overlay Component
 *
 * Renders a grid pattern that scales with the viewport zoom level.
 * The grid consists of minor lines at regular intervals and major lines
 * at larger intervals for easier visual reference.
 *
 * Features:
 * - Configurable grid spacing and colors
 * - Efficient rendering (only visible lines)
 * - Scales appropriately with zoom
 * - Major/minor line distinction
 *
 * @param props - Component props
 * @returns Konva Group containing grid lines, or null if not visible
 *
 * @example
 * ```tsx
 * <GridOverlayComponent
 *   visible={showGrid}
 *   viewport={viewport}
 *   canvasSize={{ width: 1920, height: 1080 }}
 *   config={{ minorGridSize: 25 }}
 * />
 * ```
 */
export function GridOverlayComponent({
  visible,
  viewport,
  canvasSize,
  config: configOverrides,
}: GridOverlayComponentProps): React.ReactElement | null {
  const config: GridConfig = useMemo(
    () => ({
      ...DEFAULT_GRID_CONFIG,
      ...configOverrides,
    }),
    [configOverrides]
  );

  /**
   * Calculate grid lines to render based on viewport.
   */
  const gridLines = useMemo(() => {
    if (!visible) return { vertical: [], horizontal: [] };

    const {
      minorGridSize,
      majorGridInterval,
      minorLineColor,
      majorLineColor,
      minorLineWidth,
      majorLineWidth,
    } = config;

    const majorGridSize = minorGridSize * majorGridInterval;

    const visibleLeft = -viewport.x / viewport.scale;
    const visibleTop = -viewport.y / viewport.scale;
    const visibleWidth = canvasSize.width / viewport.scale;
    const visibleHeight = canvasSize.height / viewport.scale;

    const startX = Math.floor(visibleLeft / minorGridSize) * minorGridSize;
    const endX = Math.ceil((visibleLeft + visibleWidth) / minorGridSize) * minorGridSize;
    const startY = Math.floor(visibleTop / minorGridSize) * minorGridSize;
    const endY = Math.ceil((visibleTop + visibleHeight) / minorGridSize) * minorGridSize;

    const vertical: Array<{
      x: number;
      isMajor: boolean;
      color: string;
      width: number;
    }> = [];
    const horizontal: Array<{
      y: number;
      isMajor: boolean;
      color: string;
      width: number;
    }> = [];

    for (let x = startX; x <= endX; x += minorGridSize) {
      const isMajor = x % majorGridSize === 0;
      vertical.push({
        x,
        isMajor,
        color: isMajor ? majorLineColor : minorLineColor,
        width: isMajor ? majorLineWidth : minorLineWidth,
      });
    }

    for (let y = startY; y <= endY; y += minorGridSize) {
      const isMajor = y % majorGridSize === 0;
      horizontal.push({
        y,
        isMajor,
        color: isMajor ? majorLineColor : minorLineColor,
        width: isMajor ? majorLineWidth : minorLineWidth,
      });
    }

    return { vertical, horizontal, startY, endY, startX, endX };
  }, [visible, viewport, canvasSize, config]);

  if (!visible) {
    return null;
  }

  const { vertical, horizontal, startY, endY, startX, endX } = gridLines as {
    vertical: Array<{ x: number; isMajor: boolean; color: string; width: number }>;
    horizontal: Array<{ y: number; isMajor: boolean; color: string; width: number }>;
    startY: number;
    endY: number;
    startX: number;
    endX: number;
  };

  return (
    <Group opacity={config.opacity} listening={false}>
      {/* Minor lines first (rendered behind major lines) */}
      {vertical
        .filter((line) => !line.isMajor)
        .map((line) => (
          <Line
            key={`v-${line.x}`}
            points={[line.x, startY, line.x, endY]}
            stroke={line.color}
            strokeWidth={line.width / viewport.scale}
            listening={false}
          />
        ))}
      {horizontal
        .filter((line) => !line.isMajor)
        .map((line) => (
          <Line
            key={`h-${line.y}`}
            points={[startX, line.y, endX, line.y]}
            stroke={line.color}
            strokeWidth={line.width / viewport.scale}
            listening={false}
          />
        ))}
      {/* Major lines on top */}
      {vertical
        .filter((line) => line.isMajor)
        .map((line) => (
          <Line
            key={`v-major-${line.x}`}
            points={[line.x, startY, line.x, endY]}
            stroke={line.color}
            strokeWidth={line.width / viewport.scale}
            listening={false}
          />
        ))}
      {horizontal
        .filter((line) => line.isMajor)
        .map((line) => (
          <Line
            key={`h-major-${line.y}`}
            points={[startX, line.y, endX, line.y]}
            stroke={line.color}
            strokeWidth={line.width / viewport.scale}
            listening={false}
          />
        ))}
    </Group>
  );
}

export default GridOverlayComponent;
