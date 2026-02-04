# CollabBoard Architecture Document

## Overview

This document describes the technical architecture of CollabBoard, a real-time collaborative whiteboard application. The architecture is designed following SOLID principles and modular design patterns to ensure maintainability, testability, and extensibility.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Module Structure](#2-module-structure)
3. [SOLID Principles Implementation](#3-solid-principles-implementation)
4. [Data Flow Patterns](#4-data-flow-patterns)
5. [Interface Definitions](#5-interface-definitions)
6. [Service Layer Architecture](#6-service-layer-architecture)
7. [Component Architecture](#7-component-architecture)
8. [State Management](#8-state-management)
9. [Real-Time Synchronization](#9-real-time-synchronization)
10. [AI Integration Architecture](#10-ai-integration-architecture)

---

## 1. System Architecture

### 1.1 High-Level Overview

```mermaid
graph TB
    subgraph ClientLayer [Client Layer - Browser]
        UI[React UI Components]
        Canvas[Konva.js Canvas]
        State[React Context + Hooks]
        LocalStore[Local State Cache]
    end
    
    subgraph ServiceLayer [Service Layer - Abstraction]
        AuthSvc[IAuthService]
        SyncSvc[ISyncService]
        PresenceSvc[IPresenceService]
        CursorSvc[ICursorService]
        AISvc[IAIService]
        BoardSvc[IBoardStateService]
    end
    
    subgraph ImplementationLayer [Implementation Layer]
        FirebaseAuth[FirebaseAuthService]
        FirebaseSync[FirebaseSyncService]
        FirebasePresence[FirebasePresenceService]
        FirebaseCursor[FirebaseCursorService]
        OpenAI[OpenAIService]
    end
    
    subgraph ExternalLayer [External Services]
        Firebase[(Firebase RTDB)]
        FireAuth[(Firebase Auth)]
        GPT4[OpenAI GPT-4]
        Netlify[Netlify Hosting]
    end
    
    UI --> State
    Canvas --> State
    State --> ServiceLayer
    
    AuthSvc --> FirebaseAuth
    SyncSvc --> FirebaseSync
    PresenceSvc --> FirebasePresence
    CursorSvc --> FirebaseCursor
    AISvc --> OpenAI
    
    FirebaseAuth --> FireAuth
    FirebaseSync --> Firebase
    FirebasePresence --> Firebase
    FirebaseCursor --> Firebase
    OpenAI --> GPT4
```

### 1.2 Technology Stack Layers

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Presentation** | React + Konva.js | UI rendering, user interactions |
| **State** | React Context + Hooks | Application state management |
| **Service** | TypeScript Interfaces | Business logic abstraction |
| **Implementation** | Firebase SDK, OpenAI SDK | External service integration |
| **Infrastructure** | Netlify, Firebase | Hosting, database, authentication |

---

## 2. Module Structure

### 2.1 Directory Architecture

```
src/
├── auth/                           # Authentication Module
│   ├── interfaces/
│   │   └── IAuthService.ts         # Auth contract
│   ├── services/
│   │   └── FirebaseAuthService.ts  # Firebase implementation
│   ├── hooks/
│   │   └── useAuth.ts              # Auth React hook
│   ├── components/
│   │   ├── LoginComponent.tsx
│   │   ├── SignupComponent.tsx
│   │   └── AuthGuard.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   └── index.ts                    # Public exports
│
├── board/                          # Board Canvas Module
│   ├── interfaces/
│   │   ├── IBoardObject.ts         # Base object contract
│   │   ├── IBoardState.ts          # State contract
│   │   ├── ITransformable.ts       # Transform capability
│   │   ├── IEditable.ts            # Edit capability
│   │   ├── ISelectable.ts          # Selection capability
│   │   └── IColorable.ts           # Color capability
│   ├── objects/
│   │   ├── StickyNote.ts
│   │   ├── Shape.ts
│   │   ├── Rectangle.ts
│   │   ├── Circle.ts
│   │   ├── Line.ts
│   │   ├── Connector.ts
│   │   ├── Frame.ts
│   │   └── ObjectFactory.ts        # Factory pattern
│   ├── services/
│   │   ├── BoardStateService.ts
│   │   └── SelectionService.ts
│   ├── hooks/
│   │   ├── useBoardState.ts
│   │   └── useSelection.ts
│   ├── components/
│   │   ├── BoardCanvasComponent.tsx
│   │   ├── StickyNoteComponent.tsx
│   │   ├── ShapeComponent.tsx
│   │   ├── ConnectorComponent.tsx
│   │   ├── ToolbarComponent.tsx
│   │   └── ZoomControlsComponent.tsx
│   ├── context/
│   │   └── BoardContext.tsx
│   └── index.ts
│
├── sync/                           # Real-Time Sync Module
│   ├── interfaces/
│   │   └── ISyncService.ts
│   ├── services/
│   │   └── FirebaseSyncService.ts
│   ├── hooks/
│   │   └── useBoardSync.ts
│   ├── utils/
│   │   ├── optimisticUpdate.ts
│   │   └── conflictResolution.ts
│   └── index.ts
│
├── presence/                       # User Presence Module
│   ├── interfaces/
│   │   ├── IPresenceService.ts
│   │   └── ICursorService.ts
│   ├── services/
│   │   ├── FirebasePresenceService.ts
│   │   └── FirebaseCursorService.ts
│   ├── hooks/
│   │   ├── usePresence.ts
│   │   └── useCursors.ts
│   ├── components/
│   │   ├── PresenceListComponent.tsx
│   │   ├── CursorOverlayComponent.tsx
│   │   └── UserAvatarComponent.tsx
│   ├── context/
│   │   └── PresenceContext.tsx
│   └── index.ts
│
├── ai/                             # AI Agent Module
│   ├── interfaces/
│   │   └── IAIService.ts
│   ├── services/
│   │   └── OpenAIService.ts
│   ├── tools/
│   │   ├── schemas/
│   │   │   ├── createStickyNote.ts
│   │   │   ├── createShape.ts
│   │   │   ├── moveObjects.ts
│   │   │   └── ...
│   │   ├── executors/
│   │   │   └── ToolExecutor.ts
│   │   └── AITools.ts
│   ├── hooks/
│   │   └── useAICommands.ts
│   ├── components/
│   │   ├── AICommandBarComponent.tsx
│   │   └── AIStatusIndicator.tsx
│   ├── context/
│   │   └── AIContext.tsx
│   └── index.ts
│
└── shared/                         # Shared Utilities
    ├── config/
    │   ├── firebase.ts
    │   └── environment.ts
    ├── types/
    │   ├── common.ts
    │   └── events.ts
    ├── utils/
    │   ├── debounce.ts
    │   ├── throttle.ts
    │   ├── uuid.ts
    │   └── coordinates.ts
    ├── hooks/
    │   └── useEventListener.ts
    └── index.ts
```

### 2.2 Module Dependency Graph

```mermaid
graph TD
    subgraph Core [Core Layer]
        Shared[shared]
    end
    
    subgraph Feature [Feature Modules]
        Auth[auth]
        Board[board]
        Sync[sync]
        Presence[presence]
        AI[ai]
    end
    
    subgraph App [Application]
        Root[App.tsx]
    end
    
    Auth --> Shared
    Board --> Shared
    Board --> Sync
    Sync --> Shared
    Presence --> Shared
    Presence --> Auth
    AI --> Shared
    AI --> Board
    
    Root --> Auth
    Root --> Board
    Root --> Presence
    Root --> AI
    
    style Shared fill:#e1f5fe
    style Auth fill:#fff3e0
    style Board fill:#e8f5e9
    style Sync fill:#fce4ec
    style Presence fill:#f3e5f5
    style AI fill:#fff8e1
```

### 2.3 Module Boundaries and Exports

Each module exposes only its public API through `index.ts`:

```typescript
/** src/auth/index.ts */
export type { IAuthService, User, AuthStateCallback } from './interfaces/IAuthService';
export { FirebaseAuthService } from './services/FirebaseAuthService';
export { useAuth } from './hooks/useAuth';
export { AuthProvider, AuthContext } from './context/AuthContext';
export { LoginComponent } from './components/LoginComponent';
export { AuthGuard } from './components/AuthGuard';
```

---

## 3. SOLID Principles Implementation

### 3.1 Single Responsibility Principle (SRP)

Each class/service has exactly one reason to change:

```mermaid
graph LR
    subgraph SRP [Single Responsibility]
        AuthSvc[AuthService<br/>Authentication Only]
        PresenceSvc[PresenceService<br/>Online Status Only]
        CursorSvc[CursorService<br/>Cursor Position Only]
        SyncSvc[SyncService<br/>Data Sync Only]
        SelectionSvc[SelectionService<br/>Selection State Only]
    end
```

**Example Implementation:**

```typescript
/**
 * AuthService handles ONLY authentication.
 * Presence is handled by PresenceService.
 * Cursors are handled by CursorService.
 */
class FirebaseAuthService implements IAuthService {
  async signIn(email: string, password: string): Promise<User> {
    // ONLY handles sign-in logic
  }
  
  async signOut(): Promise<void> {
    // ONLY handles sign-out logic
    // Does NOT handle presence cleanup (PresenceService does that)
  }
}
```

### 3.2 Open/Closed Principle (OCP)

The system is open for extension but closed for modification:

```mermaid
classDiagram
    class IBoardObject {
        <<interface>>
        +id: string
        +type: string
        +x: number
        +y: number
    }
    
    class StickyNote {
        +text: string
    }
    
    class Shape {
        +shapeType: string
    }
    
    class Image {
        +src: string
    }
    
    class Video {
        +videoUrl: string
    }
    
    IBoardObject <|-- StickyNote : implements
    IBoardObject <|-- Shape : implements
    IBoardObject <|-- Image : can be added
    IBoardObject <|-- Video : can be added
    
    note for IBoardObject "New object types can be added\nwithout modifying existing code"
```

**Factory Pattern for Extension:**

```typescript
class ObjectFactory {
  private creators = new Map<string, ObjectCreator>();
  
  /** Register new object types at runtime */
  register(type: string, creator: ObjectCreator): void {
    this.creators.set(type, creator);
  }
  
  /** Create objects without knowing concrete types */
  create(type: string, props: Partial<IBoardObject>): IBoardObject {
    const creator = this.creators.get(type);
    if (!creator) throw new Error(`Unknown type: ${type}`);
    return creator(props);
  }
}

// Registration at startup
factory.register('sticky-note', (props) => new StickyNote(props));
factory.register('rectangle', (props) => new Rectangle(props));
// New types can be added without modifying factory
factory.register('image', (props) => new ImageObject(props));
```

### 3.3 Liskov Substitution Principle (LSP)

All implementations are substitutable for their base interfaces:

```mermaid
classDiagram
    class ISyncService {
        <<interface>>
        +push(object): Promise
        +subscribe(callback): Unsubscribe
        +delete(id): Promise
    }
    
    class FirebaseSyncService {
        +push(object): Promise
        +subscribe(callback): Unsubscribe
        +delete(id): Promise
    }
    
    class MockSyncService {
        +push(object): Promise
        +subscribe(callback): Unsubscribe
        +delete(id): Promise
    }
    
    class SupabaseSyncService {
        +push(object): Promise
        +subscribe(callback): Unsubscribe
        +delete(id): Promise
    }
    
    ISyncService <|.. FirebaseSyncService : implements
    ISyncService <|.. MockSyncService : implements
    ISyncService <|.. SupabaseSyncService : can swap
    
    note for ISyncService "Any implementation can be used\nwherever ISyncService is expected"
```

**Usage Example:**

```typescript
/** Component depends on interface, not implementation */
interface BoardProps {
  syncService: ISyncService;  // Any implementation works
}

function BoardCanvas({ syncService }: BoardProps) {
  // Works with FirebaseSyncService, MockSyncService, etc.
  useEffect(() => {
    return syncService.subscribe((objects) => {
      setObjects(objects);
    });
  }, [syncService]);
}

// Production
<BoardCanvas syncService={new FirebaseSyncService()} />

// Testing
<BoardCanvas syncService={new MockSyncService()} />
```

### 3.4 Interface Segregation Principle (ISP)

Small, focused interfaces instead of large monolithic ones:

```mermaid
classDiagram
    class ITransformable {
        <<interface>>
        +setPosition(x, y)
        +setSize(width, height)
        +setRotation(degrees)
    }
    
    class IEditable {
        <<interface>>
        +text: string
        +setText(text)
        +isEditing: boolean
    }
    
    class ISelectable {
        <<interface>>
        +isSelected: boolean
        +setSelected(selected)
    }
    
    class IColorable {
        <<interface>>
        +color: string
        +setColor(color)
    }
    
    class IConnectable {
        <<interface>>
        +getConnectionPoint(position)
    }
    
    class StickyNote {
        +implements all except IConnectable
    }
    
    class Connector {
        +implements ITransformable, ISelectable, IColorable
        +does NOT implement IEditable
    }
    
    ITransformable <|.. StickyNote
    IEditable <|.. StickyNote
    ISelectable <|.. StickyNote
    IColorable <|.. StickyNote
    
    ITransformable <|.. Connector
    ISelectable <|.. Connector
    IColorable <|.. Connector
```

**Implementation:**

```typescript
/** StickyNote implements only what it needs */
class StickyNote implements 
  IBoardObject, 
  ITransformable, 
  IEditable, 
  ISelectable, 
  IColorable 
{
  // Does NOT implement IConnectable
  // because sticky notes aren't connector endpoints
}

/** Connector implements only what it needs */
class Connector implements 
  IBoardObject, 
  ITransformable, 
  ISelectable, 
  IColorable 
{
  // Does NOT implement IEditable
  // because connectors don't have editable text
}
```

### 3.5 Dependency Inversion Principle (DIP)

High-level modules depend on abstractions, not concretions:

```mermaid
graph TB
    subgraph HighLevel [High-Level Modules]
        BoardCanvas[BoardCanvas Component]
        AICommandBar[AICommandBar Component]
    end
    
    subgraph Abstractions [Abstractions - Interfaces]
        ISyncService[ISyncService]
        IPresenceService[IPresenceService]
        IAIService[IAIService]
    end
    
    subgraph LowLevel [Low-Level Modules]
        FirebaseSync[FirebaseSyncService]
        FirebasePresence[FirebasePresenceService]
        OpenAI[OpenAIService]
    end
    
    BoardCanvas --> ISyncService
    BoardCanvas --> IPresenceService
    AICommandBar --> IAIService
    
    FirebaseSync -.-> ISyncService
    FirebasePresence -.-> IPresenceService
    OpenAI -.-> IAIService
    
    style Abstractions fill:#e8f5e9
```

**Dependency Injection Container:**

```typescript
interface ServiceContainer {
  authService: IAuthService;
  syncService: ISyncService;
  presenceService: IPresenceService;
  cursorService: ICursorService;
  aiService: IAIService;
}

/** Factory creates appropriate implementations */
function createProductionServices(): ServiceContainer {
  return {
    authService: new FirebaseAuthService(),
    syncService: new FirebaseSyncService(),
    presenceService: new FirebasePresenceService(),
    cursorService: new FirebaseCursorService(),
    aiService: new OpenAIService(),
  };
}

function createTestServices(): ServiceContainer {
  return {
    authService: new MockAuthService(),
    syncService: new MockSyncService(),
    presenceService: new MockPresenceService(),
    cursorService: new MockCursorService(),
    aiService: new MockAIService(),
  };
}

/** Provider injects services into component tree */
function ServiceProvider({ children, services }: Props) {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}
```

---

## 4. Data Flow Patterns

### 4.1 Unidirectional Data Flow

```mermaid
graph LR
    Action[User Action] --> Dispatch[Dispatch]
    Dispatch --> Reducer[Reducer/Handler]
    Reducer --> State[New State]
    State --> View[View Update]
    View --> Action
```

### 4.2 Optimistic Update Pattern

```mermaid
sequenceDiagram
    participant User
    participant LocalState
    participant OptimisticLayer
    participant SyncService
    participant Firebase
    
    User->>LocalState: Create sticky note
    LocalState->>OptimisticLayer: Apply immediately
    OptimisticLayer->>User: Show note (instant)
    OptimisticLayer->>SyncService: Push async
    SyncService->>Firebase: Write to RTDB
    
    alt Success
        Firebase->>SyncService: Confirm
        SyncService->>OptimisticLayer: Commit
    else Failure
        Firebase->>SyncService: Error
        SyncService->>OptimisticLayer: Rollback
        OptimisticLayer->>User: Remove note
        OptimisticLayer->>User: Show error
    end
```

### 4.3 Real-Time Subscription Flow

```mermaid
sequenceDiagram
    participant Component
    participant Hook
    participant Service
    participant Firebase
    
    Component->>Hook: useBoardSync(boardId)
    Hook->>Service: subscribe(boardId, callback)
    Service->>Firebase: onValue(ref)
    
    loop On every change
        Firebase->>Service: Snapshot
        Service->>Hook: callback(objects)
        Hook->>Component: setState(objects)
        Component->>Component: Re-render
    end
    
    Component->>Hook: Unmount
    Hook->>Service: unsubscribe()
    Service->>Firebase: off()
```

---

## 5. Interface Definitions

### 5.1 Core Interfaces

```typescript
/** Base board object interface */
interface IBoardObject {
  readonly id: string;
  readonly type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  readonly createdAt: number;
  updatedAt: number;
}

/** Board state interface */
interface IBoardState {
  objects: Map<string, IBoardObject>;
  viewportX: number;
  viewportY: number;
  scale: number;
  selectedIds: Set<string>;
}

/** Capability interfaces */
interface ITransformable {
  setPosition(x: number, y: number): void;
  setSize(width: number, height: number): void;
  setRotation(degrees: number): void;
}

interface IEditable {
  text: string;
  setText(text: string): void;
  isEditing: boolean;
  setEditing(editing: boolean): void;
}

interface ISelectable {
  isSelected: boolean;
  setSelected(selected: boolean): void;
}

interface IColorable {
  color: string;
  setColor(color: string): void;
}
```

### 5.2 Service Interfaces

```typescript
/** Authentication service */
interface IAuthService {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: AuthStateCallback): Unsubscribe;
}

/** Synchronization service */
interface ISyncService {
  push(object: IBoardObject): Promise<void>;
  pushBatch(objects: IBoardObject[]): Promise<void>;
  subscribe(boardId: string, callback: SyncCallback): Unsubscribe;
  delete(objectId: string): Promise<void>;
  deleteBatch(objectIds: string[]): Promise<void>;
}

/** Presence service */
interface IPresenceService {
  setOnline(userId: string, displayName: string): Promise<void>;
  setOffline(userId: string): Promise<void>;
  subscribeToPresence(boardId: string, callback: PresenceCallback): Unsubscribe;
  getOnlineUsers(boardId: string): Promise<OnlineUser[]>;
}

/** Cursor service */
interface ICursorService {
  updatePosition(userId: string, x: number, y: number): Promise<void>;
  subscribeToAllCursors(boardId: string, callback: CursorCallback): Unsubscribe;
  removeCursor(userId: string): Promise<void>;
}

/** AI service */
interface IAIService {
  processCommand(command: string, boardState: IBoardObject[]): Promise<ToolCall[]>;
  executeTool(toolCall: ToolCall, boardService: IBoardStateService): Promise<void>;
  getAvailableTools(): ToolDefinition[];
}
```

---

## 6. Service Layer Architecture

### 6.1 Service Hierarchy

```mermaid
graph TB
    subgraph Application [Application Services]
        BoardState[BoardStateService]
        Selection[SelectionService]
    end
    
    subgraph Infrastructure [Infrastructure Services]
        Auth[AuthService]
        Sync[SyncService]
        Presence[PresenceService]
        Cursor[CursorService]
        AI[AIService]
    end
    
    subgraph External [External Adapters]
        FirebaseAdapter[Firebase Adapter]
        OpenAIAdapter[OpenAI Adapter]
    end
    
    BoardState --> Sync
    Selection --> BoardState
    
    Auth --> FirebaseAdapter
    Sync --> FirebaseAdapter
    Presence --> FirebaseAdapter
    Cursor --> FirebaseAdapter
    AI --> OpenAIAdapter
```

### 6.2 Service Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: new Service()
    Created --> Initialized: initialize()
    Initialized --> Active: start()
    Active --> Subscribed: subscribe()
    Subscribed --> Active: unsubscribe()
    Active --> Stopped: stop()
    Stopped --> [*]: dispose()
```

---

## 7. Component Architecture

### 7.1 Component Hierarchy

```mermaid
graph TB
    App[App]
    App --> AuthProvider
    AuthProvider --> PresenceProvider
    PresenceProvider --> BoardProvider
    BoardProvider --> AIProvider
    AIProvider --> MainLayout
    
    MainLayout --> Header
    MainLayout --> BoardCanvas
    MainLayout --> Sidebar
    
    Header --> PresenceList
    Header --> ZoomControls
    Header --> AICommandBar
    
    BoardCanvas --> ObjectLayer
    BoardCanvas --> CursorLayer
    BoardCanvas --> SelectionLayer
    
    ObjectLayer --> StickyNote[StickyNoteComponent]
    ObjectLayer --> Shape[ShapeComponent]
    ObjectLayer --> Connector[ConnectorComponent]
    
    Sidebar --> Toolbar
    Sidebar --> PropertyPanel
```

### 7.2 Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `App` | Root component, provider composition |
| `AuthProvider` | Authentication context |
| `BoardProvider` | Board state context |
| `PresenceProvider` | Presence/cursor context |
| `AIProvider` | AI service context |
| `BoardCanvas` | Konva stage management |
| `ObjectLayer` | Object rendering |
| `CursorLayer` | Remote cursor rendering |
| `Toolbar` | Tool selection UI |

---

## 8. State Management

### 8.1 State Architecture

```mermaid
graph TB
    subgraph GlobalState [Global State - React Context]
        AuthState[Auth State]
        BoardState[Board State]
        PresenceState[Presence State]
        AIState[AI State]
    end
    
    subgraph LocalState [Local Component State]
        UIState[UI State]
        FormState[Form State]
        AnimationState[Animation State]
    end
    
    subgraph DerivedState [Derived State - useMemo]
        VisibleObjects[Visible Objects]
        SelectedObjects[Selected Objects]
        OnlineUsers[Online Users]
    end
    
    BoardState --> VisibleObjects
    BoardState --> SelectedObjects
    PresenceState --> OnlineUsers
```

### 8.2 State Flow

```typescript
/** Board State Structure */
interface BoardStateContextValue {
  // State
  objects: Map<string, IBoardObject>;
  selectedIds: Set<string>;
  viewportX: number;
  viewportY: number;
  scale: number;
  
  // Actions
  addObject(object: IBoardObject): void;
  updateObject(id: string, updates: Partial<IBoardObject>): void;
  deleteObject(id: string): void;
  selectObject(id: string, additive?: boolean): void;
  clearSelection(): void;
  setViewport(x: number, y: number, scale: number): void;
}
```

---

## 9. Real-Time Synchronization

### 9.1 Sync Architecture

```mermaid
graph LR
    subgraph Client1 [Client 1]
        L1[Local State]
        O1[Optimistic Layer]
    end
    
    subgraph Firebase [Firebase RTDB]
        DB[(Database)]
    end
    
    subgraph Client2 [Client 2]
        L2[Local State]
        O2[Optimistic Layer]
    end
    
    L1 --> O1
    O1 -->|Push| DB
    DB -->|Broadcast| O1
    DB -->|Broadcast| O2
    O2 --> L2
```

### 9.2 Conflict Resolution

```mermaid
sequenceDiagram
    participant Client1
    participant Firebase
    participant Client2
    
    Note over Client1,Client2: Both edit same object
    
    Client1->>Firebase: Update (timestamp: 1000)
    Client2->>Firebase: Update (timestamp: 1001)
    
    Note over Firebase: Last-write-wins
    Firebase->>Firebase: Keep timestamp: 1001
    
    Firebase->>Client1: Broadcast (timestamp: 1001)
    Firebase->>Client2: Broadcast (timestamp: 1001)
    
    Note over Client1,Client2: Both have same state
```

### 9.3 Offline Support

```mermaid
stateDiagram-v2
    [*] --> Online
    Online --> Offline: Connection lost
    
    state Offline {
        [*] --> LocalQueue
        LocalQueue --> LocalQueue: Queue changes
    }
    
    Offline --> Reconnecting: Connection restored
    
    state Reconnecting {
        [*] --> SyncQueue
        SyncQueue --> ResolveConflicts
        ResolveConflicts --> [*]
    }
    
    Reconnecting --> Online: Sync complete
```

---

## 10. AI Integration Architecture

### 10.1 AI Command Processing

```mermaid
graph TB
    subgraph Input [User Input]
        Command[Natural Language Command]
    end
    
    subgraph Processing [AI Processing]
        Parser[Command Parser]
        Context[Board Context Builder]
        OpenAI[OpenAI GPT-4]
        ToolMapper[Tool Call Mapper]
    end
    
    subgraph Execution [Tool Execution]
        Queue[Command Queue]
        Executor[Tool Executor]
        BoardService[Board Service]
    end
    
    subgraph Output [Output]
        BoardUpdate[Board Update]
        Sync[Sync to Users]
    end
    
    Command --> Parser
    Parser --> Context
    Context --> OpenAI
    OpenAI --> ToolMapper
    ToolMapper --> Queue
    Queue --> Executor
    Executor --> BoardService
    BoardService --> BoardUpdate
    BoardUpdate --> Sync
```

### 10.2 AI Tool Registry

```typescript
const aiTools: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "createStickyNote",
      description: "Creates a new sticky note",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          color: { type: "string", enum: ["yellow", "pink", "blue", "green"] },
          x: { type: "number" },
          y: { type: "number" }
        },
        required: ["text"]
      }
    }
  },
  // ... more tools
];
```

### 10.3 Multi-Step Command Flow

```mermaid
sequenceDiagram
    participant User
    participant AIService
    participant OpenAI
    participant Executor
    participant Board
    
    User->>AIService: "Create SWOT template"
    AIService->>OpenAI: Process with tools
    
    OpenAI->>AIService: Tool calls:
    Note right of OpenAI: 1. createFrame(Strengths)<br/>2. createFrame(Weaknesses)<br/>3. createFrame(Opportunities)<br/>4. createFrame(Threats)
    
    loop Each tool call
        AIService->>Executor: Execute tool
        Executor->>Board: Create object
        Board->>Board: Update state
    end
    
    Board->>User: Show complete template
```

---

## Related Documents

- [Comprehensive PRD](./COMPREHENSIVE-PRD.md)
- [Git Workflow](./GIT-WORKFLOW.md)
- [Tech Stack Guides](./tech-guides/)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Feb 04, 2026 | Initial architecture document |
