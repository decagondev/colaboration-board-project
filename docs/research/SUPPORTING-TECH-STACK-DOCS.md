# Supporting Documents for CollabBoard Tech Stack

To assist with in-depth understanding of the locked tech stack for the CollabBoard project, I've compiled a series of supporting documents. These are structured as individual Markdown files that could be placed in the `/docs/tech-guides/` directory of your GitHub repo. Each guide draws from the latest 2026 best practices, tutorials, and resources obtained via web searches. They include explanations, code examples, best practices, and citations to official docs or tutorials.

These documents align with the project's focus on real-time collaboration, AI integration, modularity, and SOLID principles. For each technology, I've emphasized relevant aspects like setup, key features, performance tips, and integration with other stack components (e.g., React with Konva.js for canvas, Firebase for sync).

## docs/tech-guides/react.md

# React Guide for CollabBoard (2026 Edition)

React is the core frontend framework for CollabBoard, handling UI components, state management, and integration with Konva.js for canvas rendering. In 2026, React emphasizes server-side rendering (SSR), concurrent features, and AI-assisted development for collaborative apps.

### Key Concepts and Best Practices
- **Functional Components and Hooks:** Use hooks like `useState`, `useEffect`, and `useContext` for state and side effects. For real-time collab, leverage `useEffect` for Firebase subscriptions.
- **React Fiber & Reconciliation:** Optimizes updates for low-latency apps; use for smooth cursor sync.
- **State Management:** Use Context API for shared board state; integrate TanStack Query for data fetching with tRPC.
- **Performance:** Memoize with `React.memo` and `useMemo`; modular components for SOLID (single responsibility).
- **Server Components:** In Next.js (alternative), use RSC for initial renders to reduce client load.

### Setup Tutorial
1. Install: `npm create vite@latest my-app -- --template react-ts`
2. Basic Component:
   ```tsx
   import { useState } from 'react';

   function Board() {
     const [objects, setObjects] = useState([]);
     // Integrate with Firebase sync
     return <div>Infinite Canvas Here</div>;
   }
   ```
3. For collab: Use `useEffect` to subscribe to Firebase RTDB changes.

### Integration with Stack
- With Konva.js: Wrap Konva stages in React components for modular rendering.
- With tRPC: Use `@trpc/react-query` for type-safe API calls.

