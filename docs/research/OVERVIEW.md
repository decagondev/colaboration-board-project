# Pre-Search Report: CollabBoard Project

This report documents the Pre-Search phase for building CollabBoard, a real-time collaborative whiteboard with AI agent integration. The process follows the structured checklist from the project appendix, using AI-driven analysis (leveraging my knowledge and targeted web searches for up-to-date insights). The goal is to explore stack options, surface tradeoffs, and document architecture decisions before coding begins.

I've incorporated considerations for **modularity** (e.g., separating concerns like UI rendering, sync logic, and AI integration into independent modules), **SOLID principles** (assuming "CSOLID" is a typo for SOLID: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion), performance targets (e.g., <100ms sync latency, 60 FPS), general workflow (AI-first with iterative vertical slices), blockers, and mitigations. Findings are granular, with options ranked by suitability for a solo developer in a 1-week sprint, prioritizing speed-to-MVP while ensuring scalability for 5+ users.

The report is divided into the three phases. All decisions aim for a modular design: e.g., using interfaces for board objects to allow extension (Open-Closed), inverting dependencies via DI for testing, and single-responsibility classes for sync vs. rendering.

## Phase 1: Define Your Constraints

This phase defines project boundaries based on the PDF specs (1-week sprint, MVP in 24 hours, focus on real-time collab and AI). Assumptions: Solo developer (me/Tom), JavaScript/TypeScript expertise, high learning appetite but priority on shipping MVP. Scale starts small but targets 5+ concurrent users without degradation.

1. **Scale & Load Profile**
   - **Users at launch? In 6 months?** Launch: 1-10 users (testing/admission focus). 6 months: 100-500 users (if productized, assuming organic growth via social posts).
   - **Traffic pattern:** Spiky (e.g., during workshops), with real-time websockets for cursors/sync.
   - **Real-time requirements:** Yes, mandatory for sync (<100ms object latency, <50ms cursor).
   - **Cold start tolerance:** Low; app must handle quick reconnects. Use serverless for auto-scaling.
   - **Findings/Options:** Initial scale favors managed services like Firebase (handles spikes well). Blocker: High concurrency could hit free-tier limits. Mitigation: Monitor with Firebase Analytics; upgrade to paid if needed.

2. **Budget & Cost Ceiling**
   - **Monthly spend limit?** $0-50 for dev/MVP (free tiers preferred); pay-per-use OK for AI APIs.
   - **Pay-per-use vs. fixed costs?** Pay-per-use for flexibility (e.g., OpenAI tokens).
   - **Trade money for time?** Yes, use managed services (e.g., Supabase) to save dev time on infra.
   - **Findings/Options:** Free tiers of Firebase/Supabase suffice for MVP. AI costs: Estimate $5-20/dev based on GPT-4 calls. Blocker: Token overages in testing. Mitigation: Use cheaper models like GPT-3.5 for drafts; track with OpenAI dashboard.

3. **Time to Ship**
   - **MVP timeline?** 24 hours for collab infra.
   - **Speed-to-market vs. maintainability?** Speed first; modular code for later refactors.
   - **Iteration cadence?** Daily vertical slices (e.g., cursor sync day 1).
   - **Findings/Options:** Prioritize stacks with quick setups (e.g., Create React App). Blocker: Learning curve for canvas libs. Mitigation: Start with tutorials; use AI tools like Cursor for code gen.

4. **Compliance & Regulatory Needs**
   - **Health data (HIPAA)? EU users (GDPR)?** No health data; GDPR possible (user auth/names). Use EU-hosted services.
   - **Enterprise clients (SOC 2)? Data residency?** Not for MVP; assume global users.
   - **Findings/Options:** Firebase/Supabase are GDPR-compliant with configs. Blocker: Data export for residency. Mitigation: Choose EU regions in setup.

