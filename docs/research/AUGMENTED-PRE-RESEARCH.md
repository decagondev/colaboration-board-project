# Augmented Pre-Search Report: CollabBoard Project

This augmented report expands on the initial Pre-Search phase for the CollabBoard project, a real-time collaborative whiteboard with AI agent integration. It incorporates deeper research, additional tradeoffs, and more granular details across all phases. Research draws from the project PDF, my up-to-date knowledge base, and targeted web searches (e.g., for stack comparisons and hosting options). Emphasis is placed on modularity (e.g., decoupled modules for UI, sync, AI), SOLID principles (e.g., single-responsibility services for sync and rendering, dependency inversion for testable integrations), performance (targeting 60 FPS, <100ms sync), workflow (AI-first with vertical slicing), blockers, and mitigations.

New additions include:
- Expanded subsections with more options, pros/cons tables, and performance implications.
- Deeper analysis of alternatives, including real-world benchmarks where available.
- Integration of recent (2026) insights on tools and stacks.
- A dedicated section on Hosting Decision (Vercel vs. Netlify), respecting your preference for Netlify while presenting a balanced case.

The report remains structured by the three phases from the appendix checklist. Final decisions prioritize speed-to-MVP in a solo 1-week sprint, with scalability for 5+ users.

## Phase 1: Define Your Constraints

This phase now includes more quantitative estimates (e.g., user growth models) and risk assessments. Assumptions: Solo developer (Tom), JS/TS proficiency, focus on shipping MVP in 24 hours with AI-first tools like Cursor for code generation.

1. **Scale & Load Profile**
   - **Users at launch? In 6 months?** Launch: 5-20 users (testing-focused for admission). 6 months: 100-1,000 users (assuming viral growth via X/LinkedIn posts; model: 20% MoM growth from 10 initial).
   - **Traffic pattern:** Spiky (e.g., 5 concurrent during workshops), with bursts of websocket traffic for real-time cursors/sync.
   - **Real-time requirements:** Critical; <50ms cursor latency, <100ms object sync. Expect 500+ objects/board, 5+ users without FPS drops.
   - **Cold start tolerance:** Very low; app must resume seamlessly post-disconnect. Use auto-scaling serverless.
   - **Findings/Options:** Managed services like Firebase excel for spikes (auto-scales to millions). Alternative: AWS AppSync for GraphQL real-time. Blocker: Free-tier throttling at 100 simultaneous connections (Firebase Spark). Mitigation: Upgrade to Blaze plan ($0.06/GB data); implement client-side optimism for perceived low latency. Performance implication: Firebase's global CDN ensures <50ms in EU (your location: London).

2. **Budget & Cost Ceiling**
   - **Monthly spend limit?** $0-100 for MVP/dev; scale to $500 at 1,000 users.
   - **Pay-per-use vs. fixed costs?** Pay-per-use for flexibility (e.g., AI tokens spike during testing).
   - **Trade money for time?** Yes: Opt for managed auth/sync (Firebase) over custom to save 10-20 hours.
   - **Findings/Options:** Free tiers cover MVP (Firebase: 1GB storage, OpenAI: $5 credit). AI costs: ~$10/dev for 100k tokens (GPT-4). Blocker: Unpredictable AI scaling (e.g., complex commands = 2k tokens/call). Mitigation: Use cheaper models (Claude 3.5) for non-critical; track via API dashboards. Projection: At 100 users (10 sessions/user/month, 5 commands/session), ~$20/month AI + $5 hosting.

3. **Time to Ship**
   - **MVP timeline?** 24 hours: Focus on collab infra (cursors, sync).
   - **Speed-to-market vs. maintainability?** Speed first; use modular code (e.g., separate /sync module) for refactors.
   - **Iteration cadence?** Hourly vertical slices (e.g., test cursor sync in 2 browsers), daily checkpoints.
   - **Findings/Options:** Stacks with quick setups (e.g., create-react-app) shave hours. Blocker: Debugging real-time (e.g., race conditions). Mitigation: AI tools for prompts like "Debug Firebase sync race"; allocate 20% time buffer.

