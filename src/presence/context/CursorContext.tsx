/**
 * Cursor Context Module
 *
 * Provides cursor state management and synchronization for the application.
 * Manages real-time cursor tracking across all users in a board.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useAuth } from '@auth/hooks';
import { FirebaseCursorService } from '../services/FirebaseCursorService';
import type { CursorPosition } from '../interfaces/ICursorService';

/**
 * Cursor context state interface.
 */
interface CursorContextState {
  /** All cursors on the current board (excluding current user) */
  cursors: CursorPosition[];
  /** Whether the cursor service is initializing */
  isLoading: boolean;
  /** Current board ID */
  boardId: string;
  /** Updates the current user's cursor position */
  updateCursorPosition: (x: number, y: number) => void;
}

const CursorContext = createContext<CursorContextState | undefined>(undefined);

/**
 * Cursor context provider props.
 */
interface CursorProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Board ID to track cursors for */
  boardId: string;
  /** User's color for cursor display */
  userColor?: string;
}

/**
 * Provides cursor state and tracking to the component tree.
 *
 * @param props - Provider props including boardId and optional userColor
 * @returns Provider component wrapping children
 *
 * @example
 * ```tsx
 * <CursorProvider boardId="default-board" userColor="#3b82f6">
 *   <CanvasComponent />
 * </CursorProvider>
 * ```
 */
export function CursorProvider({
  children,
  boardId,
  userColor = '#3b82f6',
}: CursorProviderProps): React.ReactNode {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<{
    cursors: CursorPosition[];
    receivedAt: number | null;
    forUserId: string | null;
  }>({ cursors: [], receivedAt: null, forUserId: null });
  const cursorServiceRef = useRef<FirebaseCursorService | null>(null);

  /** Initialize cursor service */
  useEffect(() => {
    if (!cursorServiceRef.current) {
      cursorServiceRef.current = new FirebaseCursorService();
    }
  }, []);

  /** Set user metadata when user or color changes */
  useEffect(() => {
    if (user && cursorServiceRef.current) {
      const displayName = user.email?.split('@')[0] || 'Anonymous';
      cursorServiceRef.current.setUserMetadata(
        user.uid,
        displayName,
        userColor
      );
    }
  }, [user, userColor]);

  /** Subscribe to cursor changes */
  useEffect(() => {
    if (!user || !cursorServiceRef.current) {
      return;
    }

    const cursorService = cursorServiceRef.current;

    cursorService.setupDisconnectCleanup(user.uid, boardId);

    const unsubscribe = cursorService.subscribeToAllCursors(
      boardId,
      (allCursors) => {
        const otherCursors = allCursors.filter(
          (cursor) => cursor.userId !== user.uid
        );
        setSubscriptionData({
          cursors: otherCursors,
          receivedAt: Date.now(),
          forUserId: user.uid,
        });
      }
    );

    return () => {
      unsubscribe();
      cursorService.removeCursor(user.uid, boardId);
    };
  }, [user, boardId]);

  const cursors = useMemo(() => {
    if (!user) return [];
    if (subscriptionData.forUserId !== user.uid) return [];
    return subscriptionData.cursors;
  }, [user, subscriptionData]);

  const isLoading = useMemo(() => {
    if (!user) return false;
    return subscriptionData.forUserId !== user.uid;
  }, [user, subscriptionData.forUserId]);

  /**
   * Updates the current user's cursor position.
   * Debounced internally by the cursor service.
   */
  const updateCursorPosition = useCallback(
    (x: number, y: number) => {
      if (user && cursorServiceRef.current) {
        cursorServiceRef.current.updatePosition(user.uid, x, y, boardId);
      }
    },
    [user, boardId]
  );

  const contextValue = useMemo(
    (): CursorContextState => ({
      cursors,
      isLoading,
      boardId,
      updateCursorPosition,
    }),
    [cursors, isLoading, boardId, updateCursorPosition]
  );

  return (
    <CursorContext.Provider value={contextValue}>
      {children}
    </CursorContext.Provider>
  );
}

/**
 * Hook to access cursor context.
 *
 * @returns Cursor context state
 * @throws Error if used outside of CursorProvider
 *
 * @example
 * ```tsx
 * const { cursors, updateCursorPosition } = useCursor();
 *
 * const handleMouseMove = (e: MouseEvent) => {
 *   updateCursorPosition(e.clientX, e.clientY);
 * };
 * ```
 */
export function useCursor(): CursorContextState {
  const context = useContext(CursorContext);

  if (context === undefined) {
    throw new Error('useCursor must be used within a CursorProvider');
  }

  return context;
}

export { CursorContext };
