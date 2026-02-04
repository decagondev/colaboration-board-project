/**
 * Connector Component
 *
 * Konva component for rendering connectors between board objects.
 */

import React, { useCallback, useMemo } from 'react';
import { Group, Line, Circle, RegularPolygon } from 'react-konva';
import type Konva from 'konva';
import type { Connector, ConnectorArrowStyle } from '../objects/Connector';
import type { Position } from '../interfaces/IBoardObject';

/**
 * Props for the ConnectorComponent.
 */
export interface ConnectorComponentProps {
  /** Connector data object */
  connector: Connector;
  /** Whether the connector is selected */
  isSelected?: boolean;
  /** Callback when the connector is clicked */
  onClick?: (
    connectorId: string,
    event: Konva.KonvaEventObject<MouseEvent>
  ) => void;
  /** Callback when an endpoint starts dragging */
  onEndpointDragStart?: (
    connectorId: string,
    endpoint: 'start' | 'end'
  ) => void;
  /** Callback when an endpoint is dragged */
  onEndpointDrag?: (
    connectorId: string,
    endpoint: 'start' | 'end',
    position: Position
  ) => void;
  /** Callback when an endpoint stops dragging */
  onEndpointDragEnd?: (
    connectorId: string,
    endpoint: 'start' | 'end',
    position: Position
  ) => void;
}

/** Arrow size multiplier based on stroke width */
const ARROW_SIZE_MULTIPLIER = 4;

/** Endpoint handle radius */
const ENDPOINT_HANDLE_RADIUS = 6;

/**
 * Calculate arrow points for rendering.
 *
 * @param position - Arrow tip position
 * @param direction - Direction vector (normalized)
 * @param size - Arrow size
 * @returns Points array for the arrow
 */
function calculateArrowPoints(
  position: Position,
  direction: Position,
  size: number
): number[] {
  const perpX = -direction.y;
  const perpY = direction.x;

  const baseX = position.x - direction.x * size;
  const baseY = position.y - direction.y * size;

  const halfWidth = size / 2;

  return [
    position.x,
    position.y,
    baseX + perpX * halfWidth,
    baseY + perpY * halfWidth,
    baseX - perpX * halfWidth,
    baseY - perpY * halfWidth,
  ];
}

/**
 * Calculate direction from start to end.
 *
 * @param start - Start position
 * @param end - End position
 * @returns Normalized direction vector
 */
function calculateDirection(start: Position, end: Position): Position {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return { x: 1, y: 0 };
  }

  return { x: dx / length, y: dy / length };
}

/**
 * Arrow Head Component
 */
