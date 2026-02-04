import { useCallback, useMemo } from 'react';
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
} from '@board/index';
import type { BoardMetadata } from '@board/context/BoardContext';
import './App.css';

/**
 * Default board ID for the application.
 * In a multi-board app, this would be dynamic.
 */
const DEFAULT_BOARD_ID = 'default-board';

/**
 * Inner board canvas that has access to board and cursor contexts.
 * Renders the Konva canvas with cursor overlay.
 */
function BoardCanvasWithCursors() {
  const { objects, selectedObjectIds, selectObject, clearSelection, updateObject } = useBoard();
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

  return <ZoomControlsComponent scale={viewport.scale} onZoomChange={handleZoomChange} />;
}

/**
 * Main Board Content Component.
 * Displays the authenticated user's board view with canvas and controls.
 */
function BoardContent() {
  const { user, signOut } = useAuth();

  /**
   * Create board metadata for the default board.
   */
  const boardMetadata = useMemo(
    (): BoardMetadata => ({
      id: DEFAULT_BOARD_ID,
      name: 'Main Board',
      description: 'Default collaborative board',
      createdBy: user?.uid ?? 'anonymous',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    }),
    [user?.uid]
  );

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
            <BoardCanvasWithCursors />
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
