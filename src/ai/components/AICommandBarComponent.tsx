/**
 * AI Command Bar Component
 *
 * Provides a UI for entering natural language commands to the AI.
 * Displays input field, submit button, and processing status.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { AICommandResult } from '../interfaces/IAIService';
import { AIStatusIndicator } from './AIStatusIndicator';

/**
 * Props for the AICommandBarComponent.
 */
export interface AICommandBarComponentProps {
  /** Callback when a command is submitted */
  onSubmit: (input: string) => Promise<AICommandResult | null>;
  /** Whether the AI is processing a command */
  isProcessing?: boolean;
  /** Whether the AI service is ready */
  isReady?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Callback when command succeeds */
  onCommandSuccess?: (result: AICommandResult) => void;
  /** Callback when command errors */
  onCommandError?: (error: Error) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the command bar is disabled */
  disabled?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Styles for the command bar container.
 */
const containerStyles: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb',
  maxWidth: '600px',
  width: '100%',
};

/**
 * Styles for the input row.
 */
const inputRowStyles: CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

/**
 * Styles for the text input.
 */
const inputStyles: CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  fontSize: '14px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

/**
 * Styles for focused input.
 */
const inputFocusStyles: CSSProperties = {
  borderColor: '#3b82f6',
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
};

/**
 * Styles for the submit button.
 */
const buttonStyles: CSSProperties = {
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#ffffff',
  backgroundColor: '#3b82f6',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  whiteSpace: 'nowrap',
};

/**
 * Styles for disabled button.
 */
const buttonDisabledStyles: CSSProperties = {
  backgroundColor: '#9ca3af',
  cursor: 'not-allowed',
};

/**
 * Styles for processing button.
 */
const buttonProcessingStyles: CSSProperties = {
  backgroundColor: '#6366f1',
};

/**
 * Styles for error message.
 */
const errorStyles: CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  color: '#dc2626',
  backgroundColor: '#fef2f2',
  borderRadius: '4px',
  border: '1px solid #fecaca',
};

/**
 * Styles for success message.
 */
const successStyles: CSSProperties = {
  padding: '8px 12px',
  fontSize: '13px',
  color: '#059669',
  backgroundColor: '#ecfdf5',
  borderRadius: '4px',
  border: '1px solid #a7f3d0',
};

/**
 * AI Command Bar Component
 *
 * Provides an input field for natural language AI commands with status feedback.
 *
 * @param props - Component props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <AICommandBarComponent
 *   onSubmit={async (input) => {
 *     return await aiService.processCommand(input);
 *   }}
 *   isProcessing={isProcessing}
 *   error={error}
 * />
 * ```
 */
export function AICommandBarComponent({
  onSubmit,
  isProcessing = false,
  isReady = true,
  error,
  onCommandSuccess,
  onCommandError,
  placeholder = 'Ask AI to help with the board...',
  disabled = false,
  className = '',
}: AICommandBarComponentProps): React.JSX.Element {
  const [input, setInput] = useState('');
  const [lastResult, setLastResult] = useState<AICommandResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDisabled = disabled || !isReady || isProcessing;

  useEffect(() => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isProcessing]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmedInput = input.trim();
      if (!trimmedInput || isDisabled) {
        return;
      }

      setLastResult(null);

      try {
        const result = await onSubmit(trimmedInput);

        if (result) {
          setLastResult(result);
          if (result.success) {
            setInput('');
            onCommandSuccess?.(result);
          } else if (result.errors && result.errors.length > 0) {
            onCommandError?.(new Error(result.errors.join('; ')));
          }
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        onCommandError?.(errorObj);
      }
    },
    [input, isDisabled, onSubmit, onCommandSuccess, onCommandError]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
      if (lastResult) {
        setLastResult(null);
      }
    },
    [lastResult]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        setInput('');
        inputRef.current?.blur();
      }
    },
    []
  );

  const computedInputStyles: CSSProperties = {
    ...inputStyles,
    ...(isFocused ? inputFocusStyles : {}),
    ...(isDisabled ? { backgroundColor: '#f9fafb' } : {}),
  };

  const computedButtonStyles: CSSProperties = {
    ...buttonStyles,
    ...(isDisabled ? buttonDisabledStyles : {}),
    ...(isProcessing ? buttonProcessingStyles : {}),
  };

  const showSuccess = lastResult?.success && !error;
  const showError = error || (lastResult && !lastResult.success);

  return (
    <div className={`ai-command-bar ${className}`} style={containerStyles}>
      <form onSubmit={handleSubmit} style={inputRowStyles}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isDisabled}
          style={computedInputStyles}
          aria-label="AI command input"
        />
        <button
          type="submit"
          disabled={isDisabled || !input.trim()}
          style={computedButtonStyles}
          aria-label={isProcessing ? 'Processing command' : 'Submit command'}
        >
          {isProcessing ? 'Processing...' : 'Send'}
        </button>
        <AIStatusIndicator
          status={isProcessing ? 'processing' : isReady ? 'idle' : 'error'}
        />
      </form>

      {showError && (
        <div style={errorStyles} role="alert">
          {error || lastResult?.errors?.join('; ')}
        </div>
      )}

      {showSuccess && (
        <div style={successStyles} role="status">
          {lastResult.message}
        </div>
      )}

      {!isReady && (
        <div style={errorStyles} role="alert">
          AI service is not configured. Please add your OpenAI API key.
        </div>
      )}
    </div>
  );
}
