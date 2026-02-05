/**
 * Toolbar Component
 *
 * Provides tool selection UI for the board canvas.
 * Allows users to select different tools for creating and manipulating objects.
 */

import React, { useCallback, useState, type JSX } from 'react';
import { ShapeFlyoutComponent } from './ShapeFlyoutComponent';
import type { ShapeType } from '../shapes';

/**
 * Available tool types.
 * Includes basic tools, connector tool, and all shape types.
 */
export type ToolType =
  | 'select'
  | 'sticky-note'
  | 'text'
  | 'connector'
  | ShapeType;

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
  id: ToolType | 'shapes' | 'connector';
  label: string;
  icon: string;
  shortcut?: string;
  isShapesTrigger?: boolean;
}

/**
 * Shape types for quick access on toolbar.
 */
const QUICK_SHAPES: ShapeType[] = ['rectangle', 'ellipse'];

/**
 * Check if a tool type is a shape.
 *
 * @param tool - The tool to check
 * @returns True if the tool is a shape type
 */
function isShapeTool(tool: ToolType): tool is ShapeType {
  const shapeTypes: ShapeType[] = [
    'rectangle',
    'ellipse',
    'line',
    'triangle',
    'diamond',
    'parallelogram',
    'cylinder',
    'document',
    'process',
    'terminator',
    'delay',
    'manual-input',
    'display',
    'connector-shape',
  ];
  return shapeTypes.includes(tool as ShapeType);
}

/**
 * Available tools configuration.
 */
const TOOLS: ToolButton[] = [
  { id: 'select', label: 'Select', icon: '↖', shortcut: 'V' },
  { id: 'sticky-note', label: 'Sticky Note', icon: '📝', shortcut: 'N' },
  { id: 'rectangle', label: 'Rectangle', icon: '▢', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: '○', shortcut: 'O' },
  { id: 'shapes', label: 'More Shapes', icon: '⬢', isShapesTrigger: true },
  { id: 'connector', label: 'Connector', icon: '↔', shortcut: 'C' },
  { id: 'text', label: 'Text', icon: 'T', shortcut: 'T' },
];

/**
 * Toolbar component for board tool selection.
 *
 * Displays a vertical toolbar with tool buttons for:
 * - Select/pointer tool
 * - Sticky note creation
 * - Shape creation (rectangle, ellipse, and more via flyout)
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
  const [isShapesFlyoutOpen, setIsShapesFlyoutOpen] = useState(false);

  /**
   * Handle tool button click.
   */
  const handleToolClick = useCallback(
    (tool: ToolButton) => {
      if (tool.isShapesTrigger) {
        setIsShapesFlyoutOpen((prev) => !prev);
      } else {
        onToolChange(tool.id as ToolType);
        setIsShapesFlyoutOpen(false);
      }
    },
    [onToolChange]
  );

  /**
   * Handle shape selection from flyout.
   */
  const handleShapeSelect = useCallback(
    (shapeType: ShapeType) => {
      onToolChange(shapeType);
      setIsShapesFlyoutOpen(false);
    },
    [onToolChange]
  );

  /**
   * Close the shapes flyout.
   */
  const handleCloseFlyout = useCallback(() => {
    setIsShapesFlyoutOpen(false);
  }, []);

  /**
   * Check if a tool is active, including if it's a shape selected from flyout.
   */
  const isToolActive = (toolId: ToolType | 'shapes'): boolean => {
    if (toolId === 'shapes') {
      return isShapesFlyoutOpen || (isShapeTool(activeTool) && !QUICK_SHAPES.includes(activeTool));
    }
    return activeTool === toolId;
  };

  return (
    <>
      <div className={`toolbar ${className}`} style={toolbarStyles}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            aria-label={tool.label}
            aria-pressed={isToolActive(tool.id)}
            aria-expanded={tool.isShapesTrigger ? isShapesFlyoutOpen : undefined}
            aria-haspopup={tool.isShapesTrigger ? 'dialog' : undefined}
            onClick={() => handleToolClick(tool)}
            style={{
              ...buttonStyles,
              ...(isToolActive(tool.id) ? activeButtonStyles : {}),
            }}
          >
            <span style={iconStyles}>{tool.icon}</span>
            {tool.isShapesTrigger && (
              <span style={expandIndicatorStyles}>▶</span>
            )}
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

      <ShapeFlyoutComponent
        isOpen={isShapesFlyoutOpen}
        onClose={handleCloseFlyout}
        onShapeSelect={handleShapeSelect}
        selectedShape={isShapeTool(activeTool) ? activeTool : undefined}
      />
    </>
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
  position: 'relative',
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

/**
 * Expand indicator styles for flyout trigger.
 */
const expandIndicatorStyles: React.CSSProperties = {
  position: 'absolute',
  right: '4px',
  bottom: '4px',
  fontSize: '8px',
  opacity: 0.6,
};

export default ToolbarComponent;
