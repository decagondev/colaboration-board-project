/**
 * Board Canvas Component
 *
 * Main canvas component using Konva.js for rendering the infinite board.
 * Handles Stage and Layer setup with responsive sizing and viewport culling.
 */

import { useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type Konva from 'konva';
import { useViewport } from '../hooks/useViewport';
import type { Bounds } from '@shared/types';

/**
 * Board object interface for rendering.
 * Minimal interface for objects to be rendered on the canvas.
 */
export interface RenderableObject {
  /** Unique object identifier */
  id: string;
  /** Object type */
  type: string;
  /** X position in canvas coordinates */
  x: number;
  /** Y position in canvas coordinates */
  y: number;
  /** Object width */
  width: number;
  /** Object height */
  height: number;
  /** Object color */
  color?: string;
  /** Rotation in degrees */
  rotation?: number;
}

/**
 * Props for the BoardCanvasComponent.
 */
export interface BoardCanvasProps {
  /** Array of objects to render on the canvas */
  objects?: RenderableObject[];
  /** Callback when an object is selected */
  onObjectSelect?: (objectId: string) => void;
  /** Callback when canvas background is clicked (deselect) */
  onBackgroundClick?: () => void;
  /** Callback when an object position changes */
  onObjectDragEnd?: (objectId: string, x: number, y: number) => void;
  /** Currently selected object IDs */
  selectedIds?: Set<string>;
  /** Children to render inside the canvas (custom layers) */
  children?: React.ReactNode;
}

/**
 * Zoom configuration constants.
 */
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_SENSITIVITY = 1.05;

/**
 * Background grid configuration.
 */
const GRID_SIZE = 50;
const _GRID_COLOR = '#e5e7eb';

/**
 * Main board canvas component.
 *
 * Features:
 * - Infinite canvas with pan and zoom
 * - Responsive sizing to fill viewport
 * - Viewport culling for performance
 * - Multiple layers for separation of concerns
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <BoardCanvasComponent
 *   objects={boardObjects}
 *   selectedIds={selectedObjectIds}
 *   onObjectSelect={(id) => setSelected(id)}
 *   onObjectDragEnd={(id, x, y) => updateObject(id, { x, y })}
 * />
 * ```
 */
export function BoardCanvasComponent({
  objects = [],
  onObjectSelect,
  onBackgroundClick,
  onObjectDragEnd,
  selectedIds = new Set(),
  children,
}: BoardCanvasProps): JSX.Element {
  const stageRef = useRef<Konva.Stage>(null);

  const { viewport, canvasSize, setViewport, isVisible } = useViewport({
    minScale: MIN_SCALE,
    maxScale: MAX_SCALE,
  });

  /**
   * Handle mouse wheel for zooming.
   * Zooms toward the pointer position for natural feel.
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>): void => {
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
      const newScale =
        direction > 0
          ? Math.min(MAX_SCALE, oldScale * ZOOM_SENSITIVITY)
          : Math.max(MIN_SCALE, oldScale / ZOOM_SENSITIVITY);

      setViewport({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [viewport, setViewport]
  );

  /**
   * Handle stage drag end for panning.
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>): void => {
      if (e.target === stageRef.current) {
        setViewport({
          ...viewport,
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [viewport, setViewport]
  );

  /**
   * Handle stage click for background deselection.
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      if (e.target === stageRef.current) {
        onBackgroundClick?.();
      }
    },
    [onBackgroundClick]
  );

  /**
   * Filter objects to only those visible in the viewport.
   */
  const visibleObjects = useMemo(() => {
    return objects.filter((obj) =>
      isVisible({
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
      })
    );
  }, [objects, isVisible]);

  /**
   * Render a single object based on its type.
   * This is a placeholder - will be replaced with proper object components.
   */
  const renderObject = useCallback(
    (obj: RenderableObject): JSX.Element => {
      const isSelected = selectedIds.has(obj.id);

      return (
        <Rect
          key={obj.id}
          id={obj.id}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          fill={obj.color ?? '#3b82f6'}
          rotation={obj.rotation ?? 0}
          draggable
          stroke={isSelected ? '#1d4ed8' : undefined}
          strokeWidth={isSelected ? 2 : 0}
          onClick={() => onObjectSelect?.(obj.id)}
          onTap={() => onObjectSelect?.(obj.id)}
          onDragEnd={(e) => {
            onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
          }}
        />
      );
    },
    [selectedIds, onObjectSelect, onObjectDragEnd]
  );

  /**
   * Generate background grid pattern bounds.
   */
  const gridBounds = useMemo((): Bounds => {
    const visibleBounds = {
      x: -viewport.x / viewport.scale,
      y: -viewport.y / viewport.scale,
      width: canvasSize.width / viewport.scale,
      height: canvasSize.height / viewport.scale,
    };

    return {
      x: Math.floor(visibleBounds.x / GRID_SIZE) * GRID_SIZE - GRID_SIZE,
      y: Math.floor(visibleBounds.y / GRID_SIZE) * GRID_SIZE - GRID_SIZE,
      width: visibleBounds.width + GRID_SIZE * 3,
      height: visibleBounds.height + GRID_SIZE * 3,
    };
  }, [viewport, canvasSize]);

  return (
    <Stage
      ref={stageRef}
      width={canvasSize.width}
      height={canvasSize.height}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      draggable
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      onClick={handleStageClick}
      onTap={handleStageClick}
    >
      {/* Background layer - grid pattern */}
      <Layer name="background" listening={false}>
        <Rect
          x={gridBounds.x}
          y={gridBounds.y}
          width={gridBounds.width}
          height={gridBounds.height}
          fill="#ffffff"
        />
      </Layer>

      {/* Object layer - main content */}
      <Layer name="objects">{visibleObjects.map(renderObject)}</Layer>

      {/* Custom layers passed as children */}
      {children}
    </Stage>
  );
}

/**
 * Export viewport hook for external use.
 */
export { useViewport } from '../hooks/useViewport';
export type {
  ViewportState,
  ViewportOptions,
  UseViewportReturn,
} from '../hooks/useViewport';
