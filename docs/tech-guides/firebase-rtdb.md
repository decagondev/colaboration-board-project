# Firebase Realtime Database Guide for Low-Latency Sync (2026)

Firebase Realtime Database (RTDB) is the backbone of CollabBoard's real-time collaboration features, providing sub-50ms data synchronization for cursor positions, object state, and user presence across multiple concurrent users.

## Table of Contents

- [Key Concepts and Architecture](#key-concepts-and-architecture)
- [Setup and Configuration](#setup-and-configuration)
- [Data Structure Design](#data-structure-design)
- [Real-Time Sync Patterns](#real-time-sync-patterns)
- [Multi-User Collaboration](#multi-user-collaboration)
- [Offline Support](#offline-support)
- [Security Rules](#security-rules)
- [Scaling Strategies](#scaling-strategies)
- [Integration with CollabBoard Stack](#integration-with-collabboard-stack)
- [Resources](#resources)

---

## Key Concepts and Architecture

### How Firebase RTDB Works

Firebase RTDB is a cloud-hosted NoSQL database that stores data as JSON and synchronizes it in real-time across all connected clients:

1. **WebSocket Connection**: Clients maintain persistent WebSocket connections for instant updates.
2. **Data Synchronization**: Changes propagate to all listeners within milliseconds.
3. **Offline Persistence**: Local cache enables offline reads/writes that sync when reconnected.
4. **Optimistic Updates**: UI updates immediately while sync happens in background.

### When to Use RTDB vs Firestore

| Use Case | RTDB | Firestore |
|----------|------|-----------|
| Cursor positions | ✅ Best (low latency) | ❌ Higher latency |
| Presence system | ✅ Best (onDisconnect) | ⚠️ Requires Cloud Functions |
| Object state sync | ✅ Good | ✅ Good |
| Complex queries | ❌ Limited | ✅ Better |
| Large documents | ❌ 10MB limit | ✅ 1MB per doc, better scaling |

For CollabBoard, RTDB is ideal for:
- Real-time cursor synchronization
- User presence (online/offline status)
- Object position updates during drag
- Chat and notifications

---

## Setup and Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Realtime Database in the project settings
4. Choose database location closest to your users

### Step 2: Install Firebase SDK

```bash
npm install firebase
```

### Step 3: Initialize Firebase

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase app and services.
 * Connects to emulators in development for local testing.
 */
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

if (import.meta.env.DEV) {
  connectDatabaseEmulator(db, 'localhost', 9000);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### Step 4: Environment Variables

Create `.env.local` (never commit this file):

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Data Structure Design

### Flat Data Structure

RTDB works best with flat, denormalized data structures. Avoid deep nesting:

```json
{
  "boards": {
    "board-123": {
      "name": "Project Planning",
      "createdBy": "user-456",
      "createdAt": 1706745600000
    }
  },
  "boardObjects": {
    "board-123": {
      "obj-001": {
        "type": "rect",
        "x": 100,
        "y": 150,
        "width": 200,
        "height": 100,
        "fill": "#3b82f6",
        "createdBy": "user-456",
        "updatedAt": 1706745700000
      },
      "obj-002": {
        "type": "sticky",
        "x": 400,
        "y": 200,
        "content": "Important note",
        "color": "#fef08a"
      }
    }
  },
  "cursors": {
    "board-123": {
      "user-456": {
        "x": 250,
        "y": 300,
        "userName": "Alice",
        "color": "#ef4444",
        "timestamp": 1706745800000
      }
    }
  },
  "presence": {
    "board-123": {
      "user-456": {
        "online": true,
        "lastSeen": 1706745800000
      }
    }
  }
}
```

### Why Flat Structure?

```typescript
/**
 * BAD: Deep nesting requires downloading entire tree for any read.
 */
const badStructure = {
  boards: {
    'board-123': {
      objects: { /* all objects */ },
      cursors: { /* all cursors */ },
      chat: { /* all messages */ },
    }
  }
};

/**
 * GOOD: Flat structure allows targeted subscriptions.
 * Only download what you need.
 */
const goodStructure = {
  boards: { /* metadata only */ },
  boardObjects: { /* by board */ },
  cursors: { /* by board */ },
  chat: { /* by board */ },
};
```

### TypeScript Interfaces

```typescript
interface Board {
  name: string;
  createdBy: string;
  createdAt: number;
  settings?: BoardSettings;
}

interface BoardObject {
  type: 'rect' | 'circle' | 'sticky' | 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  fill?: string;
  content?: string;
  createdBy: string;
  updatedAt: number;
}

interface CursorPosition {
  x: number;
  y: number;
  userName: string;
  color: string;
  timestamp: number;
}

interface PresenceStatus {
  online: boolean;
  lastSeen: number;
}
```

---

## Real-Time Sync Patterns

### Subscribing to Data

Use `onValue` for real-time listeners:

```typescript
import { ref, onValue, off } from 'firebase/database';
import { useEffect, useState } from 'react';
import { db } from '../config/firebase';

/**
 * Hook for subscribing to board objects with real-time updates.
 * Automatically unsubscribes on unmount.
 *
 * @param boardId - The board to subscribe to
 * @returns Object containing loading state, error, and objects array
 */
export function useBoardObjects(boardId: string) {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const objectsRef = ref(db, `boardObjects/${boardId}`);

    const unsubscribe = onValue(
      objectsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const objectList = Object.entries(data).map(([id, obj]) => ({
            id,
            ...(obj as Omit<BoardObject, 'id'>),
          }));
          setObjects(objectList);
        } else {
          setObjects([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => off(objectsRef);
  }, [boardId]);

  return { objects, loading, error };
}
```

### Writing Data

Use `set`, `update`, and `push` for different write operations:

```typescript
import { ref, set, update, push, serverTimestamp } from 'firebase/database';

/**
 * Create a new object on the board.
 * Uses push() to generate a unique ID.
 *
 * @param boardId - Target board
 * @param objectData - Object data without ID
 * @returns Promise resolving to the new object's key
 */
async function createObject(
  boardId: string,
  objectData: Omit<BoardObject, 'id'>
): Promise<string> {
  const objectsRef = ref(db, `boardObjects/${boardId}`);
  const newObjectRef = push(objectsRef);
  
  await set(newObjectRef, {
    ...objectData,
    updatedAt: serverTimestamp(),
  });
  
  return newObjectRef.key!;
}

/**
 * Update specific fields of an object.
 * Only modified fields are sent over the wire.
 *
 * @param boardId - Target board
 * @param objectId - Object to update
 * @param updates - Partial object with fields to update
 */
async function updateObject(
  boardId: string,
  objectId: string,
  updates: Partial<BoardObject>
): Promise<void> {
  const objectRef = ref(db, `boardObjects/${boardId}/${objectId}`);
  
  await update(objectRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update multiple objects atomically.
 * All updates succeed or fail together.
 *
 * @param boardId - Target board
 * @param objectUpdates - Map of object IDs to their updates
 */
async function batchUpdateObjects(
  boardId: string,
  objectUpdates: Record<string, Partial<BoardObject>>
): Promise<void> {
  const updates: Record<string, any> = {};
  
  Object.entries(objectUpdates).forEach(([objectId, objectData]) => {
    Object.entries(objectData).forEach(([key, value]) => {
      updates[`boardObjects/${boardId}/${objectId}/${key}`] = value;
    });
    updates[`boardObjects/${boardId}/${objectId}/updatedAt`] = serverTimestamp();
  });
  
  await update(ref(db), updates);
}
```

### Optimizing Reads with Queries

```typescript
import { ref, query, orderByChild, limitToLast, startAt, endAt } from 'firebase/database';

/**
 * Query objects modified within a time range.
 * Useful for syncing only recent changes.
 */
function getRecentObjects(boardId: string, sinceTimestamp: number) {
  return query(
    ref(db, `boardObjects/${boardId}`),
    orderByChild('updatedAt'),
    startAt(sinceTimestamp)
  );
}

/**
 * Query the most recently updated objects.
 * Useful for showing recent activity.
 */
function getLatestObjects(boardId: string, limit: number = 10) {
  return query(
    ref(db, `boardObjects/${boardId}`),
    orderByChild('updatedAt'),
    limitToLast(limit)
  );
}
```

---

## Multi-User Collaboration

### Presence System

Track which users are online using `onDisconnect`:

```typescript
import { ref, set, onDisconnect, onValue, serverTimestamp } from 'firebase/database';
import { useEffect, useState } from 'react';

/**
 * Hook that manages user presence for a board.
 * Automatically marks user as offline on disconnect.
 *
 * @param boardId - The board to track presence on
 * @param userId - Current user's ID
 * @param userName - Display name
 */
export function usePresence(boardId: string, userId: string, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const presenceRef = ref(db, `presence/${boardId}/${userId}`);
    const connectedRef = ref(db, '.info/connected');

    const unsubscribeConnected = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        set(presenceRef, {
          online: true,
          userName,
          lastSeen: serverTimestamp(),
        });

        onDisconnect(presenceRef).set({
          online: false,
          userName,
          lastSeen: serverTimestamp(),
        });
      }
    });

    const boardPresenceRef = ref(db, `presence/${boardId}`);
    const unsubscribePresence = onValue(boardPresenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      const online = Object.entries(data)
        .filter(([, status]: [string, any]) => status.online)
        .map(([id]) => id);
      setOnlineUsers(online);
    });

    return () => {
      unsubscribeConnected();
      unsubscribePresence();
    };
  }, [boardId, userId, userName]);

  return onlineUsers;
}
```

### Cursor Synchronization

Efficient cursor broadcasting with throttling:

```typescript
import { ref, set, onValue, serverTimestamp } from 'firebase/database';
import { useEffect, useCallback, useRef } from 'react';

const CURSOR_THROTTLE_MS = 50;
const CURSOR_STALE_MS = 5000;

/**
 * Hook for two-way cursor synchronization.
 * Broadcasts local cursor and receives remote cursors.
 *
 * @param boardId - Board to sync cursors on
 * @param userId - Local user ID
 * @param userMeta - User display info
 */
export function useCursorSync(
  boardId: string,
  userId: string,
  userMeta: { name: string; color: string }
) {
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorPosition>>(new Map());
  const lastBroadcastRef = useRef(0);

  const broadcastCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastBroadcastRef.current < CURSOR_THROTTLE_MS) {
        return;
      }
      lastBroadcastRef.current = now;

      const cursorRef = ref(db, `cursors/${boardId}/${userId}`);
      set(cursorRef, {
        x,
        y,
        userName: userMeta.name,
        color: userMeta.color,
        timestamp: serverTimestamp(),
      });
    },
    [boardId, userId, userMeta]
  );

  useEffect(() => {
    const cursorsRef = ref(db, `cursors/${boardId}`);
    
    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const now = Date.now();
      const cursors = new Map<string, CursorPosition>();
      
      Object.entries(data).forEach(([id, cursor]: [string, any]) => {
        if (id !== userId && now - cursor.timestamp < CURSOR_STALE_MS) {
          cursors.set(id, cursor);
        }
      });
      
      setRemoteCursors(cursors);
    });

    return () => unsubscribe();
  }, [boardId, userId]);

  return { remoteCursors, broadcastCursor };
}
```

### Conflict Resolution

RTDB uses last-write-wins by default. For critical operations, use transactions:

```typescript
import { ref, runTransaction } from 'firebase/database';

/**
 * Atomically increment a counter using transactions.
 * Prevents race conditions when multiple users update simultaneously.
 *
 * @param boardId - Target board
 * @param counterId - Counter to increment
 * @returns The new counter value
 */
async function incrementCounter(boardId: string, counterId: string): Promise<number> {
  const counterRef = ref(db, `boards/${boardId}/counters/${counterId}`);
  
  const result = await runTransaction(counterRef, (currentValue) => {
    return (currentValue || 0) + 1;
  });
  
  return result.snapshot.val();
}

/**
 * Claim an object for editing (locking mechanism).
 * Only succeeds if object is not already claimed.
 *
 * @param boardId - Target board
 * @param objectId - Object to claim
 * @param userId - User attempting to claim
 * @returns True if claim was successful
 */
async function claimObject(
  boardId: string,
  objectId: string,
  userId: string
): Promise<boolean> {
  const lockRef = ref(db, `locks/${boardId}/${objectId}`);
  
  const result = await runTransaction(lockRef, (currentLock) => {
    if (currentLock && currentLock.userId !== userId) {
      return undefined;
    }
    return {
      userId,
      timestamp: Date.now(),
    };
  });
  
  return result.committed;
}
```

---

## Offline Support

### Enabling Persistence

RTDB automatically caches data locally:

```typescript
import { enablePersistence, getDatabase } from 'firebase/database';

const db = getDatabase(app);
```

Persistence is enabled by default in web SDK v9+.

### Handling Offline State

```typescript
import { ref, onValue } from 'firebase/database';
import { useState, useEffect } from 'react';

/**
 * Hook that tracks Firebase connection status.
 * Returns true when connected, false when offline.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsOnline(snapshot.val() === true);
    });

    return () => unsubscribe();
  }, []);

  return isOnline;
}

/**
 * Component showing connection status indicator.
 */
function ConnectionStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? 'Connected' : 'Offline - changes will sync when reconnected'}
    </div>
  );
}
```

---

## Security Rules

### Basic Rules Structure

```json
{
  "rules": {
    "boards": {
      "$boardId": {
        ".read": "auth != null && data.child('members/' + auth.uid).exists()",
        ".write": "auth != null && data.child('members/' + auth.uid).exists()"
      }
    },
    "boardObjects": {
      "$boardId": {
        ".read": "auth != null && root.child('boards/' + $boardId + '/members/' + auth.uid).exists()",
        ".write": "auth != null && root.child('boards/' + $boardId + '/members/' + auth.uid).exists()",
        "$objectId": {
          ".validate": "newData.hasChildren(['type', 'x', 'y', 'createdBy'])"
        }
      }
    },
    "cursors": {
      "$boardId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    },
    "presence": {
      "$boardId": {
        ".read": "auth != null",
        "$userId": {
          ".write": "auth != null && auth.uid == $userId"
        }
      }
    }
  }
}
```

### Validation Rules

```json
{
  "rules": {
    "boardObjects": {
      "$boardId": {
        "$objectId": {
          ".validate": "newData.child('type').isString() && newData.child('type').val().matches(/^(rect|circle|sticky|text|image)$/) && newData.child('x').isNumber() && newData.child('y').isNumber() && newData.child('x').val() >= -100000 && newData.child('x').val() <= 100000 && newData.child('y').val() >= -100000 && newData.child('y').val() <= 100000"
        }
      }
    }
  }
}
```

---

## Scaling Strategies

### Database Sharding

For high-traffic boards, shard across multiple database instances:

```typescript
/**
 * Get the appropriate database reference based on board ID.
 * Distributes load across multiple RTDB instances.
 *
 * @param boardId - Board identifier
 * @returns Database reference for the appropriate shard
 */
function getShardedDb(boardId: string) {
  const shardIndex = hashCode(boardId) % SHARD_COUNT;
  const shardUrl = `https://collabboard-shard-${shardIndex}.firebaseio.com`;
  
  return getDatabase(app, shardUrl);
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

### Data Cleanup

Regularly clean stale data:

```typescript
import { ref, query, orderByChild, endAt, get, remove } from 'firebase/database';

/**
 * Remove stale cursor data older than threshold.
 * Should be run periodically via Cloud Function or cron.
 *
 * @param boardId - Board to clean
 * @param maxAgeMs - Maximum age in milliseconds
 */
async function cleanStaleCursors(boardId: string, maxAgeMs: number = 60000) {
  const cutoff = Date.now() - maxAgeMs;
  const cursorsRef = ref(db, `cursors/${boardId}`);
  
  const snapshot = await get(cursorsRef);
  const data = snapshot.val() || {};
  
  const staleKeys = Object.entries(data)
    .filter(([, cursor]: [string, any]) => cursor.timestamp < cutoff)
    .map(([key]) => key);
  
  await Promise.all(
    staleKeys.map((key) => remove(ref(db, `cursors/${boardId}/${key}`)))
  );
}
```

---

## Integration with CollabBoard Stack

### With React Hooks

```typescript
export { useBoardObjects } from './hooks/useBoardObjects';
export { usePresence } from './hooks/usePresence';
export { useCursorSync } from './hooks/useCursorSync';
export { useOnlineStatus } from './hooks/useOnlineStatus';
```

### With tRPC

Proxy complex queries through tRPC when needed:

```typescript
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const boardRouter = router({
  getStats: publicProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input }) => {
      const objectsSnapshot = await get(ref(db, `boardObjects/${input.boardId}`));
      const objects = objectsSnapshot.val() || {};
      
      return {
        objectCount: Object.keys(objects).length,
        lastUpdated: Math.max(
          ...Object.values(objects).map((o: any) => o.updatedAt || 0)
        ),
      };
    }),
});
```

---

## Resources

### Official Documentation
- [Firebase Realtime Database Docs](https://firebase.google.com/docs/database)
- [Security Rules Reference](https://firebase.google.com/docs/database/security)
- [Data Structure Best Practices](https://firebase.google.com/docs/database/web/structure-data)

### Tutorials and Guides
- [Real-Time Sync Techniques](https://www.researchgate.net/publication/376458751_Real-time_Database_Synchronization_Techniques_in_Firebase_for_Mobile_App_Development)
- [Firebase Performance Optimization](https://firebase.google.com/docs/database/usage/optimize)
- [Offline Capabilities](https://firebase.google.com/docs/database/web/offline-capabilities)

### Related CollabBoard Guides
- [React Guide](./react.md) - Frontend integration with hooks
- [Firebase Auth Guide](./firebase-auth.md) - Authentication integration
- [Konva.js Guide](./konva.md) - Canvas rendering with sync
