/**
 * Frame Component
 *
 * Konva component for rendering frame containers on the board.
 */

import React, { useCallback, useRef } from 'react';
import { Group, Rect, Text } from 'react-konva';
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
 * Frame Konva Component
 *
 * Renders a frame container with:
 * - Title bar (optional)
 * - Background fill
 * - Border
 * - Resize/transform support
 *
 * @param props - Component props
 * @returns Konva Group element
 */
export function FrameComponent({
  frame,
  isSelected = false,
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
   * Get stroke style based on selection.
   */
  const getStrokeColor = (): string => {
    if (isSelected) return '#4A90D9';
    return colors.stroke;
  };

  /**
   * Get stroke width based on selection.
   */
  const getStrokeWidth = (): number => {
    return isSelected ? 2 : 1;
  };

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
      {/* Background */}
      <Rect
        width={bounds.width}
        height={bounds.height}
        fill={getBackgroundFill()}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        cornerRadius={4}
      />

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
            width={bounds.width - 16}
            height={titleHeight - 16}
            text={frame.title}
            fontFamily="Arial, sans-serif"
            fontSize={14}
            fontStyle="bold"
            fill={colors.text}
            verticalAlign="middle"
            ellipsis={true}
          />
        </>
      )}
    </Group>
  );
}
