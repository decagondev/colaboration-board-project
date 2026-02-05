import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { AuthProvider, AuthGuard, useAuth } from '@auth/index';
import {
  PresenceProvider,
  PresenceListComponent,
  CursorProvider,
  CursorOverlayComponent,
  useCursor,
} from '@presence/index';
import {
  BoardProvider,
  BoardCanvasComponent,
  useBoard,
  ZoomControlsComponent,
  ToolbarComponent,
  PropertiesPanelComponent,
  ConnectionAnchorOverlay,
} from '@board/index';
import { useConnectorCreation } from '@board/hooks';
import { AIProvider, AICommandBarWrapper, GlobalAIIndicator } from '@ai/index';
import type { BoardMetadata } from '@board/context/BoardContext';
import type {
  CanvasClickEvent,
  ToolType,
  RenderableObject,
  ViewportState,
  TransformEndEvent,
  PropertyChangeEvent,
  PropertyPanelObject,
} from '@board/components';
import type { ConnectionAnchor } from '@board/interfaces';
import type { SyncableObject } from '@sync/interfaces/ISyncService';
import { generateUUID, measureText } from '@shared/utils';
import { ShapeRegistry } from '@board/shapes';
import type { ShapeType } from '@board/shapes';
import './App.css';

/**
 * Default board ID for the application.
 * In a multi-board app, this would be dynamic.
 */
const DEFAULT_BOARD_ID = 'default-board';

/**
 * Default sticky note dimensions.
 */
const DEFAULT_STICKY_NOTE_SIZE = { width: 200, height: 200 };

/**
 * Default shape dimensions.
 */
const DEFAULT_SHAPE_SIZE = { width: 150, height: 100 };

/**
 * Available sticky note colors.
 */
const STICKY_NOTE_COLORS = [
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fecaca',
  '#e9d5ff',
];

/**
 * Props for the BoardCanvasWithCursors component.
 */
interface BoardCanvasWithCursorsProps {
  /** Currently selected tool */
  activeTool: ToolType;
  /** Callback to reset tool to select after creation */
  onToolReset: () => void;
  /** Current user ID for object creation */
  userId: string;
  /** Whether to show the grid overlay */
  showGrid: boolean;
}

/**
 * State for editing text objects.
 */
interface EditingState {
  objectId: string | null;
  initialText: string;
}

/**
 * Inner board canvas that has access to board and cursor contexts.
 * Renders the Konva canvas with cursor overlay.
 */