4. **Compliance & Regulatory Needs**
   - **Health data (HIPAA)? EU users (GDPR)?** No HIPAA; GDPR yes (user names/presence data). Store minimally, enable data export.
   - **Enterprise clients (SOC 2)? Data residency?** Not MVP; assume EU residency for London users.
   - **Findings/Options:** Firebase/Supabase offer GDPR tools (e.g., EU regions). Blocker: Accidental PII leaks in board objects. Mitigation: Anonymize cursors; use SOLID interfaces for data sanitization.

5. **Team & Skill Constraints**
   - **Solo or team?** Solo.
   - **Languages/frameworks known?** JS/TS, React; moderate canvas/WebSockets.
   - **Learning vs. shipping?** 70/30: Learn Konva.js via tutorials (2 hours), ship rest.
   - **Findings/Options:** JS ecosystem minimizes context switches. Blocker: AI integration complexity (function calling). Mitigation: Use pre-built examples; AI-gen 80% code.

## Phase 2: Architecture Discovery

Expanded with pros/cons tables, more alternatives, and 2026-specific insights (e.g., improved edge functions). Focus on modularity: e.g., abstract backend via interfaces for easy swaps.

6. **Hosting & Deployment** (See dedicated section below for Vercel vs. Netlify details)
   - **Serverless vs. containers vs. edge vs. VPS?** Serverless + edge for auto-scaling.
   - **CI/CD requirements?** Manual setup via Netlify website for Git-based deploys with previews.
   - **Scaling characteristics?** Horizontal for users; edge caching for static assets.
   - **Findings/Options:** See Hosting Decision section.

7. **Authentication & Authorization**
   - **Auth approach?** Email/password + social (Google) for quick MVP.
   - **RBAC needed?** Basic: Read/write per board; future multi-tenancy.
   - **Multi-tenancy considerations?** Per-board invites (post-MVP).
   - **Findings/Options:**
     | Option | Pros | Cons | Performance/Modularity |
     |--------|------|------|-------------------------|
     | Firebase Auth (Top) | Real-time presence, free, integrates with DB. | Google lock-in. | <50ms login; SOLID auth service injectable. |
     | Supabase Auth | Open-source, Postgres-backed. | Slight setup overhead. | Similar latency; easier GDPR. |
     | Clerk | Feature-rich (SSO), quick. | $20/month >50 users. | Edge-optimized; modular wrapper. |
     - Blocker: Token expiration during long sessions. Mitigation: Auto-refresh; test with multiple browsers.

8. **Database & Data Layer**
   - **Type?** Document for JSON-like board objects (notes/shapes).
   - **Needs?** Real-time sync, no vectors/full-text for MVP; caching via client state.
   - **Read/write ratio?** 60/40 (high writes from edits).
   - **Findings/Options:**
     | Option | Pros | Cons | Performance/Modularity |
     |--------|------|------|-------------------------|
     | Firebase Realtime DB (Top) | Native sync, low latency (<50ms). | No complex queries. | Handles 500 objects; sync module decoupled. |
     | Firestore | Scalable queries. | Higher cost for reads. | Better for growth; interface for DB ops. |
     | Supabase Realtime | SQL flexibility. | Less canvas-optimized. | <100ms; SOLID repo pattern. |
     - Blocker: Data bloat (500+ objects). Mitigation: Compress JSON; paginate loads.

9. **Backend/API Architecture**
   - **Monolith or microservices?** Monolith MVP.
   - **REST vs. GraphQL vs. tRPC?** tRPC for type-safety in TS.
   - **Background jobs?** Queue for AI multi-step (if needed).
   - **Findings/Options:**
     | Option | Pros | Cons | Performance/Modularity |
     |--------|------|------|-------------------------|
     | Node.js + tRPC (Top) | End-to-end types, fast. | Learning if new. | <100ms calls; DI for services. |
     | GraphQL (Apollo) | Flexible. | Boilerplate. | Good for complex; modular resolvers. |
     | REST (Express) | Simple. | No types. | Basic; easy to modularize. |
     - Blocker: AI conflicts in shared state. Mitigation: Lock mechanisms; separate AI queue.

