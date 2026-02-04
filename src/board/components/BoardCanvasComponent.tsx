/**
 * Board Canvas Component
 *
 * Main canvas component using Konva.js for rendering the infinite board.
 * Handles Stage and Layer setup with responsive sizing and viewport culling.
 */

import { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Ellipse, Group, Text } from 'react-konva';
import type Konva from 'konva';
import type { Bounds, Size } from '@shared/types';
import { TransformerComponent } from './TransformerComponent';
import { LassoOverlayComponent } from './LassoOverlayComponent';
import type { LassoState } from '../interfaces/ISelectionService';

/**
 * Viewport state for canvas positioning and scaling.
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
 * Board object interface for rendering.
 * Extended interface with all data needed for type-specific rendering.
 */
export interface RenderableObject {
  /** Unique object identifier */
  id: string;
  /** Object type: 'sticky-note', 'shape', 'text' */
  type: string;
  /** X position in canvas coordinates */
  x: number;
  /** Y position in canvas coordinates */
  y: number;
  /** Object width */
  width: number;
  /** Object height */
  height: number;
  /** Object-specific data */
  data?: Record<string, unknown>;
}

/**
 * Canvas click event data with canvas coordinates.
 */
export interface CanvasClickEvent {
  /** X position in canvas coordinates */
  canvasX: number;
  /** Y position in canvas coordinates */
  canvasY: number;
  /** X position in screen coordinates */
  screenX: number;
  /** Y position in screen coordinates */
  screenY: number;
}

/**
 * Props for the BoardCanvasComponent.
 */
/**
 * Transform end event data for resize/rotate operations.
 */
export interface TransformEndEvent {
  /** Object ID being transformed */
  objectId: string;
  /** New X position */
  x: number;
  /** New Y position */
  y: number;
  /** New width */
  width: number;
  /** New height */
  height: number;
  /** New rotation in degrees */
  rotation: number;
}

