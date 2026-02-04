/**
 * Canvas Interaction Hook
 *
 * Handles pan and zoom interactions for the Konva canvas.
 * Provides handlers for wheel zoom and drag pan with configurable limits.
 */

import { useCallback, useRef } from 'react';
import type Konva from 'konva';
import type { ViewportState } from './useViewport';

/**
 * Configuration for canvas interaction behavior.
 */
export interface CanvasInteractionOptions {
  /** Minimum allowed zoom scale */
  minScale?: number;
  /** Maximum allowed zoom scale */
  maxScale?: number;
  /** Zoom sensitivity multiplier */
  zoomSensitivity?: number;
  /** Whether panning is enabled */
  panEnabled?: boolean;
  /** Whether zooming is enabled */
  zoomEnabled?: boolean;
}

/**
 * Return type for useCanvasInteraction hook.
 */
export interface UseCanvasInteractionReturn {
  /** Handler for wheel events (zooming) */
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  /** Handler for drag end events (panning) */
  handleDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Handler for drag move events (live panning) */
  handleDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  /** Zoom to a specific scale */
  zoomTo: (scale: number, center?: { x: number; y: number }) => void;
  /** Zoom in by the sensitivity factor */
  zoomIn: () => void;
  /** Zoom out by the sensitivity factor */
  zoomOut: () => void;
  /** Reset zoom to 1 and center viewport */
  resetView: () => void;
  /** Pan to a specific position */
  panTo: (x: number, y: number) => void;
}

/**
 * Default interaction configuration.
 */
const DEFAULT_OPTIONS: Required<CanvasInteractionOptions> = {
  minScale: 0.1,
  maxScale: 5,
  zoomSensitivity: 1.05,
  panEnabled: true,
  zoomEnabled: true,
};

/**
 * Custom hook for managing canvas pan and zoom interactions.
 *
 * Provides:
 * - Wheel zoom toward pointer position
 * - Drag-to-pan functionality
 * - Zoom limits and sensitivity configuration
 * - Programmatic zoom and pan controls
 *
 * @param viewport - Current viewport state
 * @param setViewport - Function to update viewport state
 * @param stageRef - Reference to the Konva Stage
 * @param options - Optional configuration
 * @returns Interaction handlers and control functions
 *
 * @example
 * ```tsx
 * const stageRef = useRef<Konva.Stage>(null);
 * const { viewport, setViewport } = useViewport();
 *
 * const { handleWheel, handleDragEnd, zoomIn, zoomOut } = useCanvasInteraction(
 *   viewport,
 *   setViewport,
 *   stageRef,
 *   { minScale: 0.1, maxScale: 5 }
 * );
 *
 * return (
 *   <Stage
 *     ref={stageRef}
 *     onWheel={handleWheel}
 *     onDragEnd={handleDragEnd}
 *     draggable
 *   />
 * );
 * ```
 */
export function useCanvasInteraction(
  viewport: ViewportState,
  setViewport: (viewport: ViewportState) => void,
  stageRef: React.RefObject<Konva.Stage | null>,
  options: CanvasInteractionOptions = {}
): UseCanvasInteractionReturn {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const lastPanPosition = useRef<{ x: number; y: number } | null>(null);

  /**
   * Clamp scale to configured bounds.
   */
  const clampScale = useCallback(
    (scale: number): number => {
      return Math.max(config.minScale, Math.min(config.maxScale, scale));
    },
    [config.minScale, config.maxScale]
  );

  /**
   * Handle wheel zoom with pointer position tracking.
   * Zooms toward the mouse pointer for natural feel.
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>): void => {
      if (!config.zoomEnabled) return;

      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = clampScale(
        direction > 0
          ? oldScale * config.zoomSensitivity
          : oldScale / config.zoomSensitivity
      );

      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [
      viewport,
      setViewport,
      stageRef,
      config.zoomEnabled,
      config.zoomSensitivity,
      clampScale,
    ]
  );

  /**
   * Handle drag end for updating final pan position.
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>): void => {
      if (!config.panEnabled) return;

      const stage = stageRef.current;
      if (e.target === stage) {
        setViewport({
          ...viewport,
          x: e.target.x(),
          y: e.target.y(),
        });
      }
      lastPanPosition.current = null;
    },
    [viewport, setViewport, stageRef, config.panEnabled]
  );

  /**
   * Handle drag move for live pan updates (optional).
   */
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>): void => {
      if (!config.panEnabled) return;

      const stage = stageRef.current;
      if (e.target === stage) {
        lastPanPosition.current = {
          x: e.target.x(),
          y: e.target.y(),
        };
      }
    },
    [stageRef, config.panEnabled]
  );

  /**
   * Zoom to a specific scale, optionally centering on a point.
   */
  const zoomTo = useCallback(
    (scale: number, center?: { x: number; y: number }): void => {
      const stage = stageRef.current;
      const newScale = clampScale(scale);

      if (center && stage) {
        const canvasCenter = center;
        const mousePointTo = {
          x: (canvasCenter.x - viewport.x) / viewport.scale,
          y: (canvasCenter.y - viewport.y) / viewport.scale,
        };

        setViewport({
          scale: newScale,
          x: canvasCenter.x - mousePointTo.x * newScale,
          y: canvasCenter.y - mousePointTo.y * newScale,
        });
      } else {
        setViewport({
          ...viewport,
          scale: newScale,
        });
      }
    },
    [viewport, setViewport, stageRef, clampScale]
  );

  /**
   * Zoom in by the sensitivity factor.
   */
  const zoomIn = useCallback((): void => {
    const newScale = clampScale(viewport.scale * config.zoomSensitivity);
    setViewport({
      ...viewport,
      scale: newScale,
    });
  }, [viewport, setViewport, config.zoomSensitivity, clampScale]);

  /**
   * Zoom out by the sensitivity factor.
   */
  const zoomOut = useCallback((): void => {
    const newScale = clampScale(viewport.scale / config.zoomSensitivity);
    setViewport({
      ...viewport,
      scale: newScale,
    });
  }, [viewport, setViewport, config.zoomSensitivity, clampScale]);

  /**
   * Reset view to default (scale 1, centered).
   */
  const resetView = useCallback((): void => {
    setViewport({
      x: 0,
      y: 0,
      scale: 1,
    });
  }, [setViewport]);

  /**
   * Pan to a specific position.
   */
  const panTo = useCallback(
    (x: number, y: number): void => {
      setViewport({
        ...viewport,
        x,
        y,
      });
    },
    [viewport, setViewport]
  );

  return {
    handleWheel,
    handleDragEnd,
    handleDragMove,
    zoomTo,
    zoomIn,
    zoomOut,
    resetView,
    panTo,
  };
}
