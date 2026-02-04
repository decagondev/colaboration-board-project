import { useCallback, useMemo, useState } from 'react';
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
} from '@board/index';
import type { BoardMetadata } from '@board/context/BoardContext';
import type { CanvasClickEvent, ToolType } from '@board/components';
import type { SyncableObject } from '@sync/interfaces/ISyncService';
import { generateUUID } from '@shared/utils';
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
}

/**
 * Inner board canvas that has access to board and cursor contexts.
 * Renders the Konva canvas with cursor overlay.
 */
function BoardCanvasWithCursors({
  activeTool,
  onToolReset,
  userId,
}: BoardCanvasWithCursorsProps) {
  const {
    objects,
    selectedObjectIds,
    selectObject,
    clearSelection,
    updateObject,
    createObject,
  } = useBoard();
  const { updateCursorPosition } = useCursor();

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
   * Object-specific properties like color and rotation are stored in the data field.
   */
  const renderableObjects = useMemo(() => {
    return objects.map((obj) => ({
      id: obj.id,
      type: obj.type,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      color: (obj.data?.color as string) ?? '#3b82f6',
      rotation: (obj.data?.rotation as number) ?? 0,
    }));
  }, [objects]);

  return (
    <div className="board-canvas-container" onMouseMove={handleMouseMove}>
      <BoardCanvasComponent
        objects={renderableObjects}
        selectedIds={selectedObjectIds}
        onObjectSelect={handleObjectSelect}
        onBackgroundClick={handleBackgroundClick}
        onCanvasClick={handleCanvasClick}
        onObjectDragEnd={handleObjectDragEnd}
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
 * Main Board Content Component.
 * Displays the authenticated user's board view with canvas and controls.
 */
function BoardContent() {
  const { user, signOut } = useAuth();
  const [activeTool, setActiveTool] = useState<ToolType>('select');

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
            />
            <BoardCanvasWithCursors
              activeTool={activeTool}
              onToolReset={handleToolReset}
              userId={user?.uid ?? 'anonymous'}
            />
            <BoardZoomControls />
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
