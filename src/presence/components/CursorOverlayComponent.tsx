/**
 * Cursor Overlay Component
 *
 * Renders other users' cursors on the canvas using Konva.
 * Displays cursor position with user name label and colored indicator.
 */

import React from 'react';
import { Layer, Group, Circle, Line, Text } from 'react-konva';
import { useCursor } from '../context/CursorContext';
import type { CursorPosition } from '../interfaces/ICursorService';

/**
 * Props for a single cursor element.
 */
interface CursorElementProps {
  /** Cursor position data */
  cursor: CursorPosition;
}

/**
 * Renders a single user's cursor with pointer and label.
 *
 * @param props - Cursor element props
 * @returns Konva Group containing cursor graphics
 */
function CursorElement({ cursor }: CursorElementProps): React.ReactNode {
  const { x, y, color, displayName } = cursor;

  return (
    <Group x={x} y={y}>
      {/* Cursor pointer arrow */}
      <Line
        points={[0, 0, 0, 16, 4, 12, 8, 20, 10, 19, 7, 11, 12, 11]}
        fill={color}
        closed={true}
        stroke="#ffffff"
        strokeWidth={1}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={3}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />

      {/* Cursor dot for better visibility */}
      <Circle
        x={0}
        y={0}
        radius={3}
        fill={color}
        stroke="#ffffff"
        strokeWidth={1}
      />

      {/* User name label */}
      <Group x={14} y={16}>
        {/* Label background */}
        <Text
          text={displayName}
          fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#ffffff"
          padding={4}
          cornerRadius={4}
        />
        {/* Label background rectangle is handled by text padding */}
        <Text
          text={displayName}
          fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
          stroke="#ffffff"
          strokeWidth={0.5}
          padding={4}
        />
      </Group>
    </Group>
  );
}

/**
 * Props for the cursor overlay component.
 */
interface CursorOverlayProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * Renders all remote user cursors as a Konva Layer.
 *
 * This component should be placed inside a Konva Stage as the topmost layer
 * to ensure cursors render above all other canvas content.
 *
 * @param props - Component props
 * @returns Konva Layer containing all cursor elements
 *
 * @example
 * ```tsx
 * <Stage width={800} height={600}>
 *   <Layer>
 *     {/* Board content *\/}
 *   </Layer>
 *   <CursorOverlayComponent />
 * </Stage>
 * ```
 */
export function CursorOverlayComponent({
  className: _className,
}: CursorOverlayProps): React.ReactNode {
  const { cursors, isLoading } = useCursor();

  if (isLoading) {
    return <Layer />;
  }

  return (
    <Layer listening={false}>
      {cursors.map((cursor) => (
        <CursorElement key={cursor.userId} cursor={cursor} />
      ))}
    </Layer>
  );
}

/**
 * Alternative HTML-based cursor overlay for use outside Konva.
 * Useful for hybrid rendering scenarios.
 */
interface HtmlCursorOverlayProps {
  /** Container dimensions */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Renders cursors as HTML elements positioned absolutely.
 *
 * @param props - Component props with container reference
 * @returns Div containing cursor elements
 */
export function HtmlCursorOverlay({
  containerRef: _containerRef,
}: HtmlCursorOverlayProps): React.ReactNode {
  const { cursors, isLoading } = useCursor();

  if (isLoading) {
    return <div className="cursor-overlay cursor-overlay--loading" />;
  }

  return (
    <div className="cursor-overlay" style={overlayStyles}>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="cursor-element"
          style={{
            ...cursorStyles,
            left: cursor.x,
            top: cursor.y,
          }}
        >
          {/* Cursor SVG */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .68-.61.28-.86L6.5 3.07a.5.5 0 0 0-1 .14Z"
              fill={cursor.color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>
          {/* User label */}
          <span
            style={{
              ...labelStyles,
              backgroundColor: cursor.color,
            }}
          >
            {cursor.displayName}
          </span>
        </div>
      ))}
    </div>
  );
}

const overlayStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  overflow: 'hidden',
  zIndex: 1000,
};

const cursorStyles: React.CSSProperties = {
  position: 'absolute',
  pointerEvents: 'none',
  transform: 'translate(-2px, -2px)',
  transition: 'left 50ms linear, top 50ms linear',
};

const labelStyles: React.CSSProperties = {
  display: 'inline-block',
  marginLeft: '8px',
  marginTop: '16px',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '11px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  color: '#ffffff',
  whiteSpace: 'nowrap',
};

export default CursorOverlayComponent;
