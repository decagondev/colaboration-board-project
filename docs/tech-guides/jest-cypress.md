# Jest and Cypress Testing Guide for Real-Time React Apps (2026)

Comprehensive testing for CollabBoard requires unit tests (Jest), component tests (React Testing Library), and end-to-end tests (Cypress) to ensure reliability of real-time collaboration features.

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Jest Setup](#jest-setup)
- [React Testing Library](#react-testing-library)
- [Mocking Firebase](#mocking-firebase)
- [Cypress Setup](#cypress-setup)
- [E2E Testing Patterns](#e2e-testing-patterns)
- [Testing Real-Time Features](#testing-real-time-features)
- [CI Integration](#ci-integration)
- [Resources](#resources)

---

## Testing Strategy

### Testing Pyramid for CollabBoard

```
         ╱╲
        ╱  ╲
       ╱ E2E╲        Cypress: Critical user flows
      ╱──────╲       (login, create board, collaborate)
     ╱        ╲
    ╱Integration╲    Jest + RTL: Component interactions
   ╱────────────╲    (Board component, Canvas, Toolbar)
  ╱              ╲
 ╱   Unit Tests   ╲  Jest: Pure functions, hooks
╱──────────────────╲ (utils, reducers, custom hooks)
```

### What to Test

| Layer | Tool | What to Test |
|-------|------|--------------|
| Unit | Jest | Utility functions, reducers, pure logic |
| Component | RTL | React components, hooks, user interactions |
| Integration | RTL | Multiple components working together |
| E2E | Cypress | Full user flows, real-time collaboration |

---

## Jest Setup

### Step 1: Install Dependencies

```bash
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom
```

### Step 2: Jest Configuration

`jest.config.ts`:

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/test/__mocks__/fileMock.ts',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/main.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

export default config;
```

### Step 3: Test Setup File

`src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### Step 4: Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## React Testing Library

### Testing Components

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Board } from '../components/Board';
import { BoardProvider } from '../contexts/BoardContext';

/**
 * Test wrapper that provides necessary context.
 */
function renderWithProviders(ui: React.ReactElement) {
  return render(
    <BoardProvider>
      {ui}
    </BoardProvider>
  );
}

describe('Board Component', () => {
  it('renders the canvas stage', () => {
    renderWithProviders(<Board boardId="test-board" />);
    
    expect(screen.getByTestId('canvas-stage')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    renderWithProviders(<Board boardId="test-board" />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows board name after loading', async () => {
    renderWithProviders(<Board boardId="test-board" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Board')).toBeInTheDocument();
    });
  });
});
```

### Testing User Interactions

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '../components/Toolbar';

describe('Toolbar Component', () => {
  const mockOnToolSelect = jest.fn();

  beforeEach(() => {
    mockOnToolSelect.mockClear();
  });

  it('selects rectangle tool when clicked', async () => {
    const user = userEvent.setup();
    
    render(<Toolbar selectedTool="select" onToolSelect={mockOnToolSelect} />);
    
    await user.click(screen.getByRole('button', { name: /rectangle/i }));
    
    expect(mockOnToolSelect).toHaveBeenCalledWith('rect');
  });

  it('highlights the selected tool', () => {
    render(<Toolbar selectedTool="rect" onToolSelect={mockOnToolSelect} />);
    
    const rectButton = screen.getByRole('button', { name: /rectangle/i });
    expect(rectButton).toHaveClass('selected');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(<Toolbar selectedTool="select" onToolSelect={mockOnToolSelect} />);
    
    await user.tab();
    await user.keyboard('{Enter}');
    
    expect(mockOnToolSelect).toHaveBeenCalled();
  });
});
```

### Testing Custom Hooks

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBoardObjects } from '../hooks/useBoardObjects';
import { mockFirebaseData } from '../test/__mocks__/firebase';

jest.mock('firebase/database');

describe('useBoardObjects Hook', () => {
  it('returns empty array initially', () => {
    const { result } = renderHook(() => useBoardObjects('board-1'));
    
    expect(result.current.objects).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it('loads objects from Firebase', async () => {
    mockFirebaseData('boardObjects/board-1', {
      'obj-1': { type: 'rect', x: 100, y: 100 },
      'obj-2': { type: 'circle', x: 200, y: 200 },
    });

    const { result } = renderHook(() => useBoardObjects('board-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.objects).toHaveLength(2);
    expect(result.current.objects[0]).toMatchObject({
      id: 'obj-1',
      type: 'rect',
    });
  });

  it('handles errors gracefully', async () => {
    mockFirebaseData('boardObjects/board-1', null, new Error('Network error'));

    const { result } = renderHook(() => useBoardObjects('board-1'));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error?.message).toContain('Network error');
  });
});
```

---

## Mocking Firebase

### Firebase Mock Setup

`src/test/__mocks__/firebase.ts`:

```typescript
import { jest } from '@jest/globals';

type SnapshotCallback = (snapshot: { val: () => any; exists: () => boolean }) => void;

const listeners: Map<string, SnapshotCallback[]> = new Map();
const mockData: Map<string, any> = new Map();

/**
 * Set mock data for a Firebase path.
 */
export function mockFirebaseData(path: string, data: any, error?: Error) {
  if (error) {
    mockData.set(path, { error });
  } else {
    mockData.set(path, { data });
  }
  
  const callbacks = listeners.get(path) || [];
  callbacks.forEach((cb) => {
    cb({
      val: () => data,
      exists: () => data !== null,
    });
  });
}

/**
 * Clear all mock data.
 */
export function clearFirebaseMocks() {
  listeners.clear();
  mockData.clear();
}

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn((db, path) => ({ path })),
  onValue: jest.fn((refObj, callback) => {
    const path = refObj.path;
    const existing = listeners.get(path) || [];
    listeners.set(path, [...existing, callback]);
    
    const data = mockData.get(path);
    if (data) {
      callback({
        val: () => data.data,
        exists: () => data.data !== null,
      });
    }
    
    return () => {
      const cbs = listeners.get(path) || [];
      listeners.set(path, cbs.filter((cb) => cb !== callback));
    };
  }),
  set: jest.fn(() => Promise.resolve()),
  update: jest.fn(() => Promise.resolve()),
  push: jest.fn(() => ({ key: `mock-key-${Date.now()}` })),
  remove: jest.fn(() => Promise.resolve()),
  serverTimestamp: jest.fn(() => Date.now()),
}));
```

### Using Mocks in Tests

```tsx
import { mockFirebaseData, clearFirebaseMocks } from '../test/__mocks__/firebase';

describe('Board with Firebase', () => {
  beforeEach(() => {
    clearFirebaseMocks();
  });

  it('syncs new objects to Firebase', async () => {
    const { set } = await import('firebase/database');
    
    mockFirebaseData('boards/test-board', { name: 'Test Board' });
    
    renderWithProviders(<Board boardId="test-board" />);
    
    const addButton = await screen.findByRole('button', { name: /add rectangle/i });
    await userEvent.click(addButton);
    
    expect(set).toHaveBeenCalled();
  });
});
```

---

## Cypress Setup

### Step 1: Install Cypress

```bash
npm install --save-dev cypress @testing-library/cypress
```

### Step 2: Cypress Configuration

`cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      on('task', {
        clearFirebaseData: async () => {
          return null;
        },
        seedFirebaseData: async (data) => {
          return null;
        },
      });
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
```

### Step 3: Support File

`cypress/support/e2e.ts`:

```typescript
import '@testing-library/cypress/add-commands';

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createBoard(name: string): Chainable<string>;
      addObject(type: string, x: number, y: number): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.findByLabelText(/email/i).type(email);
  cy.findByLabelText(/password/i).type(password);
  cy.findByRole('button', { name: /sign in/i }).click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('createBoard', (name: string) => {
  cy.findByRole('button', { name: /create board/i }).click();
  cy.findByLabelText(/board name/i).type(name);
  cy.findByRole('button', { name: /create/i }).click();
  cy.url().should('match', /\/board\/[\w-]+/);
  return cy.url().then((url) => url.split('/').pop()!);
});

Cypress.Commands.add('addObject', (type: string, x: number, y: number) => {
  cy.findByRole('button', { name: new RegExp(type, 'i') }).click();
  cy.get('[data-testid="canvas-stage"]').click(x, y);
});
```

### Step 4: Package.json Scripts

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "cy:run": "cypress run",
    "cy:run:ci": "start-server-and-test dev http://localhost:5173 cy:run"
  }
}
```

---

## E2E Testing Patterns

### Authentication Flow

```typescript
describe('Authentication', () => {
  beforeEach(() => {
    cy.task('clearFirebaseData');
  });

  it('allows user to sign up and access dashboard', () => {
    cy.visit('/signup');
    
    cy.findByLabelText(/email/i).type('test@example.com');
    cy.findByLabelText(/password/i).type('securePassword123');
    cy.findByLabelText(/confirm password/i).type('securePassword123');
    cy.findByRole('button', { name: /sign up/i }).click();
    
    cy.url().should('include', '/dashboard');
    cy.findByText(/welcome/i).should('be.visible');
  });

  it('shows error for invalid credentials', () => {
    cy.visit('/login');
    
    cy.findByLabelText(/email/i).type('wrong@example.com');
    cy.findByLabelText(/password/i).type('wrongPassword');
    cy.findByRole('button', { name: /sign in/i }).click();
    
    cy.findByText(/invalid email or password/i).should('be.visible');
  });
});
```

### Board Collaboration Flow

```typescript
describe('Board Collaboration', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123');
  });

  it('creates a new board and adds objects', () => {
    cy.createBoard('My Test Board');
    
    cy.findByTestId('canvas-stage').should('be.visible');
    
    cy.addObject('rectangle', 200, 200);
    cy.get('[data-testid="board-object"]').should('have.length', 1);
    
    cy.addObject('sticky', 400, 200);
    cy.get('[data-testid="board-object"]').should('have.length', 2);
  });

  it('drags objects to new positions', () => {
    cy.visit('/board/existing-board-id');
    
    cy.get('[data-testid="board-object"]')
      .first()
      .trigger('mousedown', { which: 1 })
      .trigger('mousemove', { clientX: 500, clientY: 300 })
      .trigger('mouseup');
    
    cy.get('[data-testid="board-object"]')
      .first()
      .should('have.attr', 'data-x', '500');
  });
});
```

### AI Command Bar

```typescript
describe('AI Command Bar', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'password123');
    cy.visit('/board/test-board');
  });

  it('creates SWOT template via AI command', () => {
    cy.findByRole('textbox', { name: /ai command/i })
      .type('Create a SWOT analysis template in the center');
    
    cy.findByRole('button', { name: /send/i }).click();
    
    cy.findByText(/created.*swot/i, { timeout: 10000 }).should('be.visible');
    
    cy.get('[data-testid="board-object"]').should('have.length.at.least', 4);
  });
});
```

---

## Testing Real-Time Features

### Multi-User Simulation

```typescript
describe('Real-Time Collaboration', () => {
  it('shows cursor positions from other users', () => {
    cy.login('user1@example.com', 'password123');
    cy.visit('/board/shared-board');
    
    cy.task('simulateRemoteCursor', {
      boardId: 'shared-board',
      userId: 'user-2',
      userName: 'User 2',
      x: 300,
      y: 400,
    });
    
    cy.get('[data-testid="remote-cursor"]')
      .should('be.visible')
      .and('contain', 'User 2');
  });

  it('syncs object changes in real-time', () => {
    cy.login('user1@example.com', 'password123');
    cy.visit('/board/shared-board');
    
    cy.task('createRemoteObject', {
      boardId: 'shared-board',
      object: {
        type: 'sticky',
        x: 500,
        y: 300,
        content: 'Added by User 2',
      },
    });
    
    cy.findByText('Added by User 2').should('be.visible');
  });
});
```

### Offline/Online Transitions

```typescript
describe('Offline Support', () => {
  it('queues changes when offline and syncs when back online', () => {
    cy.login('user@example.com', 'password123');
    cy.visit('/board/test-board');
    
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new Event('offline'));
    });
    
    cy.findByText(/offline/i).should('be.visible');
    
    cy.addObject('sticky', 200, 200);
    cy.get('[data-testid="board-object"]').should('have.length', 1);
    
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(true);
      win.dispatchEvent(new Event('online'));
    });
    
    cy.findByText(/synced/i).should('be.visible');
  });
});
```

---

## CI Integration

### GitHub Actions Workflow

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Cypress run
        uses: cypress-io/github-action@v6
        with:
          build: npm run build
          start: npm run preview
          wait-on: 'http://localhost:4173'
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

---

## Resources

### Official Documentation
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Cypress Documentation](https://docs.cypress.io/)

### Tutorials
- [Testing React Apps](https://testing-library.com/docs/react-testing-library/example-intro)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

### Related CollabBoard Guides
- [React Guide](./react.md) - Component patterns
- [Firebase RTDB Guide](./firebase-rtdb.md) - Mocking strategies
- [ESLint/Prettier Guide](./eslint-prettier.md) - Test file linting
