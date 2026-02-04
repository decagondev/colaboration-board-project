# React Guide for CollabBoard (2026 Edition)

React is the core frontend framework for CollabBoard, handling UI components, state management, and integration with Konva.js for canvas rendering. In 2026, React emphasizes server-side rendering (SSR), concurrent features, and AI-assisted development for collaborative apps.

## Table of Contents

- [Key Concepts and Best Practices](#key-concepts-and-best-practices)
- [Setup Tutorial](#setup-tutorial)
- [State Management Strategies](#state-management-strategies)
- [Performance Optimization](#performance-optimization)
- [Integration with CollabBoard Stack](#integration-with-collabboard-stack)
- [Common Patterns for Real-Time Apps](#common-patterns-for-real-time-apps)
- [Resources](#resources)

---

## Key Concepts and Best Practices

### Functional Components and Hooks

Modern React development centers on functional components with hooks. For CollabBoard, the most critical hooks include:

- **`useState`**: Local component state for UI interactions (e.g., selected tool, hover states).
- **`useEffect`**: Side effects like Firebase subscriptions for real-time data sync.
- **`useContext`**: Shared state across the component tree (board state, user presence).
- **`useRef`**: References to Konva stage/layers for imperative operations.
- **`useCallback`** and **`useMemo`**: Performance optimization for expensive computations and callback stability.

```tsx
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

interface BoardObject {
  id: string;
  type: 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Custom hook for subscribing to board objects from Firebase RTDB.
 * Handles subscription lifecycle and cleanup automatically.
 *
 * @param boardId - The unique identifier of the board to subscribe to
 * @returns Array of board objects synced in real-time
 */
function useBoardObjects(boardId: string): BoardObject[] {
  const [objects, setObjects] = useState<BoardObject[]>([]);

  useEffect(() => {
    const objectsRef = ref(db, `boards/${boardId}/objects`);
    
    const unsubscribe = onValue(objectsRef, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [boardId]);

  return objects;
}
```

### React Fiber and Reconciliation

React Fiber is the reconciliation engine that enables:

- **Incremental rendering**: Break rendering work into chunks for smoother UI updates.
- **Priority-based updates**: High-priority updates (user input) interrupt lower-priority work.
- **Concurrent features**: `useTransition` and `useDeferredValue` for non-blocking state updates.

For CollabBoard, this means cursor positions and user interactions remain smooth even when syncing large amounts of board data.

```tsx
import { useTransition, useDeferredValue } from 'react';

/**
 * Search component with deferred rendering for smooth typing experience.
 * Uses React 18+ concurrent features to prioritize input responsiveness.
 */
function ObjectSearch({ objects }: { objects: BoardObject[] }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredObjects = objects.filter((obj) =>
    obj.type.includes(deferredQuery.toLowerCase())
  );

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          startTransition(() => {
            setQuery(e.target.value);
          });
        }}
        placeholder="Search objects..."
      />
      {isPending && <span>Searching...</span>}
      <ul>
        {filteredObjects.map((obj) => (
          <li key={obj.id}>{obj.type} at ({obj.x}, {obj.y})</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Setup Tutorial

### Step 1: Create Project with Vite

Vite provides fast builds and hot module replacement (HMR) for React + TypeScript:

```bash
npm create vite@latest collabboard -- --template react-ts
cd collabboard
npm install
```

### Step 2: Project Structure

Organize the project following SOLID principles with clear module boundaries:

```
src/
├── components/          # UI components (Single Responsibility)
│   ├── Board/
│   │   ├── Board.tsx
│   │   ├── BoardObject.tsx
│   │   └── index.ts
│   ├── Toolbar/
│   └── Cursors/
├── hooks/               # Custom hooks (reusable logic)
│   ├── useBoardObjects.ts
│   ├── usePresence.ts
│   └── useFirebaseAuth.ts
├── contexts/            # React Context providers
│   ├── BoardContext.tsx
│   └── AuthContext.tsx
├── services/            # External integrations (Dependency Inversion)
│   ├── firebase.ts
│   ├── openai.ts
│   └── api.ts
├── types/               # TypeScript type definitions
│   └── board.ts
└── utils/               # Pure utility functions
    └── geometry.ts
```

### Step 3: Basic Board Component

```tsx
import { Stage, Layer } from 'react-konva';
import { useBoardObjects } from '../hooks/useBoardObjects';
import { BoardObject } from './BoardObject';

interface BoardProps {
  boardId: string;
}

/**
 * Main board component that renders the infinite canvas with synced objects.
 * Integrates with Konva.js for 2D rendering and Firebase for real-time updates.
 *
 * @param boardId - Unique identifier for the board to render
 */
export function Board({ boardId }: BoardProps) {
  const objects = useBoardObjects(boardId);

  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      <Layer>
        {objects.map((obj) => (
          <BoardObject key={obj.id} object={obj} />
        ))}
      </Layer>
    </Stage>
  );
}
```

---

## State Management Strategies

### Context API for Global State

Use React Context for state that needs to be shared across many components:

```tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';

interface BoardState {
  selectedTool: 'select' | 'rect' | 'circle' | 'text' | 'pan';
  zoom: number;
  offset: { x: number; y: number };
  selectedObjectIds: string[];
}

type BoardAction =
  | { type: 'SET_TOOL'; payload: BoardState['selectedTool'] }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_OFFSET'; payload: { x: number; y: number } }
  | { type: 'SELECT_OBJECTS'; payload: string[] };

const BoardContext = createContext<{
  state: BoardState;
  dispatch: React.Dispatch<BoardAction>;
} | null>(null);

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_TOOL':
      return { ...state, selectedTool: action.payload };
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload };
    case 'SET_OFFSET':
      return { ...state, offset: action.payload };
    case 'SELECT_OBJECTS':
      return { ...state, selectedObjectIds: action.payload };
    default:
      return state;
  }
}

/**
 * Provider component for board-wide state management.
 * Uses useReducer for predictable state updates.
 */
export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, {
    selectedTool: 'select',
    zoom: 1,
    offset: { x: 0, y: 0 },
    selectedObjectIds: [],
  });

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

/**
 * Hook to access board state and dispatch actions.
 * Throws if used outside BoardProvider.
 */
export function useBoardState() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardState must be used within BoardProvider');
  }
  return context;
}
```

### TanStack Query with tRPC

For server state and API data, integrate TanStack Query with tRPC for type-safe data fetching:

```tsx
import { trpc } from '../utils/trpc';

