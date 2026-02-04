/**
 * Firebase Configuration Module
 *
 * Initializes and exports Firebase services for the application.
 * Uses environment variables for configuration to keep secrets secure.
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import {
  getDatabase,
  Database,
  connectDatabaseEmulator,
} from 'firebase/database';

/**
 * Firebase configuration object.
 * Values are loaded from environment variables.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

/**
 * Validates that all required Firebase configuration values are present.
 *
 * @throws Error if any required configuration is missing
 */
function validateConfig(): void {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'databaseURL',
  ] as const;

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  );

  if (missingKeys.length > 0) {
    console.warn(
      `Missing Firebase configuration: ${missingKeys.join(', ')}. ` +
        'Please check your .env file.'
    );
  }
}

validateConfig();

/**
 * Initialize Firebase app.
 */
const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Firebase Auth instance.
 */
const auth: Auth = getAuth(app);

/**
 * Firebase Realtime Database instance.
 */
const database: Database = getDatabase(app);

/**
 * Connect to Firebase emulators in development mode.
 * Set VITE_USE_FIREBASE_EMULATORS=true in .env to enable.
 */
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectDatabaseEmulator(database, 'localhost', 9000);
  console.log('Connected to Firebase emulators');
}

export { app, auth, database };
export type { FirebaseApp, Auth, Database };
