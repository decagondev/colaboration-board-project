/**
 * Shape Flyout Component
 *
 * A toggleable flyout panel that displays available shapes organized by category.
 * Implements Single Responsibility Principle - only handles shape selection UI.
 */

import React, { useCallback, useMemo, useRef, useEffect, type JSX } from 'react';
import type { ShapeType, ShapeCategory, ShapeDefinition } from '../shapes';
import { ShapeRegistry } from '../shapes';

/**
 * Props for the ShapeFlyoutComponent.
 */
export interface ShapeFlyoutComponentProps {
  /** Whether the flyout is visible */
  isOpen: boolean;
  /** Callback when the flyout should close */
  onClose: () => void;
  /** Callback when a shape is selected */
  onShapeSelect: (shapeType: ShapeType) => void;
  /** Currently selected shape type */
  selectedShape?: ShapeType;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Category labels for display.
 */
const CATEGORY_LABELS: Record<ShapeCategory, string> = {
  basic: 'Basic Shapes',
  flowchart: 'Flowchart Shapes',
  uml: 'UML Shapes',
};

/**
 * Order of category display.
 */
const CATEGORY_ORDER: ShapeCategory[] = ['basic', 'flowchart', 'uml'];

/**
 * Shape Flyout component for shape selection.
 *
 * Displays a panel with shapes organized by category.
 * Users can click on a shape to select it for drawing.
 *
 * @param props - Component props
 * @returns JSX element or null if closed
 *
 * @example
 * ```tsx
 * <ShapeFlyoutComponent
 *   isOpen={showFlyout}
 *   onClose={() => setShowFlyout(false)}
 *   onShapeSelect={(type) => setSelectedTool(type)}
 *   selectedShape={currentShape}
 * />
 * ```
 */
export function ShapeFlyoutComponent({
  isOpen,
  onClose,
  onShapeSelect,
  selectedShape,
  className = '',
}: ShapeFlyoutComponentProps): JSX.Element | null {
  const flyoutRef = useRef<HTMLDivElement>(null);

  /**
   * Get shapes grouped by category.
   */
  const shapesByCategory = useMemo(() => {
    const grouped: Record<ShapeCategory, ShapeDefinition[]> = {
      basic: [],
      flowchart: [],
      uml: [],
    };

    for (const shape of ShapeRegistry.getAll()) {
      grouped[shape.category].push(shape);
    }

    return grouped;
  }, []);

  /**
   * Handle shape button click.
   */
  const handleShapeClick = useCallback(
    (shapeType: ShapeType) => {
      onShapeSelect(shapeType);
      onClose();
    },
    [onShapeSelect, onClose]
  );

  /**
   * Handle click outside to close.
   */
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={flyoutRef}
      className={`shape-flyout ${className}`}
      style={flyoutStyles}
      role="dialog"
      aria-label="Shape Selection"
    >
      <div style={headerStyles}>
        <h3 style={titleStyles}>Shapes</h3>
        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyles}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div style={contentStyles}>
        {CATEGORY_ORDER.map((category) => {
          const shapes = shapesByCategory[category];
          if (shapes.length === 0) return null;

          return (
            <div key={category} style={categoryStyles}>
              <h4 style={categoryTitleStyles}>{CATEGORY_LABELS[category]}</h4>
              <div style={shapeGridStyles}>
                {shapes.map((shape) => (
                  <button
                    key={shape.type}
                    type="button"
                    title={shape.description || shape.label}
                    aria-label={shape.label}
                    aria-pressed={selectedShape === shape.type}
                    onClick={() => handleShapeClick(shape.type)}
                    style={{
                      ...shapeButtonStyles,
                      ...(selectedShape === shape.type
                        ? selectedButtonStyles
                        : {}),
                    }}
                  >
                    <span style={shapeIconStyles}>{shape.icon}</span>
                    <span style={shapeLabelStyles}>{shape.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Flyout container styles.
 */
const flyoutStyles: React.CSSProperties = {
  position: 'fixed',
  left: '84px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '280px',
  maxHeight: '80vh',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  zIndex: 1001,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

/**
 * Header styles.
 */
const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #e5e7eb',
};

/**
 * Title styles.
 */
const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '16px',
  fontWeight: 600,
  color: '#1f2937',
};

/**
 * Close button styles.
 */
const closeButtonStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  color: '#6b7280',
  transition: 'all 0.15s ease',
};

/**
 * Content area styles.
 */
const contentStyles: React.CSSProperties = {
  padding: '12px 16px',
  overflowY: 'auto',
  flex: 1,
};

/**
 * Category section styles.
 */
const categoryStyles: React.CSSProperties = {
  marginBottom: '16px',
};

/**
 * Category title styles.
 */
const categoryTitleStyles: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '12px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/**
 * Shape grid styles.
 */
const shapeGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '8px',
};

/**
 * Shape button styles.
 */
const shapeButtonStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 4px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  minHeight: '72px',
};

/**
 * Selected shape button styles.
 */
const selectedButtonStyles: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderColor: '#3b82f6',
};

/**
 * Shape icon styles.
 */
const shapeIconStyles: React.CSSProperties = {
  fontSize: '24px',
  lineHeight: 1,
  marginBottom: '4px',
};

/**
 * Shape label styles.
 */
const shapeLabelStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  textAlign: 'center',
  lineHeight: 1.2,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export default ShapeFlyoutComponent;
