# CollabBoard

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Project Description

CollabBoard is a real-time collaborative whiteboard tool built with AI-first development methodologies. Inspired by tools like Miro, it enables multiple users to brainstorm, draw shapes, add sticky notes, and manipulate content simultaneously with low-latency synchronization. Key features include an infinite canvas with pan/zoom, multiplayer cursors with presence awareness, object persistence, and an AI agent that responds to natural language commands (e.g., "Create a SWOT analysis template" or "Arrange sticky notes in a grid").

This project is developed as part of the Gauntlet AI Week 1 challenge, focusing on production-scale infrastructure, conflict resolution (last-write-wins), and AI integration for board manipulation. It supports up to 5+ concurrent users without degradation, with performance targets like 60 FPS rendering and <100ms object sync latency.

**Tech Stack:**
- **Frontend:** React + Konva.js for canvas rendering
- **Backend/Database:** Firebase Realtime Database for sync
- **Authentication:** Firebase Auth
- **AI:** OpenAI GPT-4 with function calling
- **API:** tRPC for type-safe communication
- **Deployment:** Netlify
- **Testing:** Jest (unit/integration) + Cypress (e2e)
- **Code Quality:** ESLint + Prettier, TypeScript

For more details, see the [Product Requirements Document (PRD)](docs/PRD.md) and [Pre-Search Report](docs/pre-search-report.md).

## Prerequisites

- Node.js v18+ (LTS recommended)
- npm or yarn
- Firebase account (for Realtime DB and Auth)
- OpenAI API key (for AI agent)
- Netlify account (for deployment)

## Setup

1. **Clone the Repository:**
   ```
   git clone https://github.com/decagondev/colaboration-board-project.git
   cd colaboration-board-project
   ```

2. **Install Dependencies:**
   ```
   npm install
   ```
   (Or `yarn install` if using Yarn.)

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```
   - Obtain Firebase keys from your Firebase console (create a web app).
   - Get OpenAI key from [platform.openai.com](https://platform.openai.com/account/api-keys).

4. **Firebase Setup:**
   - In Firebase Console, enable Realtime Database and Authentication (Email/Password + Google).
   - Set Database Rules for security (e.g., auth required for writes):
     ```
     {
       "rules": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
     ```

5. **Local Emulators (Optional for Development):**
   Install Firebase CLI: `npm install -g firebase-tools`
   ```
   firebase login
   firebase init emulators
   firebase emulators:start
   ```
   Update `.env` to point to emulators if needed.

## Getting Started

1. **Run Development Server:**
   ```
   npm run dev
   ```
   The app will start at `http://localhost:5173` (default Vite port).

2. **Authentication:**
   - Sign up or log in with email/password or Google.
   - Once authenticated, you'll join the default board with presence indicators.

3. **Basic Usage Test:**
   - Open multiple browser windows/incognito tabs.
   - Move your cursor—others should see it in realtime with your name.
   - Add a sticky note or shape; it should sync instantly.

4. **Build for Production:**
   ```
   npm run build
   ```
   Output in `/dist` for deployment.

## Usage

### Core Features
- **Infinite Board:** Pan with drag, zoom with mouse wheel. Create objects by selecting tools from the toolbar.
- **Sticky Notes:** Click "Note" tool, place on canvas, edit text, change color.
- **Shapes & Connectors:** Draw rectangles/circles/lines; connect with arrows.
- **Transforms & Operations:** Select (shift-click for multi), move/resize/rotate, delete/duplicate.
- **Collaboration:** See cursors/names of online users. Changes sync in <100ms.
- **AI Agent:** Use the command bar (e.g., "/ai") to input natural language:
  - Creation: "Add a yellow sticky note that says 'User Research'"
  - Manipulation: "Move all pink sticky notes to the right"
  - Layout: "Arrange these in a 2x3 grid"
  - Complex: "Create a SWOT analysis template"
  AI results appear realtime for all users.

### Testing Locally
- Run unit tests: `npm test`
- Run e2e tests: `npx cypress open`
- Simulate multiplayer: Use multiple browsers; throttle network in DevTools for realism.

### Deployment
- Push to GitHub.
- In Netlify dashboard, add site from repo (manual CI/CD as per plan).
- Set env vars in Netlify.
- Deployed URL will support public access with auth.

## Contributing
Follow the git workflow: Branch from `dev`, feature branches (e.g., `feature/auth-setup`), granular commits, tests before merge. Adhere to SOLID principles and modular design. See `.cursor/rules.md` for details.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Built for Gauntlet AI challenge.
- Inspired by Miro and AI-first methodologies.
