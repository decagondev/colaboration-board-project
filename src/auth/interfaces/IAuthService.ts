/**
 * Auth Service Interface Module
 *
 * Defines the contract for authentication services.
 * Following the Dependency Inversion Principle (DIP),
 * components depend on this interface rather than concrete implementations.
 */

import type { Unsubscribe } from '@shared/types';

/**
 * Represents an authenticated user.
 */
export interface User {
  /** Unique identifier for the user */
  uid: string;
  /** User's email address */
  email: string | null;
  /** User's display name */
  displayName: string | null;
  /** URL to user's profile photo */
  photoURL: string | null;
}

/**
 * Callback function for auth state changes.
 */
export type AuthStateCallback = (user: User | null) => void;

/**
 * Custom error class for authentication errors.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Authentication service interface.
 *
 * Provides methods for user authentication including sign-in, sign-up,
 * sign-out, and auth state observation.
 *
 * @example
 * ```typescript
 * const authService: IAuthService = new FirebaseAuthService();
 *
 * // Sign in a user
 * const user = await authService.signIn('user@example.com', 'password');
 *
 * // Listen for auth state changes
 * const unsubscribe = authService.onAuthStateChanged((user) => {
 *   if (user) {
 *     console.log('User signed in:', user.email);
 *   } else {
 *     console.log('User signed out');
 *   }
 * });
 * ```
 */
export interface IAuthService {
  /**
   * Signs in a user with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to the authenticated user
   * @throws {AuthError} When credentials are invalid or sign-in fails
   */
  signIn(email: string, password: string): Promise<User>;

  /**
   * Creates a new user account with email and password.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to the newly created user
   * @throws {AuthError} When email is already in use or sign-up fails
   */
  signUp(email: string, password: string): Promise<User>;

  /**
   * Signs out the currently authenticated user.
   *
   * @returns Promise resolving when sign-out is complete
   * @throws {AuthError} When sign-out fails
   */
  signOut(): Promise<void>;

  /**
   * Gets the currently authenticated user.
   *
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): User | null;

  /**
   * Subscribes to authentication state changes.
   *
   * @param callback - Function called when auth state changes
   * @returns Unsubscribe function to stop listening
   */
  onAuthStateChanged(callback: AuthStateCallback): Unsubscribe;
}