export interface BoardCanvasProps {
  /** Array of objects to render on the canvas */
  objects?: RenderableObject[];
  /** Controlled viewport state */
  viewport?: ViewportState;
  /** Callback when viewport changes (for controlled mode) */
  onViewportChange?: (viewport: ViewportState) => void;
  /** Callback when an object is selected */
  onObjectSelect?: (objectId: string) => void;
  /** Callback when canvas background is clicked (deselect) */
  onBackgroundClick?: () => void;
  /** Callback when canvas background is clicked with coordinates */
  onCanvasClick?: (event: CanvasClickEvent) => void;
  /** Callback when an object position changes */
  onObjectDragEnd?: (objectId: string, x: number, y: number) => void;
  /** Callback when object is double-clicked for editing */
  onObjectDoubleClick?: (objectId: string) => void;
  /** Callback when object is resized/rotated */
  onObjectTransformEnd?: (event: TransformEndEvent) => void;
  /** Currently selected object IDs */
  selectedIds?: Set<string>;
  /** Currently active tool (affects pan behavior) */
  activeTool?: string;
  /** Callback when lasso selection completes with object IDs in bounds */
  onLassoSelect?: (objectIds: string[]) => void;
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

/**
 * Default viewport state.
 */
const DEFAULT_VIEWPORT: ViewportState = { x: 0, y: 0, scale: 1 };

/**
 * Sticky note rendering constants.
 */
const STICKY_NOTE_CORNER_RADIUS = 4;
const STICKY_NOTE_PADDING = 12;
const STICKY_NOTE_SHADOW_OFFSET = 4;

/**
 * Main board canvas component.
 *
 * Features:
 * - Infinite canvas with pan and zoom
 * - Responsive sizing to fill viewport
 * - Viewport culling for performance
 * - Type-specific object rendering
 * - Multiple layers for separation of concerns
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <BoardCanvasComponent
 *   objects={boardObjects}
 *   viewport={viewport}
 *   onViewportChange={setViewport}
 *   selectedIds={selectedObjectIds}
 *   onObjectSelect={(id) => setSelected(id)}
 *   onObjectDragEnd={(id, x, y) => updateObject(id, { x, y })}
 * />
 * ```
 */
export function BoardCanvasComponent({
  objects = [],
  viewport: controlledViewport,
  onViewportChange,
  onObjectSelect,
  onBackgroundClick,
  onCanvasClick,
  onObjectDragEnd,
  onObjectDoubleClick,
  onObjectTransformEnd,
  selectedIds = new Set(),
  activeTool = 'select',
  onLassoSelect,
  children,
}: BoardCanvasProps): JSX.Element {
  const stageRef = useRef<Konva.Stage>(null);
  const nodeRefsMap = useRef<Map<string, Konva.Node>>(new Map());

  const [internalViewport, setInternalViewport] =
    useState<ViewportState>(DEFAULT_VIEWPORT);
  const [canvasSize, setCanvasSize] = useState<Size>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const objectClickedRef = useRef(false);
  const [lassoState, setLassoState] = useState<LassoState>({
    isActive: false,
    startPoint: null,
    currentPoint: null,
    bounds: null,
  });
  const lassoStartRef = useRef<{ x: number; y: number } | null>(null);

  const viewport = controlledViewport ?? internalViewport;
  const setViewport = onViewportChange ?? setInternalViewport;

  /**
   * Track space bar for pan mode.
   */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    }
    function handleKeyUp(e: KeyboardEvent): void {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  /**
   * Handle window resize for responsive canvas.
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
   * Check if bounds are visible in the viewport.
   */
  const isVisible = useCallback(
    (bounds: Bounds): boolean => {
      const visibleBounds = {
        x: -viewport.x / viewport.scale,
        y: -viewport.y / viewport.scale,
        width: canvasSize.width / viewport.scale,
        height: canvasSize.height / viewport.scale,
      };

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
    [viewport, canvasSize]
  );

  /**
   * Register a Konva node reference for an object.
   */
  const registerNodeRef = useCallback(
    (objectId: string, node: Konva.Node | null) => {
      if (node) {
        nodeRefsMap.current.set(objectId, node);
      } else {
        nodeRefsMap.current.delete(objectId);
      }
    },
    []
  );

  /**
   * Get selected Konva nodes for the transformer.
   */
  const selectedNodes = useMemo(() => {
    const nodes: Konva.Node[] = [];
    selectedIds.forEach((id) => {
      const node = nodeRefsMap.current.get(id);
      if (node) {
        nodes.push(node);
      }
    });
    return nodes;
  }, [selectedIds]);

  /**
   * Handle transform end event from the transformer.
   */
  const handleTransformEnd = useCallback(() => {
    if (!onObjectTransformEnd) return;

    selectedIds.forEach((objectId) => {
      const node = nodeRefsMap.current.get(objectId);
      if (!node) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      node.scaleX(1);
      node.scaleY(1);

      onObjectTransformEnd({
        objectId,
        x: node.x(),
        y: node.y(),
        width: Math.max(node.width() * scaleX, 20),
        height: Math.max(node.height() * scaleY, 20),
        rotation: node.rotation(),
      });
    });
  }, [selectedIds, onObjectTransformEnd]);

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
   * Handle mouse down for pan initiation or lasso selection.
   * Panning is enabled when:
   * - Space bar is held down
   * - Middle mouse button is pressed
   * Lasso is enabled when:
   * - Select tool is active
   * - Clicking on empty canvas (not on an object)
   */
  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      const pointer = e.target?.getStage()?.getPointerPosition();
      const canvasX = pointer ? (pointer.x - viewport.x) / viewport.scale : 0;
      const canvasY = pointer ? (pointer.y - viewport.y) / viewport.scale : 0;
      
      const isMiddleButton = e.evt.button === 1;
      const isLeftButton = e.evt.button === 0;
      const clickedOnStage = e.target === stageRef.current;
      
      if (isSpacePressed || isMiddleButton) {
        e.evt.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
          x: e.evt.clientX - viewport.x,
          y: e.evt.clientY - viewport.y,
        };
      } else if (isLeftButton && activeTool === 'select' && clickedOnStage) {
        lassoStartRef.current = { x: canvasX, y: canvasY };
        setLassoState({
          isActive: true,
          startPoint: { x: canvasX, y: canvasY },
          currentPoint: { x: canvasX, y: canvasY },
          bounds: { x: canvasX, y: canvasY, width: 0, height: 0 },
        });
      }
    },
    [isSpacePressed, viewport.x, viewport.y, viewport.scale, activeTool]
  );

  /**
   * Handle mouse move for panning or lasso selection.
   */
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      if (isPanning && panStartRef.current) {
        const newX = e.evt.clientX - panStartRef.current.x;
        const newY = e.evt.clientY - panStartRef.current.y;
        setViewport({
          ...viewport,
          x: newX,
          y: newY,
        });
      } else if (lassoState.isActive && lassoStartRef.current) {
        const pointer = stageRef.current?.getPointerPosition();
        if (!pointer) return;
        
        const canvasX = (pointer.x - viewport.x) / viewport.scale;
        const canvasY = (pointer.y - viewport.y) / viewport.scale;
        const start = lassoStartRef.current;
        
        const minX = Math.min(start.x, canvasX);
        const minY = Math.min(start.y, canvasY);
        const maxX = Math.max(start.x, canvasX);
        const maxY = Math.max(start.y, canvasY);
        
        setLassoState({
          isActive: true,
          startPoint: start,
          currentPoint: { x: canvasX, y: canvasY },
          bounds: {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          },
        });
      }
    },
    [isPanning, viewport, setViewport, lassoState.isActive]
  );

  /**
   * Handle mouse up to end panning or finalize lasso selection.
   */
  const handleMouseUp = useCallback((): void => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
    
    if (lassoState.isActive && lassoState.bounds) {
      const { x: lx, y: ly, width: lw, height: lh } = lassoState.bounds;
      
      if (lw > 5 || lh > 5) {
        const selectedObjectIds = objects
          .filter((obj) => {
            const objRight = obj.x + obj.width;
            const objBottom = obj.y + obj.height;
            const lassoRight = lx + lw;
            const lassoBottom = ly + lh;
            
            return (
              obj.x < lassoRight &&
              objRight > lx &&
              obj.y < lassoBottom &&
              objBottom > ly
            );
          })
          .map((obj) => obj.id);
        
        if (selectedObjectIds.length > 0 && onLassoSelect) {
          onLassoSelect(selectedObjectIds);
        }
      }
      
      setLassoState({
        isActive: false,
        startPoint: null,
        currentPoint: null,
        bounds: null,
      });
      lassoStartRef.current = null;
    }
  }, [isPanning, lassoState, objects, onLassoSelect]);

  /**
   * Handle stage click for background deselection and object creation.
   * Provides both screen and canvas coordinates.
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>): void => {
      if (objectClickedRef.current) {
        objectClickedRef.current = false;
        return;
      }
      
      if (lassoState.isActive) {
        return;
      }
      
      if (e.target === stageRef.current) {
        onBackgroundClick?.();

        const stage = stageRef.current;
        if (stage && onCanvasClick) {
          const pointer = stage.getPointerPosition();
          if (pointer) {
            const canvasX = (pointer.x - viewport.x) / viewport.scale;
            const canvasY = (pointer.y - viewport.y) / viewport.scale;
            onCanvasClick({
              canvasX,
              canvasY,
              screenX: pointer.x,
              screenY: pointer.y,
            });
          }
        }
      }
    },
    [onBackgroundClick, onCanvasClick, viewport, lassoState.isActive]
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
   * Render a sticky note object.
   */
  const renderStickyNote = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const color = (obj.data?.color as string) ?? '#fef08a';
      const text = (obj.data?.text as string) ?? '';
      const fontSize = (obj.data?.fontSize as number) ?? 16;
      const rotation = (obj.data?.rotation as number) ?? 0;

      return (
        <Group
          key={obj.id}
          ref={(node) => registerNodeRef(obj.id, node)}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          rotation={rotation}
          draggable
          onClick={(e) => {
            e.cancelBubble = true;
            objectClickedRef.current = true;
            onObjectSelect?.(obj.id);
          }}
          onTap={() => onObjectSelect?.(obj.id)}
          onDblClick={() => onObjectDoubleClick?.(obj.id)}
          onDblTap={() => onObjectDoubleClick?.(obj.id)}
          onDragEnd={(e) => {
            onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
          }}
        >
          {/* Shadow */}
          <Rect
            x={STICKY_NOTE_SHADOW_OFFSET}
            y={STICKY_NOTE_SHADOW_OFFSET}
            width={obj.width}
            height={obj.height}
            cornerRadius={STICKY_NOTE_CORNER_RADIUS}
            fill="rgba(0, 0, 0, 0.15)"
          />
          {/* Background */}
          <Rect
            width={obj.width}
            height={obj.height}
            fill={color}
            cornerRadius={STICKY_NOTE_CORNER_RADIUS}
            stroke={isSelected ? '#4A90D9' : undefined}
            strokeWidth={isSelected ? 2 : 0}
            shadowColor="rgba(0, 0, 0, 0.1)"
            shadowBlur={8}
            shadowOffset={{ x: 2, y: 2 }}
          />
          {/* Text */}
          <Text
            x={STICKY_NOTE_PADDING}
            y={STICKY_NOTE_PADDING}
            width={obj.width - STICKY_NOTE_PADDING * 2}
            height={obj.height - STICKY_NOTE_PADDING * 2}
            text={text || 'Double-click to edit'}
            fill={text ? '#1f2937' : '#999999'}
            fontSize={fontSize}
            fontFamily="system-ui, -apple-system, sans-serif"
            align="left"
            verticalAlign="top"
            wrap="word"
            ellipsis={true}
            listening={false}
          />
        </Group>
      );
    },
    [onObjectSelect, onObjectDoubleClick, onObjectDragEnd, registerNodeRef]
  );

  /**
   * Render a shape object (rectangle, ellipse, etc.).
   */
  const renderShape = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const shapeType = (obj.data?.shapeType as string) ?? 'rectangle';
      const color = (obj.data?.color as string) ?? '#3b82f6';
      const strokeColor = (obj.data?.strokeColor as string) ?? '#1d4ed8';
      const strokeWidth = (obj.data?.strokeWidth as number) ?? 2;
      const rotation = (obj.data?.rotation as number) ?? 0;

      return (
        <Group
          key={obj.id}
          ref={(node) => registerNodeRef(obj.id, node)}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          rotation={rotation}
          draggable
          onClick={(e) => {
            e.cancelBubble = true;
            objectClickedRef.current = true;
            onObjectSelect?.(obj.id);
          }}
          onTap={() => onObjectSelect?.(obj.id)}
          onDblClick={() => onObjectDoubleClick?.(obj.id)}
          onDblTap={() => onObjectDoubleClick?.(obj.id)}
          onDragEnd={(e) => {
            onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
          }}
        >
          {shapeType === 'ellipse' ? (
            <Ellipse
              x={obj.width / 2}
              y={obj.height / 2}
              radiusX={obj.width / 2}
              radiusY={obj.height / 2}
              fill={color}
              stroke={isSelected ? '#4A90D9' : strokeColor}
              strokeWidth={isSelected ? Math.max(strokeWidth, 2) : strokeWidth}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={isSelected ? 10 : 5}
              shadowOffset={{ x: 2, y: 2 }}
            />
          ) : (
            <Rect
              width={obj.width}
              height={obj.height}
              fill={color}
              stroke={isSelected ? '#4A90D9' : strokeColor}
              strokeWidth={isSelected ? Math.max(strokeWidth, 2) : strokeWidth}
              cornerRadius={4}
              shadowColor="rgba(0, 0, 0, 0.1)"
              shadowBlur={isSelected ? 10 : 5}
              shadowOffset={{ x: 2, y: 2 }}
            />
          )}
        </Group>
      );
    },
    [onObjectSelect, onObjectDoubleClick, onObjectDragEnd, registerNodeRef]
  );

  /**
   * Render a text object.
   */
  const renderTextObject = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const text = (obj.data?.text as string) ?? 'Double-click to edit';
      const fontSize = (obj.data?.fontSize as number) ?? 18;
      const color = (obj.data?.color as string) ?? '#1f2937';
      const rotation = (obj.data?.rotation as number) ?? 0;

      return (
        <Group
          key={obj.id}
          ref={(node) => registerNodeRef(obj.id, node)}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          rotation={rotation}
          draggable
          onClick={(e) => {
            e.cancelBubble = true;
            objectClickedRef.current = true;
            onObjectSelect?.(obj.id);
          }}
          onTap={() => onObjectSelect?.(obj.id)}
          onDblClick={() => onObjectDoubleClick?.(obj.id)}
          onDblTap={() => onObjectDoubleClick?.(obj.id)}
          onDragEnd={(e) => {
            onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
          }}
        >
          {/* Hit area for click/double-click detection */}
          <Rect
            width={obj.width}
            height={obj.height}
            fill="transparent"
            stroke={isSelected ? '#4A90D9' : 'transparent'}
            strokeWidth={isSelected ? 1 : 0}
            dash={isSelected ? [4, 4] : undefined}
          />
          {/* Text content */}
          <Text
            width={obj.width}
            height={obj.height}
            text={text}
            fontSize={fontSize}
            fill={color}
            fontFamily="system-ui, -apple-system, sans-serif"
            align="left"
            verticalAlign="middle"
            wrap="word"
            ellipsis={true}
            listening={false}
          />
        </Group>
      );
    },
    [onObjectSelect, onObjectDoubleClick, onObjectDragEnd, registerNodeRef]
  );

  /**
   * Render a single object based on its type.
   */
  const renderObject = useCallback(
    (obj: RenderableObject): JSX.Element => {
      const isSelected = selectedIds.has(obj.id);

      switch (obj.type) {
        case 'sticky-note':
          return renderStickyNote(obj, isSelected);
        case 'shape':
          return renderShape(obj, isSelected);
        case 'text':
          return renderTextObject(obj, isSelected);
        default:
          return (
            <Rect
              key={obj.id}
              x={obj.x}
              y={obj.y}
              width={obj.width}
              height={obj.height}
              fill={(obj.data?.color as string) ?? '#3b82f6'}
              rotation={(obj.data?.rotation as number) ?? 0}
              draggable
              stroke={isSelected ? '#4A90D9' : undefined}
              strokeWidth={isSelected ? 2 : 0}
              onClick={(e) => {
                e.cancelBubble = true;
                objectClickedRef.current = true;
                onObjectSelect?.(obj.id);
              }}
              onTap={() => onObjectSelect?.(obj.id)}
              onDragEnd={(e) => {
                onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
              }}
            />
          );
      }
    },
    [
      selectedIds,
      renderStickyNote,
      renderShape,
      renderTextObject,
      onObjectSelect,
      onObjectDragEnd,
    ]
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

  /**
   * Cursor style based on current state.
   */
  const cursorStyle = useMemo((): string => {
    if (isPanning) return 'grabbing';
    if (isSpacePressed) return 'grab';
    return 'default';
  }, [isPanning, isSpacePressed]);

  return (
    <Stage
      ref={stageRef}
      width={canvasSize.width}
      height={canvasSize.height}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ cursor: cursorStyle }}
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
      <Layer name="objects">
        {visibleObjects.map(renderObject)}
        {/* Lasso selection overlay */}
        <LassoOverlayComponent lassoState={lassoState} />
        {/* Transformer for selected objects */}
        {selectedNodes.length > 0 && (
          <TransformerComponent
            nodes={selectedNodes}
            rotateEnabled={true}
            keepRatio={false}
            onTransformEnd={handleTransformEnd}
          />
        )}
      </Layer>

      {/* Custom layers passed as children */}
      {children}
    </Stage>
  );
}

/**
 * Re-export viewport hook for external use.
 */
export { useViewport } from '../hooks/useViewport';
export type { ViewportOptions, UseViewportReturn } from '../hooks/useViewport';
