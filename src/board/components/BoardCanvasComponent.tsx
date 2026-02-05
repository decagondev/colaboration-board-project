/**
 * Board Canvas Component
 *
 * Main canvas component using Konva.js for rendering the infinite board.
 * Handles Stage and Layer setup with responsive sizing and viewport culling.
 */

import { useRef, useCallback, useMemo, useEffect, useState, type JSX } from 'react';
import { Stage, Layer, Rect, Ellipse, Group, Text, Line, Circle, RegularPolygon } from 'react-konva';
import type Konva from 'konva';
import type { Bounds, Size } from '@shared/types';
import { TransformerComponent } from './TransformerComponent';
import { LassoOverlayComponent } from './LassoOverlayComponent';
import { GridOverlayComponent } from './GridOverlayComponent';
import type { GridConfig } from './GridOverlayComponent';
import type { LassoState } from '../interfaces/ISelectionService';
import { ShapeRegistry } from '../shapes';
import type { ShapeType, ShapeRenderProps } from '../shapes';
import type { ConnectorArrowStyle, ConnectorRouteStyle, ConnectorEndpoint } from '../objects/Connector';
import type { Position } from '../interfaces/IBoardObject';
import type { ViewportState } from '../hooks/useViewport';
import { FrameComponent } from './FrameComponent';
import type { Frame } from '../objects/Frame';
import { ObjectLabelComponent } from './ObjectLabelComponent';
import type { LabelConfig } from '../interfaces/ILabelable';

/**
 * Re-export ViewportState from the canonical location.
 */
export type { ViewportState } from '../hooks/useViewport';

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
  /** Scale factor applied horizontally */
  scaleX: number;
  /** Scale factor applied vertically */
  scaleY: number;
}

/**
 * Connector preview line configuration.
 */
export interface ConnectorPreview {
  /** Whether the preview is active */
  active: boolean;
  /** Start position of the preview line */
  startPosition: Position;
  /** Current end position (mouse position) */
  endPosition: Position;
  /** Stroke color for the preview */
  strokeColor?: string;
}