5. **Team & Skill Constraints**
   - **Solo or team?** Solo.
   - **Languages/frameworks known?** JS/TS, React; familiar with Node/Express.
   - **Learning vs. shipping?** Balance: Learn Konva.js quickly for canvas.
   - **Findings/Options:** Stick to JS ecosystem for speed. Blocker: Real-time expertise gap. Mitigation: Use pre-built libs like Firebase Realtime DB.

## Phase 2: Architecture Discovery

Explored options via web searches for real-time whiteboard stacks (e.g., "best stacks for real-time collaborative whiteboards 2026", "Firebase vs Supabase for websockets"). Recommended path: Firebase backend, React + Konva.js frontend, OpenAI for AI. Alternatives evaluated for tradeoffs.

6. **Hosting & Deployment**
   - **Serverless vs. containers vs. edge vs. VPS?** Serverless for auto-scaling.
   - **CI/CD requirements?** Basic GitHub Actions for deploys.
   - **Scaling characteristics?** Horizontal for users/objects.
   - **Findings/Options:**
     - **Top: Vercel (serverless, free tier, integrates with React).** Pros: Fast deploys, edge caching for static assets. Cons: Cold starts ~100ms (mitigate with warm-ups).
     - **Alternative: Firebase Hosting.** Pros: Seamless with backend. Cons: Less flexible for custom domains.
     - **Alternative: Render.** Pros: Free for small apps. Cons: Slower builds.
     - Blocker: Deployment downtime. Mitigation: Use CI/CD for zero-downtime.

7. **Authentication & Authorization**
   - **Auth approach?** Email/password or social login.
   - **RBAC needed?** Basic: User presence/read-write on boards.
   - **Multi-tenancy?** Per-board access (future-proof).
   - **Findings/Options:**
     - **Top: Firebase Auth.** Pros: Built-in, real-time presence. Cons: Google dependency.
     - **Alternative: Supabase Auth.** Pros: Open-source, JWT-based. Cons: Setup time.
     - **Alternative: Clerk/Auth0.** Pros: Quick social logins. Cons: Cost for >100 users.
     - Blocker: Session hijacking. Mitigation: Use secure tokens, follow SOLID (interface for auth service).

8. **Database & Data Layer**
   - **Type?** Document for flexible objects (notes/shapes).
   - **Needs?** Real-time sync, caching (no full-text/vector for MVP).
   - **Read/write ratio?** High writes (edits), reads for sync.
   - **Findings/Options:**
     - **Top: Firebase Realtime DB/Firestore.** Pros: Native real-time, low latency (<50ms). Cons: Query limits for large boards.
     - **Alternative: Supabase (Postgres with Realtime).** Pros: SQL for complex queries. Cons: Less optimized for infinite sync.
     - **Alternative: DynamoDB.** Pros: Scalable. Cons: No native real-time (need AppSync).
     - Blocker: Data consistency in disconnects. Mitigation: Last-write-wins + optimistic UI; modular sync module.

9. **Backend/API Architecture**
   - **Monolith or microservices?** Monolith for MVP.
   - **REST vs. GraphQL vs. tRPC?** tRPC for type-safe.
   - **Background jobs?** AI processing in queues.
   - **Findings/Options:**
     - **Top: Node.js with tRPC.** Pros: End-to-end types, fast. Cons: Learning if new.
     - **Alternative: GraphQL (Apollo).** Pros: Flexible queries. Cons: Overkill for simple sync.
     - **Alternative: REST (Express).** Pros: Simple. Cons: Verbose.
     - Blocker: AI integration conflicts. Mitigation: Separate AI service module (Dependency Inversion).

