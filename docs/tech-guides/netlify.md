# Netlify Deployment Guide for React Apps with Serverless Functions (2026)

Netlify hosts CollabBoard's React SPA with serverless functions for AI proxies and API endpoints, providing automatic deployments, edge caching, and seamless integration with the modern web development workflow.

## Table of Contents

- [Key Concepts](#key-concepts)
- [Project Setup](#project-setup)
- [Serverless Functions](#serverless-functions)
- [Environment Variables](#environment-variables)
- [Build Configuration](#build-configuration)
- [Performance Optimization](#performance-optimization)
- [CI/CD and Preview Deploys](#cicd-and-preview-deploys)
- [Integration with CollabBoard Stack](#integration-with-collabboard-stack)
- [Resources](#resources)

---

## Key Concepts

### Netlify Architecture

```
User Request
     ↓
Netlify Edge (CDN)
     ↓
┌─────────────────────────────────────┐
│  Static Assets (React SPA)          │ ← dist/ folder
│  - index.html                       │
│  - JS/CSS bundles                   │
│  - Images, fonts                    │
└─────────────────────────────────────┘
     ↓ (API routes)
┌─────────────────────────────────────┐
│  Serverless Functions               │ ← netlify/functions/
│  - tRPC handler                     │
│  - AI proxy                         │
│  - Webhooks                         │
└─────────────────────────────────────┘
```

### Benefits for CollabBoard

- **Global CDN**: Fast static asset delivery worldwide
- **Serverless Functions**: Secure API proxy without managing servers
- **Automatic HTTPS**: SSL certificates for all deployments
- **Preview Deploys**: Test PRs before merging
- **Git Integration**: Auto-deploy on push to main

---

## Project Setup

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
netlify login
```

### Step 2: Initialize Project

```bash
cd collabboard
netlify init
```

### Step 3: Project Structure

```
collabboard/
├── src/                      # React source code
├── public/                   # Static assets
├── netlify/
│   └── functions/           # Serverless functions
│       ├── trpc.ts          # tRPC API handler
│       ├── ai-proxy.ts      # OpenAI proxy
│       └── webhook.ts       # External webhooks
├── netlify.toml             # Netlify configuration
├── package.json
└── vite.config.ts
```

### Step 4: Basic netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
  
[dev]
  command = "npm run dev"
  port = 5173
  targetPort = 5173
  autoLaunch = false
```

---

## Serverless Functions

### Function Structure

```typescript
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

/**
 * Basic Netlify function structure.
 * Handles HTTP requests and returns responses.
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: 'Hello from Netlify Functions!' }),
  };
};
```

### tRPC Handler

```typescript
import { Handler } from '@netlify/functions';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../src/server/routers';
import { createContext } from '../../src/server/context';

/**
 * tRPC handler for all API requests.
 * Routes to appropriate procedures based on path.
 */
export const handler: Handler = async (event) => {
  const url = new URL(event.rawUrl);
  
  const request = new Request(url, {
    method: event.httpMethod,
    headers: event.headers as HeadersInit,
    body: event.body,
  });

  const response = await fetchRequestHandler({
    endpoint: '/.netlify/functions/trpc',
    req: request,
    router: appRouter,
    createContext: ({ req }) => createContext({ req }),
  });

  const body = await response.text();

  return {
    statusCode: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body,
  };
};
```

### AI Proxy Function

```typescript
import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Proxy for OpenAI API calls.
 * Keeps API key secure on server side.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { messages, tools, boardContext } = JSON.parse(event.body || '{}');

    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant for CollabBoard. Current board: ${boardContext?.boardName || 'Unknown'}`,
    };

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [systemMessage, ...messages],
      tools,
      tool_choice: 'auto',
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.choices[0].message),
    };
  } catch (error) {
    console.error('AI proxy error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'AI request failed' }),
    };
  }
};
```

### Background Functions (Long-Running)

```typescript
import { Handler } from '@netlify/functions';

/**
 * Background function for long-running tasks.
 * Can run up to 15 minutes (vs 10 seconds for regular functions).
 */
export const handler: Handler = async (event) => {
  const { taskId, boardId } = JSON.parse(event.body || '{}');

  await processLongRunningTask(taskId, boardId);

  return {
    statusCode: 202,
    body: JSON.stringify({ status: 'processing', taskId }),
  };
};

export const config = {
  type: 'background',
};
```

---

## Environment Variables

### Setting Variables

**Via Netlify CLI:**

```bash
netlify env:set OPENAI_API_KEY "sk-your-key"
netlify env:set FIREBASE_API_KEY "your-firebase-key"
```

**Via netlify.toml (non-sensitive only):**

```toml
[build.environment]
  NODE_VERSION = "20"
  VITE_APP_NAME = "CollabBoard"
```

### Accessing in Functions

```typescript
export const handler: Handler = async (event) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const firebaseKey = process.env.FIREBASE_API_KEY;
  
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing API key configuration' }),
    };
  }
};
```

### Context-Specific Variables

```toml
[context.production.environment]
  VITE_API_URL = "https://collabboard.netlify.app"

[context.deploy-preview.environment]
  VITE_API_URL = "https://deploy-preview--collabboard.netlify.app"

[context.branch-deploy.environment]
  VITE_API_URL = "https://staging--collabboard.netlify.app"
```

---

## Build Configuration

### Vite Configuration

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          konva: ['konva', 'react-konva'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
        },
      },
    },
  },
});
```

### Advanced netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["sharp"]

[[plugins]]
  package = "@netlify/plugin-lighthouse"
```

---

## Performance Optimization

### Edge Caching

```toml
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.woff2"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### Function Optimization

```typescript
import { Handler } from '@netlify/functions';

let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000;

/**
 * Function with in-memory caching for repeated requests.
 * Cache persists across warm invocations.
 */
export const handler: Handler = async (event) => {
  const now = Date.now();
  
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return {
      statusCode: 200,
      headers: { 'X-Cache': 'HIT' },
      body: JSON.stringify(cachedData),
    };
  }

  const data = await fetchExpensiveData();
  cachedData = data;
  cacheTimestamp = now;

  return {
    statusCode: 200,
    headers: { 'X-Cache': 'MISS' },
    body: JSON.stringify(data),
  };
};
```

### Bundle Analysis

```bash
npm install --save-dev rollup-plugin-visualizer
```

```typescript
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
});
```

---

## CI/CD and Preview Deploys

### GitHub Actions Integration

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Branch Deploys

```toml
[context.staging]
  command = "npm run build:staging"

[context.staging.environment]
  VITE_ENV = "staging"
  VITE_API_URL = "https://staging-api.collabboard.com"
```

### Deploy Notifications

```toml
[[plugins]]
  package = "netlify-plugin-slack-notify"
  
  [plugins.inputs]
    webhook_url = "https://hooks.slack.com/services/xxx"
    message = "New deployment: {{DEPLOY_URL}}"
```

---

## Integration with CollabBoard Stack

### React SPA Routing

```toml
[[redirects]]
  from = "/board/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/dashboard"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/settings/*"
  to = "/index.html"
  status = 200
```

### Firebase Integration

Functions can access Firebase Admin SDK:

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = getDatabase(app);

export const handler: Handler = async (event) => {
  const snapshot = await db.ref('boards').once('value');
  return {
    statusCode: 200,
    body: JSON.stringify(snapshot.val()),
  };
};
```

### Local Development

```bash
netlify dev
```

This runs:
- Vite dev server on port 5173
- Functions on port 8888
- Proxy combining both

---

## Resources

### Official Documentation
- [Netlify Documentation](https://docs.netlify.com/)
- [Functions Guide](https://docs.netlify.com/functions/overview/)
- [React Framework Guide](https://docs.netlify.com/build/frameworks/framework-setup-guides/react)

### Tutorials
- [Deploying Vite Apps](https://docs.netlify.com/build/frameworks/framework-setup-guides/react/#vite)
- [Serverless Functions](https://docs.netlify.com/functions/create/)

### Related CollabBoard Guides
- [React Guide](./react.md) - Frontend framework
- [tRPC Guide](./trpc.md) - API integration
- [OpenAI Guide](./openai-gpt4.md) - AI proxy setup
