/**
 * Presence Context Module
 *
 * Provides presence state and subscription to the component tree
 * using React Context.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import type {
  OnlineUser,
  IPresenceService,
} from '../interfaces/IPresenceService';
import { FirebasePresenceService } from '../services/FirebasePresenceService';
import { useAuth } from '@auth/hooks/useAuth';

/**
 * Default board ID for the application.
 * In a full implementation, this would come from routing or props.
 */
const DEFAULT_BOARD_ID = 'default-board';

/**
 * Presence context value interface.
 */
interface PresenceContextValue {
  /** List of online users */
  onlineUsers: OnlineUser[];
  /** Current user's color */
  currentUserColor: string | null;
  /** Whether presence is loading */
  isLoading: boolean;
  /** Current board ID */
  boardId: string;
}

/**
 * Presence context with undefined default value.
 */
const PresenceContext = createContext<PresenceContextValue | undefined>(
  undefined
);

/**
 * Presence provider props.
 */
interface PresenceProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional board ID (defaults to 'default-board') */
  boardId?: string;
  /** Optional presence service for dependency injection */
  presenceService?: IPresenceService;
}

/**
 * Presence Provider Component
 *
 * Manages presence subscription and provides online users to the component tree.
 */
export function PresenceProvider({
  children,
  boardId = DEFAULT_BOARD_ID,
  presenceService,
}: PresenceProviderProps) {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<{
    users: OnlineUser[];
    receivedAt: number | null;
    forUserId: string | null;
  }>({ users: [], receivedAt: null, forUserId: null });

  const service = useMemo(
    () => presenceService ?? new FirebasePresenceService(),
    [presenceService]
  );

  const setUserOnline = useCallback(async () => {
    if (!user) return;

    const displayName = user.displayName || user.email || 'Anonymous';
    await service.setOnline(user.uid, displayName, boardId);
  }, [user, boardId, service]);

  const setUserOffline = useCallback(async () => {
    if (!user) return;

    await service.setOffline(user.uid, boardId);
  }, [user, boardId, service]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setUserOnline();

    const unsubscribe = service.subscribeToPresence(boardId, (users) => {
      setSubscriptionData({
        users,
        receivedAt: Date.now(),
        forUserId: user.uid,
      });
    });

    return () => {
      unsubscribe();
      setUserOffline();
    };
  }, [user, boardId, service, setUserOnline, setUserOffline]);

  const onlineUsers = useMemo(() => {
    if (!user) return [];
    if (subscriptionData.forUserId !== user.uid) return [];
    return subscriptionData.users;
  }, [user, subscriptionData]);

  const isLoading = useMemo(() => {
    if (!user) return false;
    return subscriptionData.forUserId !== user.uid;
  }, [user, subscriptionData.forUserId]);

  const currentUserColor = useMemo(() => {
    if (!user) return null;
    const currentOnlineUser = onlineUsers.find((u) => u.uid === user.uid);
    return currentOnlineUser?.color ?? null;
  }, [user, onlineUsers]);

  const value = useMemo<PresenceContextValue>(
    () => ({
      onlineUsers,
      currentUserColor,
      isLoading,
      boardId,
    }),
    [onlineUsers, currentUserColor, isLoading, boardId]
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

/**
 * Hook to access presence context.
 *
 * @returns Presence context value
 * @throws Error if used outside PresenceProvider
 */
export function usePresence(): PresenceContextValue {
  const context = useContext(PresenceContext);

  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }

  return context;
}

export { PresenceContext };
