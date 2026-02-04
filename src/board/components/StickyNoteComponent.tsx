/**
 * Sticky Note Component
 *
 * Konva component for rendering and interacting with sticky notes.
 * Supports drag, resize, double-click editing, and color selection.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { StickyNote } from '../objects/StickyNote';
import type { Position } from '../interfaces/IBoardObject';

/**
 * Props for the StickyNoteComponent.
 */
export interface StickyNoteComponentProps {
  /** Sticky note data object */
  note: StickyNote;
  /** Whether the note is selected */
  isSelected?: boolean;
  /** Whether the note is being edited */
  isEditing?: boolean;
  /** Callback when the note is clicked */
  onClick?: (noteId: string, event: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Callback when the note is double-clicked for editing */
  onDoubleClick?: (noteId: string) => void;
  /** Callback when the note is dragged */
  onDragStart?: (noteId: string) => void;
  /** Callback when the note drag ends */
  onDragEnd?: (noteId: string, position: Position) => void;
  /** Callback when the note is transformed (resized) */
  onTransformEnd?: (
    noteId: string,
    transform: { x: number; y: number; width: number; height: number }
  ) => void;
  /** Callback when text content changes */
  onContentChange?: (noteId: string, content: string) => void;
  /** Callback to enter edit mode */
  onEditStart?: (noteId: string) => void;
  /** Callback to exit edit mode */
  onEditEnd?: (noteId: string) => void;
}

/**
 * Corner radius for sticky notes.
 */
const CORNER_RADIUS = 4;

/**
 * Padding inside the sticky note.
 */
const PADDING = 12;

/**
 * Shadow offset.
 */
const SHADOW_OFFSET = 4;

/**
 * Sticky Note Konva Component
 *
 * Renders a sticky note with:
 * - Colored background with rounded corners
 * - Text content with word wrapping
 * - Click and drag support
 * - Double-click to edit
 *
 * @param props - Component props
 * @returns Konva Group element
 */
export function StickyNoteComponent({
  note,
  isSelected = false,
  isEditing = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  onContentChange,
  onEditStart,
  onEditEnd,
}: StickyNoteComponentProps): React.ReactElement {
  const groupRef = useRef<Konva.Group>(null);
  const textRef = useRef<Konva.Text>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bounds = note.getBounds();
  const colors = note.colors;

  /**
   * Handle click events.
   */
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isDragging) {
        onClick?.(note.id, e);
      }
    },
    [note.id, onClick, isDragging]
  );

  /**
   * Handle double-click for editing.
   */
  const handleDoubleClick = useCallback(() => {
    if (!note.locked) {
      onDoubleClick?.(note.id);
      onEditStart?.(note.id);
    }
  }, [note.id, note.locked, onDoubleClick, onEditStart]);

  /**
   * Handle drag start.
   */
  const handleDragStart = useCallback(() => {
    if (!note.locked) {
      setIsDragging(true);
      onDragStart?.(note.id);
    }
  }, [note.id, note.locked, onDragStart]);

  /**
   * Handle drag end.
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);
      if (!note.locked) {
        const newPosition: Position = {
          x: e.target.x(),
          y: e.target.y(),
        };
        onDragEnd?.(note.id, newPosition);
      }
    },
    [note.id, note.locked, onDragEnd]
  );

  /**
   * Handle transform end (resize).
   */
  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onTransformEnd?.(note.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(50, bounds.width * scaleX),
      height: Math.max(50, bounds.height * scaleY),
    });
  }, [note.id, bounds.width, bounds.height, onTransformEnd]);

  /**
   * Get stroke width based on selection state.
   */
  const getStrokeWidth = (): number => {
    if (isSelected) return 2;
    return 0;
  };

  /**
   * Get stroke color based on selection state.
   */
  const getStrokeColor = (): string => {
    if (isSelected) return '#4A90D9';
    return 'transparent';
  };

  /**
   * Calculate text dimensions accounting for padding.
   */
  const textWidth = bounds.width - PADDING * 2;
  const textHeight = bounds.height - PADDING * 2;

  /**
   * Determine cursor style.
   */
  const getCursor = (): string => {
    if (note.locked) return 'default';
    if (isEditing) return 'text';
    return 'move';
  };

  return (
    <Group
      ref={groupRef}
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      draggable={!note.locked && !isEditing}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Shadow */}
      <Rect
        x={SHADOW_OFFSET}
        y={SHADOW_OFFSET}
        width={bounds.width}
        height={bounds.height}
        cornerRadius={CORNER_RADIUS}
        fill="rgba(0, 0, 0, 0.15)"
      />

      {/* Main background */}
      <Rect
        width={bounds.width}
        height={bounds.height}
        fill={colors.fill}
        cornerRadius={CORNER_RADIUS}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={8}
        shadowOffset={{ x: 2, y: 2 }}
      />

      {/* Text content */}
      <Text
        ref={textRef}
        x={PADDING}
        y={PADDING}
        width={textWidth}
        height={textHeight}
        text={note.content || note.placeholder}
        fill={note.content ? colors.text : '#999999'}
        fontSize={note.fontSize}
        fontFamily="system-ui, -apple-system, sans-serif"
        align={note.textAlign}
        verticalAlign="top"
        wrap="word"
        ellipsis={true}
        listening={false}
      />

      {/* Edit indicator when in edit mode */}
      {isEditing && (
        <Rect
          width={bounds.width}
          height={bounds.height}
          fill="transparent"
          stroke="#4A90D9"
          strokeWidth={2}
          cornerRadius={CORNER_RADIUS}
          dash={[5, 5]}
        />
      )}
    </Group>
  );
}