function BoardCanvasWithCursors({
  activeTool,
  onToolReset,
  userId,
  showGrid,
}: BoardCanvasWithCursorsProps) {
  const {
    objects,
    selectedObjectIds,
    selectObject,
    selectObjects,
    clearSelection,
    updateObject,
    deleteObject,
    createObject,
    viewport,
    setViewport,
  } = useBoard();
  const { updateCursorPosition } = useCursor();
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingState, setEditingState] = useState<EditingState>({
    objectId: null,
    initialText: '',
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    isCreating: isCreatingConnector,
    dragState: connectorDragState,
    startCreation: startConnectorCreation,
    updatePosition: updateConnectorPosition,
    checkAnchorProximity,
    completeCreation: completeConnectorCreation,
    cancelCreation: cancelConnectorCreation,
  } = useConnectorCreation({ snapDistance: 25 });

  const [hoveredObjectId, setHoveredObjectId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<ConnectionAnchor | null>(null);
  const [dragOverFrameId, setDragOverFrameId] = useState<string | null>(null);
  const isDraggingRef = useRef<string | null>(null);

  /**
   * Convert board objects to renderable format.
   * Passes full data for type-specific rendering.
   */
  const renderableObjects = useMemo((): RenderableObject[] => {
    return objects.map((obj) => ({
      id: obj.id,
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      data: obj.data,
    }));
  }, [objects]);

  /**
   * Check if an input element is currently focused.
   */
  const isInputFocused = useCallback((): boolean => {
    const activeElement = document.activeElement;
    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      (activeElement as HTMLElement)?.isContentEditable === true
    );
  }, []);

  /**
   * Handle keyboard events for delete and other shortcuts.
   * Ignores events when user is focused on input/textarea elements.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingState.objectId) return;

      if (isInputFocused()) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectIds.size > 0) {
          e.preventDefault();
          selectedObjectIds.forEach((id) => {
            deleteObject(id);
          });
          clearSelection();
        }
      }

      if (e.key === 'Escape') {
        if (isCreatingConnector) {
          cancelConnectorCreation();
        }
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectIds, deleteObject, clearSelection, editingState.objectId, isInputFocused, isCreatingConnector, cancelConnectorCreation]);

  /**
   * Handle mouse move to track cursor position and connector drag.
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateCursorPosition(x, y);

      if (isCreatingConnector) {
        const canvasX = (x - viewport.x) / viewport.scale;
        const canvasY = (y - viewport.y) / viewport.scale;
        updateConnectorPosition({ x: canvasX, y: canvasY });
        checkAnchorProximity(
          { x: canvasX, y: canvasY },
          renderableObjects,
          null
        );
      }
    },
    [
      updateCursorPosition,
      isCreatingConnector,
      viewport,
      updateConnectorPosition,
      checkAnchorProximity,
      renderableObjects,
    ]
  );

  /**
   * Handle mouse up - no longer completes connectors (click-based flow instead).
   */
  const handleMouseUp = useCallback(() => {
    // Connector creation is now click-based, not drag-based
    // MouseUp doesn't complete connections anymore
  }, []);

  /**
   * Get the world position of an anchor on an object.
   */
  const getAnchorWorldPosition = useCallback(
    (obj: SyncableObject, anchor: ConnectionAnchor): { x: number; y: number } => {
      const rotation = (obj.data?.rotation as number) ?? 0;
      const radians = (rotation * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);

      let localX = obj.width / 2;
      let localY = obj.height / 2;

      switch (anchor) {
        case 'top': localX = obj.width / 2; localY = 0; break;
        case 'topRight': localX = obj.width; localY = 0; break;
        case 'right': localX = obj.width; localY = obj.height / 2; break;
        case 'bottomRight': localX = obj.width; localY = obj.height; break;
        case 'bottom': localX = obj.width / 2; localY = obj.height; break;
        case 'bottomLeft': localX = 0; localY = obj.height; break;
        case 'left': localX = 0; localY = obj.height / 2; break;
        case 'topLeft': localX = 0; localY = 0; break;
        case 'center': localX = obj.width / 2; localY = obj.height / 2; break;
        default: localX = obj.width / 2; localY = obj.height / 2;
      }

      return {
        x: obj.x + localX * cos - localY * sin,
        y: obj.y + localX * sin + localY * cos,
      };
    },
    []
  );

  /**
   * Handle anchor click to start or complete connector creation.
   * First click starts the connection, second click completes it.
   */
  const handleAnchorClick = useCallback(
    (objectId: string, anchor: ConnectionAnchor, position: { x: number; y: number }) => {
      if (activeTool !== 'connector') return;

      if (!isCreatingConnector) {
        startConnectorCreation(position, objectId, anchor);
      } else {
        const { startObjectId, startAnchor } = connectorDragState;
        
        if (!startObjectId) {
          cancelConnectorCreation();
          return;
        }

        const startObj = objects.find((o) => o.id === startObjectId);
        const endObj = objects.find((o) => o.id === objectId);

        if (!startObj || !endObj) {
          cancelConnectorCreation();
          return;
        }

        if (startObjectId === objectId) {
          cancelConnectorCreation();
          return;
        }

        const result = completeConnectorCreation();
        if (!result) {
          cancelConnectorCreation();
          return;
        }

        const startEdge = getAnchorWorldPosition(startObj, startAnchor ?? 'right');
        const endEdge = getAnchorWorldPosition(endObj, anchor);

        const now = Date.now();
        const connectorObject: SyncableObject = {
          id: result.id,
          type: 'connector',
          x: Math.min(startEdge.x, endEdge.x),
          y: Math.min(startEdge.y, endEdge.y),
          width: Math.abs(endEdge.x - startEdge.x) || 1,
          height: Math.abs(endEdge.y - startEdge.y) || 1,
          createdBy: userId,
          createdAt: now,
          modifiedBy: userId,
          modifiedAt: now,
          zIndex: objects.length + 1,
          data: {
            startPoint: { 
              objectId: startObjectId, 
              anchor: 'auto', 
              position: startEdge 
            },
            endPoint: { 
              objectId: objectId, 
              anchor: 'auto', 
              position: endEdge 
            },
            routeStyle: result.routeStyle,
            startArrow: result.startArrow,
            endArrow: result.endArrow,
            strokeColor: result.strokeColor,
            strokeWidth: result.strokeWidth,
          },
        };
        createObject(connectorObject);
      }
    },
    [
      activeTool,
      isCreatingConnector,
      connectorDragState,
      objects,
      startConnectorCreation,
      completeConnectorCreation,
      cancelConnectorCreation,
      getAnchorWorldPosition,
      userId,
      createObject,
    ]
  );

  /**
   * Handle anchor hover for visual feedback.
   */
  const handleAnchorMouseEnter = useCallback(
    (objectId: string, anchor: ConnectionAnchor) => {
      setHoveredObjectId(objectId);
      setHoveredAnchor(anchor);
    },
    []
  );

  /**
   * Handle anchor mouse leave.
   */
  const handleAnchorMouseLeave = useCallback(() => {
    setHoveredObjectId(null);
    setHoveredAnchor(null);
  }, []);

  /**
   * Handle object selection.
   */
  const handleObjectSelect = useCallback(
    (objectId: string) => {
      selectObject(objectId);
    },
    [selectObject]
  );

  /**
   * Handle lasso selection (multiple objects).
   */
  const handleLassoSelect = useCallback(
    (objectIds: string[]) => {
      selectObjects(objectIds);
    },
    [selectObjects]
  );

  /**
   * Handle background click to clear selection.
   */
  const handleBackgroundClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  /**
   * Check which frame (if any) contains the given bounds.
   */
  const findFrameAtBounds = useCallback(
    (bounds: { x: number; y: number; width: number; height: number }): string | null => {
      const frames = objects.filter((o) => o.type === 'frame');
      const CONTAINMENT_THRESHOLD = 0.3;

      let bestFrameId: string | null = null;
      let bestOverlap = 0;

      for (const frame of frames) {
        const titleHeight = (frame.data?.showTitle as boolean) !== false ? 32 : 0;
        const padding = { top: 40, right: 8, bottom: 8, left: 8 };
        
        const contentBounds = {
          x: frame.x + padding.left,
          y: frame.y + titleHeight + padding.top,
          width: frame.width - padding.left - padding.right,
          height: frame.height - titleHeight - padding.top - padding.bottom,
        };

        const overlapX = Math.max(
          0,
          Math.min(contentBounds.x + contentBounds.width, bounds.x + bounds.width) -
            Math.max(contentBounds.x, bounds.x)
        );
        const overlapY = Math.max(
          0,
          Math.min(contentBounds.y + contentBounds.height, bounds.y + bounds.height) -
            Math.max(contentBounds.y, bounds.y)
        );

        const overlapArea = overlapX * overlapY;
        const objectArea = bounds.width * bounds.height;
        const overlapPercentage = objectArea > 0 ? overlapArea / objectArea : 0;

        if (overlapPercentage >= CONTAINMENT_THRESHOLD && overlapPercentage > bestOverlap) {
          bestFrameId = frame.id;
          bestOverlap = overlapPercentage;
        }
      }

      return bestFrameId;
    },
    [objects]
  );

  /**
   * Handle object drag start to track dragging state.
   */
  const handleObjectDragStart = useCallback((objectId: string) => {
    const obj = objects.find((o) => o.id === objectId);
    if (obj && obj.type !== 'frame' && obj.type !== 'connector') {
      isDraggingRef.current = objectId;
    }
  }, [objects]);

  /**
   * Handle object dragging to show frame hover feedback.
   */
  const handleObjectDrag = useCallback(
    (objectId: string, x: number, y: number) => {
      if (isDraggingRef.current !== objectId) return;
      
      const obj = objects.find((o) => o.id === objectId);
      if (!obj || obj.type === 'frame' || obj.type === 'connector') return;

      const frameId = findFrameAtBounds({
        x,
        y,
        width: obj.width,
        height: obj.height,
      });

      setDragOverFrameId(frameId);
    },
    [objects, findFrameAtBounds]
  );

  /**
   * Handle object drag end to update position, manage frame containment, and update connectors.
   */
  const handleObjectDragEnd = useCallback(
    (objectId: string, x: number, y: number) => {
      isDraggingRef.current = null;
      setDragOverFrameId(null);
      updateObject(objectId, { x, y });
      
      const movedObject = objects.find((o) => o.id === objectId);
      if (!movedObject) return;

      /**
       * Frame containment logic:
       * Check if the moved object should be added to or removed from a frame.
       */
      if (movedObject.type !== 'frame' && movedObject.type !== 'connector') {
        const objectBounds = {
          x,
          y,
          width: movedObject.width,
          height: movedObject.height,
        };

        const frames = objects.filter((o) => o.type === 'frame');
        let bestFrame: typeof frames[0] | null = null;
        let bestOverlap = 0;
        const CONTAINMENT_THRESHOLD = 0.5;

        for (const frame of frames) {
          const titleHeight = (frame.data?.showTitle as boolean) !== false ? 32 : 0;
          const padding = { top: 40, right: 8, bottom: 8, left: 8 };
          
          const contentBounds = {
            x: frame.x + padding.left,
            y: frame.y + titleHeight + padding.top,
            width: frame.width - padding.left - padding.right,
            height: frame.height - titleHeight - padding.top - padding.bottom,
          };

          const overlapX = Math.max(
            0,
            Math.min(contentBounds.x + contentBounds.width, objectBounds.x + objectBounds.width) -
              Math.max(contentBounds.x, objectBounds.x)
          );
          const overlapY = Math.max(
            0,
            Math.min(contentBounds.y + contentBounds.height, objectBounds.y + objectBounds.height) -
              Math.max(contentBounds.y, objectBounds.y)
          );

          const overlapArea = overlapX * overlapY;
          const objectArea = objectBounds.width * objectBounds.height;
          const overlapPercentage = objectArea > 0 ? overlapArea / objectArea : 0;

          if (overlapPercentage >= CONTAINMENT_THRESHOLD && overlapPercentage > bestOverlap) {
            bestFrame = frame;
            bestOverlap = overlapPercentage;
          }
        }

        for (const frame of frames) {
          const currentChildIds = (frame.data?.childIds as string[]) ?? [];
          const isCurrentlyInFrame = currentChildIds.includes(objectId);

          if (frame === bestFrame && !isCurrentlyInFrame) {
            updateObject(frame.id, {
              data: {
                ...frame.data,
                childIds: [...currentChildIds, objectId],
              },
            });
          } else if (frame !== bestFrame && isCurrentlyInFrame) {
            updateObject(frame.id, {
              data: {
                ...frame.data,
                childIds: currentChildIds.filter((id) => id !== objectId),
              },
            });
          }
        }
      }

      /**
       * If the moved object is a frame, move all its children with it.
       */
      if (movedObject.type === 'frame') {
        const childIds = (movedObject.data?.childIds as string[]) ?? [];
        const deltaX = x - movedObject.x;
        const deltaY = y - movedObject.y;

        for (const childId of childIds) {
          const child = objects.find((o) => o.id === childId);
          if (child) {
            updateObject(childId, {
              x: child.x + deltaX,
              y: child.y + deltaY,
            });
          }
        }
      }
      
      /**
       * Update connected connectors when an object moves.
       */
      objects
        .filter((obj) => obj.type === 'connector')
        .forEach((connector) => {
          const startPoint = connector.data?.startPoint as { objectId?: string; anchor?: ConnectionAnchor; position?: { x: number; y: number } } | undefined;
          const endPoint = connector.data?.endPoint as { objectId?: string; anchor?: ConnectionAnchor; position?: { x: number; y: number } } | undefined;
          
          if (!startPoint?.objectId || !endPoint?.objectId) return;
          
          const isStartConnected = startPoint.objectId === objectId;
          const isEndConnected = endPoint.objectId === objectId;
          
          if (!isStartConnected && !isEndConnected) return;
          
          const startObj = isStartConnected 
            ? { ...movedObject, x, y }
            : objects.find((o) => o.id === startPoint.objectId);
          const endObj = isEndConnected
            ? { ...movedObject, x, y }
            : objects.find((o) => o.id === endPoint.objectId);
          
          if (!startObj || !endObj) return;
          
          const newStartPos = getAnchorWorldPosition(startObj, startPoint.anchor ?? 'right');
          const newEndPos = getAnchorWorldPosition(endObj, endPoint.anchor ?? 'left');
          
          updateObject(connector.id, {
            x: Math.min(newStartPos.x, newEndPos.x),
            y: Math.min(newStartPos.y, newEndPos.y),
            width: Math.abs(newEndPos.x - newStartPos.x) || 1,
            height: Math.abs(newEndPos.y - newStartPos.y) || 1,
            data: {
              ...connector.data,
              startPoint: { ...startPoint, position: newStartPos },
              endPoint: { ...endPoint, position: newEndPos },
            },
          });
        });
    },
    [updateObject, objects, getAnchorWorldPosition]
  );

  /**
   * Handle double-click on an object to start editing.
   */
  const handleObjectDoubleClick = useCallback(
    (objectId: string) => {
      const obj = objects.find((o) => o.id === objectId);
      if (!obj) return;

      if (obj.type === 'sticky-note' || obj.type === 'text') {
        const currentText =
          obj.type === 'sticky-note'
            ? ((obj.data?.text as string) ?? '')
            : ((obj.data?.text as string) ?? '');

        setEditingState({ objectId, initialText: currentText });

        setTimeout(() => {
          if (!containerRef.current) return;

          const containerRect = containerRef.current.getBoundingClientRect();

          const screenX = obj.x * viewport.scale + viewport.x;
          const screenY = obj.y * viewport.scale + viewport.y;
          const screenWidth = obj.width * viewport.scale;
          const screenHeight = obj.height * viewport.scale;

          const textarea = document.createElement('textarea');
          textarea.value = currentText;
          textarea.style.position = 'absolute';
          textarea.style.left = `${containerRect.left + screenX + 12}px`;
          textarea.style.top = `${containerRect.top + screenY + 12}px`;
          textarea.style.width = `${screenWidth - 24}px`;
          textarea.style.height = `${screenHeight - 24}px`;
          textarea.style.fontSize = `${((obj.data?.fontSize as number) ?? 16) * viewport.scale}px`;
          textarea.style.fontFamily = 'system-ui, -apple-system, sans-serif';
          textarea.style.border = '2px solid #4A90D9';
          textarea.style.borderRadius = '4px';
          textarea.style.padding = '4px';
          textarea.style.margin = '0';
          textarea.style.resize = 'none';
          textarea.style.outline = 'none';
          textarea.style.overflow = 'hidden';
          textarea.style.zIndex = '10000';
          textarea.style.backgroundColor =
            obj.type === 'sticky-note'
              ? ((obj.data?.color as string) ?? '#fef08a')
              : 'white';
          textarea.style.color = '#1f2937';

          const handleBlur = (): void => {
            const newText = textarea.value;
            updateObject(objectId, {
              data: { ...obj.data, text: newText },
            });
            textarea.remove();
            setEditingState({ objectId: null, initialText: '' });
            textareaRef.current = null;
          };

          const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
              textarea.value = currentText;
              textarea.blur();
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              textarea.blur();
            }
          };

          textarea.addEventListener('blur', handleBlur);
          textarea.addEventListener('keydown', handleKeyDown);

          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          textareaRef.current = textarea;
        }, 0);
      }
    },
    [objects, viewport, updateObject]
  );

  /**
   * Handle object transform end (resize/rotate).
   * For text and sticky-note objects, scales the font size proportionally.
   * For text objects, also snaps the bounding box to fit the scaled text.
   * Also updates any connected connectors.
   */
  const handleObjectTransformEnd = useCallback(
    (event: TransformEndEvent) => {
      const obj = objects.find((o) => o.id === event.objectId);
      if (!obj) return;

      const existingData = obj.data ?? {};
      const updatedData: Record<string, unknown> = {
        ...existingData,
        rotation: event.rotation,
      };

      let finalWidth = event.width;
      let finalHeight = event.height;

      if (obj.type === 'text' || obj.type === 'sticky-note') {
        const currentFontSize = (existingData.fontSize as number) ?? 16;
        const scaleFactor = Math.max(event.scaleX, event.scaleY);
        const newFontSize = Math.round(currentFontSize * scaleFactor);
        const clampedFontSize = Math.max(8, Math.min(200, newFontSize));
        updatedData.fontSize = clampedFontSize;

        if (obj.type === 'text') {
          const textContent = (existingData.text as string) || 'Text';
          const measured = measureText({
            text: textContent,
            fontSize: clampedFontSize,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 16,
          });

          finalWidth = Math.max(measured.width, 50);
          finalHeight = Math.max(measured.height, 30);
        }
      }

      updateObject(event.objectId, {
        x: event.x,
        y: event.y,
        width: finalWidth,
        height: finalHeight,
        data: updatedData,
      });
      
      const transformedObj = { 
        x: event.x, 
        y: event.y, 
        width: finalWidth, 
        height: finalHeight,
        data: updatedData,
      };
      
      objects
        .filter((connObj) => connObj.type === 'connector')
        .forEach((connector) => {
          const startPoint = connector.data?.startPoint as { objectId?: string; anchor?: ConnectionAnchor; position?: { x: number; y: number } } | undefined;
          const endPoint = connector.data?.endPoint as { objectId?: string; anchor?: ConnectionAnchor; position?: { x: number; y: number } } | undefined;
          
          if (!startPoint?.objectId || !endPoint?.objectId) return;
          
          const isStartConnected = startPoint.objectId === event.objectId;
          const isEndConnected = endPoint.objectId === event.objectId;
          
          if (!isStartConnected && !isEndConnected) return;
          
          const startObj = isStartConnected 
            ? transformedObj
            : objects.find((o) => o.id === startPoint.objectId);
          const endObj = isEndConnected
            ? transformedObj
            : objects.find((o) => o.id === endPoint.objectId);
          
          if (!startObj || !endObj) return;
          
          const newStartPos = getAnchorWorldPosition(startObj as SyncableObject, startPoint.anchor ?? 'right');
          const newEndPos = getAnchorWorldPosition(endObj as SyncableObject, endPoint.anchor ?? 'left');
          
          updateObject(connector.id, {
            x: Math.min(newStartPos.x, newEndPos.x),
            y: Math.min(newStartPos.y, newEndPos.y),
            width: Math.abs(newEndPos.x - newStartPos.x) || 1,
            height: Math.abs(newEndPos.y - newStartPos.y) || 1,
            data: {
              ...connector.data,
              startPoint: { ...startPoint, position: newStartPos },
              endPoint: { ...endPoint, position: newEndPos },
            },
          });
        });
    },
    [updateObject, objects, getAnchorWorldPosition]
  );

  /**
   * Handle viewport change from canvas.
   */
  const handleViewportChange = useCallback(
    (newViewport: ViewportState) => {
      setViewport(newViewport);
    },
    [setViewport]
  );

  /**
   * Handle canvas click for object creation.
   * Creates objects based on the currently active tool.
   */
  const handleCanvasClick = useCallback(
    async (event: CanvasClickEvent) => {
      if (activeTool === 'select' || activeTool === 'connector') {
        return;
      }

      const now = Date.now();
      const baseObject = {
        id: generateUUID(),
        createdBy: userId,
        createdAt: now,
        modifiedBy: userId,
        modifiedAt: now,
        zIndex: objects.length + 1,
      };

      let newObject: SyncableObject | null = null;

      switch (activeTool) {
        case 'sticky-note': {
          const color =
            STICKY_NOTE_COLORS[
              Math.floor(Math.random() * STICKY_NOTE_COLORS.length)
            ];
          newObject = {
            ...baseObject,
            type: 'sticky-note',
            x: event.canvasX - DEFAULT_STICKY_NOTE_SIZE.width / 2,
            y: event.canvasY - DEFAULT_STICKY_NOTE_SIZE.height / 2,
            width: DEFAULT_STICKY_NOTE_SIZE.width,
            height: DEFAULT_STICKY_NOTE_SIZE.height,
            data: {
              color,
              text: '',
              fontSize: 16,
            },
          };
          break;
        }
        case 'rectangle': {
          newObject = {
            ...baseObject,
            type: 'shape',
            x: event.canvasX - DEFAULT_SHAPE_SIZE.width / 2,
            y: event.canvasY - DEFAULT_SHAPE_SIZE.height / 2,
            width: DEFAULT_SHAPE_SIZE.width,
            height: DEFAULT_SHAPE_SIZE.height,
            data: {
              shapeType: 'rectangle',
              color: '#3b82f6',
              strokeColor: '#1d4ed8',
              strokeWidth: 2,
            },
          };
          break;
        }
        case 'ellipse': {
          newObject = {
            ...baseObject,
            type: 'shape',
            x: event.canvasX - DEFAULT_SHAPE_SIZE.width / 2,
            y: event.canvasY - DEFAULT_SHAPE_SIZE.height / 2,
            width: DEFAULT_SHAPE_SIZE.width,
            height: DEFAULT_SHAPE_SIZE.height,
            data: {
              shapeType: 'ellipse',
              color: '#10b981',
              strokeColor: '#059669',
              strokeWidth: 2,
            },
          };
          break;
        }
        case 'text': {
          newObject = {
            ...baseObject,
            type: 'text',
            x: event.canvasX,
            y: event.canvasY,
            width: 200,
            height: 50,
            data: {
              text: 'Double-click to edit',
              fontSize: 18,
              color: '#1f2937',
            },
          };
          break;
        }
        case 'frame': {
          newObject = {
            ...baseObject,
            type: 'frame',
            x: event.canvasX - 200,
            y: event.canvasY - 150,
            width: 400,
            height: 300,
            data: {
              title: 'Frame',
              childIds: [],
              showTitle: true,
              backgroundOpacity: 0.1,
              snapBehavior: 'none',
            },
          };
          break;
        }
        default: {
          const shapeDefinition = ShapeRegistry.get(activeTool as ShapeType);
          if (shapeDefinition) {
            const { width, height } = shapeDefinition.defaultSize;
            newObject = {
              ...baseObject,
              type: 'shape',
              x: event.canvasX - width / 2,
              y: event.canvasY - height / 2,
              width,
              height,
              data: {
                shapeType: activeTool,
                color: '#3b82f6',
                strokeColor: '#1d4ed8',
                strokeWidth: 2,
              },
            };
          }
          break;
        }
      }

      if (newObject) {
        await createObject(newObject);
        onToolReset();
      }
    },
    [activeTool, userId, objects.length, createObject, onToolReset]
  );

  /**
   * Determine the highlighted object and anchor for the overlay.
   */
  const overlayHighlightedObjectId = isCreatingConnector
    ? connectorDragState.hoveredObjectId
    : hoveredObjectId;
  const overlayHighlightedAnchor = isCreatingConnector
    ? connectorDragState.nearestAnchor
    : hoveredAnchor;

  /**
   * Connector preview configuration for rendering during creation.
   */
  const connectorPreview = useMemo(() => {
    if (!isCreatingConnector) {
      return undefined;
    }
    return {
      active: true,
      startPosition: connectorDragState.startPosition,
      endPosition: connectorDragState.currentPosition,
      strokeColor: '#3b82f6',
    };
  }, [isCreatingConnector, connectorDragState.startPosition, connectorDragState.currentPosition]);

  return (
    <div
      ref={containerRef}
      className="board-canvas-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      tabIndex={0}
    >
      <BoardCanvasComponent
        objects={renderableObjects}
        viewport={viewport}
        onViewportChange={handleViewportChange}
        selectedIds={selectedObjectIds}
        onObjectSelect={handleObjectSelect}
        onBackgroundClick={handleBackgroundClick}
        onCanvasClick={handleCanvasClick}
        onObjectDragStart={handleObjectDragStart}
        onObjectDrag={handleObjectDrag}
        onObjectDragEnd={handleObjectDragEnd}
        onObjectDoubleClick={handleObjectDoubleClick}
        onObjectTransformEnd={handleObjectTransformEnd}
        activeTool={activeTool}
        onLassoSelect={handleLassoSelect}
        showGrid={showGrid}
        connectorPreview={connectorPreview}
        hoveredFrameId={dragOverFrameId}
      >
        <CursorOverlayComponent />
        <ConnectionAnchorOverlay
          objects={renderableObjects}
          visible={activeTool === 'connector'}
          highlightedObjectId={overlayHighlightedObjectId}
          highlightedAnchor={overlayHighlightedAnchor}
          onAnchorClick={handleAnchorClick}
          onAnchorMouseEnter={handleAnchorMouseEnter}
          onAnchorMouseLeave={handleAnchorMouseLeave}
        />
      </BoardCanvasComponent>
    </div>
  );
}

