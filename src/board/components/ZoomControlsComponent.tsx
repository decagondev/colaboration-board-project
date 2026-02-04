/**
 * Zoom Controls Component
 *
 * Provides UI controls for zooming in/out and displaying current zoom level.
 * Includes zoom in, zoom out, and reset to 100% functionality.
 */

import React, { useCallback, useMemo } from 'react';

/**
 * Props for the ZoomControlsComponent.
 */
export interface ZoomControlsProps {
  /** Current zoom scale (1 = 100%) */
  scale: number;
  /** Callback when zoom changes */
  onZoomChange: (newScale: number) => void;
  /** Minimum allowed scale */
  minScale?: number;
  /** Maximum allowed scale */
  maxScale?: number;
  /** Zoom step multiplier */
  zoomStep?: number;
  /** CSS class name for styling */
  className?: string;
}

/**
 * Default zoom configuration.
 */
const DEFAULT_MIN_SCALE = 0.1;
const DEFAULT_MAX_SCALE = 5;
const DEFAULT_ZOOM_STEP = 1.2;

/**
 * Predefined zoom levels for quick selection.
 */
const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

/**
 * Zoom controls component for the board canvas.
 *
 * Displays current zoom percentage and provides buttons for:
 * - Zoom in (increase scale)
 * - Zoom out (decrease scale)
 * - Reset to 100%
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <ZoomControlsComponent
 *   scale={viewport.scale}
 *   onZoomChange={(scale) => setViewport({ ...viewport, scale })}
 * />
 * ```
 */
export function ZoomControlsComponent({
  scale,
  onZoomChange,
  minScale = DEFAULT_MIN_SCALE,
  maxScale = DEFAULT_MAX_SCALE,
  zoomStep = DEFAULT_ZOOM_STEP,
  className = '',
}: ZoomControlsProps): JSX.Element {
  /**
   * Calculate zoom percentage for display.
   */
  const zoomPercentage = useMemo(() => Math.round(scale * 100), [scale]);

  /**
   * Handle zoom in action.
   */
  const handleZoomIn = useCallback((): void => {
    const newScale = Math.min(maxScale, scale * zoomStep);
    onZoomChange(newScale);
  }, [scale, maxScale, zoomStep, onZoomChange]);

  /**
   * Handle zoom out action.
   */
  const handleZoomOut = useCallback((): void => {
    const newScale = Math.max(minScale, scale / zoomStep);
    onZoomChange(newScale);
  }, [scale, minScale, zoomStep, onZoomChange]);

  /**
   * Reset zoom to 100%.
   */
  const handleResetZoom = useCallback((): void => {
    onZoomChange(1);
  }, [onZoomChange]);

  /**
   * Handle zoom preset selection.
   */
  const handlePresetSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const newScale = parseFloat(event.target.value);
      if (!isNaN(newScale)) {
        onZoomChange(Math.max(minScale, Math.min(maxScale, newScale)));
      }
    },
    [onZoomChange, minScale, maxScale]
  );

  /**
   * Check if zoom in is disabled.
   */
  const isZoomInDisabled = scale >= maxScale;

  /**
   * Check if zoom out is disabled.
   */
  const isZoomOutDisabled = scale <= minScale;

  return (
    <div
      className={`zoom-controls ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
      }}
    >
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={isZoomOutDisabled}
        aria-label="Zoom out"
        style={{
          width: '32px',
          height: '32px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: isZoomOutDisabled ? '#f3f4f6' : '#ffffff',
          cursor: isZoomOutDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: isZoomOutDisabled ? '#9ca3af' : '#374151',
        }}
      >
        −
      </button>

      <select
        value={scale}
        onChange={handlePresetSelect}
        aria-label="Zoom level"
        style={{
          minWidth: '80px',
          height: '32px',
          padding: '0 8px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#374151',
          textAlign: 'center',
        }}
      >
        {ZOOM_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {Math.round(preset * 100)}%
          </option>
        ))}
        {!ZOOM_PRESETS.includes(scale) && (
          <option value={scale}>{zoomPercentage}%</option>
        )}
      </select>

      <button
        type="button"
        onClick={handleZoomIn}
        disabled={isZoomInDisabled}
        aria-label="Zoom in"
        style={{
          width: '32px',
          height: '32px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: isZoomInDisabled ? '#f3f4f6' : '#ffffff',
          cursor: isZoomInDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          color: isZoomInDisabled ? '#9ca3af' : '#374151',
        }}
      >
        +
      </button>

      <button
        type="button"
        onClick={handleResetZoom}
        aria-label="Reset zoom to 100%"
        title="Reset to 100%"
        style={{
          height: '32px',
          padding: '0 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: scale === 1 ? '#f3f4f6' : '#ffffff',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#374151',
        }}
      >
        Reset
      </button>
    </div>
  );
}
