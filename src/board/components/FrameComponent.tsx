/**
 * Frame Component
 *
 * Konva component for rendering frame containers on the board.
 * Supports visual feedback for container drop targets and child management.
 *
 * @module board/components/FrameComponent
 */

import React, { useCallback, useRef, useMemo } from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import type Konva from 'konva';
import type { Frame } from '../objects/Frame';
import type { Position } from '../interfaces/IBoardObject';
import { FRAME_DEFAULTS } from '../objects/Frame';

/**
 * Props for the FrameComponent.
 */
export interface FrameComponentProps {
  /** Frame data object */
  frame: Frame;
  /** Whether the frame is selected */
  isSelected?: boolean;
  /** Whether the frame is a valid drop target for an object being dragged */
  isDropTarget?: boolean;
  /** Whether an object is currently hovering over this frame for potential containment */
  isHoveredForDrop?: boolean;
  /** Number of children currently in this frame */
  childCount?: number;
  /** Callback when the frame is clicked */
  onClick?: (
    frameId: string,
    event: Konva.KonvaEventObject<MouseEvent>
  ) => void;
  /** Callback when the frame is double-clicked (to edit title) */
  onDoubleClick?: (frameId: string) => void;
  /** Callback when dragging starts */
  onDragStart?: (frameId: string) => void;
  /** Callback when drag ends */
  onDragEnd?: (frameId: string, position: Position) => void;
  /** Callback when transform ends */
  onTransformEnd?: (
    frameId: string,
    transform: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }
  ) => void;
  /** Callback when title changes */
  onTitleChange?: (frameId: string, title: string) => void;
}

/**
 * Drop target visual colors.
 */
const DROP_TARGET_COLORS = {
  active: '#4A90D9',
  hover: '#6DB3F2',
  glow: 'rgba(74, 144, 217, 0.3)',
};

/**
 * Frame Konva Component
 *
 * Renders a frame container with:
 * - Title bar (optional)
 * - Background fill
 * - Border
 * - Resize/transform support
 * - Drop target visual feedback
 * - Child count indicator
 *
 * @param props - Component props
 * @returns Konva Group element
 */
