/**
 * AI Status Indicator Component
 *
 * Displays the current status of the AI service.
 * Shows visual feedback for idle, processing, completed, and error states.
 */

import React from 'react';
import type { CSSProperties } from 'react';
import type { AIStatus } from '../interfaces/IAIService';

/**
 * Props for the AIStatusIndicator component.
 */
export interface AIStatusIndicatorProps {
  /** Current AI status */
  status: AIStatus;
  /** Show status text label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional CSS class name */
  className?: string;
}

/**
 * Status color mapping.
 */
const STATUS_COLORS: Record<AIStatus, string> = {
  idle: '#10b981',
  processing: '#3b82f6',
  completed: '#10b981',
  error: '#ef4444',
};

/**
 * Status label mapping.
 */
const STATUS_LABELS: Record<AIStatus, string> = {
  idle: 'Ready',
  processing: 'Processing...',
  completed: 'Done',
  error: 'Error',
};

/**
 * Size dimensions mapping.
 */
const SIZE_DIMENSIONS: Record<'small' | 'medium' | 'large', number> = {
  small: 8,
  medium: 12,
  large: 16,
};

/**
 * Container styles.
 */
const containerStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

/**
 * Label styles.
 */
const labelStyles: CSSProperties = {
  fontSize: '12px',
  fontWeight: 500,
  color: '#6b7280',
};

/**
 * Keyframes for pulse animation (using CSS-in-JS).
 */
const pulseKeyframes = `
  @keyframes ai-status-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.1);
    }
  }
`;

/**
 * AI Status Indicator Component
 *
 * Displays a visual indicator of the AI service status with optional label.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <AIStatusIndicator status="processing" showLabel />
 * <AIStatusIndicator status="idle" size="small" />
 * ```
 */
export function AIStatusIndicator({
  status,
  showLabel = false,
  size = 'medium',
  className = '',
}: AIStatusIndicatorProps): React.JSX.Element {
  const dotSize = SIZE_DIMENSIONS[size];
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];

  const dotStyles: CSSProperties = {
    width: `${dotSize}px`,
    height: `${dotSize}px`,
    borderRadius: '50%',
    backgroundColor: color,
    transition: 'background-color 0.2s',
    ...(status === 'processing'
      ? {
          animation: 'ai-status-pulse 1.5s ease-in-out infinite',
        }
      : {}),
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div
        className={`ai-status-indicator ${className}`}
        style={containerStyles}
        role="status"
        aria-label={`AI status: ${label}`}
      >
        <div style={dotStyles} aria-hidden="true" />
        {showLabel && <span style={labelStyles}>{label}</span>}
      </div>
    </>
  );
}
