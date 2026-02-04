/**
 * Firebase Auth Service Implementation
 *
 * Implements IAuthService using Firebase Authentication.
 * Following the Single Responsibility Principle (SRP),
 * this service only handles authentication concerns.
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  AuthError as FirebaseAuthError,
} from 'firebase/auth';
import { auth } from '@shared/config/firebase';
import type { Unsubscribe } from '@shared/types';
import type {
  IAuthService,
  User,
  AuthStateCallback,
} from '../interfaces/IAuthService';
import { AuthError } from '../interfaces/IAuthService';

/**
 * Maps Firebase user to application User type.
 *
 * @param firebaseUser - Firebase user object
 * @returns Application User object
 */
function mapFirebaseUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
}

/**
 * Maps Firebase auth error codes to user-friendly messages.
 *
 * @param code - Firebase error code
 * @returns User-friendly error message
 */
function getErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests':
      'Too many failed attempts. Please try again later.',
  };

  return errorMessages[code] || 'An authentication error occurred.';
}

/**
 * Firebase implementation of IAuthService.
 *
 * Provides authentication functionality using Firebase Auth SDK.
 * All methods handle errors and wrap them in AuthError for consistency.
 */
export class FirebaseAuthService implements IAuthService {
  /**
   * Signs in a user with email and password using Firebase Auth.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to the authenticated user
   * @throws {AuthError} When credentials are invalid
   */
  async signIn(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return mapFirebaseUser(credential.user);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as FirebaseAuthError;
        throw new AuthError(
          getErrorMessage(firebaseError.code),
          firebaseError.code,
          error
        );
      }
      throw new AuthError('Failed to sign in', undefined, error);
    }
  }

  /**
   * Creates a new user account using Firebase Auth.
   *
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise resolving to the newly created user
   * @throws {AuthError} When email is already in use
   */
  async signUp(email: string, password: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return mapFirebaseUser(credential.user);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as FirebaseAuthError;
        throw new AuthError(
          getErrorMessage(firebaseError.code),
          firebaseError.code,
          error
        );
      }
      throw new AuthError('Failed to create account', undefined, error);
    }
  }

  /**
   * Signs out the currently authenticated user.
   *
   * @returns Promise resolving when sign-out is complete
   * @throws {AuthError} When sign-out fails
   */
  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw new AuthError('Failed to sign out', undefined, error);
    }
  }

  /**
   * Gets the currently authenticated user from Firebase Auth.
   *
   * @returns The current user or null if not authenticated
   */
  getCurrentUser(): User | null {
    const currentUser = auth.currentUser;
    return currentUser ? mapFirebaseUser(currentUser) : null;
  }

  /**
   * Subscribes to Firebase auth state changes.
   *
   * @param callback - Function called when auth state changes
   * @returns Unsubscribe function to stop listening
   */
  onAuthStateChanged(callback: AuthStateCallback): Unsubscribe {
    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      const user = firebaseUser ? mapFirebaseUser(firebaseUser) : null;
      callback(user);
    });
  }
}
