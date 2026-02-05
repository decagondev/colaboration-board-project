/**
 * Environment Configuration Module
 *
 * Provides typed access to environment variables.
 */

/**
 * Environment configuration interface.
 */
interface EnvironmentConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    databaseURL: string;
  };
  openai: {
    apiKey: string;
  };
  development: {
    useFirebaseEmulators: boolean;
  };
}

/**
 * Gets the current environment configuration.
 *
 * @returns The environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    firebase: {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
    },
    openai: {
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    },
    development: {
      useFirebaseEmulators:
        import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true',
    },
  };
}

/**
 * Checks if the application is running in development mode.
 *
 * @returns True if in development mode
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Checks if the application is running in production mode.
 *
 * @returns True if in production mode
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Checks if the OpenAI API key is configured.
 *
 * @returns True if the OpenAI API key is available
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof apiKey === 'string' && apiKey.length > 0;
}

/**
 * Gets the OpenAI API key.
 *
 * @returns The OpenAI API key or empty string if not configured
 */
export function getOpenAIApiKey(): string {
  return import.meta.env.VITE_OPENAI_API_KEY || '';
}
