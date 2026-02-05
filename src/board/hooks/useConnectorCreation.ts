/**
 * useConnectorCreation Hook
 *
 * React hook for managing connector creation through drag-to-connect interaction.
 *
 * @module board/hooks/useConnectorCreation
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Position } from '../interfaces/IBoardObject';
import type { ConnectionAnchor, ConnectionPoint } from '../interfaces/IConnectable';
import type {
  IConnectionService,
  ConnectorDragState,
  ConnectorCreationOptions,
  ConnectorCreationResult,
} from '../interfaces/IConnectionService';
import { ConnectionService } from '../services/ConnectionService';
import { DEFAULT_CONNECTOR_DRAG_STATE } from '../interfaces/IConnectionService';
import type { RenderableObject } from '../components/BoardCanvasComponent';

/**
 * Configuration for the useConnectorCreation hook.
 */
export interface UseConnectorCreationConfig {
  /** Snap distance to anchor points (default: 20) */
  snapDistance?: number;
  /** Default connector creation options */
  defaultOptions?: ConnectorCreationOptions;
  /** External connection service (optional, creates one internally if not provided) */
  connectionService?: IConnectionService;
}

/**
 * Return type for the useConnectorCreation hook.
 */
export interface UseConnectorCreationReturn {
  /** Whether connector creation mode is active */
  isCreating: boolean;
  /** Current drag state */
  dragState: ConnectorDragState;
  /** Start connector creation from a position or anchor */
  startCreation: (
    position: Position,
    objectId?: string | null,
    anchor?: ConnectionAnchor
  ) => void;
  /** Update the drag position during creation */
  updatePosition: (position: Position) => void;
  /** Check if position is near an anchor and update hover state */
  checkAnchorProximity: (
    position: Position,
    objects: RenderableObject[],
    excludeObjectId?: string | null
  ) => void;
  /** Complete creation and return the connector data */
  completeCreation: (
    options?: ConnectorCreationOptions
  ) => ConnectorCreationResult | null;
  /** Cancel the current creation */
  cancelCreation: () => void;
  /** Get connection points for an object */
  getObjectConnectionPoints: (object: RenderableObject) => ConnectionPoint[];
  /** Find nearest anchor point on an object */
  findNearestAnchor: (
    position: Position,
    object: RenderableObject
  ) => { anchor: ConnectionAnchor; position: Position } | null;
  /** The underlying connection service */
  service: IConnectionService;
}

/**
 * Hook for managing connector creation through drag-to-connect.
 *
 * Provides functionality for:
 * - Starting connector creation from an anchor point or free position
 * - Tracking drag position during creation
 * - Snapping to nearby anchor points
 * - Completing or cancelling creation
 *
 * @param config - Optional configuration
 * @returns Connector creation state and functions
 *
 * @example
 * ```typescript
 * const {
 *   isCreating,
 *   dragState,
 *   startCreation,
 *   updatePosition,
 *   checkAnchorProximity,
 *   completeCreation,
 * } = useConnectorCreation({ snapDistance: 25 });
 *
 * const handleAnchorClick = (objectId: string, anchor: ConnectionAnchor, position: Position) => {
 *   startCreation(position, objectId, anchor);
 * };
 *
 * const handleMouseMove = (e: MouseEvent) => {
 *   if (isCreating) {
 *     updatePosition({ x: e.clientX, y: e.clientY });
 *     checkAnchorProximity({ x: e.clientX, y: e.clientY }, objects, dragState.startObjectId);
 *   }
 * };
 *
 * const handleMouseUp = () => {
 *   if (isCreating) {
 *     const result = completeCreation();
 *     if (result) {
 *       onConnectorCreated(result);
 *     }
 *   }
 * };
 * ```
 */
