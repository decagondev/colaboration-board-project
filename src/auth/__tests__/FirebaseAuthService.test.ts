/**
 * FirebaseAuthService Unit Tests
 */

import { AuthError } from '../interfaces/IAuthService';

describe('AuthError', () => {
  it('should create an error with message', () => {
    const error = new AuthError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.name).toBe('AuthError');
  });

  it('should create an error with code and cause', () => {
    const cause = new Error('Original error');
    const error = new AuthError('Test error', 'auth/test-code', cause);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('auth/test-code');
    expect(error.cause).toBe(cause);
  });
});

describe('IAuthService interface', () => {
  it('should define all required methods', () => {
    const mockAuthService = {
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      onAuthStateChanged: jest.fn(),
    };

    expect(mockAuthService.signIn).toBeDefined();
    expect(mockAuthService.signUp).toBeDefined();
    expect(mockAuthService.signOut).toBeDefined();
    expect(mockAuthService.getCurrentUser).toBeDefined();
    expect(mockAuthService.onAuthStateChanged).toBeDefined();
  });
});

describe('User type', () => {
  it('should have required properties', () => {
    const user = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
    };

    expect(user.uid).toBe('test-uid');
    expect(user.email).toBe('test@example.com');
    expect(user.displayName).toBe('Test User');
    expect(user.photoURL).toBe('https://example.com/photo.jpg');
  });

  it('should allow null for optional properties', () => {
    const user = {
      uid: 'test-uid',
      email: null,
      displayName: null,
      photoURL: null,
    };

    expect(user.email).toBeNull();
    expect(user.displayName).toBeNull();
    expect(user.photoURL).toBeNull();
  });
});