/**
 * Zoom controls wrapper that connects to board context.
 */
function BoardZoomControls() {
  const { viewport, setViewport } = useBoard();

  const handleZoomChange = useCallback(
    (newScale: number) => {
      setViewport({ scale: newScale });
    },
    [setViewport]
  );

  return (
    <ZoomControlsComponent
      scale={viewport.scale}
      onZoomChange={handleZoomChange}
    />
  );
}

/**
 * Properties panel wrapper that connects to board context.
 * Displays and edits properties of the currently selected object.
 */
function BoardPropertiesPanel() {
  const { objects, selectedObjectIds, updateObject } = useBoard();

  /**
   * Get the first selected object for the properties panel.
   * Currently supports single selection editing.
   */
  const selectedObject = useMemo((): PropertyPanelObject | null => {
    if (selectedObjectIds.size === 0) return null;
    
    const firstSelectedId = Array.from(selectedObjectIds)[0];
    const obj = objects.find((o) => o.id === firstSelectedId);
    
    if (!obj) return null;

    return {
      id: obj.id,
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      data: obj.data as Record<string, unknown> | undefined,
    };
  }, [objects, selectedObjectIds]);

  /**
   * Handle property change from the properties panel.
   * For text objects, snaps the container when font size or text content changes.
   * Supports nested data paths like 'data.label.text'.
   */
  const handlePropertyChange = useCallback(
    (event: PropertyChangeEvent) => {
      const { objectId, property, value } = event;
      const obj = objects.find((o) => o.id === objectId);
      if (!obj) return;

      if (property.startsWith('data.')) {
        const dataPath = property.slice(5);
        const pathParts = dataPath.split('.');
        
        let newData: Record<string, unknown>;
        
        if (pathParts.length === 1) {
          newData = {
            ...obj.data,
            [pathParts[0]]: value,
          };
        } else {
          newData = { ...obj.data };
          let current = newData;
          
          for (let i = 0; i < pathParts.length - 1; i++) {
            const key = pathParts[i];
            current[key] = { ...(current[key] as Record<string, unknown> || {}) };
            current = current[key] as Record<string, unknown>;
          }
          
          current[pathParts[pathParts.length - 1]] = value;
        }

        if (obj.type === 'text' && (dataPath === 'fontSize' || dataPath === 'text')) {
          const textContent = dataPath === 'text' 
            ? (value as string) 
            : (obj.data?.text as string) || 'Text';
          const fontSize = dataPath === 'fontSize' 
            ? (value as number) 
            : (obj.data?.fontSize as number) || 16;

          const measured = measureText({
            text: textContent,
            fontSize,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: 16,
          });

          updateObject(objectId, {
            width: Math.max(measured.width, 50),
            height: Math.max(measured.height, 30),
            data: newData,
          });
        } else {
          updateObject(objectId, {
            data: newData,
          });
        }
      } else {
        updateObject(objectId, {
          [property]: value,
        });
      }
    },
    [objects, updateObject]
  );

  return (
    <PropertiesPanelComponent
      selectedObject={selectedObject}
      onPropertyChange={handlePropertyChange}
    />
  );
}

