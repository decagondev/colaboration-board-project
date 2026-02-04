# tRPC Setup Guide with React and Firebase (2026)

tRPC provides end-to-end type-safe APIs for CollabBoard, bridging the React frontend with backend services while maintaining full TypeScript type inference without code generation.

## Table of Contents

- [Key Concepts](#key-concepts)
- [Setup and Installation](#setup-and-installation)
- [Defining Routers and Procedures](#defining-routers-and-procedures)
- [React Client Integration](#react-client-integration)
- [Authentication and Context](#authentication-and-context)
- [Real-Time Subscriptions](#real-time-subscriptions)
- [Error Handling](#error-handling)
- [Integration with CollabBoard Stack](#integration-with-collabboard-stack)
- [Resources](#resources)

---

## Key Concepts

### Why tRPC?

tRPC eliminates the gap between frontend and backend:

| Feature | REST/GraphQL | tRPC |
|---------|--------------|------|
| Type Safety | Manual types or codegen | Automatic inference |
| Boilerplate | High | Minimal |
| Learning Curve | Moderate | Low (just TypeScript) |
| Bundle Size | Varies | Very small |
| Validation | Separate layer | Built-in with Zod |

### Architecture Overview

```
React Component
      ↓
tRPC React Hooks (useQuery, useMutation)
      ↓
tRPC Client (HTTP/WebSocket)
      ↓
tRPC Server (Router + Procedures)
      ↓
Firebase RTDB / External Services
```

---

## Setup and Installation

### Step 1: Install Dependencies

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

### Step 2: Create tRPC Server

```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

interface Context {
  userId: string | null;
  isAdmin: boolean;
}

/**
 * Initialize tRPC with context type.
 * This is the foundation for all routers and procedures.
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof z.ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication.
 * Throws UNAUTHORIZED if no user in context.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

/**
 * Admin procedure that requires admin role.
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});
```

### Step 3: Project Structure

```
src/
├── server/
│   ├── trpc.ts              # tRPC initialization
│   ├── context.ts           # Context creation
│   ├── routers/
│   │   ├── index.ts         # Root router
│   │   ├── board.ts         # Board procedures
│   │   ├── user.ts          # User procedures
│   │   └── ai.ts            # AI procedures
│   └── index.ts             # Server entry
├── client/
│   └── trpc.ts              # Client configuration
└── types/
    └── trpc.ts              # Shared types
```

---

## Defining Routers and Procedures

### Board Router

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { ref, get, set, push, update, remove } from 'firebase/database';
import { db } from '../../config/firebase';

const BoardSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

const BoardObjectSchema = z.object({
  type: z.enum(['rect', 'circle', 'sticky', 'text', 'image']),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  content: z.string().optional(),
  fill: z.string().optional(),
});

/**
 * Board router with CRUD operations.
 * All procedures require authentication.
 */
export const boardRouter = router({
  /**
   * Get a board by ID with all its objects.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const boardRef = ref(db, `boards/${input.id}`);
      const snapshot = await get(boardRef);
      
      if (!snapshot.exists()) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });
      }

      const board = snapshot.val();
      
      if (!board.members?.[ctx.userId] && !board.isPublic) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const objectsRef = ref(db, `boardObjects/${input.id}`);
      const objectsSnapshot = await get(objectsRef);
      const objects = objectsSnapshot.val() || {};

      return {
        id: input.id,
        ...board,
        objects: Object.entries(objects).map(([id, obj]) => ({ id, ...obj })),
      };
    }),

  /**
   * List all boards the user has access to.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const boardsRef = ref(db, 'boards');
    const snapshot = await get(boardsRef);
    const boards = snapshot.val() || {};

    return Object.entries(boards)
      .filter(([, board]: [string, any]) => 
        board.members?.[ctx.userId] || board.isPublic
      )
      .map(([id, board]: [string, any]) => ({
        id,
        name: board.name,
        description: board.description,
        isPublic: board.isPublic,
        memberCount: Object.keys(board.members || {}).length,
        createdAt: board.createdAt,
      }));
  }),

  /**
   * Create a new board.
   */
  create: protectedProcedure
    .input(BoardSchema)
    .mutation(async ({ input, ctx }) => {
      const boardsRef = ref(db, 'boards');
      const newBoardRef = push(boardsRef);
      
      const boardData = {
        ...input,
        owner: ctx.userId,
        members: { [ctx.userId]: { role: 'owner', joinedAt: Date.now() } },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newBoardRef, boardData);

      return { id: newBoardRef.key!, ...boardData };
    }),

  /**
   * Update board metadata.
   */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: BoardSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      const boardRef = ref(db, `boards/${input.id}`);
      const snapshot = await get(boardRef);
      
      if (!snapshot.exists()) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const board = snapshot.val();
      if (board.owner !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await update(boardRef, {
        ...input.data,
        updatedAt: Date.now(),
      });

      return { success: true };
    }),

  /**
   * Add an object to the board.
   */
  addObject: protectedProcedure
    .input(z.object({
      boardId: z.string(),
      object: BoardObjectSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const objectsRef = ref(db, `boardObjects/${input.boardId}`);
      const newObjectRef = push(objectsRef);

      const objectData = {
        ...input.object,
        createdBy: ctx.userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await set(newObjectRef, objectData);

      return { id: newObjectRef.key!, ...objectData };
    }),

  /**
   * Delete a board and all its objects.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const boardRef = ref(db, `boards/${input.id}`);
      const snapshot = await get(boardRef);
      
      if (!snapshot.exists()) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const board = snapshot.val();
      if (board.owner !== ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await Promise.all([
        remove(boardRef),
        remove(ref(db, `boardObjects/${input.id}`)),
        remove(ref(db, `cursors/${input.id}`)),
        remove(ref(db, `presence/${input.id}`)),
      ]);

      return { success: true };
    }),
});
```

### Root Router

```typescript
import { router } from '../trpc';
import { boardRouter } from './board';
import { userRouter } from './user';
import { aiRouter } from './ai';

/**
 * Root router combining all sub-routers.
 * Export type for client inference.
 */
export const appRouter = router({
  board: boardRouter,
  user: userRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
```

---

## React Client Integration

### Client Configuration

```typescript
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../server/routers';

/**
 * Create typed tRPC React hooks.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the tRPC client configuration.
 * Uses batch link for efficient request grouping.
 */
export function getTRPCClient(getToken: () => Promise<string | null>) {
  return trpc.createClient({
    links: [
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error),
      }),
      httpBatchLink({
        url: '/.netlify/functions/trpc',
        async headers() {
          const token = await getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
```

### Provider Setup

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, getTRPCClient } from './client/trpc';
import { useAuth } from './contexts/AuthContext';
import { useState } from 'react';

/**
 * App wrapper providing tRPC and React Query context.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const { getIdToken } = useAuth();
  
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() => getTRPCClient(getIdToken));

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Using tRPC Hooks

```tsx
import { trpc } from '../client/trpc';

/**
 * Component demonstrating tRPC query and mutation usage.
 */
export function BoardList() {
  const { data: boards, isLoading, error } = trpc.board.list.useQuery();
  
  const createBoard = trpc.board.create.useMutation({
    onSuccess: () => {
      utils.board.list.invalidate();
    },
  });

  const utils = trpc.useUtils();

  if (isLoading) return <div>Loading boards...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Your Boards</h2>
      <ul>
        {boards?.map((board) => (
          <li key={board.id}>
            <a href={`/board/${board.id}`}>{board.name}</a>
            <span>{board.memberCount} members</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => createBoard.mutate({ name: 'New Board' })}
        disabled={createBoard.isPending}
      >
        {createBoard.isPending ? 'Creating...' : 'Create Board'}
      </button>
    </div>
  );
}
```

---

## Authentication and Context

### Context Creation

```typescript
import { inferAsyncReturnType } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { verifyIdToken } from './auth';

/**
 * Create context for each request.
 * Extracts user from Authorization header.
 */
export async function createContext({ req }: FetchCreateContextFnOptions) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, isAdmin: false };
  }

  const token = authHeader.slice(7);
  
  try {
    const decoded = await verifyIdToken(token);
    return {
      userId: decoded.uid,
      isAdmin: decoded.admin === true,
    };
  } catch {
    return { userId: null, isAdmin: false };
  }
}

export type Context = inferAsyncReturnType<typeof createContext>;
```

### Netlify Function Handler

```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { Handler } from '@netlify/functions';
import { appRouter } from '../../src/server/routers';
import { createContext } from '../../src/server/context';

export const handler: Handler = async (event, context) => {
  const request = new Request(event.rawUrl, {
    method: event.httpMethod,
    headers: event.headers as HeadersInit,
    body: event.body,
  });

  const response = await fetchRequestHandler({
    endpoint: '/.netlify/functions/trpc',
    req: request,
    router: appRouter,
    createContext,
  });

  const body = await response.text();

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  };
};
```

---

## Real-Time Subscriptions

### WebSocket Setup (Optional)

```typescript
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './routers';
import { createContext } from './context';

const wss = new WebSocketServer({ port: 3001 });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

console.log('WebSocket server listening on ws://localhost:3001');
```

### Subscription Procedure

```typescript
import { observable } from '@trpc/server/observable';

export const boardRouter = router({
  onObjectChange: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .subscription(({ input }) => {
      return observable<BoardObject>((emit) => {
        const objectsRef = ref(db, `boardObjects/${input.boardId}`);
        
        const unsubscribe = onChildChanged(objectsRef, (snapshot) => {
          emit.next({ id: snapshot.key!, ...snapshot.val() });
        });

        return () => unsubscribe();
      });
    }),
});
```

---

## Error Handling

### Custom Error Classes

```typescript
import { TRPCError } from '@trpc/server';

/**
 * Throw typed errors with consistent codes.
 */
export function throwNotFound(resource: string): never {
  throw new TRPCError({
    code: 'NOT_FOUND',
    message: `${resource} not found`,
  });
}

export function throwForbidden(action: string): never {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `You don't have permission to ${action}`,
  });
}

export function throwValidation(message: string): never {
  throw new TRPCError({
    code: 'BAD_REQUEST',
    message,
  });
}
```

### Client Error Handling

```tsx
import { TRPCClientError } from '@trpc/client';

function BoardEditor({ boardId }: { boardId: string }) {
  const { data, error } = trpc.board.getById.useQuery({ id: boardId });

  if (error) {
    if (error instanceof TRPCClientError) {
      switch (error.data?.code) {
        case 'NOT_FOUND':
          return <NotFoundPage />;
        case 'FORBIDDEN':
          return <AccessDeniedPage />;
        case 'UNAUTHORIZED':
          return <LoginRedirect />;
        default:
          return <ErrorPage message={error.message} />;
      }
    }
  }

  return <Canvas board={data} />;
}
```

---

## Integration with CollabBoard Stack

### With Firebase

tRPC procedures call Firebase directly:

```typescript
const boardRouter = router({
  getStats: protectedProcedure
    .input(z.object({ boardId: z.string() }))
    .query(async ({ input }) => {
      const [objectsSnap, presenceSnap] = await Promise.all([
        get(ref(db, `boardObjects/${input.boardId}`)),
        get(ref(db, `presence/${input.boardId}`)),
      ]);

      const objects = objectsSnap.val() || {};
      const presence = presenceSnap.val() || {};

      return {
        objectCount: Object.keys(objects).length,
        onlineUsers: Object.values(presence).filter((p: any) => p.online).length,
      };
    }),
});
```

### With React Query

Leverage React Query's caching:

```tsx
function useBoard(boardId: string) {
  const utils = trpc.useUtils();

  const query = trpc.board.getById.useQuery({ id: boardId });

  const addObject = trpc.board.addObject.useMutation({
    onMutate: async (newObject) => {
      await utils.board.getById.cancel({ id: boardId });
      
      const previous = utils.board.getById.getData({ id: boardId });
      
      utils.board.getById.setData({ id: boardId }, (old) => ({
        ...old!,
        objects: [...(old?.objects || []), { id: 'temp', ...newObject.object }],
      }));

      return { previous };
    },
    onError: (err, newObject, context) => {
      utils.board.getById.setData({ id: boardId }, context?.previous);
    },
    onSettled: () => {
      utils.board.getById.invalidate({ id: boardId });
    },
  });

  return { ...query, addObject };
}
```

---

## Resources

### Official Documentation
- [tRPC Documentation](https://trpc.io/docs)
- [React Query Integration](https://trpc.io/docs/client/react)
- [Server Setup](https://trpc.io/docs/server/introduction)

### Tutorials
- [tRPC + React Setup](https://trpc.io/docs/client/react/server-components)
- [Zod Validation](https://zod.dev/)

### Related CollabBoard Guides
- [React Guide](./react.md) - Frontend integration
- [Firebase RTDB Guide](./firebase-rtdb.md) - Database layer
- [Netlify Guide](./netlify.md) - Serverless deployment
