/**
 * Connection Service Interface
 *
 * Defines the contract for managing connector attachments between board objects.
 *
 * @module board/interfaces/IConnectionService
 */

import type { Position } from './IBoardObject';
import type { ConnectionAnchor, ConnectionPoint } from './IConnectable';
import type {
  ConnectorEndpoint,
  ConnectorRouteStyle,
  ConnectorArrowStyle,
} from '../objects/Connector';

/**
 * State during connector creation/editing drag operation.
 */
export interface ConnectorDragState {
  /** Whether a drag operation is in progress */
  isActive: boolean;
  /** Which endpoint is being dragged: 'start' or 'end' */
  endpoint: 'start' | 'end';
  /** ID of the connector being created/edited (null during creation) */
  connectorId: string | null;
  /** Start position of the connector */
  startPosition: Position;
  /** Current end position during drag */
  currentPosition: Position;
  /** Object ID at start point (if connected) */
  startObjectId: string | null;
  /** Anchor at start point */
  startAnchor: ConnectionAnchor;
  /** Object ID being hovered over (potential connection) */
  hoveredObjectId: string | null;
  /** Nearest anchor on the hovered object */
  nearestAnchor: ConnectionAnchor | null;
}

/**
 * Default drag state.
 */
export const DEFAULT_CONNECTOR_DRAG_STATE: ConnectorDragState = {
  isActive: false,
  endpoint: 'end',
  connectorId: null,
  startPosition: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 },
  startObjectId: null,
  startAnchor: 'auto',
  hoveredObjectId: null,
  nearestAnchor: null,
};

/**
 * Connector creation options.
 */
export interface ConnectorCreationOptions {
  /** Route style for the connector */
  routeStyle?: ConnectorRouteStyle;
  /** Arrow style at start */
  startArrow?: ConnectorArrowStyle;
  /** Arrow style at end */
  endArrow?: ConnectorArrowStyle;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
}

/**
 * Result of creating a connector.
 */
export interface ConnectorCreationResult {
  /** Connector ID */
  id: string;
  /** Start endpoint */
  startPoint: ConnectorEndpoint;
  /** End endpoint */
  endPoint: ConnectorEndpoint;
  /** Route style */
  routeStyle: ConnectorRouteStyle;
  /** Start arrow style */
  startArrow: ConnectorArrowStyle;
  /** End arrow style */
  endArrow: ConnectorArrowStyle;
  /** Stroke color */
  strokeColor: string;
  /** Stroke width */
  strokeWidth: number;
}

/**
 * Event fired when connections change.
 */
export interface ConnectionChangeEvent {
  /** Type of change */
  type: 'created' | 'updated' | 'deleted';
  /** Connector ID */
  connectorId: string;
  /** Previous state (for updates/deletes) */
  previousState?: {
    startObjectId: string | null;
    endObjectId: string | null;
  };
  /** Current state (for creates/updates) */
  currentState?: {
    startObjectId: string | null;
    endObjectId: string | null;
  };
}

/**
 * Connection Service Interface
 *
 * Manages connector attachments and provides helper functions for
 * determining connection points during connector creation.
 */
export interface IConnectionService {
  /**
   * Current drag state during connector creation/editing.
   */
  readonly dragState: ConnectorDragState;

  /**
   * Start a connector creation drag from a position.
   *
   * @param position - Start position
   * @param objectId - Optional object ID if starting from an anchor
   * @param anchor - Optional anchor if starting from an object
   */
  startDrag(
    position: Position,
    objectId?: string | null,
    anchor?: ConnectionAnchor
  ): void;

  /**
   * Update the current drag position.
   *
   * @param position - Current mouse/pointer position
   */
  updateDrag(position: Position): void;

  /**
   * Update the hover state during drag.
   *
   * @param objectId - Object being hovered over (null if none)
   * @param nearestAnchor - Nearest anchor on the hovered object
   * @param anchorPosition - Position of the nearest anchor
   */
  updateHover(
    objectId: string | null,
    nearestAnchor: ConnectionAnchor | null,
    anchorPosition?: Position | null
  ): void;

  /**
   * Complete the drag and create a connector.
   *
   * @param options - Optional connector creation options
   * @returns Connector creation result, or null if cancelled
   */
  completeDrag(
    options?: ConnectorCreationOptions
  ): ConnectorCreationResult | null;

  /**
   * Cancel the current drag operation.
   */
  cancelDrag(): void;

  /**
   * Start dragging an existing connector's endpoint.
   *
   * @param connectorId - Connector ID
   * @param endpoint - Which endpoint to drag
   * @param startPosition - Current position of the endpoint
   * @param connectedObjectId - Currently connected object ID (if any)
   * @param connectedAnchor - Currently connected anchor
   */
  startEndpointDrag(
    connectorId: string,
    endpoint: 'start' | 'end',
    startPosition: Position,
    connectedObjectId: string | null,
    connectedAnchor: ConnectionAnchor
  ): void;

  /**
   * Get connection points for an object at the given bounds.
   *
   * @param x - Object X position
   * @param y - Object Y position
   * @param width - Object width
   * @param height - Object height
   * @param rotation - Object rotation in degrees (optional, default 0)
   * @returns Array of connection points
   */
  getConnectionPoints(
    x: number,
    y: number,
    width: number,
    height: number,
    rotation?: number
  ): ConnectionPoint[];

  /**
   * Find the nearest connection point to a position.
   *
   * @param points - Available connection points
   * @param position - Target position
   * @returns Nearest connection point
   */
  findNearestConnectionPoint(
    points: ConnectionPoint[],
    position: Position
  ): ConnectionPoint;

  /**
   * Calculate the distance between two positions.
   *
   * @param a - First position
   * @param b - Second position
   * @returns Distance
   */
  calculateDistance(a: Position, b: Position): number;

  /**
   * Subscribe to connection change events.
   *
   * @param callback - Function called when connections change
   * @returns Unsubscribe function
   */
  onConnectionChange(callback: (event: ConnectionChangeEvent) => void): () => void;

  /**
   * Reset the service state.
   */
  reset(): void;
}