/**
 * Hook for managing sticky note text editing.
 *
 * Creates and manages a hidden textarea for editing sticky note content.
 *
 * @param stageRef - Reference to the Konva stage
 * @param onSave - Callback when content is saved
 * @returns Functions to start and stop editing
 */
export function useStickyNoteEditor(
  stageRef: React.RefObject<Konva.Stage | null>,
  onSave: (noteId: string, content: string) => void
): {
  startEditing: (note: StickyNote) => void;
  stopEditing: () => void;
  editingNoteId: string | null;
} {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const currentNoteRef = useRef<StickyNote | null>(null);

  /**
   * Start editing a note.
   */
  const startEditing = useCallback(
    (note: StickyNote) => {
      if (note.locked) return;

      const stage = stageRef.current;
      if (!stage) return;

      const container = stage.container();
      const bounds = note.getBounds();
      const colors = note.colors;

      const stageBox = container.getBoundingClientRect();
      const scale = stage.scaleX();

      const x =
        stageBox.left + (bounds.x + PADDING) * scale + stage.x() * scale;
      const y = stageBox.top + (bounds.y + PADDING) * scale + stage.y() * scale;
      const width = (bounds.width - PADDING * 2) * scale;
      const height = (bounds.height - PADDING * 2) * scale;

      const textarea = document.createElement('textarea');
      textarea.value = note.content;
      textarea.style.position = 'absolute';
      textarea.style.top = `${y}px`;
      textarea.style.left = `${x}px`;
      textarea.style.width = `${width}px`;
      textarea.style.height = `${height}px`;
      textarea.style.fontSize = `${note.fontSize * scale}px`;
      textarea.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      textarea.style.textAlign = note.textAlign;
      textarea.style.color = colors.text;
      textarea.style.background = colors.fill;
      textarea.style.border = '2px solid #4A90D9';
      textarea.style.borderRadius = `${CORNER_RADIUS}px`;
      textarea.style.padding = '0';
      textarea.style.margin = '0';
      textarea.style.overflow = 'hidden';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.lineHeight = '1.4';
      textarea.style.zIndex = '1000';

      container.appendChild(textarea);
      textarea.focus();
      textarea.select();

      textareaRef.current = textarea;
      currentNoteRef.current = note;
      setEditingNoteId(note.id);

      const handleBlur = (): void => {
        if (textareaRef.current && currentNoteRef.current) {
          onSave(currentNoteRef.current.id, textareaRef.current.value);
          cleanup();
        }
      };

      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
          cleanup();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleBlur();
        }
      };

      const cleanup = (): void => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener('blur', handleBlur);
          textareaRef.current.removeEventListener('keydown', handleKeyDown);
          textareaRef.current.remove();
          textareaRef.current = null;
        }
        currentNoteRef.current = null;
        setEditingNoteId(null);
      };

      textarea.addEventListener('blur', handleBlur);
      textarea.addEventListener('keydown', handleKeyDown);
    },
    [stageRef, onSave]
  );

  /**
   * Stop editing the current note.
   */
  const stopEditing = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
  }, []);

  /**
   * Cleanup on unmount.
   */
  useEffect(() => {
    return () => {
      if (textareaRef.current) {
        textareaRef.current.remove();
      }
    };
  }, []);

  return { startEditing, stopEditing, editingNoteId };
}
