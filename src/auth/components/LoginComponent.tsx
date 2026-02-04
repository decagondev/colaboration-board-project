/**
 * Login Component
 *
 * Provides a form for user authentication with email and password.
 * Supports both sign-in and sign-up modes.
 */

import { useState, FormEvent, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginComponent.css';

/**
 * Login component for user authentication.
 *
 * @example
 * ```tsx
 * <LoginComponent onSuccess={() => navigate('/board')} />
 * ```
 */
export function LoginComponent() {
  const { signIn, signUp, error, isLoading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = useCallback((): boolean => {
    if (!email.trim()) {
      setValidationError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setValidationError('Please enter a valid email');
      return false;
    }

    if (!password) {
      setValidationError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }

    if (isSignUp && password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    setValidationError(null);
    return true;
  }, [email, password, confirmPassword, isSignUp]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      clearError();

      if (!validateForm()) {
        return;
      }

      try {
        if (isSignUp) {
          await signUp(email, password);
        } else {
          await signIn(email, password);
        }
      } catch {
        /* Error is handled by context */
      }
    },
    [email, password, isSignUp, signIn, signUp, validateForm, clearError]
  );

  const toggleMode = useCallback(() => {
    setIsSignUp((prev) => !prev);
    setValidationError(null);
    clearError();
    setConfirmPassword('');
  }, [clearError]);

  const displayError = validationError || error;

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="login-subtitle">
          {isSignUp
            ? 'Sign up to start collaborating'
            : 'Sign in to your account'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {displayError && (
            <div className="login-error" role="alert">
              {displayError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
              disabled={isLoading}
              data-testid="email-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              disabled={isLoading}
              data-testid="password-input"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                disabled={isLoading}
                data-testid="confirm-password-input"
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
            data-testid="login-button"
          >
            {isLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <span>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            className="toggle-mode-button"
            disabled={isLoading}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
