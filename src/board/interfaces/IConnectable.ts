/**
 * Connectable Interface
 *
 * For objects that can have connectors attached to them.
 */

import type { Position } from './IBoardObject';

/**
 * Connection point anchor positions.
 */
export type ConnectionAnchor =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'center'
  | 'auto';

/**
 * Connection point definition.
 */
export interface ConnectionPoint {
  /** Anchor position on the object */
  anchor: ConnectionAnchor;
  /** Absolute position on the canvas */
  position: Position;
  /** Direction vector for connector routing */
  direction: Position;
}

/**
 * Connection reference (linking connector to object).
 */
export interface ConnectionRef {
  /** Connected object ID */
  objectId: string;
  /** Connection point anchor */
  anchor: ConnectionAnchor;
}

/**
 * Interface for objects that can have connectors attached.
 *
 * Connectable objects provide connection points that connectors
 * can attach to, and automatically update when the object moves.
 */
export interface IConnectable {
  /**
   * Get all available connection points.
   *
   * @returns Array of connection points
   */
  getConnectionPoints(): ConnectionPoint[];

  /**
   * Get the nearest connection point to a position.
   *
   * @param position - Target position
   * @returns Nearest connection point
   */
  getNearestConnectionPoint(position: Position): ConnectionPoint;

  /**
   * Get a specific connection point by anchor.
   *
   * @param anchor - Anchor type
   * @returns Connection point or undefined if not available
   */
  getConnectionPoint(anchor: ConnectionAnchor): ConnectionPoint | undefined;

  /**
   * IDs of connectors attached to this object.
   */
  readonly connectedIds: readonly string[];

  /**
   * Register a connector attachment.
   *
   * @param connectorId - Connector ID
   * @param anchor - Attachment anchor
   */
  attachConnector(connectorId: string, anchor: ConnectionAnchor): void;

  /**
   * Remove a connector attachment.
   *
   * @param connectorId - Connector ID
   */
  detachConnector(connectorId: string): void;

  /**
   * Whether the object can have connectors attached.
   */
  readonly isConnectable: boolean;
}

/**
 * Rotate a point around a center by a given angle.
 *
 * @param point - Point to rotate
 * @param center - Center of rotation
 * @param angleDegrees - Rotation angle in degrees
 * @returns Rotated point
 */
function rotatePoint(
  point: Position,
  center: Position,
  angleDegrees: number
): Position {
  if (angleDegrees === 0) return point;
  
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Rotate a direction vector by a given angle.
 *
 * @param direction - Direction vector to rotate
 * @param angleDegrees - Rotation angle in degrees
 * @returns Rotated direction vector
 */
function rotateDirection(direction: Position, angleDegrees: number): Position {
  if (angleDegrees === 0) return direction;
  
  const angleRadians = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  return {
    x: direction.x * cos - direction.y * sin,
    y: direction.x * sin + direction.y * cos,
  };
}

/**
 * Calculate connection points for a rectangular object.
 *
 * @param x - Object X position
 * @param y - Object Y position
 * @param width - Object width
 * @param height - Object height
 * @param rotation - Object rotation in degrees (optional, default 0)
 * @returns Array of connection points
 */
export function calculateConnectionPoints(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number = 0
): ConnectionPoint[] {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const center = { x: centerX, y: centerY };

  const unrotatedPoints: ConnectionPoint[] = [
    {
      anchor: 'top',
      position: { x: centerX, y },
      direction: { x: 0, y: -1 },
    },
    {
      anchor: 'right',
      position: { x: x + width, y: centerY },
      direction: { x: 1, y: 0 },
    },
    {
      anchor: 'bottom',
      position: { x: centerX, y: y + height },
      direction: { x: 0, y: 1 },
    },
    {
      anchor: 'left',
      position: { x, y: centerY },
      direction: { x: -1, y: 0 },
    },
    {
      anchor: 'center',
      position: { x: centerX, y: centerY },
      direction: { x: 0, y: 0 },
    },
  ];

  if (rotation === 0) {
    return unrotatedPoints;
  }

  return unrotatedPoints.map((point) => ({
    anchor: point.anchor,
    position: rotatePoint(point.position, center, rotation),
    direction: rotateDirection(point.direction, rotation),
  }));
}

/**
 * Type guard to check if an object is connectable.
 *
 * @param obj - Object to check
 * @returns True if object implements IConnectable
 */
export function isConnectable(obj: unknown): obj is IConnectable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'getConnectionPoints' in obj &&
    typeof (obj as IConnectable).getConnectionPoints === 'function'
  );
}
