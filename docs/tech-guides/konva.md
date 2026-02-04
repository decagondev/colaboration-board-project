# Konva.js Guide for Infinite Canvas and Real-Time Collaboration (2026)

Konva.js is the 2D canvas library powering CollabBoard's infinite board, enabling high-performance rendering of shapes, text, images, and real-time cursor overlays. It provides a robust event system for pan/zoom interactions and drag operations essential for collaborative whiteboard functionality.

## Table of Contents

- [Key Concepts and Architecture](#key-concepts-and-architecture)
- [Setup and Installation](#setup-and-installation)
- [Implementing an Infinite Canvas](#implementing-an-infinite-canvas)
- [Shape Rendering and Manipulation](#shape-rendering-and-manipulation)
- [Real-Time Collaboration Features](#real-time-collaboration-features)
- [Performance Optimization](#performance-optimization)
- [Integration with CollabBoard Stack](#integration-with-collabboard-stack)
- [Resources](#resources)

---

## Key Concepts and Architecture

### Stages and Layers

Konva uses a hierarchical structure for organizing canvas content:

```
Stage (root container)
├── Layer (object layer)
│   ├── Rect, Circle, Text, Image...
│   └── Group (container for related shapes)
├── Layer (cursor layer)
│   └── Cursors and selections
└── Layer (UI overlay layer)
    └── Selection rectangles, guides
```

**Key principles:**
- **Stage**: The root container that maps to a canvas element. One per canvas view.
- **Layers**: Separate canvases stacked on top of each other. Each layer has its own canvas buffer.
- **Groups**: Logical containers for shapes that move/transform together.
- **Shapes**: Primitive objects (Rect, Circle, Line, Text, Image, etc.).

```tsx
import { Stage, Layer, Group, Rect, Text } from 'react-konva';

/**
 * Basic Konva stage structure with multiple layers for different concerns.
 * Separating layers improves rendering performance by isolating redraws.
 */
function CanvasStructure() {
  return (
    <Stage width={800} height={600}>
      {/* Main content layer - objects, shapes, text */}
      <Layer name="content">
        <Group draggable>
          <Rect x={50} y={50} width={100} height={100} fill="blue" />
          <Text x={50} y={160} text="Label" />
        </Group>
      </Layer>

      {/* Cursor layer - updated frequently, separate for performance */}
      <Layer name="cursors" listening={false}>
        {/* Remote user cursors rendered here */}
      </Layer>

      {/* UI overlay layer - selection boxes, guides */}
      <Layer name="ui" listening={false}>
        {/* Selection rectangles, alignment guides */}
      </Layer>
    </Stage>
  );
}
```

### Coordinate Systems

Understanding Konva's coordinate system is essential for infinite canvas:

- **Stage coordinates**: Absolute position on the canvas element.
- **Layer coordinates**: Position relative to the layer (affected by layer offset).
- **Local coordinates**: Position relative to a shape's parent group.

```tsx
/**
 * Convert screen (pointer) coordinates to canvas (stage) coordinates.
 * Essential for placing objects where the user clicks on an infinite canvas.
 *
 * @param stage - Reference to the Konva stage
 * @param clientX - Mouse X position in viewport
 * @param clientY - Mouse Y position in viewport
 * @returns Canvas coordinates adjusted for pan and zoom
 */
function screenToCanvas(
  stage: Konva.Stage,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const transform = stage.getAbsoluteTransform().copy().invert();
  const pos = stage.getPointerPosition();
  
  if (!pos) return { x: 0, y: 0 };
  
  return transform.point(pos);
}
```

---

## Setup and Installation

### Step 1: Install Dependencies

```bash
npm install konva react-konva
```

For TypeScript projects, types are included in the main packages.

### Step 2: Basic Stage Setup

```tsx
import { Stage, Layer, Rect } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import Konva from 'konva';

interface CanvasProps {
  width: number;
  height: number;
}

/**
 * Basic Konva canvas component with responsive sizing.
 * Handles window resize to maintain full-viewport coverage.
 */
export function Canvas({ width, height }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Stage
      ref={stageRef}
      width={dimensions.width}
      height={dimensions.height}
    >
      <Layer>
        <Rect x={100} y={100} width={50} height={50} fill="red" />
      </Layer>
    </Stage>
  );
}
```

---

## Implementing an Infinite Canvas

### Pan and Zoom with Mouse/Touch

The infinite canvas illusion is created by transforming the stage position and scale:

```tsx
import { Stage, Layer } from 'react-konva';
import { useRef, useState, useCallback } from 'react';
import Konva from 'konva';

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const ZOOM_SENSITIVITY = 1.1;

/**
 * Infinite canvas component with pan and zoom functionality.
 * Supports mouse wheel zoom, drag-to-pan, and touch gestures.
 */
export function InfiniteCanvas({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<Konva.Stage>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0,
    y: 0,
    scale: 1,
  });

  /**
   * Handle mouse wheel for zooming.
   * Zooms toward the pointer position for natural feel.
   */
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = viewport.scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(
      MIN_SCALE,
      Math.min(MAX_SCALE, direction > 0 ? oldScale * ZOOM_SENSITIVITY : oldScale / ZOOM_SENSITIVITY)
    );

    setViewport({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, [viewport]);

  /**
   * Handle stage drag for panning.
   * Updates viewport offset as user drags.
   */
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    if (e.target === stageRef.current) {
      setViewport((prev) => ({
        ...prev,
        x: e.target.x(),
        y: e.target.y(),
      }));
    }
  }, []);

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight}
      x={viewport.x}
      y={viewport.y}
      scaleX={viewport.scale}
      scaleY={viewport.scale}
      draggable
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
    >
      {children}
    </Stage>
  );
}
```

### Viewport Culling for Performance

Only render objects visible in the current viewport:

```tsx
import { useMemo } from 'react';

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate the visible area in canvas coordinates.
 *
 * @param viewport - Current viewport state (position and scale)
 * @param screenWidth - Width of the screen in pixels
 * @param screenHeight - Height of the screen in pixels
 * @returns Bounds object representing visible canvas area
 */
function getVisibleBounds(
  viewport: ViewportState,
  screenWidth: number,
  screenHeight: number
): Bounds {
  return {
    x: -viewport.x / viewport.scale,
    y: -viewport.y / viewport.scale,
    width: screenWidth / viewport.scale,
    height: screenHeight / viewport.scale,
  };
}

/**
 * Check if an object intersects with the visible viewport.
 *
 * @param obj - Object with position and dimensions
 * @param bounds - Visible viewport bounds
 * @returns True if object should be rendered
 */
function isVisible(obj: BoardObject, bounds: Bounds): boolean {
  const objRight = obj.x + (obj.width || 50);
  const objBottom = obj.y + (obj.height || 50);
  
  return !(
    obj.x > bounds.x + bounds.width ||
    objRight < bounds.x ||
    obj.y > bounds.y + bounds.height ||
    objBottom < bounds.y
  );
}

/**
 * Hook that filters objects to only those visible in viewport.
 * Significantly improves performance with many objects.
 */
function useVisibleObjects(
  objects: BoardObject[],
  viewport: ViewportState
): BoardObject[] {
  return useMemo(() => {
    const bounds = getVisibleBounds(
      viewport,
      window.innerWidth,
      window.innerHeight
    );
    return objects.filter((obj) => isVisible(obj, bounds));
  }, [objects, viewport]);
}
```

---

## Shape Rendering and Manipulation

### Custom Shape Components

Create reusable shape components for different object types:

```tsx
import { Rect, Circle, Text, Group, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';
import Konva from 'konva';

interface ShapeProps {
  object: BoardObject;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (updates: Partial<BoardObject>) => void;
}

/**
 * Rectangle shape component with selection and transformation support.
 * Handles drag events and syncs position changes to parent.
 */
export function RectangleShape({ object, isSelected, onSelect, onChange }: ShapeProps) {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        x={object.x}
        y={object.y}
        width={object.width || 100}
        height={object.height || 100}
        fill={object.fill || '#3b82f6'}
        stroke={isSelected ? '#1d4ed8' : undefined}
        strokeWidth={isSelected ? 2 : 0}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          if (!node) return;

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          node.scaleX(1);
          node.scaleY(1);

          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
```

### Sticky Notes

A common collaborative element with text editing:

```tsx
import { Group, Rect, Text } from 'react-konva';
import { useState, useRef } from 'react';
import Konva from 'konva';

interface StickyNoteProps {
  object: BoardObject & { content?: string; color?: string };
  onContentChange: (content: string) => void;
  onChange: (updates: Partial<BoardObject>) => void;
}

const STICKY_COLORS = ['#fef08a', '#fed7aa', '#bbf7d0', '#bfdbfe', '#f5d0fe'];

/**
 * Sticky note component with inline text editing.
 * Double-click to edit, click outside to save.
 */
export function StickyNote({ object, onContentChange, onChange }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef<Konva.Text>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    
    const textNode = textRef.current;
    if (!textNode) return;

    const stage = textNode.getStage();
    if (!stage) return;

    const textPosition = textNode.absolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = object.content || '';
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + textPosition.y}px`;
    textarea.style.left = `${stageBox.left + textPosition.x}px`;
    textarea.style.width = `${object.width || 150}px`;
    textarea.style.height = `${(object.height || 150) - 10}px`;
    textarea.style.fontSize = '14px';
    textarea.style.border = 'none';
    textarea.style.padding = '5px';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.fontFamily = 'sans-serif';

    textarea.focus();

    textarea.addEventListener('blur', () => {
      onContentChange(textarea.value);
      document.body.removeChild(textarea);
      setIsEditing(false);
    });
  };

  return (
    <Group
      x={object.x}
      y={object.y}
      draggable
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
    >
      <Rect
        width={object.width || 150}
        height={object.height || 150}
        fill={object.color || STICKY_COLORS[0]}
        shadowColor="black"
        shadowBlur={5}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.2}
        cornerRadius={4}
      />
      <Text
        ref={textRef}
        x={10}
        y={10}
        width={(object.width || 150) - 20}
        height={(object.height || 150) - 20}
        text={object.content || 'Double-click to edit'}
        fontSize={14}
        fontFamily="sans-serif"
        fill="#374151"
        visible={!isEditing}
      />
    </Group>
  );
}
```

---

## Real-Time Collaboration Features

### Remote Cursor Rendering

Display other users' cursors in real-time:

```tsx
import { Layer, Group, Circle, Text, Arrow } from 'react-konva';

interface RemoteCursor {
  id: string;
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

interface CursorLayerProps {
  cursors: RemoteCursor[];
  localUserId: string;
}

/**
 * Layer for rendering remote user cursors.
 * Filters out local user and renders each remote cursor with name label.
 */
export function CursorLayer({ cursors, localUserId }: CursorLayerProps) {
  const remoteCursors = cursors.filter((c) => c.userId !== localUserId);

  return (
    <Layer listening={false}>
      {remoteCursors.map((cursor) => (
        <Group key={cursor.id} x={cursor.x} y={cursor.y}>
          {/* Cursor pointer */}
          <Arrow
            points={[0, 0, 12, 14, 5, 12, 0, 20]}
            fill={cursor.color}
            stroke="#fff"
            strokeWidth={1}
            closed
          />
          {/* User name label */}
          <Group x={15} y={15}>
            <Rect
              width={cursor.userName.length * 8 + 12}
              height={20}
              fill={cursor.color}
              cornerRadius={4}
            />
            <Text
              x={6}
              y={4}
              text={cursor.userName}
              fontSize={12}
              fill="#fff"
              fontFamily="sans-serif"
            />
          </Group>
        </Group>
      ))}
    </Layer>
  );
}
```

### Broadcasting Cursor Position

Throttle cursor updates to reduce Firebase writes:

```tsx
import { useEffect, useRef, useCallback } from 'react';
import { ref, set, onDisconnect } from 'firebase/database';
import { db } from '../config/firebase';
import Konva from 'konva';

const CURSOR_UPDATE_THROTTLE_MS = 50;

/**
 * Hook that broadcasts local cursor position to Firebase.
 * Throttles updates and cleans up on disconnect.
 *
 * @param stageRef - Reference to the Konva stage
 * @param boardId - Current board identifier
 * @param userId - Local user identifier
 * @param userName - Display name for cursor label
 * @param color - User's assigned color
 */
export function useCursorBroadcast(
  stageRef: React.RefObject<Konva.Stage>,
  boardId: string,
  userId: string,
  userName: string,
  color: string
) {
  const lastUpdateRef = useRef<number>(0);

  const broadcastPosition = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - lastUpdateRef.current < CURSOR_UPDATE_THROTTLE_MS) {
        return;
      }
      lastUpdateRef.current = now;

      const cursorRef = ref(db, `cursors/${boardId}/${userId}`);
      set(cursorRef, {
        userId,
        userName,
        color,
        x,
        y,
        timestamp: now,
      });
    },
    [boardId, userId, userName, color]
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const cursorRef = ref(db, `cursors/${boardId}/${userId}`);
    
    onDisconnect(cursorRef).remove();

    const handleMouseMove = () => {
      const pos = stage.getPointerPosition();
      if (pos) {
        const transform = stage.getAbsoluteTransform().copy().invert();
        const canvasPos = transform.point(pos);
        broadcastPosition(canvasPos.x, canvasPos.y);
      }
    };

    stage.on('mousemove', handleMouseMove);
    stage.on('touchmove', handleMouseMove);

    return () => {
      stage.off('mousemove', handleMouseMove);
      stage.off('touchmove', handleMouseMove);
    };
  }, [stageRef, boardId, userId, broadcastPosition]);
}
```

---

## Performance Optimization

### Layer Optimization

Separate frequently-updated content from static content:

```tsx
/**
 * Optimized canvas structure with separated layers.
 * Each layer is an independent canvas element.
 */
function OptimizedCanvas({ objects, cursors }: Props) {
  return (
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Static background layer - rarely redraws */}
      <Layer name="background" listening={false}>
        <Rect x={0} y={0} width={10000} height={10000} fill="#f8fafc" />
      </Layer>

      {/* Object layer - redraws on object changes */}
      <Layer name="objects">
        {objects.map((obj) => (
          <BoardShape key={obj.id} object={obj} />
        ))}
      </Layer>

      {/* Cursor layer - redraws very frequently */}
      <Layer name="cursors" listening={false}>
        {cursors.map((c) => (
          <RemoteCursor key={c.id} cursor={c} />
        ))}
      </Layer>
    </Stage>
  );
}
```

### Shape Caching

Cache complex shapes for faster redraws:

```tsx
import { useEffect, useRef } from 'react';
import { Group, Rect, Text, Image } from 'react-konva';
import Konva from 'konva';

/**
 * Complex shape component that uses Konva caching for performance.
 * Caching converts the group to a single image for faster draws.
 */
function ComplexCard({ object }: { object: BoardObject }) {
  const groupRef = useRef<Konva.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.cache();
    }
  }, [object]);

  return (
    <Group ref={groupRef} x={object.x} y={object.y} draggable>
      <Rect width={200} height={150} fill="#fff" cornerRadius={8} />
      <Rect width={200} height={40} fill="#3b82f6" cornerRadius={[8, 8, 0, 0]} />
      <Text x={10} y={10} text="Header" fill="#fff" fontSize={16} />
      <Text x={10} y={50} text="Content goes here..." fill="#374151" fontSize={14} />
      {/* More complex content... */}
    </Group>
  );
}
```

### Batch Rendering

Use `batchDraw()` for multiple updates:

```tsx
/**
 * Efficiently update multiple shapes in a single draw call.
 */
