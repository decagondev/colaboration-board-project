/**
 * Toolbar Component
 *
 * Provides tool selection UI for the board canvas.
 * Allows users to select different tools for creating and manipulating objects.
 */

import React, { useCallback } from 'react';

/**
 * Available tool types.
 */
export type ToolType =
  | 'select'
  | 'sticky-note'
  | 'rectangle'
  | 'ellipse'
  | 'text';

/**
 * Props for the ToolbarComponent.
 */
export interface ToolbarComponentProps {
  /** Currently selected tool */
  activeTool: ToolType;
  /** Callback when a tool is selected */
  onToolChange: (tool: ToolType) => void;
  /** Whether the grid is visible */
  showGrid?: boolean;
  /** Callback when grid visibility is toggled */
  onGridToggle?: () => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Tool button configuration.
 */
interface ToolButton {
  id: ToolType;
  label: string;
  icon: string;
  shortcut?: string;
}

/**
 * Available tools configuration.
 */
const TOOLS: ToolButton[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'sticky-note', label: 'Sticky Note', icon: '📝', shortcut: 'N' },
  { id: 'rectangle', label: 'Rectangle', icon: '▢', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: '○', shortcut: 'O' },
  { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
];

/**
 * Toolbar component for board tool selection.
 *
 * Displays a vertical toolbar with tool buttons for:
 * - Select/pointer tool
 * - Sticky note creation
 * - Shape creation (rectangle, ellipse)
 * - Text creation
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <ToolbarComponent
 *   activeTool={currentTool}
 *   onToolChange={(tool) => setCurrentTool(tool)}
 * />
 * ```
 */
export function ToolbarComponent({
  activeTool,
  onToolChange,
  showGrid = false,
  onGridToggle,
  className = '',
}: ToolbarComponentProps): JSX.Element {
  /**
   * Handle tool button click.
   */
  const handleToolClick = useCallback(
    (tool: ToolType) => {
      onToolChange(tool);
    },
    [onToolChange]
  );

  return (
    <div className={`toolbar ${className}`} style={toolbarStyles}>
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          aria-label={tool.label}
          aria-pressed={activeTool === tool.id}
          onClick={() => handleToolClick(tool.id)}
          style={{
            ...buttonStyles,
            ...(activeTool === tool.id ? activeButtonStyles : {}),
          }}
        >
          <span style={iconStyles}>{tool.icon}</span>
        </button>
      ))}
      
      {/* Divider */}
      {onGridToggle && <div style={dividerStyles} />}
      
      {/* Grid toggle button */}
      {onGridToggle && (
        <button
          type="button"
          title={`Toggle Grid (G)${showGrid ? ' - On' : ' - Off'}`}
          aria-label="Toggle Grid"
          aria-pressed={showGrid}
          onClick={onGridToggle}
          style={{
            ...buttonStyles,
            ...(showGrid ? activeButtonStyles : {}),
          }}
        >
          <span style={iconStyles}>#</span>
        </button>
      )}
    </div>
  );
}

/**
 * Toolbar container styles.
 */
const toolbarStyles: React.CSSProperties = {
  position: 'fixed',
  left: '20px',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
};

/**
 * Tool button styles.
 */
const buttonStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

/**
 * Active tool button styles.
 */
const activeButtonStyles: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  borderColor: '#3b82f6',
  color: '#ffffff',
};

/**
 * Icon styles.
 */
const iconStyles: React.CSSProperties = {
  fontSize: '20px',
  lineHeight: 1,
};

/**
 * Divider styles between tool sections.
 */
const dividerStyles: React.CSSProperties = {
  width: '32px',
  height: '1px',
  backgroundColor: '#e5e7eb',
  margin: '4px auto',
};

export default ToolbarComponent;