export function useConnectorCreation(
  config: UseConnectorCreationConfig = {}
): UseConnectorCreationReturn {
  const { snapDistance = 20, defaultOptions, connectionService } = config;

  const serviceRef = useRef<IConnectionService>(
    connectionService ?? new ConnectionService()
  );

  const [dragState, setDragState] = useState<ConnectorDragState>(
    DEFAULT_CONNECTOR_DRAG_STATE
  );

  useEffect(() => {
    if (connectionService) {
      serviceRef.current = connectionService;
    }
  }, [connectionService]);

  const isCreating = useMemo(() => dragState.isActive, [dragState.isActive]);

  const startCreation = useCallback(
    (
      position: Position,
      objectId?: string | null,
      anchor?: ConnectionAnchor
    ) => {
      serviceRef.current.startDrag(position, objectId, anchor);
      setDragState(serviceRef.current.dragState);
    },
    []
  );

  const updatePosition = useCallback((position: Position) => {
    serviceRef.current.updateDrag(position);
    setDragState(serviceRef.current.dragState);
  }, []);

  const getObjectConnectionPoints = useCallback(
    (object: RenderableObject): ConnectionPoint[] => {
      return serviceRef.current.getConnectionPoints(
        object.x,
        object.y,
        object.width,
        object.height
      );
    },
    []
  );

  const findNearestAnchor = useCallback(
    (
      position: Position,
      object: RenderableObject
    ): { anchor: ConnectionAnchor; position: Position } | null => {
      const points = getObjectConnectionPoints(object);
      const filteredPoints = points.filter((p) => p.anchor !== 'center');

      if (filteredPoints.length === 0) {
        return null;
      }

      const nearest = serviceRef.current.findNearestConnectionPoint(
        filteredPoints,
        position
      );
      const distance = serviceRef.current.calculateDistance(
        nearest.position,
        position
      );

      if (distance <= snapDistance) {
        return {
          anchor: nearest.anchor,
          position: nearest.position,
        };
      }

      return null;
    },
    [snapDistance, getObjectConnectionPoints]
  );

  const checkAnchorProximity = useCallback(
    (
      position: Position,
      objects: RenderableObject[],
      excludeObjectId?: string | null
    ) => {
      const connectableObjects = objects.filter(
        (obj) =>
          obj.id !== excludeObjectId &&
          (obj.type === 'shape' || obj.type === 'sticky-note' || obj.type === 'text')
      );

      let foundObjectId: string | null = null;
      let foundAnchor: ConnectionAnchor | null = null;
      let foundPosition: Position | null = null;
      let minDistance = Infinity;

      for (const obj of connectableObjects) {
        const points = getObjectConnectionPoints(obj);
        const filteredPoints = points.filter((p) => p.anchor !== 'center');

        for (const point of filteredPoints) {
          const distance = serviceRef.current.calculateDistance(
            point.position,
            position
          );

          if (distance <= snapDistance && distance < minDistance) {
            minDistance = distance;
            foundObjectId = obj.id;
            foundAnchor = point.anchor;
            foundPosition = point.position;
          }
        }
      }

      serviceRef.current.updateHover(foundObjectId, foundAnchor, foundPosition);
      setDragState(serviceRef.current.dragState);
    },
    [snapDistance, getObjectConnectionPoints]
  );

  const completeCreation = useCallback(
    (options?: ConnectorCreationOptions): ConnectorCreationResult | null => {
      const mergedOptions = { ...defaultOptions, ...options };
      const result = serviceRef.current.completeDrag(mergedOptions);
      setDragState(DEFAULT_CONNECTOR_DRAG_STATE);
      return result;
    },
    [defaultOptions]
  );

  const cancelCreation = useCallback(() => {
    serviceRef.current.cancelDrag();
    setDragState(DEFAULT_CONNECTOR_DRAG_STATE);
  }, []);

  return {
    isCreating,
    dragState,
    startCreation,
    updatePosition,
    checkAnchorProximity,
    completeCreation,
    cancelCreation,
    getObjectConnectionPoints,
    findNearestAnchor,
    service: serviceRef.current,
  };
}
