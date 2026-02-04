# CollabBoard Development Rules and Guidelines

## Overview

This document defines the coding standards, architectural principles, and development guidelines for the CollabBoard project. All code contributions must adhere to these rules.

---

## Table of Contents

1. [SOLID Principles](#1-solid-principles)
2. [Modular Design](#2-modular-design)
3. [TypeScript Guidelines](#3-typescript-guidelines)
4. [React Component Guidelines](#4-react-component-guidelines)
5. [Service Layer Guidelines](#5-service-layer-guidelines)
6. [Testing Requirements](#6-testing-requirements)
7. [Documentation Standards](#7-documentation-standards)
8. [Git Workflow](#8-git-workflow)
9. [Code Quality Tools](#9-code-quality-tools)
10. [AI-First Development](#10-ai-first-development)

---

## 1. SOLID Principles

### 1.1 Single Responsibility Principle (SRP)

Each class, module, or function should have exactly one reason to change.

**Rules:**
- Services handle ONE domain concern only
- Components render ONE logical unit
- Functions perform ONE operation
- Files contain ONE primary export

**Examples:**

```typescript
/** GOOD: Single responsibility */
class AuthService {
  async signIn(email: string, password: string): Promise<User> { }
  async signOut(): Promise<void> { }
}

class PresenceService {
  async setOnline(userId: string): Promise<void> { }
  async setOffline(userId: string): Promise<void> { }
}

/** BAD: Multiple responsibilities */
class UserService {
  async signIn() { }           // Auth concern
  async setOnline() { }        // Presence concern
  async updateCursor() { }     // Cursor concern
}
```

### 1.2 Open/Closed Principle (OCP)

Software entities should be open for extension but closed for modification.

**Rules:**
- Use interfaces for extensibility
- Use factory patterns for object creation
- Add new features by adding code, not modifying existing
- Use strategy pattern for behavioral variations

**Examples:**

```typescript
/** GOOD: Extensible via interface */
interface IBoardObject {
  id: string;
  type: string;
  render(): void;
}

class StickyNote implements IBoardObject { }
class Rectangle implements IBoardObject { }
class NewObjectType implements IBoardObject { }  // Added without modification

/** BAD: Requires modification to extend */
class BoardObject {
  render() {
    if (this.type === 'sticky') { }
    else if (this.type === 'rectangle') { }
    // Must modify to add new types
  }
}
```

### 1.3 Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types.

**Rules:**
- All interface implementations must be interchangeable
- Subclasses must not break parent class contracts
- Use abstract methods for required overrides
- Avoid throwing unexpected exceptions in overrides

**Examples:**

```typescript
/** GOOD: Substitutable implementations */
interface ISyncService {
  push(object: IBoardObject): Promise<void>;
}

class FirebaseSyncService implements ISyncService {
  async push(object: IBoardObject): Promise<void> { }
}

class MockSyncService implements ISyncService {
  async push(object: IBoardObject): Promise<void> { }
}

function useSync(service: ISyncService) {
  // Works with any implementation
  await service.push(object);
}
```

### 1.4 Interface Segregation Principle (ISP)

Clients should not depend on interfaces they don't use.

**Rules:**
- Keep interfaces small and focused
- Split large interfaces into capability interfaces
- Classes implement only interfaces they need
- Avoid "fat" interfaces with many methods

**Examples:**

```typescript
/** GOOD: Segregated interfaces */
interface ITransformable {
  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
}

interface IEditable {
  setText(text: string): void;
}

interface IColorable {
  setColor(color: string): void;
}

class StickyNote implements ITransformable, IEditable, IColorable { }
class Connector implements ITransformable, IColorable { }  // Not IEditable

/** BAD: Fat interface */
interface IBoardObject {
  setPosition(): void;
  setSize(): void;
  setText(): void;      // Not all objects have text
  setColor(): void;
  connect(): void;       // Not all objects connect
}
```

### 1.5 Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions.

**Rules:**
- Components receive services via props or context
- Services depend on interfaces, not implementations
- Use dependency injection for testability
- Never instantiate services inside components

**Examples:**

```typescript
/** GOOD: Depends on abstraction */
interface BoardCanvasProps {
  syncService: ISyncService;
  presenceService: IPresenceService;
}

function BoardCanvas({ syncService, presenceService }: BoardCanvasProps) {
  // Uses interfaces, not concrete classes
}

/** BAD: Depends on concretion */
function BoardCanvas() {
  const syncService = new FirebaseSyncService();  // Hardcoded dependency
}
```

---

## 2. Modular Design

### 2.1 Module Structure

Each module must follow this structure:

```
src/{module}/
├── interfaces/          # Public contracts
│   └── I{Service}.ts
├── services/            # Business logic
│   └── {Implementation}.ts
├── hooks/               # React hooks
│   └── use{Feature}.ts
├── components/          # UI components
│   └── {Name}Component.tsx
├── context/             # React context (if needed)
│   └── {Module}Context.tsx
├── utils/               # Module-specific utilities
│   └── {utility}.ts
└── index.ts             # Public exports only
```

### 2.2 Module Independence

**Rules:**
- Modules communicate through well-defined interfaces
- No circular dependencies between modules
- Shared code goes in `shared/` module
- Each module has clear boundaries

**Allowed Dependencies:**

```
auth      → shared
board     → shared, sync
sync      → shared
presence  → shared, auth
ai        → shared, board
```

### 2.3 Public Exports

Only export what's needed by other modules:

```typescript
/** src/auth/index.ts */
export type { IAuthService, User } from './interfaces/IAuthService';
export { useAuth } from './hooks/useAuth';
export { AuthProvider } from './context/AuthContext';
export { LoginComponent } from './components/LoginComponent';

// DO NOT export implementation details
// export { FirebaseAuthService }  // Internal only
```

---

## 3. TypeScript Guidelines

### 3.1 Type Safety

**Rules:**
- Enable `strict: true` in tsconfig
- No `any` type (use `unknown` if truly unknown)
- Explicit return types for functions
- Interface over type for objects

```typescript
/** GOOD */
interface User {
  id: string;
  email: string;
}

function getUser(id: string): User | null {
  // Explicit return type
}

/** BAD */
function getUser(id: any): any {
  // No type safety
}
```

### 3.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Interface | `I` prefix, PascalCase | `IAuthService` |
| Type | PascalCase | `UserRole` |
| Class | PascalCase | `FirebaseAuthService` |
| Function | camelCase | `getUserById` |
| Variable | camelCase | `currentUser` |
| Constant | UPPER_SNAKE | `MAX_OBJECTS` |
| Component | PascalCase | `LoginComponent` |
| Hook | `use` prefix | `useAuth` |

### 3.3 File Naming

| Type | Convention | Example |
|------|------------|---------|
| Interface | `I{Name}.ts` | `IAuthService.ts` |
| Service | `{Name}Service.ts` | `FirebaseAuthService.ts` |
| Component | `{Name}Component.tsx` | `LoginComponent.tsx` |
| Hook | `use{Name}.ts` | `useAuth.ts` |
| Context | `{Name}Context.tsx` | `AuthContext.tsx` |
| Test | `{name}.test.ts` | `auth.test.ts` |
| Utility | `{name}.ts` | `debounce.ts` |

---

## 4. React Component Guidelines

### 4.1 Component Structure

```typescript
/**
 * Component description.
 * 
 * @param props - Component props
 * @returns The rendered component
 */
function MyComponent({ prop1, prop2 }: MyComponentProps): JSX.Element {
  // 1. Hooks (state, context, custom hooks)
  const [state, setState] = useState<Type>(initial);
  const { data } = useContext(MyContext);
  
  // 2. Derived values (useMemo)
  const computed = useMemo(() => expensive(state), [state]);
  
  // 3. Effects (useEffect)
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  // 4. Event handlers
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  // 5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 4.2 Component Rules

**Rules:**
- Functional components only (no class components)
- Props interface named `{Component}Props`
- Memoize expensive computations with `useMemo`
- Memoize callbacks with `useCallback`
- Extract complex logic into custom hooks

### 4.3 Prop Types

```typescript
interface LoginComponentProps {
  /** Called when login succeeds */
  onSuccess: (user: User) => void;
  /** Called when login fails */
  onError?: (error: Error) => void;
  /** Initial email value */
  initialEmail?: string;
}
```

---

## 5. Service Layer Guidelines

### 5.1 Service Interface Pattern

```typescript
/**
 * Authentication service interface.
 * Handles user authentication and session management.
 */
interface IAuthService {
  /**
   * Signs in a user with email and password.
   * @param email - User's email address
   * @param password - User's password
   * @returns The authenticated user
   * @throws AuthError if credentials are invalid
   */
  signIn(email: string, password: string): Promise<User>;
  
  /**
   * Signs out the current user.
   */
  signOut(): Promise<void>;
}
```

### 5.2 Implementation Pattern

```typescript
/**
 * Firebase implementation of IAuthService.
 */
class FirebaseAuthService implements IAuthService {
  private auth: Auth;
  
  constructor(app: FirebaseApp) {
    this.auth = getAuth(app);
  }
  
  async signIn(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.auth, 
        email, 
        password
      );
      return this.mapToUser(credential.user);
    } catch (error) {
      throw new AuthError('Invalid credentials', error);
    }
  }
  
  private mapToUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
    };
  }
}
```

### 5.3 Error Handling

```typescript
/** Custom error class for domain errors */
class AuthError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Always handle errors at service boundaries */
async signIn(email: string, password: string): Promise<User> {
  try {
    // Implementation
  } catch (error) {
    if (error instanceof FirebaseError) {
      throw new AuthError(this.mapFirebaseError(error.code), error);
    }
    throw new AuthError('Unknown error', error);
  }
}
```

---

## 6. Testing Requirements

### 6.1 Coverage Targets

| Type | Target |
|------|--------|
| Overall | 80% |
| Services | 90% |
| Utilities | 95% |
| Components | 70% |

### 6.2 Test File Structure

```typescript
describe('AuthService', () => {
  describe('signIn', () => {
    it('should return user on valid credentials', async () => {
      // Arrange
      const service = new MockAuthService();
      
      // Act
      const result = await service.signIn('test@example.com', 'password');
      
      // Assert
      expect(result).toMatchObject({ email: 'test@example.com' });
    });
    
    it('should throw AuthError on invalid credentials', async () => {
      // Arrange
      const service = new MockAuthService();
      
      // Act & Assert
      await expect(
        service.signIn('wrong@example.com', 'wrong')
      ).rejects.toThrow(AuthError);
    });
  });
});
```

### 6.3 Testing Rules

**Rules:**
- Use Arrange-Act-Assert pattern
- Mock external dependencies
- Test error cases explicitly
- Use meaningful test descriptions
- One assertion per test when possible

---

## 7. Documentation Standards

### 7.1 JSDoc Requirements

All public interfaces, classes, and functions must have JSDoc:

```typescript
/**
 * Creates a new sticky note on the board.
 * 
 * @param text - The text content of the note
 * @param options - Optional configuration
 * @param options.color - Background color (default: 'yellow')
 * @param options.position - Initial position (default: center of viewport)
 * @returns The created sticky note object
 * @throws BoardError if the board is read-only
 * 
 * @example
 * const note = createStickyNote('Hello', { color: 'pink' });
 */
function createStickyNote(
  text: string,
  options?: CreateStickyNoteOptions
): StickyNote {
  // Implementation
}
```

### 7.2 Comment Rules

**DO:**
- Document public APIs with JSDoc
- Explain "why" not "what"
- Document complex algorithms
- Note any non-obvious behavior

**DON'T:**
- Use single-line comments for production code
- Comment obvious code
- Leave commented-out code
- Use comments instead of clear code

---

## 8. Git Workflow

### 8.1 Branch Rules

- **main**: Protected, releases only
- **dev**: Integration branch, all features merge here
- **feature/\***: Branch from dev, merge to dev

### 8.2 Commit Rules

Format: `type(scope): description`

```bash
feat(auth): add email login
fix(sync): resolve race condition
test(board): add selection tests
docs(readme): update setup guide
chore(deps): upgrade TypeScript
```

### 8.3 Merge Rules

- All tests must pass before merge
- No linting errors
- TypeScript must compile
- Code review (or self-review checklist)

See [Git Workflow Guide](../docs/GIT-WORKFLOW.md) for full details.

---

## 9. Code Quality Tools

### 9.1 ESLint

Configuration: `.eslintrc.cjs`

**Key Rules:**
- Airbnb base config
- TypeScript support
- React hooks rules
- Import order enforcement

### 9.2 Prettier

Configuration: `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### 9.3 Pre-commit Hooks

Husky runs on every commit:

1. ESLint (auto-fix)
2. Prettier (auto-format)
3. TypeScript check
4. Test (affected files)

---

## 10. AI-First Development

### 10.1 Using AI Tools

**Allowed:**
- Generate boilerplate code
- Suggest implementations
- Write test cases
- Generate documentation

**Required:**
- Review all AI-generated code
- Ensure SOLID compliance
- Verify type safety
- Run tests

### 10.2 AI Logging

Track AI usage in `docs/ai-log.md`:

```markdown
## Feature: Auth Service

- **Prompt**: "Generate IAuthService interface following SOLID"
- **Tool**: Cursor/Claude
- **% AI Generated**: 70%
- **Manual Changes**: Added error handling, fixed types
```

### 10.3 Documentation MCP

Use Context7 MCP for fetching latest docs:

```
Prompt: "Use Context7 to get latest Firebase RTDB best practices"
```

---

## Quick Reference Checklist

Before committing code, verify:

- [ ] Follows SOLID principles
- [ ] Module structure correct
- [ ] Interfaces defined
- [ ] Services are injectable
- [ ] Components are functional
- [ ] JSDoc documentation added
- [ ] Tests written and passing
- [ ] No linting errors
- [ ] TypeScript compiles
- [ ] Commit message follows convention

---

## Related Documents

- [Comprehensive PRD](../docs/COMPREHENSIVE-PRD.md)
- [Architecture Document](../docs/ARCHITECTURE.md)
- [Git Workflow Guide](../docs/GIT-WORKFLOW.md)
