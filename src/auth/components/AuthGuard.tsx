/**
 * Auth Guard Component
 *
 * Protects routes that require authentication.
 * Redirects to login if user is not authenticated.
 */

import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { LoginComponent } from './LoginComponent';
import './AuthGuard.css';

/**
 * Auth guard props.
 */
interface AuthGuardProps {
  /** Protected content to render when authenticated */
  children: ReactNode;
  /** Optional custom loading component */
  loadingComponent?: ReactNode;
  /** Optional custom login component */
  loginComponent?: ReactNode;
}

/**
 * Default loading component displayed during auth state check.
 */
function DefaultLoading() {
  return (
    <div className="auth-loading">
      <div className="auth-loading-spinner" />
      <p>Loading...</p>
    </div>
  );
}

/**
 * Auth Guard Component
 *
 * Wraps content that requires authentication.
 * Shows loading state while checking auth, login form if not authenticated,
 * or the protected content if authenticated.
 *
 * @example
 * ```tsx
 * <AuthGuard>
 *   <ProtectedPage />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  loadingComponent,
  loginComponent,
}: AuthGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <>{loadingComponent ?? <DefaultLoading />}</>;
  }

  if (!user) {
    return <>{loginComponent ?? <LoginComponent />}</>;
  }

  return <>{children}</>;
}