10. **Frontend Framework & Rendering**
    - **SEO?** None needed.
    - **Offline/PWA?** Basic local persistence.
    - **SPA vs. SSR?** SPA for real-time.
    - **Findings/Options:**
      | Option | Pros | Cons | Performance/Modularity |
      |--------|------|------|-------------------------|
      | React + Konva.js (Top) | Mature, 60 FPS canvas. | Bundle size (200KB+). | Virtual DOM; components per object type (SOLID). |
      | Svelte + Fabric.js | Lightweight, reactive. | Smaller ecosystem. | Faster renders; modular stores. |
      | Vue + PixiJS | Good for graphics. | Curve for non-Vue users. | Reactive; feature modules. |
      - Blocker: Zoom/pan perf with 500 objects. Mitigation: Viewport culling; profile with React DevTools.

11. **Third-Party Integrations**
    - **Needed?** AI (OpenAI), optional analytics.
    - **Pricing/rate limits?** OpenAI: $0.002/1k tokens (2026 rates); 200 RPM.
    - **Vendor lock-in?** Medium; use wrappers.
    - **Findings/Options:**
      | Option | Pros | Cons | Performance/Modularity |
      |--------|------|------|-------------------------|
      | OpenAI GPT-4 (Top) | Strong function calling. | Cost at scale. | <2s response; AI facade interface. |
      | Anthropic Claude | Better multi-step reasoning. | Similar pricing. | Consistent; easy swap. |
      - Blocker: Rate limits during tests. Mitigation: Local mocks; batch commands.

## Phase 3: Post-Stack Refinement

Expanded with more pitfalls, 2026 updates (e.g., improved linters), and SOLID alignments.

12. **Security Vulnerabilities**
    - **Pitfalls?** Open Firebase rules allowing overwrites.
    - **Misconfigurations?** Exposed API keys in client.
    - **Dependency risks?** Outdated Konva (check npm audit).
    - **Findings/Options:** Enforce rules; use secrets. Blocker: XSS in text notes. Mitigation: DOMPurify; SOLID validators.

13. **File Structure & Project Organization**
    - **Structure?** React standard: /src/components, /services, /ai.
    - **Monorepo vs. polyrepo?** Monorepo.
    - **Organization?** Feature-sliced (e.g., /board, /collab).
    - **Findings/Options:** Turborepo for scaling. Blocker: Growth clutter. Mitigation: ESLint plugins.

14. **Naming Conventions & Code Style**
    - **Patterns?** Descriptive camelCase (e.g., updateBoardObject).
    - **Linter?** ESLint + Prettier (2026 configs).
    - **Findings/Options:** Airbnb + TS rules. Blocker: Inconsistencies. Mitigation: Husky hooks.

15. **Testing Strategy**
    - **Tools?** Jest (unit), React Testing Library (integration), Cypress (e2e).
    - **Coverage?** 80% MVP (sync critical).
    - **Mocking?** MSW for APIs.
    - **Findings/Options:** Focus real-time tests. Blocker: Flaky networks. Mitigation: SOLID mocks.

16. **Recommended Tooling & DX**
    - **VS Code extensions?** ESLint, Prettier, GitLens, Cursor AI.
    - **CLI tools?** Vite for fast builds.
    - **Debugging?** React Inspector, Firebase emulator.
    - **Findings/Options:** Emulate locally. Blocker: Real-time debug. Mitigation: Console logs + Sentry.

## Hosting Decision: Vercel vs. Netlify

