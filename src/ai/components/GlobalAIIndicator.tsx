/**
 * Global AI Processing Indicator Component
 *
 * Shows a visual indicator when any user is processing an AI command on the board.
 * Uses Firebase RTDB to sync processing state across all connected users.
 */

import React, { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { QueuedCommand } from '../interfaces/IAICommandQueue';
import { defaultAICommandQueueService } from '../services/AICommandQueueService';

/**
 * Props for the GlobalAIIndicator component.
 */
export interface GlobalAIIndicatorProps {
  /** Board identifier */
  boardId: string;
  /** Show the user who initiated the command */
  showUser?: boolean;
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Optional CSS class name */
  className?: string;
}

/**
 * Container styles based on position.
 */
const getContainerStyles = (
  position: GlobalAIIndicatorProps['position']
): CSSProperties => {
  const base: CSSProperties = {
    position: 'fixed',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e5e7eb',
    zIndex: 1000,
    transition: 'opacity 0.2s, transform 0.2s',
  };

  switch (position) {
    case 'top-left':
      return { ...base, top: '16px', left: '16px' };
    case 'bottom-right':
      return { ...base, bottom: '16px', right: '16px' };
    case 'bottom-left':
      return { ...base, bottom: '16px', left: '16px' };
    case 'top-right':
    default:
      return { ...base, top: '16px', right: '16px' };
  }
};

/**
 * Pulse animation styles.
 */
const pulseStyles: CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: '#3b82f6',
  animation: 'global-ai-pulse 1.5s ease-in-out infinite',
};

/**
 * Text styles.
 */
const textStyles: CSSProperties = {
  fontSize: '13px',
  color: '#374151',
  fontWeight: 500,
};

/**
 * User text styles.
 */
const userTextStyles: CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
  fontStyle: 'italic',
};

/**
 * Keyframes for pulse animation.
 */
const pulseKeyframes = `
  @keyframes global-ai-pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }
`;

/**
 * Global AI Processing Indicator
 *
 * Displays a floating indicator when any user is processing an AI command.
 *
 * @param props - Component props
 * @returns JSX element or null if not processing
 *
 * @example
 * ```tsx
 * <GlobalAIIndicator boardId={currentBoardId} showUser />
 * ```
 */
export function GlobalAIIndicator({
  boardId,
  showUser = false,
  position = 'top-right',
  className = '',
}: GlobalAIIndicatorProps): React.JSX.Element | null {
  const [processingCommand, setProcessingCommand] =
    useState<QueuedCommand | null>(null);

  useEffect(() => {
    if (!boardId) {
      return;
    }

    const unsubscribe = defaultAICommandQueueService.subscribe(
      boardId,
      (commands) => {
        const processing = commands.find((cmd) => cmd.status === 'processing');
        setProcessingCommand(processing ?? null);
      },
      { statusFilter: ['processing'] }
    );

    return unsubscribe;
  }, [boardId]);

  if (!processingCommand) {
    return null;
  }

  const containerStyles = getContainerStyles(position);

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div
        className={`global-ai-indicator ${className}`}
        style={containerStyles}
        role="status"
        aria-live="polite"
        aria-label="AI is processing a command"
      >
        <div style={pulseStyles} aria-hidden="true" />
        <div>
          <span style={textStyles}>AI is thinking...</span>
          {showUser && processingCommand.userId && (
            <div style={userTextStyles}>
              Requested by {processingCommand.userId}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
