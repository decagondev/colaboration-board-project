/**
 * AI Commands Hook
 *
 * Provides a simplified interface for submitting AI commands
 * with automatic board state integration.
 */

import { useState, useCallback, useMemo } from 'react';
import { useAI } from '../context/AIContext';
import type {
  AICommandResult,
  IBoardStateService,
} from '../interfaces/IAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';

/**
 * Options for the useAICommands hook.
 */
interface UseAICommandsOptions {
  /** Callback when a command succeeds */
  onSuccess?: (result: AICommandResult) => void;
  /** Callback when a command fails */
  onError?: (error: string) => void;
  /** Board state provider function */
  getBoardState?: () => SyncableObject[];
  /** Board service for executing commands */
  boardService?: IBoardStateService;
}

/**
 * Return type for useAICommands hook.
 */
interface UseAICommandsReturn {
  /** Submit a command */
  submit: (input: string) => Promise<AICommandResult | null>;
  /** Whether a command is currently processing */
  isProcessing: boolean;
  /** Last error message */
  lastError: string | null;
  /** Last result */
  lastResult: AICommandResult | null;
  /** Clear the last error */
  clearError: () => void;
  /** Whether the AI is ready */
  isReady: boolean;
}

/**
 * Hook for submitting AI commands with integrated state management.
 *
 * @param options - Hook configuration options
 * @returns AI command submission interface
 *
 * @example
 * ```tsx
 * function CommandInput() {
 *   const { submit, isProcessing, lastError } = useAICommands({
 *     getBoardState: () => boardObjects,
 *     boardService: myBoardService,
 *     onSuccess: (result) => console.log('Success:', result),
 *     onError: (error) => console.error('Error:', error),
 *   });
 *
 *   const handleSubmit = async () => {
 *     await submit('Create a blue rectangle');
 *   };
 *
 *   return (
 *     <button onClick={handleSubmit} disabled={isProcessing}>
 *       {isProcessing ? 'Processing...' : 'Submit'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useAICommands(
  options: UseAICommandsOptions = {}
): UseAICommandsReturn {
  const { onSuccess, onError, getBoardState, boardService } = options;
  const { submitCommand, status, error, clearError, isReady } = useAI();

  const [lastResult, setLastResult] = useState<AICommandResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isProcessing = useMemo(() => status === 'processing', [status]);

  const submit = useCallback(
    async (input: string): Promise<AICommandResult | null> => {
      if (!boardService) {
        const errorMsg = 'Board service is not configured';
        setLocalError(errorMsg);
        onError?.(errorMsg);
        return null;
      }

      const boardState = getBoardState?.() ?? [];

      try {
        setLocalError(null);
        const result = await submitCommand(input, boardState, boardService);
        setLastResult(result);

        if (result.success) {
          onSuccess?.(result);
        } else if (result.errors && result.errors.length > 0) {
          const errorMsg = result.errors.join('; ');
          setLocalError(errorMsg);
          onError?.(errorMsg);
        }

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setLocalError(errorMsg);
        onError?.(errorMsg);
        return null;
      }
    },
    [submitCommand, getBoardState, boardService, onSuccess, onError]
  );

  const handleClearError = useCallback(() => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  return {
    submit,
    isProcessing,
    lastError: localError ?? error,
    lastResult,
    clearError: handleClearError,
    isReady,
  };
}
