/**
 * Text Component
 *
 * Konva component for rendering standalone text objects on the board.
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';
import type Konva from 'konva';
import type { StandaloneText } from '../objects/StandaloneText';
import type { Position } from '../interfaces/IBoardObject';

/**
 * Props for the TextComponent.
 */
export interface TextComponentProps {
  /** Text data object */
  text: StandaloneText;
  /** Whether the text is selected */
  isSelected?: boolean;
  /** Reference to the Konva stage for editor positioning */
  stageRef?: React.RefObject<Konva.Stage | null>;
  /** Callback when the text is clicked */
  onClick?: (textId: string, event: Konva.KonvaEventObject<MouseEvent>) => void;
  /** Callback when the text is double-clicked (to start editing) */
  onDoubleClick?: (textId: string) => void;
  /** Callback when dragging starts */
  onDragStart?: (textId: string) => void;
  /** Callback when drag ends */
  onDragEnd?: (textId: string, position: Position) => void;
  /** Callback when transform ends */
  onTransformEnd?: (
    textId: string,
    transform: {
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
    }
  ) => void;
  /** Callback when editing starts */
  onEditStart?: (textId: string) => void;
  /** Callback when editing ends */
  onEditEnd?: (textId: string, content: string) => void;
}

/**
 * Hook for managing text editing with a native textarea overlay.
 *
 * @param stageRef - Reference to the Konva stage
 * @param onSave - Callback when content is saved
 * @returns Editor control functions and state
 */
export function useTextEditor(
  stageRef: React.RefObject<Konva.Stage | null>,
  onSave: (textId: string, content: string) => void
): {
  startEditing: (text: StandaloneText) => void;
  stopEditing: () => void;
  editingTextId: string | null;
} {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const currentTextRef = useRef<StandaloneText | null>(null);

  const startEditing = useCallback(
    (text: StandaloneText) => {
      if (text.locked) return;

      const stage = stageRef.current;
      if (!stage) return;

      const container = stage.container();
      const stageBox = container.getBoundingClientRect();
      const transform = text.transform;

      const textarea = document.createElement('textarea');
      textarea.value = text.content;
      textarea.style.position = 'absolute';
      textarea.style.left = `${stageBox.left + transform.x}px`;
      textarea.style.top = `${stageBox.top + transform.y}px`;
      textarea.style.width = `${text.size.width}px`;
      textarea.style.minHeight = `${text.size.height}px`;
      textarea.style.fontSize = `${text.fontSize}px`;
      textarea.style.fontFamily = text.fontFamily;
      textarea.style.color = text.colors.text;
      textarea.style.backgroundColor = 'transparent';
      textarea.style.border = '2px solid #4A90D9';
      textarea.style.padding = '4px';
      textarea.style.margin = '0';
      textarea.style.overflow = 'hidden';
      textarea.style.resize = 'none';
      textarea.style.outline = 'none';
      textarea.style.transformOrigin = 'left top';
      textarea.style.textAlign = text.align;
      textarea.style.lineHeight = String(text.lineHeight);
      textarea.style.zIndex = '10000';

      const fontWeight = text.fontStyle.includes('bold') ? 'bold' : 'normal';
      const fontStyleValue = text.fontStyle.includes('italic')
        ? 'italic'
        : 'normal';
      textarea.style.fontWeight = fontWeight;
      textarea.style.fontStyle = fontStyleValue;

      if (transform.rotation !== 0) {
        textarea.style.transform = `rotate(${transform.rotation}deg)`;
      }

      const handleBlur = (): void => {
        if (currentTextRef.current) {
          onSave(currentTextRef.current.id, textarea.value);
        }
        textarea.remove();
        setEditingTextId(null);
        currentTextRef.current = null;
      };

      const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
          textarea.value = text.content;
          textarea.blur();
        }
      };

      textarea.addEventListener('blur', handleBlur);
      textarea.addEventListener('keydown', handleKeyDown);

      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      textareaRef.current = textarea;
      currentTextRef.current = text;
      setEditingTextId(text.id);
    },
    [stageRef, onSave]
  );

  const stopEditing = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (textareaRef.current) {
        textareaRef.current.remove();
      }
    };
  }, []);

  return { startEditing, stopEditing, editingTextId };
}

/**
 * Text Konva Component
 *
 * Renders a standalone text object with:
 * - Customizable font properties
 * - Text alignment
 * - Selection highlighting
 * - Inline editing support
 *
 * @param props - Component props
 * @returns Konva Group element
 */
export function TextComponent({
  text,
  isSelected = false,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onTransformEnd,
}: TextComponentProps): React.ReactElement | null {
  const groupRef = useRef<Konva.Group>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!text.visible) {
    return null;
  }

  const bounds = text.getBounds();
  const colors = text.colors;
  const transform = text.transform;

  const fontStyle = (() => {
    if (text.fontStyle === 'bold italic') return 'bold italic';
    if (text.fontStyle === 'bold') return 'bold';
    if (text.fontStyle === 'italic') return 'italic';
    return 'normal';
  })();

  /**
   * Handle click events (mouse or touch).
   */
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (!isDragging) {
        onClick?.(text.id, e as Konva.KonvaEventObject<MouseEvent>);
      }
    },
    [text.id, onClick, isDragging]
  );

  /**
   * Handle double click events.
   */
  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.(text.id);
  }, [text.id, onDoubleClick]);

  /**
   * Handle drag start.
   */
  const handleDragStart = useCallback(() => {
    if (!text.locked) {
      setIsDragging(true);
      onDragStart?.(text.id);
    }
  }, [text.id, text.locked, onDragStart]);

  /**
   * Handle drag end.
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      setIsDragging(false);
      if (!text.locked) {
        const newPosition: Position = {
          x: e.target.x(),
          y: e.target.y(),
        };
        onDragEnd?.(text.id, newPosition);
      }
    },
    [text.id, text.locked, onDragEnd]
  );

  /**
   * Handle transform end.
   */
  const handleTransformEnd = useCallback(() => {
    const node = groupRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    onTransformEnd?.(text.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(50, bounds.width * scaleX),
      height: Math.max(20, bounds.height * scaleY),
      rotation: node.rotation(),
    });
  }, [text.id, bounds.width, bounds.height, onTransformEnd]);

  return (
    <Group
      ref={groupRef}
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      rotation={transform.rotation}
      draggable={!text.locked}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Selection background */}
      {isSelected && (
        <Rect
          width={bounds.width}
          height={bounds.height}
          fill="transparent"
          stroke="#4A90D9"
          strokeWidth={1}
          dash={[4, 4]}
        />
      )}

      {/* Text content */}
      <Text
        width={bounds.width}
        height={bounds.height}
        text={text.content}
        fontFamily={text.fontFamily}
        fontSize={text.fontSize}
        fontStyle={fontStyle}
        fill={colors.text}
        align={text.align}
        verticalAlign={text.verticalAlign}
        lineHeight={text.lineHeight}
        ellipsis={true}
        wrap="word"
      />
    </Group>
  );
}
