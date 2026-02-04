/**
 * Auth Context Module
 *
 * Provides authentication state and methods to the component tree
 * using React Context. Follows the Provider pattern for dependency injection.
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
import type { User, IAuthService } from '../interfaces/IAuthService';
import { FirebaseAuthService } from '../services/FirebaseAuthService';

/**
 * Auth context value interface.
 */
interface AuthContextValue {
  /** Current authenticated user or null */
  user: User | null;
  /** Loading state during auth operations */
  isLoading: boolean;
  /** Error message if auth operation fails */
  error: string | null;
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up with email and password */
  signUp: (email: string, password: string) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Clear any auth errors */
  clearError: () => void;
}

/**
 * Auth context with undefined default value.
 * Must be used within AuthProvider.
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth provider props.
 */
interface AuthProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional auth service for dependency injection (useful for testing) */
  authService?: IAuthService;
}

/**
 * Auth Provider Component
 *
 * Wraps the application and provides auth state and methods via context.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children, authService }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => authService ?? new FirebaseAuthService(),
    [authService]
  );

  useEffect(() => {
    const unsubscribe = service.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [service]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await service.signIn(email, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign in failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        await service.signUp(email, password);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sign up failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await service.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      error,
      signIn,
      signUp,
      signOut,
      clearError,
    }),
    [user, isLoading, error, signIn, signUp, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 *
 * @returns Auth context value
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth();
 *   // ...
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export { AuthContext };
