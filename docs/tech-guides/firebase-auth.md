# Firebase Authentication Guide for React Integration (2026)

Firebase Authentication provides secure, easy-to-implement user authentication for CollabBoard, integrating seamlessly with Firebase Realtime Database for access control and presence tracking.

## Table of Contents

- [Key Concepts](#key-concepts)
- [Setup and Configuration](#setup-and-configuration)
- [Authentication Providers](#authentication-providers)
- [React Integration Patterns](#react-integration-patterns)
- [Presence and Session Management](#presence-and-session-management)
- [Security Rules Integration](#security-rules-integration)
- [Advanced Patterns](#advanced-patterns)
- [Resources](#resources)

---

## Key Concepts

### Firebase Auth Overview

Firebase Authentication provides:

- **Multiple sign-in methods**: Email/password, Google, GitHub, Microsoft, and more
- **Token-based authentication**: JWT tokens for secure API access
- **Session persistence**: Configurable persistence (local, session, none)
- **Built-in security**: Password hashing, token refresh, rate limiting

### Auth State Flow

```
User Action → Firebase Auth → Token Generated → Auth State Changed → UI Updated
                                    ↓
                            RTDB Security Rules → Access Granted/Denied
```

---

## Setup and Configuration

### Step 1: Enable Auth in Firebase Console

1. Navigate to Firebase Console → Authentication
2. Click "Get Started"
3. Enable desired sign-in methods under "Sign-in method" tab

### Step 2: Install and Initialize

```typescript
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### Step 3: Configure OAuth Providers (Google Example)

In Firebase Console:
1. Authentication → Sign-in method → Google → Enable
2. Add authorized domains (localhost for dev, your domain for prod)
3. Configure OAuth consent screen in Google Cloud Console

---

## Authentication Providers

### Email/Password Authentication

```typescript
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Register a new user with email and password.
 * Sends verification email and sets display name.
 *
 * @param email - User's email address
 * @param password - User's chosen password (min 6 chars)
 * @param displayName - User's display name for the app
 * @throws AuthError if registration fails
 */
async function registerUser(
  email: string, 
  password: string, 
  displayName: string
): Promise<void> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  await updateProfile(userCredential.user, { displayName });
  
  await sendEmailVerification(userCredential.user);
}

/**
 * Sign in existing user with email and password.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns User credential on success
 * @throws AuthError with code 'auth/user-not-found' or 'auth/wrong-password'
 */
async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Send password reset email to user.
 *
 * @param email - Email address to send reset link
 */
async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
```

### Google Sign-In

```typescript
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

/**
 * Sign in with Google using popup.
 * Best for desktop browsers.
 *
 * @returns User credential with Google profile data
 */
async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  
  return {
    user: result.user,
    accessToken: credential?.accessToken,
  };
}

/**
 * Sign in with Google using redirect.
 * Better for mobile browsers that block popups.
 */
async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Handle redirect result on page load.
 * Call this in useEffect on app initialization.
 */
async function handleGoogleRedirect() {
  const result = await getRedirectResult(auth);
  if (result) {
    return result.user;
  }
  return null;
}
```

### GitHub Sign-In

```typescript
import { GithubAuthProvider, signInWithPopup } from 'firebase/auth';

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

/**
 * Sign in with GitHub OAuth.
 * Requires GitHub OAuth app configuration in Firebase Console.
 *
 * @returns User credential with GitHub profile
 */
async function signInWithGitHub() {
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
}
```

### Anonymous Authentication

Useful for allowing users to try the app before creating an account:

```typescript
import { signInAnonymously, linkWithCredential, EmailAuthProvider } from 'firebase/auth';

/**
 * Sign in anonymously to allow immediate app access.
 * User can later link to a permanent account.
 */
async function signInAnonymous() {
  return signInAnonymously(auth);
}

/**
 * Convert anonymous account to permanent email/password account.
 * Preserves all user data and board access.
 *
 * @param email - Email for the new permanent account
 * @param password - Password for the new account
 */
async function convertAnonymousAccount(email: string, password: string) {
  const user = auth.currentUser;
  if (!user || !user.isAnonymous) {
    throw new Error('No anonymous user to convert');
  }

  const credential = EmailAuthProvider.credential(email, password);
  await linkWithCredential(user, credential);
}
```

---

## React Integration Patterns

### Auth Context Provider

Create a context to provide auth state throughout the app:

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider component that wraps app and provides auth state.
 * Handles auth state changes and loading states.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * Must be used within AuthProvider.
 *
 * @returns Auth context with user, loading state, and signOut function
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Route Component

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

/**
 * Route wrapper that redirects unauthenticated users to login.
 * Optionally requires email verification.
 *
 * @param children - Components to render when authenticated
 * @param requireVerified - If true, also requires email verification
 */
export function ProtectedRoute({ children, requireVerified = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <>{children}</>;
}
```

### Login Form Component

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Login form with email/password and social sign-in options.
 * Redirects to original destination after successful login.
 */
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const authError = err as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts. Please try again later.');
          break;
        default:
          setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Sign In</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      
      <div className="divider">or</div>
      
      <button type="button" onClick={signInWithGoogle} className="google-btn">
        Continue with Google
      </button>
    </form>
  );
}
```

### User Profile Hook

```typescript
import { useState, useEffect } from 'react';
import { User, updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

interface UseProfileReturn {
  updateDisplayName: (name: string) => Promise<void>;
  updateUserEmail: (newEmail: string, password: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing user profile updates.
 * Handles re-authentication for sensitive operations.
 *
 * @param user - Current Firebase user
 * @returns Functions to update profile, email, and password
 */
export function useProfile(user: User | null): UseProfileReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDisplayName = async (name: string) => {
    if (!user) throw new Error('No user');
    setLoading(true);
    setError(null);
    try {
      await updateProfile(user, { displayName: name });
    } catch (err) {
      setError('Failed to update name');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserEmail = async (newEmail: string, password: string) => {
    if (!user || !user.email) throw new Error('No user');
    setLoading(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
    } catch (err) {
      setError('Failed to update email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) throw new Error('No user');
    setLoading(true);
    setError(null);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (err) {
      setError('Failed to update password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateDisplayName, updateUserEmail, updateUserPassword, loading, error };
}
```

---

## Presence and Session Management

### Integrating Auth with RTDB Presence

```typescript
import { ref, set, onDisconnect, onValue, serverTimestamp } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';

/**
 * Set up presence tracking that ties to auth state.
 * Automatically updates presence when user signs in/out.
 */
export function initializePresenceSystem() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userPresenceRef = ref(db, `users/${user.uid}/presence`);
      const connectedRef = ref(db, '.info/connected');

      onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === true) {
          set(userPresenceRef, {
            online: true,
            lastSeen: serverTimestamp(),
          });

          onDisconnect(userPresenceRef).set({
            online: false,
            lastSeen: serverTimestamp(),
          });
        }
      });
    }
  });
}
```

### Session Token Management

```typescript
import { getIdToken, getIdTokenResult } from 'firebase/auth';

/**
 * Get current user's ID token for API requests.
 * Automatically refreshes if expired.
 *
 * @param forceRefresh - Force token refresh even if not expired
 * @returns JWT token string
 */
async function getAuthToken(forceRefresh = false): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  
  return getIdToken(user, forceRefresh);
}

/**
 * Check if user has admin custom claims.
 *
 * @returns True if user is admin
 */
async function isAdmin(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  
  const tokenResult = await getIdTokenResult(user);
  return tokenResult.claims.admin === true;
}

/**
 * Create authenticated fetch wrapper for API calls.
 *
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Fetch response
 */
async function authFetch(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}
```

---

## Security Rules Integration

### RTDB Rules with Auth

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "boards": {
      "$boardId": {
        ".read": "auth != null && (data.child('owner').val() == auth.uid || data.child('members/' + auth.uid).exists())",
        ".write": "auth != null && (data.child('owner').val() == auth.uid || data.child('members/' + auth.uid + '/role').val() == 'editor')",
        "members": {
          "$memberId": {
            ".write": "auth != null && data.parent().parent().child('owner').val() == auth.uid"
          }
        }
      }
    },
    "boardObjects": {
      "$boardId": {
        ".read": "auth != null && root.child('boards/' + $boardId + '/members/' + auth.uid).exists()",
        ".write": "auth != null && root.child('boards/' + $boardId + '/members/' + auth.uid).exists()"
      }
    }
  }
}
```

### Validating User Data

```json
{
  "rules": {
    "users": {
      "$userId": {
        ".validate": "newData.hasChildren(['displayName', 'email', 'createdAt'])",
        "displayName": {
          ".validate": "newData.isString() && newData.val().length >= 2 && newData.val().length <= 50"
        },
        "email": {
          ".validate": "newData.isString() && newData.val() == auth.token.email"
        }
      }
    }
  }
}
```

---

## Advanced Patterns

### Multi-Factor Authentication

```typescript
import { 
  multiFactor, 
  PhoneAuthProvider, 
  PhoneMultiFactorGenerator,
  getMultiFactorResolver
} from 'firebase/auth';

/**
 * Enroll user in phone-based MFA.
 *
 * @param phoneNumber - Phone number in E.164 format (+1234567890)
 * @param verificationCode - Code from SMS
 */
async function enrollMFA(phoneNumber: string, verificationCode: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('No user');

  const multiFactorSession = await multiFactor(user).getSession();
  
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(
    { phoneNumber, session: multiFactorSession },
    window.recaptchaVerifier
  );

  const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
  const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
  
  await multiFactor(user).enroll(multiFactorAssertion, 'Phone Number');
}
```

### Custom Claims for Roles

Set custom claims via Cloud Functions:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setAdminRole = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set roles');
  }

  const { userId, isAdmin } = data;
  await admin.auth().setCustomUserClaims(userId, { admin: isAdmin });
  
  return { success: true };
});
```

---

## Resources

### Official Documentation
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Auth Web SDK Reference](https://firebase.google.com/docs/reference/js/auth)
- [Security Rules with Auth](https://firebase.google.com/docs/database/security/user-security)

### Tutorials and Guides
- [React + Firebase Auth Tutorial](https://www.youtube.com/watch?v=2eawqqvpGoA)
- [Firebase Auth Best Practices](https://firebase.google.com/docs/auth/web/auth-state-persistence)
- [Custom Claims Guide](https://firebase.google.com/docs/auth/admin/custom-claims)

### Related CollabBoard Guides
- [Firebase RTDB Guide](./firebase-rtdb.md) - Database integration
- [React Guide](./react.md) - Frontend patterns
- [Netlify Guide](./netlify.md) - Deployment with serverless functions