export interface BoardCanvasProps {
  /** Array of objects to render on the canvas */
  objects?: RenderableObject[];
  /** Array of Frame objects to render */
  frames?: Frame[];
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
  /** Callback when object drag starts */
  onObjectDragStart?: (objectId: string) => void;
  /** Callback when object is being dragged (for live feedback) */
  onObjectDrag?: (objectId: string, x: number, y: number) => void;
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
  /** Whether to show the grid overlay */
  showGrid?: boolean;
  /** Grid configuration options */
  gridConfig?: Partial<GridConfig>;
  /** Connector preview line (shown during connector creation) */
  connectorPreview?: ConnectorPreview;
  /** ID of frame that is currently a valid drop target */
  dropTargetFrameId?: string | null;
  /** ID of frame that is being hovered for potential drop */
  hoveredFrameId?: string | null;
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
  frames = [],
  viewport: controlledViewport,
  onViewportChange,
  onObjectSelect,
  onBackgroundClick,
  onCanvasClick,
  onObjectDragStart,
  onObjectDrag,
  onObjectDragEnd,
  onObjectDoubleClick,
  onObjectTransformEnd,
  selectedIds = new Set(),
  activeTool = 'select',
  onLassoSelect,
  showGrid = false,
  gridConfig,
  connectorPreview,
  dropTargetFrameId,
  hoveredFrameId,
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
    endPoint: null,
    bounds: null,
  });
  const lassoStartRef = useRef<{ x: number; y: number } | null>(null);

  const viewport = controlledViewport ?? internalViewport;
  const setViewport = onViewportChange ?? setInternalViewport;

  /**
   * Track space bar for pan mode.
   * Ignores space key when focused on input/textarea elements.
   */
  useEffect(() => {
    function isInputFocused(): boolean {
      const activeElement = document.activeElement;
      return (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable === true
      );
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (isInputFocused()) {
        return;
      }
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
   * Check if any selected object is a text type.
   * Text objects should only have rotation handles, not resize handles.
   */
  const hasTextSelection = useMemo(() => {
    return objects.some(
      (obj) => selectedIds.has(obj.id) && obj.type === 'text'
    );
  }, [objects, selectedIds]);

  /**
   * Determine enabled anchors based on selection.
   * Text objects only get rotation (no resize anchors).
   */
  const transformerAnchors = useMemo(() => {
    if (hasTextSelection) {
      return [];
    }
    return undefined;
  }, [hasTextSelection]);

  /**
   * Handle transform end event from the transformer.
   * Passes scale factors for font size scaling in text objects.
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
        scaleX,
        scaleY,
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
          endPoint: { x: canvasX, y: canvasY },
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
          endPoint: { x: canvasX, y: canvasY },
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
        endPoint: null,
        bounds: null,
      });
      lassoStartRef.current = null;
    }
  }, [isPanning, lassoState, objects, onLassoSelect]);

  /**
   * Handle stage click for background deselection and object creation.
   * Provides both screen and canvas coordinates.
   * Accepts both mouse and touch events for cross-device compatibility.
   */
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): void => {
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
          onDragStart={() => {
            onObjectDragStart?.(obj.id);
          }}
          onDragMove={(e) => {
            onObjectDrag?.(obj.id, e.target.x(), e.target.y());
          }}
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
    [onObjectSelect, onObjectDoubleClick, onObjectDragStart, onObjectDrag, onObjectDragEnd, registerNodeRef]
  );

  /**
   * Render a shape object using ShapeRegistry for extended shapes.
   * Falls back to built-in rendering for basic shapes not in registry.
   */
  const renderShape = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const shapeType = (obj.data?.shapeType as ShapeType) ?? 'rectangle';
      const color = (obj.data?.color as string) ?? '#3b82f6';
      const strokeColor = (obj.data?.strokeColor as string) ?? '#1d4ed8';
      const strokeWidth = (obj.data?.strokeWidth as number) ?? 2;
      const rotation = (obj.data?.rotation as number) ?? 0;

      const shapeDefinition = ShapeRegistry.get(shapeType);

      const renderShapeContent = (): JSX.Element => {
        if (shapeDefinition) {
          const renderProps: ShapeRenderProps = {
            x: 0,
            y: 0,
            width: obj.width,
            height: obj.height,
            fill: color,
            stroke: isSelected ? '#4A90D9' : strokeColor,
            strokeWidth: isSelected ? Math.max(strokeWidth, 2) : strokeWidth,
            isSelected,
            shadowEnabled: true,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowBlur: isSelected ? 10 : 5,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          };
          return shapeDefinition.render(renderProps);
        }

        if (shapeType === 'ellipse') {
          return (
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
          );
        }

        return (
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
        );
      };

      const labelConfig = obj.data?.label as Partial<LabelConfig> | undefined;

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
          onDragStart={() => {
            onObjectDragStart?.(obj.id);
          }}
          onDragMove={(e) => {
            onObjectDrag?.(obj.id, e.target.x(), e.target.y());
          }}
          onDragEnd={(e) => {
            onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
          }}
        >
          {renderShapeContent()}
          {labelConfig?.text && (
            <ObjectLabelComponent
              label={labelConfig}
              objectWidth={obj.width}
              objectHeight={obj.height}
              isSelected={isSelected}
            />
          )}
        </Group>
      );
    },
    [onObjectSelect, onObjectDoubleClick, onObjectDragStart, onObjectDrag, onObjectDragEnd, registerNodeRef]
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
          onDragStart={() => {
            onObjectDragStart?.(obj.id);
          }}
          onDragMove={(e) => {
            onObjectDrag?.(obj.id, e.target.x(), e.target.y());
          }}
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
    [onObjectSelect, onObjectDoubleClick, onObjectDragStart, onObjectDrag, onObjectDragEnd, registerNodeRef]
  );

  /**
   * Calculate arrow points for connector rendering.
   */
  const calculateArrowPoints = useCallback(
    (position: Position, direction: Position, size: number): number[] => {
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
    },
    []
  );

  /**
   * Calculate direction vector from start to end.
   */
  const calculateDirection = useCallback(
    (start: Position, end: Position): Position => {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length === 0) return { x: 1, y: 0 };
      return { x: dx / length, y: dy / length };
    },
    []
  );

  /**
   * Calculate intersection point of a line from shape center to target with the shape's edge.
   * Accounts for rotation around the shape's top-left corner (how Konva rotates).
   */
  const getShapeEdgePoint = useCallback(
    (
      shapeX: number,
      shapeY: number,
      shapeWidth: number,
      shapeHeight: number,
      rotation: number,
      targetX: number,
      targetY: number
    ): Position => {
      const radians = (rotation * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      
      const localCenterX = shapeWidth / 2;
      const localCenterY = shapeHeight / 2;
      const worldCenterX = shapeX + localCenterX * cos - localCenterY * sin;
      const worldCenterY = shapeY + localCenterX * sin + localCenterY * cos;
      
      const invRadians = -radians;
      const invCos = Math.cos(invRadians);
      const invSin = Math.sin(invRadians);
      
      const relTargetX = targetX - shapeX;
      const relTargetY = targetY - shapeY;
      const localTargetX = relTargetX * invCos - relTargetY * invSin;
      const localTargetY = relTargetX * invSin + relTargetY * invCos;
      
      const dirX = localTargetX - localCenterX;
      const dirY = localTargetY - localCenterY;
      
      if (dirX === 0 && dirY === 0) {
        return { x: worldCenterX, y: worldCenterY };
      }
      
      const halfWidth = shapeWidth / 2;
      const halfHeight = shapeHeight / 2;
      
      const absDirX = Math.abs(dirX);
      const absDirY = Math.abs(dirY);
      
      let localEdgeX: number;
      let localEdgeY: number;
      
      if (absDirX * halfHeight > absDirY * halfWidth) {
        const scale = halfWidth / absDirX;
        localEdgeX = localCenterX + (dirX > 0 ? halfWidth : -halfWidth);
        localEdgeY = localCenterY + dirY * scale;
      } else {
        const scale = halfHeight / absDirY;
        localEdgeX = localCenterX + dirX * scale;
        localEdgeY = localCenterY + (dirY > 0 ? halfHeight : -halfHeight);
      }
      
      return {
        x: shapeX + localEdgeX * cos - localEdgeY * sin,
        y: shapeY + localEdgeX * sin + localEdgeY * cos,
      };
    },
    []
  );

  /**
   * Calculate connector line points based on route style.
   * Supports straight, elbow, orthogonal, and bezier routing.
   * Returns { points, bezier } where bezier indicates if the line should use bezier mode.
   */
  const getConnectorPoints = useCallback(
    (
      start: Position,
      end: Position,
      routeStyle: ConnectorRouteStyle
    ): { points: number[]; bezier: boolean } => {
      if (routeStyle === 'straight') {
        return { points: [start.x, start.y, end.x, end.y], bezier: false };
      }

      if (routeStyle === 'elbow') {
        const midX = (start.x + end.x) / 2;
        return { 
          points: [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y], 
          bezier: false 
        };
      }

      if (routeStyle === 'orthogonal') {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (Math.abs(dx) > Math.abs(dy)) {
          const midX = start.x + dx / 2;
          return {
            points: [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y],
            bezier: false,
          };
        } else {
          const midY = start.y + dy / 2;
          return {
            points: [start.x, start.y, start.x, midY, end.x, midY, end.x, end.y],
            bezier: false,
          };
        }
      }

      if (routeStyle === 'bezier') {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curveStrength = dist * 0.3;
        
        const cp1x = start.x + dx * 0.25;
        const cp1y = start.y + dy * 0.1 - curveStrength * 0.5;
        const cp2x = start.x + dx * 0.75;
        const cp2y = end.y - dy * 0.1 + curveStrength * 0.5;
        
        return {
          points: [start.x, start.y, cp1x, cp1y, cp2x, cp2y, end.x, end.y],
          bezier: true,
        };
      }

      return { points: [start.x, start.y, end.x, end.y], bezier: false };
    },
    []
  );

  /**
   * Render an arrow head for connectors.
   */
  const renderArrowHead = useCallback(
    (
      position: Position,
      direction: Position,
      style: ConnectorArrowStyle,
      size: number,
      strokeColor: string
    ): JSX.Element | null => {
      if (style === 'none') return null;

      if (style === 'circle') {
        return (
          <Circle
            x={position.x}
            y={position.y}
            radius={size / 2}
            fill={strokeColor}
            stroke={strokeColor}
            strokeWidth={1}
          />
        );
      }

      if (style === 'filled-arrow') {
        return (
          <RegularPolygon
            x={position.x - (direction.x * size) / 2}
            y={position.y - (direction.y * size) / 2}
            sides={3}
            radius={size / 2}
            rotation={Math.atan2(direction.y, direction.x) * (180 / Math.PI) + 90}
            fill={strokeColor}
            stroke={strokeColor}
            strokeWidth={1}
          />
        );
      }

      const arrowPoints = calculateArrowPoints(position, direction, size);
      return (
        <Line
          points={arrowPoints}
          stroke={strokeColor}
          strokeWidth={2}
          lineCap="round"
          lineJoin="round"
        />
      );
    },
    [calculateArrowPoints]
  );

  /**
   * Calculate connector render data (positions, directions, etc.)
   */
  const getConnectorRenderData = useCallback(
    (obj: RenderableObject) => {
      const startPoint = obj.data?.startPoint as ConnectorEndpoint | undefined;
      const endPoint = obj.data?.endPoint as ConnectorEndpoint | undefined;
      const routeStyle = (obj.data?.routeStyle as ConnectorRouteStyle) ?? 'straight';

      if (!startPoint?.position || !endPoint?.position) {
        return null;
      }

      const startObj = objects.find(o => o.id === startPoint.objectId);
      const endObj = objects.find(o => o.id === endPoint.objectId);

      let startRenderPos = startPoint.position;
      let endRenderPos = endPoint.position;

      if (startObj && endObj) {
        const startRotation = (startObj.data?.rotation as number) ?? 0;
        const endRotation = (endObj.data?.rotation as number) ?? 0;
        
        const startCenterX = startObj.x + startObj.width / 2;
        const startCenterY = startObj.y + startObj.height / 2;
        const endCenterX = endObj.x + endObj.width / 2;
        const endCenterY = endObj.y + endObj.height / 2;

        startRenderPos = getShapeEdgePoint(
          startObj.x, startObj.y, startObj.width, startObj.height,
          startRotation, endCenterX, endCenterY
        );
        endRenderPos = getShapeEdgePoint(
          endObj.x, endObj.y, endObj.width, endObj.height,
          endRotation, startCenterX, startCenterY
        );
      }

      const { points, bezier } = getConnectorPoints(startRenderPos, endRenderPos, routeStyle);
      
      const lastSegmentStart = points.length >= 4 
        ? { x: points[points.length - 4], y: points[points.length - 3] }
        : startRenderPos;
      const direction = calculateDirection(lastSegmentStart, endRenderPos);
      
      const firstSegmentEnd = points.length >= 4
        ? { x: points[2], y: points[3] }
        : endRenderPos;
      const reverseDirection = calculateDirection(firstSegmentEnd, startRenderPos);

      return {
        startRenderPos,
        endRenderPos,
        points,
        bezier,
        direction,
        reverseDirection,
      };
    },
    [objects, getConnectorPoints, getShapeEdgePoint, calculateDirection]
  );

  /**
   * Render connector line only (without arrows) - renders below shapes.
   */
  const renderConnectorLine = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const renderData = getConnectorRenderData(obj);
      if (!renderData) {
        return <Group key={`line-${obj.id}`} />;
      }

      const strokeColor = isSelected ? '#4A90D9' : ((obj.data?.strokeColor as string) ?? '#1f2937');
      const strokeWidth = (obj.data?.strokeWidth as number) ?? 2;

      return (
        <Group
          key={`line-${obj.id}`}
          onClick={(e) => {
            e.cancelBubble = true;
            objectClickedRef.current = true;
            onObjectSelect?.(obj.id);
          }}
          onTap={() => onObjectSelect?.(obj.id)}
        >
          <Line
            points={renderData.points}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={strokeWidth + 10}
            bezier={renderData.bezier}
          />
        </Group>
      );
    },
    [getConnectorRenderData, onObjectSelect]
  );

  /**
   * Render connector arrows and handles only - renders above shapes.
   */
  const renderConnectorArrows = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const renderData = getConnectorRenderData(obj);
      if (!renderData) {
        return <Group key={`arrows-${obj.id}`} />;
      }

      const startArrow = (obj.data?.startArrow as ConnectorArrowStyle) ?? 'none';
      const endArrow = (obj.data?.endArrow as ConnectorArrowStyle) ?? 'arrow';
      const strokeColor = isSelected ? '#4A90D9' : ((obj.data?.strokeColor as string) ?? '#1f2937');
      const strokeWidth = (obj.data?.strokeWidth as number) ?? 2;
      const arrowSize = strokeWidth * 4;

      return (
        <Group key={`arrows-${obj.id}`}>
          {/* Start arrow */}
          {renderArrowHead(renderData.startRenderPos, renderData.reverseDirection, startArrow, arrowSize, strokeColor)}

          {/* End arrow */}
          {renderArrowHead(renderData.endRenderPos, renderData.direction, endArrow, arrowSize, strokeColor)}

          {/* Endpoint handles when selected */}
          {isSelected && (
            <>
              <Circle
                x={renderData.startRenderPos.x}
                y={renderData.startRenderPos.y}
                radius={6}
                fill="#FFFFFF"
                stroke="#4A90D9"
                strokeWidth={2}
              />
              <Circle
                x={renderData.endRenderPos.x}
                y={renderData.endRenderPos.y}
                radius={6}
                fill="#FFFFFF"
                stroke="#4A90D9"
                strokeWidth={2}
              />
            </>
          )}
        </Group>
      );
    },
    [getConnectorRenderData, renderArrowHead]
  );

  /**
   * Render a connector object (backward compatibility).
   */
  const renderConnector = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      return (
        <Group key={obj.id}>
          {renderConnectorLine(obj, isSelected)}
        </Group>
      );
    },
    [renderConnectorLine]
  );

  /**
   * Render a frame object using FrameComponent.
   * Used when Frame class instances are passed via frames prop.
   */
  const renderFrame = useCallback(
    (frame: Frame): JSX.Element => {
      const isSelected = selectedIds.has(frame.id);
      const isDropTarget = dropTargetFrameId === frame.id;
      const isHoveredForDrop = hoveredFrameId === frame.id;
      const childCount = frame.childIds.length;

      return (
        <FrameComponent
          key={frame.id}
          frame={frame}
          isSelected={isSelected}
          isDropTarget={isDropTarget}
          isHoveredForDrop={isHoveredForDrop}
          childCount={childCount}
          onClick={(frameId, e) => {
            e.cancelBubble = true;
            objectClickedRef.current = true;
            onObjectSelect?.(frameId);
          }}
          onDoubleClick={onObjectDoubleClick}
          onDragStart={() => {}}
          onDragEnd={(frameId, position) => {
            onObjectDragEnd?.(frameId, position.x, position.y);
          }}
          onTransformEnd={(frameId, transform) => {
            onObjectTransformEnd?.({
              objectId: frameId,
              x: transform.x,
              y: transform.y,
              width: transform.width,
              height: transform.height,
              rotation: transform.rotation,
              scaleX: 1,
              scaleY: 1,
            });
          }}
        />
      );
    },
    [
      selectedIds,
      dropTargetFrameId,
      hoveredFrameId,
      onObjectSelect,
      onObjectDoubleClick,
      onObjectDragEnd,
      onObjectTransformEnd,
    ]
  );

  /**
   * Render a frame from RenderableObject data.
   * Used when frames come through the objects array as plain data.
   */
  const renderFrameFromData = useCallback(
    (obj: RenderableObject, isSelected: boolean): JSX.Element => {
      const title = (obj.data?.title as string) ?? 'Frame';
      const showTitle = (obj.data?.showTitle as boolean) ?? true;
      const backgroundOpacity = (obj.data?.backgroundOpacity as number) ?? 0.1;
      const childIds = (obj.data?.childIds as string[]) ?? [];
      const rotation = (obj.data?.rotation as number) ?? 0;
      const fillColor = (obj.data?.fillColor as string) ?? '#e5e7eb';
      const strokeColor = (obj.data?.strokeColor as string) ?? '#9ca3af';
      const titleHeight = showTitle ? 32 : 0;

      const isDropTarget = dropTargetFrameId === obj.id;
      const isHoveredForDrop = hoveredFrameId === obj.id;

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
          onDragStart={() => {
            onObjectDragStart?.(obj.id);
          }}
          onDragMove={(e) => {
            onObjectDrag?.(obj.id, e.target.x(), e.target.y());
          }}
          onDragEnd={(e) => {
            onObjectDragEnd?.(obj.id, e.target.x(), e.target.y());
          }}
        >
          {/* Drop target glow effect */}
          {isHoveredForDrop && (
            <Rect
              x={-4}
              y={-4}
              width={obj.width + 8}
              height={obj.height + 8}
              fill="rgba(74, 144, 217, 0.3)"
              cornerRadius={8}
              listening={false}
            />
          )}
          {/* Background */}
          <Rect
            width={obj.width}
            height={obj.height}
            fill={`rgba(229, 231, 235, ${backgroundOpacity})`}
            stroke={isHoveredForDrop ? '#6DB3F2' : isDropTarget ? '#4A90D9' : isSelected ? '#4A90D9' : strokeColor}
            strokeWidth={isHoveredForDrop ? 3 : isDropTarget || isSelected ? 2 : 1}
            cornerRadius={4}
            shadowColor={isHoveredForDrop ? '#4A90D9' : undefined}
            shadowBlur={isHoveredForDrop ? 10 : 0}
            shadowOpacity={isHoveredForDrop ? 0.5 : 0}
          />
          {/* Title bar */}
          {showTitle && (
            <>
              <Rect
                width={obj.width}
                height={titleHeight}
                fill={fillColor || '#e5e7eb'}
                cornerRadius={[4, 4, 0, 0]}
              />
              <Text
                x={8}
                y={8}
                width={obj.width - 50}
                height={titleHeight - 16}
                text={title}
                fontFamily="Arial, sans-serif"
                fontSize={14}
                fontStyle="bold"
                fill="#374151"
                verticalAlign="middle"
                ellipsis={true}
                listening={false}
              />
              {/* Child count badge */}
              {childIds.length > 0 && (
                <>
                  <Rect
                    x={obj.width - 32}
                    y={6}
                    width={24}
                    height={20}
                    fill="rgba(0, 0, 0, 0.15)"
                    cornerRadius={10}
                  />
                  <Text
                    x={obj.width - 32}
                    y={6}
                    width={24}
                    height={20}
                    text={String(childIds.length)}
                    fontFamily="Arial, sans-serif"
                    fontSize={11}
                    fill="#374151"
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                  />
                </>
              )}
            </>
          )}
        </Group>
      );
    },
    [
      dropTargetFrameId,
      hoveredFrameId,
      onObjectSelect,
      onObjectDoubleClick,
      onObjectDragStart,
      onObjectDrag,
      onObjectDragEnd,
      registerNodeRef,
    ]
  );

  /**
   * Filter frames to only those visible in the viewport.
   */
  const visibleFrames = useMemo(() => {
    return frames.filter((frame) => {
      const bounds = frame.getBounds();
      return isVisible({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      });
    });
  }, [frames, isVisible]);

  /**
   * Filter frame objects from renderableObjects for separate rendering.
   */
  const frameObjects = useMemo(() => {
    return visibleObjects.filter((obj) => obj.type === 'frame');
  }, [visibleObjects]);

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
        case 'connector':
          return renderConnector(obj, isSelected);
        case 'frame':
          return renderFrameFromData(obj, isSelected);
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
      renderConnector,
      renderFrameFromData,
      onObjectSelect,
      onObjectDragStart,
      onObjectDrag,
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
        {/* Grid overlay */}
        <GridOverlayComponent
          visible={showGrid}
          viewport={viewport}
          canvasSize={canvasSize}
          config={gridConfig}
        />
      </Layer>

      {/* Object layer - main content */}
      <Layer name="objects">
        {/* 0. Render Frame class instances from frames prop (if any) */}
        {visibleFrames.map(renderFrame)}
        {/* 0b. Render frame objects from objects array (below everything else - they act as containers) */}
        {frameObjects.map(renderObject)}
        {/* 1. Render connector lines (below shapes) */}
        {visibleObjects.filter(obj => obj.type === 'connector').map(obj => 
          renderConnectorLine(obj, selectedIds.has(obj.id))
        )}
        {/* 2. Render all shapes (above connector lines and frames) */}
        {visibleObjects.filter(obj => obj.type !== 'connector' && obj.type !== 'frame').map(renderObject)}
        {/* 3. Render connector arrows and handles (above shapes) */}
        {visibleObjects.filter(obj => obj.type === 'connector').map(obj => 
          renderConnectorArrows(obj, selectedIds.has(obj.id))
        )}
        {/* Connector preview line during creation */}
        {connectorPreview?.active && (
          <Line
            points={[
              connectorPreview.startPosition.x,
              connectorPreview.startPosition.y,
              connectorPreview.endPosition.x,
              connectorPreview.endPosition.y,
            ]}
            stroke={connectorPreview.strokeColor ?? '#3b82f6'}
            strokeWidth={2}
            dash={[8, 4]}
            lineCap="round"
            listening={false}
          />
        )}
        {/* Lasso selection overlay */}
        <LassoOverlayComponent lassoState={lassoState} />
        {/* Transformer for selected objects */}
        {selectedNodes.length > 0 && (
          <TransformerComponent
            nodes={selectedNodes}
            rotateEnabled={true}
            keepRatio={false}
            enabledAnchors={transformerAnchors}
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