function batchUpdateShapes(layer: Konva.Layer, updates: ShapeUpdate[]) {
  updates.forEach(({ id, x, y }) => {
    const shape = layer.findOne(`#${id}`);
    if (shape) {
      shape.position({ x, y });
    }
  });
  
  layer.batchDraw();
}
```

---

## Integration with CollabBoard Stack

### With React

Use `react-konva` for declarative canvas components that integrate with React's lifecycle:

```tsx
import { Stage, Layer } from 'react-konva';
import { BoardProvider, useBoardState } from '../contexts/BoardContext';

function BoardCanvas() {
  const { state } = useBoardState();
  
  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      scaleX={state.zoom}
      scaleY={state.zoom}
    >
      <Layer>{/* Objects */}</Layer>
    </Stage>
  );
}

function App() {
  return (
    <BoardProvider>
      <BoardCanvas />
    </BoardProvider>
  );
}
```

### With Firebase RTDB

Sync shape positions on drag end:

```tsx
import { ref, update } from 'firebase/database';

function handleDragEnd(boardId: string, objectId: string, e: Konva.KonvaEventObject<DragEvent>) {
  const updates = {
    [`boards/${boardId}/objects/${objectId}/x`]: e.target.x(),
    [`boards/${boardId}/objects/${objectId}/y`]: e.target.y(),
  };
  
  update(ref(db), updates);
}
```

---

## Resources

### Official Documentation
- [Konva.js Documentation](https://konvajs.org/docs/index.html)
- [react-konva GitHub](https://github.com/konvajs/react-konva)
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)

### Tutorials and Examples
- [Infinite Canvas Tutorial](https://dev.to/sheikh_yawar/how-to-implement-an-infinite-canvas-using-react-konva-5fn4)
- [Konva + React Real-Time Whiteboard](https://konvajs.org/docs/react/index.html)
- [Canvas Performance Optimization](https://konvajs.org/docs/performance/Layer_Management.html)

### Related CollabBoard Guides
- [React Guide](./react.md) - Frontend framework integration
- [Firebase RTDB Guide](./firebase-rtdb.md) - Real-time data sync
- [Jest/Cypress Guide](./jest-cypress.md) - Testing Konva interactions
