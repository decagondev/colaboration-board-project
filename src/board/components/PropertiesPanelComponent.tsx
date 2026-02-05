/**
 * Properties Panel Component
 *
 * Displays and allows editing of properties for selected board objects.
 * Follows Interface Segregation Principle by providing focused property editors.
 */

import React, { useCallback, useMemo } from 'react';

/**
 * Property change event data.
 */
export interface PropertyChangeEvent {
  /** ID of the object being modified */
  objectId: string;
  /** Property path being changed (e.g., 'width', 'data.color') */
  property: string;
  /** New value for the property */
  value: unknown;
}

/**
 * Object data for the properties panel.
 */
export interface PropertyPanelObject {
  /** Unique object identifier */
  id: string;
  /** Object type */
  type: string;
  /** X position */
  x: number;
  /** Y position */
  y: number;
  /** Width */
  width: number;
  /** Height */
  height: number;
  /** Additional type-specific data */
  data?: Record<string, unknown>;
}

/**
 * Props for the PropertiesPanelComponent.
 */
export interface PropertiesPanelComponentProps {
  /** Currently selected object (or null if none) */
  selectedObject: PropertyPanelObject | null;
  /** Callback when a property value changes */
  onPropertyChange: (event: PropertyChangeEvent) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Property section configuration.
 */
interface PropertySection {
  title: string;
  properties: PropertyConfig[];
}

/**
 * Individual property configuration.
 */
interface PropertyConfig {
  key: string;
  label: string;
  type: 'number' | 'color' | 'text' | 'select';
  dataKey?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

/**
 * Color presets for quick selection.
 */
const COLOR_PRESETS = [
  '#fef3c7', '#fde68a', '#fcd34d',
  '#d1fae5', '#a7f3d0', '#6ee7b7',
  '#dbeafe', '#bfdbfe', '#93c5fd',
  '#fce7f3', '#fbcfe8', '#f9a8d4',
  '#f3f4f6', '#e5e7eb', '#d1d5db',
  '#1f2937', '#374151', '#4b5563',
];

/**
 * Get property sections based on object type.
 *
 * @param objectType - Type of the selected object
 * @returns Array of property sections to display
 */
function getPropertySections(objectType: string): PropertySection[] {
  const transformSection: PropertySection = {
    title: 'Transform',
    properties: [
      { key: 'x', label: 'X', type: 'number', step: 1 },
      { key: 'y', label: 'Y', type: 'number', step: 1 },
      { key: 'width', label: 'Width', type: 'number', min: 10, step: 1 },
      { key: 'height', label: 'Height', type: 'number', min: 10, step: 1 },
      { key: 'rotation', label: 'Rotation', type: 'number', dataKey: 'rotation', min: -180, max: 180, step: 1 },
    ],
  };

  const baseColorSection: PropertySection = {
    title: 'Colors',
    properties: [
      { key: 'color', label: 'Fill Color', type: 'color', dataKey: 'color' },
    ],
  };

  const textSection: PropertySection = {
    title: 'Text',
    properties: [
      { key: 'fontSize', label: 'Font Size', type: 'number', dataKey: 'fontSize', min: 8, max: 200, step: 1 },
      { key: 'textColor', label: 'Text Color', type: 'color', dataKey: 'color' },
    ],
  };

  const stickyNoteColorSection: PropertySection = {
    title: 'Colors',
    properties: [
      { key: 'backgroundColor', label: 'Background', type: 'color', dataKey: 'color' },
      { key: 'textColor', label: 'Text Color', type: 'color', dataKey: 'textColor' },
    ],
  };

  const shapeColorSection: PropertySection = {
    title: 'Colors',
    properties: [
      { key: 'fillColor', label: 'Fill', type: 'color', dataKey: 'color' },
      { key: 'strokeColor', label: 'Stroke', type: 'color', dataKey: 'strokeColor' },
    ],
  };

  switch (objectType) {
    case 'sticky-note':
      return [transformSection, stickyNoteColorSection, textSection];
    case 'text':
      return [transformSection, textSection];
    case 'shape':
      return [transformSection, shapeColorSection];
    default:
      return [transformSection, baseColorSection];
  }
}

/**
 * Properties Panel component for editing selected object properties.
 *
 * Displays a sidebar panel with property editors organized into sections:
 * - Transform (position, size, rotation)
 * - Colors (fill, stroke, text color depending on object type)
 * - Text (font size for text-based objects)
 *
 * @param props - Component props
 * @returns JSX element or null if no object selected
 *
 * @example
 * ```tsx
 * <PropertiesPanelComponent
 *   selectedObject={selectedObj}
 *   onPropertyChange={(event) => updateObject(event.objectId, { [event.property]: event.value })}
 * />
 * ```
 */
export function PropertiesPanelComponent({
  selectedObject,
  onPropertyChange,
  className = '',
}: PropertiesPanelComponentProps): JSX.Element | null {
  /**
   * Get property sections based on selected object type.
   */
  const sections = useMemo(() => {
    if (!selectedObject) return [];
    return getPropertySections(selectedObject.type);
  }, [selectedObject?.type]);

  /**
   * Get the current value of a property.
   */
  const getPropertyValue = useCallback(
    (config: PropertyConfig): unknown => {
      if (!selectedObject) return '';

      if (config.dataKey) {
        return selectedObject.data?.[config.dataKey] ?? getDefaultValue(config);
      }

      const value = selectedObject[config.key as keyof PropertyPanelObject];
      return value ?? getDefaultValue(config);
    },
    [selectedObject]
  );

  /**
   * Handle property value change.
   */
  const handleChange = useCallback(
    (config: PropertyConfig, value: unknown) => {
      if (!selectedObject) return;

      const property = config.dataKey ? `data.${config.dataKey}` : config.key;
      onPropertyChange({
        objectId: selectedObject.id,
        property,
        value,
      });
    },
    [selectedObject, onPropertyChange]
  );

  if (!selectedObject) {
    return (
      <div className={`properties-panel ${className}`} style={panelStyles}>
        <div style={headerStyles}>Properties</div>
        <div style={emptyStateStyles}>
          <span style={emptyIconStyles}>⬚</span>
          <span>No object selected</span>
          <span style={hintStyles}>Click an object to edit its properties</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`properties-panel ${className}`} style={panelStyles}>
      <div style={headerStyles}>Properties</div>
      
      <div style={objectTypeStyles}>
        <span style={objectTypeBadgeStyles}>{formatObjectType(selectedObject.type)}</span>
      </div>

      {sections.map((section) => (
        <div key={section.title} style={sectionStyles}>
          <div style={sectionTitleStyles}>{section.title}</div>
          <div style={sectionContentStyles}>
            {section.properties.map((config) => (
              <PropertyEditor
                key={config.key}
                config={config}
                value={getPropertyValue(config)}
                onChange={(value) => handleChange(config, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Property Editor sub-component.
 * Renders the appropriate input based on property type.
 */
interface PropertyEditorProps {
  config: PropertyConfig;
  value: unknown;
  onChange: (value: unknown) => void;
}

function PropertyEditor({ config, value, onChange }: PropertyEditorProps): JSX.Element {
  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = parseFloat(e.target.value);
      if (!isNaN(numValue)) {
        onChange(Math.round(numValue));
      }
    },
    [onChange]
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleColorPresetClick = useCallback(
    (color: string) => {
      onChange(color);
    },
    [onChange]
  );

  switch (config.type) {
    case 'number':
      return (
        <div style={propertyRowStyles}>
          <label style={labelStyles}>{config.label}</label>
          <input
            type="number"
            value={value as number}
            min={config.min}
            max={config.max}
            step={config.step ?? 1}
            onChange={handleNumberChange}
            style={numberInputStyles}
          />
        </div>
      );

    case 'color':
      return (
        <div style={propertyRowStyles}>
          <label style={labelStyles}>{config.label}</label>
          <div style={colorEditorStyles}>
            <input
              type="color"
              value={(value as string) || '#000000'}
              onChange={handleColorChange}
              style={colorInputStyles}
            />
            <input
              type="text"
              value={(value as string) || ''}
              onChange={handleTextChange}
              placeholder="#000000"
              style={colorTextInputStyles}
            />
          </div>
          <div style={colorPresetsStyles}>
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                onClick={() => handleColorPresetClick(color)}
                style={{
                  ...colorPresetStyles,
                  backgroundColor: color,
                  border: value === color ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                }}
              />
            ))}
          </div>
        </div>
      );

    case 'text':
      return (
        <div style={propertyRowStyles}>
          <label style={labelStyles}>{config.label}</label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={handleTextChange}
            style={textInputStyles}
          />
        </div>
      );

    default:
      return (
        <div style={propertyRowStyles}>
          <label style={labelStyles}>{config.label}</label>
          <span>{String(value)}</span>
        </div>
      );
  }
}

/**
 * Get default value for a property based on its type.
 */
function getDefaultValue(config: PropertyConfig): unknown {
  switch (config.type) {
    case 'number':
      return config.min ?? 0;
    case 'color':
      return '#000000';
    case 'text':
      return '';
    default:
      return '';
  }
}

/**
 * Format object type for display.
 */
function formatObjectType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Panel container styles.
 */
const panelStyles: React.CSSProperties = {
  position: 'fixed',
  right: '20px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '260px',
  maxHeight: '80vh',
  overflowY: 'auto',
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
};

/**
 * Header styles.
 */
const headerStyles: React.CSSProperties = {
  padding: '16px 16px 12px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#1f2937',
  borderBottom: '1px solid #e5e7eb',
};

/**
 * Empty state styles.
 */
const emptyStateStyles: React.CSSProperties = {
  padding: '32px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  color: '#6b7280',
  fontSize: '13px',
};

/**
 * Empty state icon styles.
 */
const emptyIconStyles: React.CSSProperties = {
  fontSize: '32px',
  marginBottom: '8px',
  opacity: 0.5,
};

/**
 * Hint text styles.
 */
const hintStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

/**
 * Object type display styles.
 */
const objectTypeStyles: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
};

/**
 * Object type badge styles.
 */
const objectTypeBadgeStyles: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  fontSize: '11px',
  fontWeight: 500,
  color: '#3b82f6',
  backgroundColor: '#eff6ff',
  borderRadius: '4px',
};

/**
 * Section container styles.
 */
const sectionStyles: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
};

/**
 * Section title styles.
 */
const sectionTitleStyles: React.CSSProperties = {
  padding: '12px 16px 8px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

/**
 * Section content styles.
 */
const sectionContentStyles: React.CSSProperties = {
  padding: '0 16px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

/**
 * Property row styles.
 */
const propertyRowStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

/**
 * Label styles.
 */
const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#4b5563',
};

/**
 * Number input styles.
 */
const numberInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: '13px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  outline: 'none',
};

/**
 * Text input styles.
 */
const textInputStyles: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: '13px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  outline: 'none',
};

/**
 * Color editor container styles.
 */
const colorEditorStyles: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

/**
 * Color input styles.
 */
const colorInputStyles: React.CSSProperties = {
  width: '36px',
  height: '36px',
  padding: '2px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  cursor: 'pointer',
};

/**
 * Color text input styles.
 */
const colorTextInputStyles: React.CSSProperties = {
  flex: 1,
  padding: '6px 8px',
  fontSize: '12px',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontFamily: 'monospace',
};

/**
 * Color presets container styles.
 */
const colorPresetsStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: '4px',
  marginTop: '8px',
};

/**
 * Color preset button styles.
 */
const colorPresetStyles: React.CSSProperties = {
  width: '100%',
  aspectRatio: '1',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'transform 0.1s ease',
};

export default PropertiesPanelComponent;