function ArrowHead({
  position,
  direction,
  style,
  size,
  stroke,
  fill,
}: {
  position: Position;
  direction: Position;
  style: ConnectorArrowStyle;
  size: number;
  stroke: string;
  fill: string;
}): React.ReactElement | null {
  if (style === 'none') {
    return null;
  }

  if (style === 'circle') {
    return (
      <Circle
        x={position.x}
        y={position.y}
        radius={size / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
    );
  }

  const arrowPoints = calculateArrowPoints(position, direction, size);

  if (style === 'filled-arrow') {
    return (
      <RegularPolygon
        x={position.x - (direction.x * size) / 2}
        y={position.y - (direction.y * size) / 2}
        sides={3}
        radius={size / 2}
        rotation={Math.atan2(direction.y, direction.x) * (180 / Math.PI) + 90}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
      />
    );
  }

  return (
    <Line
      points={arrowPoints}
      stroke={stroke}
      strokeWidth={2}
      lineCap="round"
      lineJoin="round"
    />
  );
}

/**
 * Connector Konva Component
 *
 * Renders a connector line between two points with optional arrows
 * and draggable endpoints when selected.
 *
 * @param props - Component props
 * @returns Konva Group element
 */
export function ConnectorComponent({
  connector,
  isSelected = false,
  onClick,
  onEndpointDragStart,
  onEndpointDrag,
  onEndpointDragEnd,
}: ConnectorComponentProps): React.ReactElement | null {
  if (!connector.visible) {
    return null;
  }

  const startPoint = connector.startPoint;
  const endPoint = connector.endPoint;
  const colors = connector.colors;
  const strokeWidth = connector.strokeWidth;

  const points = connector.getPoints();
  const arrowSize = strokeWidth * ARROW_SIZE_MULTIPLIER;

  const direction = useMemo(
    () => calculateDirection(startPoint.position, endPoint.position),
    [startPoint.position, endPoint.position]
  );

  const reverseDirection = useMemo(
    () => ({ x: -direction.x, y: -direction.y }),
    [direction]
  );

  const strokeColor = useMemo(() => {
    if (isSelected) return '#4A90D9';
    return colors.stroke;
  }, [isSelected, colors.stroke]);

  /**
   * Handle click on the connector.
   */
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      onClick?.(connector.id, e);
    },
    [connector.id, onClick]
  );

  /**
   * Handle start endpoint drag start.
   */
  const handleStartDragStart = useCallback(() => {
    if (!connector.locked) {
      onEndpointDragStart?.(connector.id, 'start');
    }
  }, [connector.id, connector.locked, onEndpointDragStart]);

  /**
   * Handle start endpoint drag.
   */
  const handleStartDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!connector.locked) {
        onEndpointDrag?.(connector.id, 'start', {
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [connector.id, connector.locked, onEndpointDrag]
  );

  /**
   * Handle start endpoint drag end.
   */
  const handleStartDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!connector.locked) {
        onEndpointDragEnd?.(connector.id, 'start', {
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [connector.id, connector.locked, onEndpointDragEnd]
  );

  /**
   * Handle end endpoint drag start.
   */
  const handleEndDragStart = useCallback(() => {
    if (!connector.locked) {
      onEndpointDragStart?.(connector.id, 'end');
    }
  }, [connector.id, connector.locked, onEndpointDragStart]);

  /**
   * Handle end endpoint drag.
   */
  const handleEndDrag = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!connector.locked) {
        onEndpointDrag?.(connector.id, 'end', {
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [connector.id, connector.locked, onEndpointDrag]
  );

  /**
   * Handle end endpoint drag end.
   */
  const handleEndDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!connector.locked) {
        onEndpointDragEnd?.(connector.id, 'end', {
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [connector.id, connector.locked, onEndpointDragEnd]
  );

  return (
    <Group onClick={handleClick} onTap={handleClick}>
      {/* Main line */}
      <Line
        points={points}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={strokeWidth + 10}
      />

      {/* Start arrow */}
      <ArrowHead
        position={startPoint.position}
        direction={reverseDirection}
        style={connector.startArrow}
        size={arrowSize}
        stroke={strokeColor}
        fill={strokeColor}
      />

      {/* End arrow */}
      <ArrowHead
        position={endPoint.position}
        direction={direction}
        style={connector.endArrow}
        size={arrowSize}
        stroke={strokeColor}
        fill={strokeColor}
      />

      {/* Endpoint handles (visible when selected) */}
      {isSelected && (
        <>
          <Circle
            x={startPoint.position.x}
            y={startPoint.position.y}
            radius={ENDPOINT_HANDLE_RADIUS}
            fill="#FFFFFF"
            stroke="#4A90D9"
            strokeWidth={2}
            draggable={!connector.locked}
            onDragStart={handleStartDragStart}
            onDragMove={handleStartDrag}
            onDragEnd={handleStartDragEnd}
          />
          <Circle
            x={endPoint.position.x}
            y={endPoint.position.y}
            radius={ENDPOINT_HANDLE_RADIUS}
            fill="#FFFFFF"
            stroke="#4A90D9"
            strokeWidth={2}
            draggable={!connector.locked}
            onDragStart={handleEndDragStart}
            onDragMove={handleEndDrag}
            onDragEnd={handleEndDragEnd}
          />
        </>
      )}
    </Group>
  );
}