10. **Frontend Framework & Rendering**
    - **SEO?** No (SPA whiteboard).
    - **Offline/PWA?** Basic offline (local state), but real-time focus.
    - **SPA vs. SSR?** SPA for interactivity.
    - **Findings/Options:**
      - **Top: React with Konva.js.** Pros: Mature canvas lib, modular components (e.g., separate Note/Shape components). Performance: 60 FPS with virtual DOM. Cons: Bundle size.
      - **Alternative: Svelte + Fabric.js.** Pros: Lighter, faster compile. Cons: Smaller community.
      - **Alternative: Vue + PixiJS.** Pros: Reactive, good for graphics. Cons: Steeper curve.
      - Blocker: Infinite canvas perf drops. Mitigation: Use viewports, SOLID (single resp. for rendering).

11. **Third-Party Integrations**
    - **Needed?** AI APIs (OpenAI), analytics (optional).
    - **Pricing/rate limits?** OpenAI: $0.03/1k tokens GPT-4; limits 10k/min.
    - **Vendor lock-in?** Medium for Firebase.
    - **Findings/Options:**
      - **Top: OpenAI GPT-4 with function calling.** Pros: Reliable for multi-step commands. Cons: Cost scales with users.
      - **Alternative: Anthropic Claude.** Pros: Better reasoning. Cons: Similar pricing.
      - Blocker: API downtime. Mitigation: Fallback to local logic for simple commands; modular AI wrapper.

## Phase 3: Post-Stack Refinement

Refined chosen stack (Firebase, React/Konva, OpenAI) with searches on pitfalls (e.g., "Firebase realtime pitfalls 2026"). Emphasize modularity: e.g., interfaces for objects, separate modules for sync/AI.

12. **Security Vulnerabilities**
    - **Pitfalls?** Firebase rules misconfigs (e.g., open writes).
    - **Misconfigurations?** Weak auth tokens.
    - **Dependency risks?** Vulnerabilities in Konva.js.
    - **Findings/Options:** Use Firebase Security Rules for validation. Blocker: XSS in editable text. Mitigation: Sanitize inputs; audit deps with npm audit.

13. **File Structure & Project Organization**
    - **Structure?** Standard React: src/components, src/services.
    - **Monorepo vs. polyrepo?** Monorepo.
    - **Organization?** By feature (board, ai, auth).
    - **Findings/Options:** Use Turborepo for monorepo if scaling. Blocker: Clutter. Mitigation: Modular folders (e.g., /board/objects for SOLID classes).

14. **Naming Conventions & Code Style**
    - **Patterns?** CamelCase for JS, descriptive (e.g., BoardSyncService).
    - **Linter?** ESLint + Prettier.
    - **Findings/Options:** Airbnb style guide. Blocker: Inconsistency. Mitigation: Auto-format on save.

15. **Testing Strategy**
    - **Tools?** Jest for unit/integration, Cypress for e2e.
    - **Coverage?** 70% for MVP (focus on sync).
    - **Mocking?** Jest mocks for APIs.
    - **Findings/Options:** Test real-time with multiple instances. Blocker: Flaky e2e. Mitigation: Use SOLID for injectable mocks.

16. **Recommended Tooling & DX**
    - **VS Code extensions?** ESLint, Prettier, React snippets.
    - **CLI tools?** Vite for build.
    - **Debugging?** Chrome DevTools for canvas.
    - **Findings/Options:** Cursor AI for code gen. Blocker: Debug real-time. Mitigation: Logging with Sentry.

## Final Decisions & Plan
- **Chosen Stack:** Firebase (backend/auth/sync), React + Konva.js (frontend), OpenAI (AI), Vercel (deploy). Rationale: Fast setup, real-time native, modular.
- **Workflow:** AI-first (use Cursor for prompts like "Implement modular sticky note component"). Vertical builds: Cursor sync → Object sync → AI.
- **Modularity/SOLID:** All components/interfaces; e.g., IBoardObject interface for extensibility.
- **Blockers/Mitigations Summary:** Perf: Optimize renders (virtualization). Sync: Optimistic updates. AI: Cache board state to reduce tokens.
- **Next:** Proceed to MVP build based on this report. Save as submission doc.
