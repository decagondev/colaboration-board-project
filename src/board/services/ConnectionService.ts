/**
 * Connection Service
 *
 * Manages connector attachments and drag operations for connector creation.
 *
 * @module board/services/ConnectionService
 */

import type { Position } from '../interfaces/IBoardObject';
import type { ConnectionAnchor, ConnectionPoint } from '../interfaces/IConnectable';
import { calculateConnectionPoints } from '../interfaces/IConnectable';
import type {
  IConnectionService,
  ConnectorDragState,
  ConnectorCreationOptions,
  ConnectorCreationResult,
  ConnectionChangeEvent,
} from '../interfaces/IConnectionService';
import { DEFAULT_CONNECTOR_DRAG_STATE } from '../interfaces/IConnectionService';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Connection Service Implementation
 *
 * Provides functionality for:
 * - Managing connector creation drag operations
 * - Finding nearest connection points
 * - Notifying listeners of connection changes
 */
export class ConnectionService implements IConnectionService {
  private _dragState: ConnectorDragState = { ...DEFAULT_CONNECTOR_DRAG_STATE };
  private _listeners: Set<(event: ConnectionChangeEvent) => void> = new Set();

  /**
   * Current drag state during connector creation/editing.
   */
  get dragState(): ConnectorDragState {
    return { ...this._dragState };
  }

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
  ): void {
    this._dragState = {
      isActive: true,
      endpoint: 'end',
      connectorId: null,
      startPosition: { ...position },
      currentPosition: { ...position },
      startObjectId: objectId ?? null,
      startAnchor: anchor ?? 'auto',
      hoveredObjectId: null,
      nearestAnchor: null,
    };
  }

  /**
   * Update the current drag position.
   *
   * @param position - Current mouse/pointer position
   */
  updateDrag(position: Position): void {
    if (!this._dragState.isActive) {
      return;
    }

    this._dragState = {
      ...this._dragState,
      currentPosition: { ...position },
    };
  }

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
  ): void {
    if (!this._dragState.isActive) {
      return;
    }

    this._dragState = {
      ...this._dragState,
      hoveredObjectId: objectId,
      nearestAnchor: nearestAnchor,
      currentPosition: anchorPosition
        ? { ...anchorPosition }
        : this._dragState.currentPosition,
    };
  }

  /**
   * Complete the drag and create a connector.
   *
   * @param options - Optional connector creation options
   * @returns Connector creation result, or null if cancelled
   */
  completeDrag(
    options?: ConnectorCreationOptions
  ): ConnectorCreationResult | null {
    if (!this._dragState.isActive) {
      return null;
    }

    const { startPosition, currentPosition, startObjectId, startAnchor } =
      this._dragState;
    const { hoveredObjectId, nearestAnchor } = this._dragState;

    const minDistance = 10;
    const distance = this.calculateDistance(startPosition, currentPosition);
    if (distance < minDistance) {
      this.cancelDrag();
      return null;
    }

    const result: ConnectorCreationResult = {
      id: generateUUID(),
      startPoint: {
        objectId: startObjectId,
        anchor: startAnchor,
        position: { ...startPosition },
      },
      endPoint: {
        objectId: hoveredObjectId,
        anchor: nearestAnchor ?? 'auto',
        position: { ...currentPosition },
      },
      routeStyle: options?.routeStyle ?? 'straight',
      startArrow: options?.startArrow ?? 'none',
      endArrow: options?.endArrow ?? 'arrow',
      strokeColor: options?.strokeColor ?? '#1f2937',
      strokeWidth: options?.strokeWidth ?? 2,
    };

    this.notifyListeners({
      type: 'created',
      connectorId: result.id,
      currentState: {
        startObjectId: startObjectId,
        endObjectId: hoveredObjectId,
      },
    });

    this._dragState = { ...DEFAULT_CONNECTOR_DRAG_STATE };

    return result;
  }

  /**
   * Cancel the current drag operation.
   */
  cancelDrag(): void {
    this._dragState = { ...DEFAULT_CONNECTOR_DRAG_STATE };
  }

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
  ): void {
    this._dragState = {
      isActive: true,
      endpoint,
      connectorId,
      startPosition: { ...startPosition },
      currentPosition: { ...startPosition },
      startObjectId: endpoint === 'start' ? connectedObjectId : null,
      startAnchor: endpoint === 'start' ? connectedAnchor : 'auto',
      hoveredObjectId: null,
      nearestAnchor: null,
    };
  }

  /**
   * Get connection points for an object at the given bounds.
   *
   * @param x - Object X position
   * @param y - Object Y position
   * @param width - Object width
   * @param height - Object height
   * @returns Array of connection points
   */
  getConnectionPoints(
    x: number,
    y: number,
    width: number,
    height: number
  ): ConnectionPoint[] {
    return calculateConnectionPoints(x, y, width, height);
  }

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
  ): ConnectionPoint {
    if (points.length === 0) {
      return {
        anchor: 'center',
        position: { ...position },
        direction: { x: 0, y: 0 },
      };
    }

    let nearest = points[0];
    let minDistance = this.calculateDistance(nearest.position, position);

    for (let i = 1; i < points.length; i++) {
      const dist = this.calculateDistance(points[i].position, position);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = points[i];
      }
    }

    return nearest;
  }

  /**
   * Calculate the distance between two positions.
   *
   * @param a - First position
   * @param b - Second position
   * @returns Distance
   */
  calculateDistance(a: Position, b: Position): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Subscribe to connection change events.
   *
   * @param callback - Function called when connections change
   * @returns Unsubscribe function
   */
  onConnectionChange(
    callback: (event: ConnectionChangeEvent) => void
  ): () => void {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  /**
   * Reset the service state.
   */
  reset(): void {
    this._dragState = { ...DEFAULT_CONNECTOR_DRAG_STATE };
    this._listeners.clear();
  }

  /**
   * Notify listeners of a connection change.
   *
   * @param event - Connection change event
   */
  private notifyListeners(event: ConnectionChangeEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }
}

/**
 * Create a new ConnectionService instance.
 *
 * @returns New ConnectionService
 */
export function createConnectionService(): IConnectionService {
  return new ConnectionService();
}
