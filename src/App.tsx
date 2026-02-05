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
} from '@board/index';
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
import type { SyncableObject } from '@sync/interfaces/ISyncService';
import { generateUUID, measureText } from '@shared/utils';
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
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectIds, deleteObject, clearSelection, editingState.objectId, isInputFocused]);

  /**
   * Handle mouse move to track cursor position.
   */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateCursorPosition(x, y);
    },
    [updateCursorPosition]
  );

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
   * Handle object drag end to update position.
   */
  const handleObjectDragEnd = useCallback(
    (objectId: string, x: number, y: number) => {
      updateObject(objectId, { x, y });
    },
    [updateObject]
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
    },
    [updateObject, objects]
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
      if (activeTool === 'select') {
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
      }

      if (newObject) {
        await createObject(newObject);
        onToolReset();
      }
    },
    [activeTool, userId, objects.length, createObject, onToolReset]
  );

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
   * Handle container click for object creation.
   * This bypasses Konva's event system which may not receive browser automation clicks.
   */
  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const canvas = containerRef.current?.querySelector('canvas');
      if (!canvas) {
        return;
      }

      if (activeTool === 'select') {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const canvasX = (screenX - viewport.x) / viewport.scale;
      const canvasY = (screenY - viewport.y) / viewport.scale;

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
            x: canvasX - DEFAULT_STICKY_NOTE_SIZE.width / 2,
            y: canvasY - DEFAULT_STICKY_NOTE_SIZE.height / 2,
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
            x: canvasX - DEFAULT_SHAPE_SIZE.width / 2,
            y: canvasY - DEFAULT_SHAPE_SIZE.height / 2,
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
            x: canvasX - DEFAULT_SHAPE_SIZE.width / 2,
            y: canvasY - DEFAULT_SHAPE_SIZE.height / 2,
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
            x: canvasX,
            y: canvasY,
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
      }

      if (newObject) {
        createObject(newObject);
        onToolReset();
      }
    },
    [activeTool, viewport, userId, objects.length, createObject, onToolReset]
  );

  return (
    <div
      ref={containerRef}
      className="board-canvas-container"
      onMouseMove={handleMouseMove}
      onClick={handleContainerClick}
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
        onObjectDragEnd={handleObjectDragEnd}
        onObjectDoubleClick={handleObjectDoubleClick}
        onObjectTransformEnd={handleObjectTransformEnd}
        activeTool={activeTool}
        onLassoSelect={handleLassoSelect}
        showGrid={showGrid}
      >
        <CursorOverlayComponent />
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
   */
  const handlePropertyChange = useCallback(
    (event: PropertyChangeEvent) => {
      const { objectId, property, value } = event;
      const obj = objects.find((o) => o.id === objectId);
      if (!obj) return;

      if (property.startsWith('data.')) {
        const dataKey = property.slice(5);
        const newData = {
          ...obj.data,
          [dataKey]: value,
        };

        if (obj.type === 'text' && (dataKey === 'fontSize' || dataKey === 'text')) {
          const textContent = dataKey === 'text' 
            ? (value as string) 
            : (obj.data?.text as string) || 'Text';
          const fontSize = dataKey === 'fontSize' 
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
          </CursorProvider>
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