export function FrameComponent({
  frame,
  isSelected = false,
  isDropTarget = false,
  isHoveredForDrop = false,
  childCount = 0,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: FrameComponentProps): React.ReactElement | null {
  const groupRef = useRef<Konva.Group>(null);

  if (!frame.visible) {
    return null;
  }

  const bounds = frame.getBounds();
  const colors = frame.colors;
  const transform = frame.transform;
  const titleHeight = frame.showTitle ? FRAME_DEFAULTS.titleHeight : 0;
  const padding = frame.padding;

  /**
   * Handle click events (mouse or touch).
   */
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      onClick?.(frame.id, e as Konva.KonvaEventObject<MouseEvent>);
    },
    [frame.id, onClick]
  );

  /**
   * Handle double click events.
   */
  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.(frame.id);
  }, [frame.id, onDoubleClick]);

  /**
   * Handle drag start.
   */
  const handleDragStart = useCallback(() => {
    if (!frame.locked) {
      onDragStart?.(frame.id);
    }
  }, [frame.id, frame.locked, onDragStart]);

  /**
   * Handle drag end.
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!frame.locked) {
        const newPosition: Position = {
          x: e.target.x(),
          y: e.target.y(),
        };
        onDragEnd?.(frame.id, newPosition);
      }
    },
    [frame.id, frame.locked, onDragEnd]
  );

  /**
   * Handle transform end.
   */
  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onTransformEnd?.(frame.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(FRAME_DEFAULTS.minWidth, bounds.width * scaleX),
      height: Math.max(FRAME_DEFAULTS.minHeight, bounds.height * scaleY),
      rotation: node.rotation(),
    });
  }, [frame.id, bounds.width, bounds.height, onTransformEnd]);

  /**
   * Get stroke style based on selection and drop state.
   */
  const getStrokeColor = (): string => {
    if (isHoveredForDrop) return DROP_TARGET_COLORS.hover;
    if (isDropTarget) return DROP_TARGET_COLORS.active;
    if (isSelected) return '#4A90D9';
    return colors.stroke;
  };

  /**
   * Get stroke width based on selection and drop state.
   */
  const getStrokeWidth = (): number => {
    if (isHoveredForDrop) return 3;
    if (isDropTarget) return 2;
    return isSelected ? 2 : 1;
  };

  /**
   * Calculate snap guide lines for grid snap behavior.
   */
  const snapGuideLines = useMemo(() => {
    if (frame.snapBehavior !== 'grid') return [];

    const gridSize = 20;
    const contentBounds = frame.getContentBounds();
    const lines: { points: number[]; key: string }[] = [];

    for (
      let x = padding.left;
      x < bounds.width - padding.right;
      x += gridSize
    ) {
      lines.push({
        points: [x, titleHeight + padding.top, x, bounds.height - padding.bottom],
        key: `v-${x}`,
      });
    }

    for (
      let y = titleHeight + padding.top;
      y < bounds.height - padding.bottom;
      y += gridSize
    ) {
      lines.push({
        points: [padding.left, y, bounds.width - padding.right, y],
        key: `h-${y}`,
      });
    }

    void contentBounds;
    return lines;
  }, [
    frame.snapBehavior,
    bounds.width,
    bounds.height,
    titleHeight,
    padding,
    frame,
  ]);

  /**
   * Calculate background fill with opacity.
   */
  const getBackgroundFill = (): string => {
    const color = colors.fill;
    if (typeof color === 'string' && color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${frame.backgroundOpacity})`;
    }
    return color;
  };

  return (
    <Group
      ref={groupRef}
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      rotation={transform.rotation}
      draggable={!frame.locked}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Drop target glow effect */}
      {isHoveredForDrop && (
        <Rect
          x={-4}
          y={-4}
          width={bounds.width + 8}
          height={bounds.height + 8}
          fill={DROP_TARGET_COLORS.glow}
          cornerRadius={8}
          listening={false}
        />
      )}

      {/* Background */}
      <Rect
        width={bounds.width}
        height={bounds.height}
        fill={getBackgroundFill()}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        cornerRadius={4}
        shadowColor={isHoveredForDrop ? DROP_TARGET_COLORS.active : undefined}
        shadowBlur={isHoveredForDrop ? 10 : 0}
        shadowOpacity={isHoveredForDrop ? 0.5 : 0}
      />

      {/* Snap grid lines (visible when snap behavior is 'grid' and selected) */}
      {isSelected && frame.snapBehavior === 'grid' && snapGuideLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke="rgba(150, 150, 150, 0.2)"
          strokeWidth={1}
          dash={[2, 2]}
          listening={false}
        />
      ))}

      {/* Content area border (shows padding area when selected) */}
      {isSelected && (
        <Rect
          x={padding.left}
          y={titleHeight + padding.top}
          width={bounds.width - padding.left - padding.right}
          height={bounds.height - titleHeight - padding.top - padding.bottom}
          stroke="rgba(100, 100, 100, 0.3)"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}

      {/* Title bar */}
      {frame.showTitle && (
        <>
          <Rect
            width={bounds.width}
            height={titleHeight}
            fill={colors.fill}
            cornerRadius={[4, 4, 0, 0]}
          />
          <Text
            x={8}
            y={8}
            width={bounds.width - 50}
            height={titleHeight - 16}
            text={frame.title}
            fontFamily="Arial, sans-serif"
            fontSize={14}
            fontStyle="bold"
            fill={colors.text}
            verticalAlign="middle"
            ellipsis={true}
          />
          {/* Child count badge */}
          {childCount > 0 && (
            <>
              <Rect
                x={bounds.width - 32}
                y={6}
                width={24}
                height={20}
                fill="rgba(0, 0, 0, 0.15)"
                cornerRadius={10}
              />
              <Text
                x={bounds.width - 32}
                y={6}
                width={24}
                height={20}
                text={String(childCount)}
                fontFamily="Arial, sans-serif"
                fontSize={11}
                fill={colors.text}
                align="center"
                verticalAlign="middle"
              />
            </>
          )}
        </>
      )}
    </Group>
  );
}
