# CollabBoard Design Document

## Introduction

This design document outlines the architecture, tech stack, methodologies, and agile breakdown for CollabBoard, a real-time collaborative whiteboard tool with AI agent integration. It incorporates findings from the Pre-Search phase, including constraints (e.g., 1-week sprint, solo developer, scale to 100-1,000 users), performance targets (<50ms cursor latency, 60 FPS), and risk mitigations (e.g., optimistic UI for sync). The project emphasizes AI-first workflows, real-time synchronization, and extensibility.

The system will support infinite canvases, sticky notes, shapes, real-time multiplayer (cursors, presence, sync), and an AI agent for natural language commands (e.g., creating templates like SWOT). Focus is on MVP in 24 hours (collab infra), full features by Friday, and polish by Sunday. Design prioritizes modularity (decoupled modules for UI, sync, AI) and SOLID principles (e.g., Single Responsibility for services, Dependency Inversion for swappable backends).

## Locked Tech Stack

Based on Pre-Search tradeoffs, the following stack is selected for speed-to-MVP, low cost (free tiers), and performance. Alternatives like Supabase were considered but Firebase RTDB was chosen for seamless realtime sync.

| Layer | Technology | Rationale | Official Documentation |
|-------|------------|-----------|------------------------|
| Frontend Framework | React | Mature SPA for interactive UI; supports modular components. | [React Documentation](https://react.dev/) |
| Canvas Library | Konva.js | High-performance 2D canvas for infinite board, pan/zoom, shapes (60 FPS target). | [Konva.js Documentation](https://konvajs.org/docs/index.html) |
| Backend/Database | Firebase Realtime Database | Low-latency sync (<50ms for cursors); free tier handles 5+ users. | [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database) |
| Authentication | Firebase Authentication | Quick setup for user presence/auth; integrates with RTDB. | [Firebase Authentication Documentation](https://firebase.google.com/docs/auth) |
| AI Integration | OpenAI GPT-4 (with function calling) | Reliable for multi-step commands; <2s latency. | [OpenAI API Documentation](https://platform.openai.com/docs/api-reference/introduction) |
| API Architecture | tRPC | Type-safe monolith for frontend-backend comms; low overhead. | [tRPC Documentation](https://trpc.io/docs) |
| Deployment/Hosting | Netlify | Serverless deploys; manual CI/CD via website; free for MVP. | [Netlify Documentation](https://docs.netlify.com/) |
| Code Quality | ESLint + Prettier | Enforce naming/style; Airbnb config for consistency. | [ESLint Documentation](https://eslint.org/docs/latest); [Prettier Documentation](https://prettier.io/docs) |
| Testing | Jest (unit/integration) + Cypress (e2e) | 80% coverage; focus on sync scenarios. | [Jest Documentation](https://jestjs.io/docs/getting-started); [Cypress Documentation](https://docs.cypress.io/) |

## Proposed Methodologies

### AI-First Development
Use AI tools (Cursor, Claude Code) for 70% code generation. Workflow: Prompt for modular components (e.g., "Generate React component for sticky note following SOLID"). Track in AI Development Log: Tools used, prompts, % AI-generated code, learnings.

### Modular Design and SOLID Principles
- **Modularity:** Feature-sliced structure (e.g., /board, /collab, /ai modules). Use interfaces for extensibility (e.g., IBoardObject for shapes/notes).
- **SOLID:**
  - **Single Responsibility:** Separate concerns (e.g., SyncService handles RTDB only).
  - **Open-Closed:** Extend via interfaces (e.g., add new shapes without modifying core).
  - **Liskov Substitution:** Subtypes interchangeable (e.g., Shape extends BoardObject).
  - **Interface Segregation:** Small interfaces (e.g., ITransformable for move/resize).
  - **Dependency Inversion:** Inject deps (e.g., DI for AI client).
- Mitigations: Use TypeScript for type safety; review for adherence in tests.

### Agile Approach
Vertical slicing: Build end-to-end (e.g., cursor sync first). Iterative: Daily checkpoints, test in browsers. Break into EPICs and User Stories for prioritization (MVP focus). User Stories include acceptance criteria for feasibility in 1-week sprint.

## Architecture Overview

High-level: React app renders infinite canvas via Konva.js. Firebase RTDB syncs state (objects, cursors) in realtime. tRPC proxies API calls (e.g., AI commands). OpenAI handles NLP, calling board functions. Netlify hosts the SPA.

- **Components:** Modular (e.g., BoardCanvas, StickyNoteComponent).
- **Data Flow:** Optimistic updates → RTDB sync → Broadcast to clients.
- **Security:** Firebase rules for auth; sanitize inputs.
- **Performance:** Viewport culling in Konva; debounce cursor updates.
- **Blockers/Mitigations:** Sync conflicts → Last-write-wins; AI costs → Cache board state.

## Agile Breakdown

### EPIC 1: Collaborative Infrastructure (MVP Focus)
Core realtime sync, auth, presence. Priority: High (24-hour gate).

- **User Story 1.1:** As a user, I want to authenticate so that I can join boards securely.  
  Acceptance: Email/password login; presence shown. Tests: Multi-browser.

- **User Story 1.2:** As a user, I want to see multiplayer cursors with names so that I know who's editing.  
  Acceptance: <50ms latency; labels update realtime. Mitigate: Debounce updates.

- **User Story 1.3:** As a user, I want presence awareness so that I see who's online.  
  Acceptance: List of users; updates on join/leave.

- **User Story 1.4:** As a user, I want resilient sync so that state persists on disconnect/reconnect.  
  Acceptance: Handle refreshes; last-write-wins conflicts.

### EPIC 2: Board Features
Infinite workspace, objects, operations. Build after collab.

- **User Story 2.1:** As a user, I want an infinite board with pan/zoom so that I can navigate large canvases.  
  Acceptance: Smooth 60 FPS; Konva viewport.

- **User Story 2.2:** As a user, I want to create/edit sticky notes so that I can add text ideas.  
  Acceptance: Editable text, colors; sync <100ms.

- **User Story 2.3:** As a user, I want shapes (rect, circle, line) so that I can draw visuals.  
  Acceptance: Solid colors; transforms (move/resize/rotate).

- **User Story 2.4:** As a user, I want connectors/frames/text so that I can organize content.  
  Acceptance: Arrows linking objects; group areas.

- **User Story 2.5:** As a user, I want selection/operations so that I can manage objects.  
  Acceptance: Multi-select, delete/duplicate/copy-paste.

### EPIC 3: AI Board Agent
NLP commands for manipulation. 6+ types.

- **User Story 3.1:** As a user, I want creation commands so that I can add objects via text.  
  Acceptance: "Add yellow sticky note"; executes <2s.

- **User Story 3.2:** As a user, I want manipulation commands so that I can edit via text.  
  Acceptance: "Move pink notes right"; shared realtime.

- **User Story 3.3:** As a user, I want layout/complex commands so that I can generate templates.  
  Acceptance: "Create SWOT"; multi-step planning.

- **User Story 3.4:** As a user, I want shared AI state so that multiple users see results without conflicts.  
  Acceptance: Queue commands; test simultaneous.

### EPIC 4: Deployment, Testing, and Polish
Final touches, docs.

- **User Story 4.1:** As a developer, I want deployment so that the app is public.  
  Acceptance: Netlify setup; supports 5+ users.

- **User Story 4.2:** As a developer, I want tests so that features are reliable.  
  Acceptance: 80% coverage; e2e for sync scenarios.

- **User Story 4.3:** As a submitter, I want documentation so that I meet requirements.  
  Acceptance: Pre-Search, AI Log, Cost Analysis.