/**
 * Component that fetches and displays board metadata using tRPC.
 * TanStack Query handles caching, refetching, and loading states.
 */
function BoardHeader({ boardId }: { boardId: string }) {
  const { data: board, isLoading } = trpc.board.getById.useQuery({ id: boardId });

  if (isLoading) return <div>Loading board...</div>;
  if (!board) return <div>Board not found</div>;

  return (
    <header>
      <h1>{board.name}</h1>
      <span>{board.collaborators.length} collaborators</span>
    </header>
  );
}
```

---

## Performance Optimization

### Memoization Techniques

Prevent unnecessary re-renders with React's memoization APIs:

```tsx
import { memo, useMemo, useCallback } from 'react';

interface ObjectListProps {
  objects: BoardObject[];
  onSelect: (id: string) => void;
}

/**
 * Memoized object list that only re-renders when objects array changes.
 * Uses React.memo for component-level memoization.
 */
const ObjectList = memo(function ObjectList({ objects, onSelect }: ObjectListProps) {
  const sortedObjects = useMemo(
    () => [...objects].sort((a, b) => a.y - b.y),
    [objects]
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  return (
    <ul>
      {sortedObjects.map((obj) => (
        <li key={obj.id} onClick={() => handleSelect(obj.id)}>
          {obj.type}
        </li>
      ))}
    </ul>
  );
});
```

### Code Splitting and Lazy Loading

Split the bundle for faster initial loads:

```tsx
import { lazy, Suspense } from 'react';

const AICommandBar = lazy(() => import('./AICommandBar'));
const SettingsPanel = lazy(() => import('./SettingsPanel'));

function App() {
  return (
    <div>
      <Board boardId="main" />
      <Suspense fallback={<div>Loading...</div>}>
        <AICommandBar />
        <SettingsPanel />
      </Suspense>
    </div>
  );
}
```

---

## Integration with CollabBoard Stack

### With Konva.js

Wrap Konva components in React for declarative canvas rendering:

```tsx
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';

function BoardObject({ object }: { object: BoardObject }) {
  const commonProps = {
    x: object.x,
    y: object.y,
    draggable: true,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      syncPositionToFirebase(object.id, e.target.x(), e.target.y());
    },
  };

  switch (object.type) {
    case 'rect':
      return <Rect {...commonProps} width={object.width} height={object.height} fill="blue" />;
    case 'circle':
      return <Circle {...commonProps} radius={50} fill="green" />;
    case 'text':
      return <Text {...commonProps} text={object.content || 'Text'} />;
    default:
      return null;
  }
}
```

### With Firebase

Use custom hooks for Firebase subscriptions with proper cleanup:

```tsx
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Hook that provides the current authenticated user.
 * Returns null during loading and after sign-out.
 */
export function useAuth(): User | null {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  return user;
}
```

### With tRPC

Configure tRPC client for type-safe API calls:

```tsx
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../server/routers';

export const trpc = createTRPCReact<AppRouter>();
```

---

## Common Patterns for Real-Time Apps

### Optimistic Updates

Update UI immediately while syncing to backend:

```tsx
function useUpdateObject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: { id: string; x: number; y: number }) => {
      await updateObjectInFirebase(update);
    },
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: ['objects'] });
      const previous = queryClient.getQueryData(['objects']);
      
      queryClient.setQueryData(['objects'], (old: BoardObject[]) =>
        old.map((obj) =>
          obj.id === update.id ? { ...obj, x: update.x, y: update.y } : obj
        )
      );
      
      return { previous };
    },
    onError: (err, update, context) => {
      queryClient.setQueryData(['objects'], context?.previous);
    },
  });
}
```

### Presence Indicators

Show which users are currently viewing or editing:

```tsx
function PresenceIndicator({ boardId }: { boardId: string }) {
  const [users, setUsers] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    const presenceRef = ref(db, `presence/${boardId}`);
    return onValue(presenceRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUsers(Object.values(data));
    });
  }, [boardId]);

  return (
    <div className="presence-bar">
      {users.map((user) => (
        <div
          key={user.id}
          className="avatar"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name[0]}
        </div>
      ))}
    </div>
  );
}
```

---

## Resources

### Official Documentation
- [React Documentation](https://react.dev/)
- [React Hooks Reference](https://react.dev/reference/react)
- [React Server Components](https://react.dev/reference/rsc/server-components)

### Tutorials and Guides
- [2026 React Best Practices](https://medium.com/codetodeploy/15-react-concepts-every-frontend-engineer-must-know-in-2026-25549bb1656a)
- [React + Firebase Real-Time Apps](https://firebase.google.com/docs/database/web/start)
- [TanStack Query Documentation](https://tanstack.com/query/latest)

### Related CollabBoard Guides
- [Konva.js Guide](./konva.md) - Canvas rendering integration
- [Firebase RTDB Guide](./firebase-rtdb.md) - Real-time data sync
- [tRPC Guide](./trpc.md) - Type-safe API layer