Resources: [React Docs](https://react.dev/), [2026 Best Practices](https://medium.com/codetodeploy/15-react-concepts-every-frontend-engineer-must-know-in-2026-25549bb1656a)

## docs/tech-guides/konva.md

# Konva.js Guide for Infinite Canvas and Real-Time Collab (2026)

Konva.js is the 2D canvas library for rendering the infinite board, shapes, and cursors in CollabBoard. It supports high-performance drawing with event handling for pan/zoom and drags.

### Key Concepts and Best Practices
- **Stages and Layers:** Use stages for the canvas; layers for grouping (e.g., object layer, cursor layer) to optimize redraws.
- **Infinite Canvas:** Implement virtual rendering with viewport culling; offset stage on pan.
- **Real-Time Collab:** Update shapes via Firebase; use Konva events for drags and sync positions.
- **Performance:** Enable `hitGraphEnabled(false)` for non-interactive layers; use caching for complex shapes.

### Setup Tutorial
1. Install: `npm i konva react-konva`
2. Basic Infinite Canvas:
   ```tsx
   import { Stage, Layer } from 'react-konva';

   function InfiniteCanvas() {
     return (
       <Stage width={window.innerWidth} height={window.innerHeight}>
         <Layer>{/* Objects here */}</Layer>
       </Stage>
     );
   }
   ```
3. Pan/Zoom: Add wheel and drag listeners.

### Integration with Stack
- With React: Use `react-konva` for declarative components.
- With Firebase: Sync object positions on `onDragEnd`.

Resources: [Konva Docs](https://konvajs.org/docs/index.html), [Infinite Canvas Tutorial](https://dev.to/sheikh_yawar/how-to-implement-an-infinite-canvas-using-react-konva-5fn4)

## docs/tech-guides/firebase-rtdb.md

# Firebase Realtime Database Guide for Low-Latency Sync (2026)

Firebase RTDB handles real-time data sync for cursors, objects, and presence in CollabBoard, with <50ms latency for 5+ users.

### Key Concepts and Best Practices
- **Data Structure:** Flat JSON tree; shard for scale (e.g., /boards/{id}/objects).
- **Low-Latency Sync:** Use `onValue` listeners; optimize with shallow queries.
- **Multi-User:** Last-write-wins; use transactions for conflicts.
- **Offline Support:** Automatic persistence and resync.
- **Scaling:** Shard across instances for >100k connections.

### Setup Tutorial
1. Install: `npm i firebase`
2. Sync Example:
   ```ts
   import { getDatabase, ref, onValue } from 'firebase/database';

   const db = getDatabase();
   onValue(ref(db, 'cursors'), (snapshot) => {
     // Update local state
   });
   ```

### Integration with Stack
- With React: Use hooks for subscriptions.
- With tRPC: Proxy complex queries if needed.

Resources: [Firebase RTDB Docs](https://firebase.google.com/docs/database), [Sync Techniques](https://www.researchgate.net/publication/376458751_Real-time_Database_Synchronization_Techniques_in_Firebase_for_Mobile_App_Development)

## docs/tech-guides/firebase-auth.md

# Firebase Authentication Guide for React Integration (2026)

Firebase Auth provides user authentication and presence for CollabBoard, integrating with RTDB for secure access.

### Key Concepts and Best Practices
- **Providers:** Email/password, Google; enable in console.
- **Presence:** Tie to RTDB with `onDisconnect`.
- **Security Rules:** Require auth for reads/writes.

### Setup Tutorial
1. Install: Included in `firebase`.
2. Auth Component:
   ```tsx
   import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

   const auth = getAuth();
   signInWithEmailAndPassword(auth, email, password);
   ```

### Integration with Stack
- With React: Use `onAuthStateChanged` in context provider.

Resources: [Firebase Auth Docs](https://firebase.google.com/docs/auth), [React Tutorial](https://www.youtube.com/watch?v=2eawqqvpGoA)

## docs/tech-guides/openai-gpt4.md

# OpenAI GPT-4 Function Calling Guide for Tool Integration (2026)

GPT-4 powers the AI agent in CollabBoard, using function calling for commands like creating SWOT templates.

### Key Concepts and Best Practices
- **Function Tools:** Define JSON schemas; model calls tools based on prompt.
- **Flow:** Request with tools → Model responds with calls → Execute and re-query.
- **Multi-Calls:** Handle parallel or sequential for complex commands.

### Setup Tutorial
1. Install: `npm i openai`
2. Example Call:
   ```ts
   import OpenAI from 'openai';

   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
   const response = await openai.chat.completions.create({
     model: 'gpt-4o',
     messages: [{ role: 'user', content: 'Create SWOT' }],
     tools: [/* schemas */],
   });
   ```

### Integration with Stack
- With React: Call from command bar; sync results to RTDB.

Resources: [OpenAI Docs](https://platform.openai.com/docs/guides/function-calling), [Tutorial](https://blog.mlq.ai/gpt-function-calling-getting-started)

## docs/tech-guides/trpc.md

# tRPC Setup Guide with React and Firebase (2026)

tRPC provides type-safe APIs for CollabBoard, bridging React frontend and Firebase backend.

### Key Concepts and Best Practices
- **Routers/Procedures:** Define endpoints with Zod schemas for validation.
- **RSC Integration:** Use in Next.js for server components; prefetch for perf.
- **Real-Time:** Combine with WebSockets for subscriptions.

### Setup Tutorial
1. Install: `npm i @trpc/server @trpc/client @trpc/react-query @tanstack/react-query`
2. Router:
   ```ts
   import { createTRPCRouter } from '@trpc/server';

   export const appRouter = createTRPCRouter({
     // Procedures here
   });
   ```

### Integration with Stack
- With Firebase: Procedures query RTDB.
- With React: Use hooks like `useQuery`.

Resources: [tRPC Docs](https://trpc.io/docs), [React Setup](https://trpc.io/docs/client/react/server-components)

## docs/tech-guides/netlify.md

# Netlify Deployment Guide for React Apps with Serverless Functions (2026)

Netlify hosts CollabBoard's React SPA, with serverless functions for AI proxies.

### Key Concepts and Best Practices
- **Deploys:** Git-based; auto-build on push.
- **Functions:** JS/Go in /functions/; up to 15min async.
- **Performance:** Edge caching; optimize for cold starts.

### Setup Tutorial
1. netlify.toml:
   ```
   [build]
   command = "npm run build"
   publish = "dist"
   ```
2. Function Example: /netlify/functions/ai-proxy.js for OpenAI calls.

### Integration with Stack
- With React: Static build; functions for dynamic.

Resources: [Netlify Docs](https://docs.netlify.com/), [React Guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/react)

## docs/tech-guides/eslint-prettier.md

# ESLint and Prettier Configuration for TypeScript React Projects (2026)

ESLint/Prettier ensure code quality and consistency in CollabBoard.

### Key Concepts and Best Practices
- **ESLint:** Use Airbnb rules; plugins for React/TS.
- **Prettier:** Format on save; integrate with ESLint.
- **Husky/Lint-Staged:** Pre-commit hooks.

### Setup Tutorial
1. Install: `npm i -D eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-airbnb eslint-plugin-react-hooks eslint-plugin-prettier eslint-config-prettier`
2. .eslintrc.js:
   ```js
   module.exports = {
     extends: ['airbnb', 'prettier'],
     parser: '@typescript-eslint/parser',
     plugins: ['@typescript-eslint', 'react-hooks'],
   };
   ```
3. .prettierrc: `{ "singleQuote": true }`

### Integration with Stack
- With VSCode: Extensions for auto-lint/format.

Resources: [ESLint Docs](https://eslint.org/), [Setup Guide](https://medium.com/@robinviktorsson/setting-up-eslint-and-prettier-for-a-typescript-project-aa2434417b8f)

## docs/tech-guides/jest-cypress.md

# Jest and Cypress Testing Guide for Real-Time React Apps (2026)

Jest for unit/integration, Cypress for e2e in CollabBoard.

### Key Concepts and Best Practices
- **Jest:** Unit test components; snapshots for UI.
- **Cypress:** E2e for real browser; time travel debug.
- **Real-Time:** Mock Firebase; test sync with multi-instances.

### Setup Tutorial
1. Jest: `npm i -D jest ts-jest @testing-library/react`
2. Cypress: `npm i -D cypress`
3. Test Example (Jest):
   ```ts
   import { render } from '@testing-library/react';
   test('renders board', () => {
     const { getByText } = render(<Board />);
     expect(getByText(/Canvas/)).toBeInTheDocument();
   });
   ```

### Integration with Stack
- Test Konva interactions in Cypress.

Resources: [Jest Docs](https://jestjs.io/), [Cypress Docs](https://docs.cypress.io/)