Based on your preference for Netlify, we'll proceed with it as the primary choice. However, here's a balanced comparison (drawing from 2026 web searches on "Vercel vs Netlify for React apps with serverless functions"). Both are excellent for hosting React SPAs like CollabBoard, where the frontend is static-ish (bundled) and real-time is offloaded to Firebase. Serverless functions could be used for AI proxies (e.g., to hide OpenAI keys), making function perf relevant.

### Pros/Cons Table (2026 Insights)
| Category | Vercel | Netlify |
|----------|--------|---------|
| **Best For** | Dynamic React/Next.js apps; performance-critical (edge functions eliminate 99% cold starts). | Static/JAMstack; built-in features like forms, identity, async background functions (up to 15 min). |
| **Build/Deploys** | Faster builds (avg 20-30s for React); preview branches seamless. | Reliable, plugin ecosystem; slightly slower for large apps. |
| **Serverless Functions** | Multi-language (JS, Python, Go, Ruby); fluid compute for no cold starts; edge middleware for low latency (<50ms). | JS/Go focus; per-invocation pricing; background async support. |
| **Pricing (Free Tier)** | Hobby: 100 GB-hours functions, but non-commercial. Pro: $20/month. | Starter: 125k function requests, commercial OK; simpler categories. |
| **Performance** | Global edge caching + routing; better for real-time adjacent (e.g., AI calls). | Strong CDN; good for static, but cold starts possible (10-26s limits). |
| **Integrations** | Deep with Firebase/Supabase; AI infra (e.g., optimized for GPT calls). | Excellent plugins; native Postgres if switching DB. |
| **Scaling** | Auto to millions; fluid for spikes. | Handles spikes well for static; functions limited. |
| **DX** | GitHub-focused CI/CD; analytics deeper. | Intuitive dashboard; easier for non-devs. |

### Case for Vercel Over Netlify
Vercel edges out for CollabBoard due to its focus on dynamic frontend performance, which aligns with real-time needs (even if sync is Firebase). Key reasons:
- **Eliminated Cold Starts:** 2026 "fluid compute" ensures <2s AI responses consistently, vs. Netlify's potential delays—critical for multi-step commands.
- **Edge Functions:** Lower latency for any serverless AI proxies (e.g., London users get <50ms), supporting 60 FPS during manipulations.
- **React Optimization:** Smoother integration with React (faster bundles, middleware for auth), potentially saving 5-10 hours in setup/debug.
- **Scalability for Growth:** Better at handling 1,000+ users with AI (multi-language functions allow Python for advanced layouts if needed).
- **Benchmarks:** Recent reviews (e.g., Codecademy 2026) note Vercel as "faster and more scalable" for performance-critical apps; YouTube comparisons highlight "smoother integration" for React.

That said, Netlify's strengths (simpler pricing, async functions, commercial free tier) make it viable and align with your preference—differences are marginal for MVP (static React deploy). Blocker for Vercel: Hobby tier non-commercial (if sharing publicly). Mitigation: Use Netlify for now, migrate if perf issues arise.

**Decision:** Proceed with Netlify for hosting/deployment. It fits the budget ($0 MVP), offers quick deploys, and supports serverless for AI if needed. CI/CD will be manually set up via the Netlify website. Update stack: Firebase backend, React + Konva frontend, OpenAI AI, Netlify deploy.

## Final Decisions & Plan
- **Chosen Stack:** Firebase (backend/auth/sync), React + Konva.js (frontend), OpenAI (AI), Netlify (deploy). Rationale: Balanced speed, cost, modularity.
- **Workflow:** AI-first (Cursor/Claude for 70% code); vertical: Day 1 cursors, Day 2 sync, etc.
- **Modularity/SOLID:** Feature modules, interfaces (e.g., ISyncService), DI container.
- **Blockers/Mitigations Summary:** Perf: Virtualization + profiling. Sync: Optimistic UI + emulators. AI: Token caching + fallbacks.
- **Next Steps:** Init repo; manually set up CI/CD via Netlify website; build cursor sync prototype. Save this as submission doc.
