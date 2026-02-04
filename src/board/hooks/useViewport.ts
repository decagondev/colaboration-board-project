/**
 * Viewport Hook Module
 *
 * Manages viewport state including position, scale, and responsive sizing.
 * Provides utilities for coordinate transformation between screen and canvas space.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Point, Bounds, Size } from '@shared/types';

/**
 * Viewport state representing the current view of the canvas.
 */
export interface ViewportState {
  /** X offset of the viewport */
  x: number;
  /** Y offset of the viewport */
  y: number;
  /** Current zoom scale (1 = 100%) */
  scale: number;
}

/**
 * Configuration options for the viewport.
 */
export interface ViewportOptions {
  /** Minimum allowed scale */
  minScale?: number;
  /** Maximum allowed scale */
  maxScale?: number;
  /** Initial viewport state */
  initialState?: Partial<ViewportState>;
}

/**
 * Default viewport configuration.
 */
const DEFAULT_OPTIONS: Required<ViewportOptions> = {
  minScale: 0.1,
  maxScale: 5,
  initialState: { x: 0, y: 0, scale: 1 },
};

/**
 * Hook return type.
 */
export interface UseViewportReturn {
  /** Current viewport state */
  viewport: ViewportState;
  /** Canvas dimensions based on window size */
  canvasSize: Size;
  /** Set the viewport position */
  setPosition: (x: number, y: number) => void;
  /** Set the viewport scale */
  setScale: (scale: number) => void;
  /** Set the entire viewport state */
  setViewport: (viewport: ViewportState) => void;
  /** Reset viewport to initial state */
  resetViewport: () => void;
  /** Get visible bounds in canvas coordinates */
  getVisibleBounds: () => Bounds;
  /** Convert screen coordinates to canvas coordinates */
  screenToCanvas: (point: Point) => Point;
  /** Convert canvas coordinates to screen coordinates */
  canvasToScreen: (point: Point) => Point;
  /** Check if a bounds rectangle is visible in the viewport */
  isVisible: (bounds: Bounds) => boolean;
}

/**
 * Custom hook for managing viewport state and responsive canvas sizing.
 *
 * Handles:
 * - Viewport position and scale state
 * - Window resize events for responsive canvas
 * - Coordinate transformation utilities
 * - Visibility culling calculations
 *
 * @param options - Configuration options for the viewport
 * @returns Viewport state and utility functions
 *
 * @example
 * ```tsx
 * const {
 *   viewport,
 *   canvasSize,
 *   setPosition,
 *   setScale,
 *   screenToCanvas,
 *   isVisible
 * } = useViewport({ minScale: 0.1, maxScale: 5 });
 *
 * // Transform mouse position to canvas coordinates
 * const canvasPos = screenToCanvas({ x: mouseX, y: mouseY });
 *
 * // Check if an object should be rendered
 * if (isVisible({ x: obj.x, y: obj.y, width: obj.width, height: obj.height })) {
 *   // Render the object
 * }
 * ```
 */
export function useViewport(options: ViewportOptions = {}): UseViewportReturn {
  const { minScale, maxScale, initialState } = {
    ...DEFAULT_OPTIONS,
    ...options,
    initialState: { ...DEFAULT_OPTIONS.initialState, ...options.initialState },
  };

  const [viewport, setViewportState] = useState<ViewportState>({
    x: initialState.x ?? 0,
    y: initialState.y ?? 0,
    scale: initialState.scale ?? 1,
  });

  const [canvasSize, setCanvasSize] = useState<Size>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  /**
   * Handle window resize events.
   */
  useEffect(() => {
    function handleResize(): void {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Set the viewport position.
   */
  const setPosition = useCallback((x: number, y: number): void => {
    setViewportState((prev) => ({ ...prev, x, y }));
  }, []);

  /**
   * Set the viewport scale with bounds checking.
   */
  const setScale = useCallback(
    (scale: number): void => {
      const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
      setViewportState((prev) => ({ ...prev, scale: clampedScale }));
    },
    [minScale, maxScale]
  );

  /**
   * Set the entire viewport state.
   */
  const setViewport = useCallback(
    (newViewport: ViewportState): void => {
      setViewportState({
        x: newViewport.x,
        y: newViewport.y,
        scale: Math.max(minScale, Math.min(maxScale, newViewport.scale)),
      });
    },
    [minScale, maxScale]
  );

  /**
   * Reset viewport to initial state.
   */
  const resetViewport = useCallback((): void => {
    setViewportState({
      x: initialState.x ?? 0,
      y: initialState.y ?? 0,
      scale: initialState.scale ?? 1,
    });
  }, [initialState]);

  /**
   * Get the visible bounds in canvas coordinates.
   */
  const getVisibleBounds = useCallback((): Bounds => {
    return {
      x: -viewport.x / viewport.scale,
      y: -viewport.y / viewport.scale,
      width: canvasSize.width / viewport.scale,
      height: canvasSize.height / viewport.scale,
    };
  }, [viewport, canvasSize]);

  /**
   * Convert screen coordinates to canvas coordinates.
   */
  const screenToCanvas = useCallback(
    (point: Point): Point => {
      return {
        x: (point.x - viewport.x) / viewport.scale,
        y: (point.y - viewport.y) / viewport.scale,
      };
    },
    [viewport]
  );

  /**
   * Convert canvas coordinates to screen coordinates.
   */
  const canvasToScreen = useCallback(
    (point: Point): Point => {
      return {
        x: point.x * viewport.scale + viewport.x,
        y: point.y * viewport.scale + viewport.y,
      };
    },
    [viewport]
  );

  /**
   * Check if a bounds rectangle is visible in the viewport.
   * Used for viewport culling to optimize rendering.
   */
  const isVisible = useCallback(
    (bounds: Bounds): boolean => {
      const visibleBounds = getVisibleBounds();

      const objRight = bounds.x + bounds.width;
      const objBottom = bounds.y + bounds.height;
      const visibleRight = visibleBounds.x + visibleBounds.width;
      const visibleBottom = visibleBounds.y + visibleBounds.height;

      return !(
        bounds.x > visibleRight ||
        objRight < visibleBounds.x ||
        bounds.y > visibleBottom ||
        objBottom < visibleBounds.y
      );
    },
    [getVisibleBounds]
  );

  return useMemo(
    () => ({
      viewport,
      canvasSize,
      setPosition,
      setScale,
      setViewport,
      resetViewport,
      getVisibleBounds,
      screenToCanvas,
      canvasToScreen,
      isVisible,
    }),
    [
      viewport,
      canvasSize,
      setPosition,
      setScale,
      setViewport,
      resetViewport,
      getVisibleBounds,
      screenToCanvas,
      canvasToScreen,
      isVisible,
    ]
  );
}
