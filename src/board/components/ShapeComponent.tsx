/**
 * Shape Component
 *
 * Konva component for rendering different shape types.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Group, Rect, Ellipse, Line, RegularPolygon } from 'react-konva';
import type Konva from 'konva';
import type { Shape } from '../objects/Shape';
import type { Position } from '../interfaces/IBoardObject';

/**
 * Props for the ShapeComponent.
 */
export interface ShapeComponentProps {
  /** Shape data object */
  shape: Shape;
  /** Whether the shape is selected */
  isSelected?: boolean;
  /** Callback when the shape is clicked */
  onClick?: (
    shapeId: string,
    event: Konva.KonvaEventObject<MouseEvent>
  ) => void;
  /** Callback when the shape is dragged */
  onDragStart?: (shapeId: string) => void;
  /** Callback when the shape drag ends */
  onDragEnd?: (shapeId: string, position: Position) => void;
  /** Callback when the shape is transformed (resized/rotated) */
  onTransformEnd?: (
    shapeId: string,
    transform: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }
  ) => void;
}

/**
 * Shape Konva Component
 *
 * Renders shapes based on their type:
 * - Rectangle (with optional corner radius)
 * - Ellipse
 * - Line
 * - Triangle
 *
 * @param props - Component props
 * @returns Konva Group element
 */
export function ShapeComponent({
  shape,
  isSelected = false,
  onClick,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: ShapeComponentProps): React.ReactElement {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bounds = shape.getBounds();
  const colors = shape.colors;
  const transform = shape.transform;

  /**
   * Handle click events.
   */
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDragging) {
        onClick?.(shape.id, e);
      }
    },
    [shape.id, onClick, isDragging]
  );

  /**
   * Handle drag start.
   */
  const handleDragStart = useCallback(() => {
    if (!shape.locked) {
      setIsDragging(true);
      onDragStart?.(shape.id);
    }
  }, [shape.id, shape.locked, onDragStart]);

  /**
   * Handle drag end.
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);
      if (!shape.locked) {
        const newPosition: Position = {
          x: e.target.x(),
          y: e.target.y(),
        };
        onDragEnd?.(shape.id, newPosition);
      }
    },
    [shape.id, shape.locked, onDragEnd]
  );

  /**
   * Handle transform end (resize/rotate).
   */
  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onTransformEnd?.(shape.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(20, bounds.width * scaleX),
      height: Math.max(20, bounds.height * scaleY),
      rotation: node.rotation(),
    });
  }, [shape.id, bounds.width, bounds.height, onTransformEnd]);

  /**
   * Get stroke width including selection highlight.
   */
  const getStrokeWidth = (): number => {
    if (isSelected) return Math.max(shape.strokeWidth, 2);
    return shape.strokeWidth;
  };

  /**
   * Get stroke color.
   */
  const getStrokeColor = (): string => {
    if (isSelected) return '#4A90D9';
    return colors.stroke;
  };

  /**
   * Render the appropriate shape based on type.
   */
  const renderShape = (): React.ReactElement => {
    switch (shape.shapeType) {
      case 'rectangle':
        return (
          <Rect
            width={bounds.width}
            height={bounds.height}
            fill={colors.fill}
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
            cornerRadius={shape.cornerRadius}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={isSelected ? 10 : 5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        );

      case 'ellipse':
        return (
          <Ellipse
            x={bounds.width / 2}
            y={bounds.height / 2}
            radiusX={bounds.width / 2}
            radiusY={bounds.height / 2}
            fill={colors.fill}
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={isSelected ? 10 : 5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        );

      case 'triangle':
        return (
          <RegularPolygon
            x={bounds.width / 2}
            y={bounds.height / 2}
            sides={3}
            radius={Math.min(bounds.width, bounds.height) / 2}
            fill={colors.fill}
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={isSelected ? 10 : 5}
            shadowOffset={{ x: 2, y: 2 }}
          />
        );

      case 'line':
        return (
          <Line
            points={shape.points || [0, 0, bounds.width, bounds.height]}
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
            lineCap="round"
            lineJoin="round"
          />
        );

      default:
        return (
          <Rect
            width={bounds.width}
            height={bounds.height}
            fill={colors.fill}
            stroke={getStrokeColor()}
            strokeWidth={getStrokeWidth()}
          />
        );
    }
  };

  return (
    <Group
      ref={groupRef}
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      rotation={transform.rotation}
      draggable={!shape.locked}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {renderShape()}
    </Group>
  );
}