/**
 * Main Board Content Component.
 * Displays the authenticated user's board view with canvas and controls.
 */
function BoardContent() {
  const { user, signOut } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [showGrid, setShowGrid] = useState(false);

  /**
   * Create board metadata for the default board.
   * Using a stable timestamp for memoization.
   */
  const [boardTimestamp] = useState(() => Date.now());
  const boardMetadata = useMemo(
    (): BoardMetadata => ({
      id: DEFAULT_BOARD_ID,
      name: 'Main Board',
      description: 'Default collaborative board',
      createdBy: user?.uid ?? 'anonymous',
      createdAt: boardTimestamp,
      modifiedAt: boardTimestamp,
    }),
    [user?.uid, boardTimestamp]
  );

  /**
   * Handle tool change from toolbar.
   */
  const handleToolChange = useCallback((tool: ToolType) => {
    setActiveTool(tool);
  }, []);

  /**
   * Reset tool to select after creating an object.
   */
  const handleToolReset = useCallback(() => {
    setActiveTool('select');
  }, []);

  /**
   * Toggle grid visibility.
   */
  const handleGridToggle = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  /**
   * Keyboard shortcuts for tools and grid.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'g':
          handleGridToggle();
          break;
        case 'v':
          setActiveTool('select');
          break;
        case 'n':
          setActiveTool('sticky-note');
          break;
        case 'r':
          setActiveTool('rectangle');
          break;
        case 'o':
          setActiveTool('ellipse');
          break;
        case 't':
          setActiveTool('text');
          break;
        case 'c':
          setActiveTool('connector');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGridToggle]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>CollabBoard</h1>
          <div className="header-right">
            <PresenceListComponent />
            <div className="header-user">
              <span>{user?.email}</span>
              <button onClick={signOut} className="sign-out-button">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="app-main">
        <BoardProvider board={boardMetadata}>
          <AIProvider apiKey={import.meta.env.VITE_OPENAI_API_KEY}>
            <CursorProvider boardId={DEFAULT_BOARD_ID}>
              <ToolbarComponent
                activeTool={activeTool}
                onToolChange={handleToolChange}
                showGrid={showGrid}
                onGridToggle={handleGridToggle}
              />
              <BoardCanvasWithCursors
                activeTool={activeTool}
                onToolReset={handleToolReset}
                userId={user?.uid ?? 'anonymous'}
                showGrid={showGrid}
              />
              <BoardZoomControls />
              <BoardPropertiesPanel />
              <div className="ai-command-bar-container">
                <AICommandBarWrapper />
              </div>
              <GlobalAIIndicator boardId={DEFAULT_BOARD_ID} showUser />
            </CursorProvider>
          </AIProvider>
        </BoardProvider>
      </main>
    </div>
  );
}

/**
 * Authenticated content wrapper with presence provider.
 */
function AuthenticatedApp() {
  return (
    <PresenceProvider>
      <BoardContent />
    </PresenceProvider>
  );
}

/**
 * Root application component for CollabBoard.
 * Wraps the app with auth provider and guard.
 */
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AuthenticatedApp />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;
