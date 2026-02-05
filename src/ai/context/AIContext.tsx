/**
 * AI Context Module
 *
 * Provides AI state and methods to the component tree using React Context.
 * Manages AI command processing, status, and history.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import type {
  IAIService,
  IBoardStateService,
  AICommand,
  AICommandResult,
  AIStatus,
  ToolCall,
} from '../interfaces/IAIService';
import { AIServiceError } from '../interfaces/IAIService';
import { OpenAIService } from '../services/OpenAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';

/**
 * AI context value interface.
 */
export interface AIContextValue {
  /** Current AI processing status */
  status: AIStatus;
  /** Current or most recent command being processed */
  currentCommand: AICommand | null;
  /** History of processed commands */
  commandHistory: AICommand[];
  /** Error message if AI operation fails */
  error: string | null;
  /** Whether the AI service is configured and ready */
  isReady: boolean;
  /** Submit a natural language command */
  submitCommand: (
    input: string,
    boardState: SyncableObject[],
    boardService: IBoardStateService
  ) => Promise<AICommandResult>;
  /** Clear the current error */
  clearError: () => void;
  /** Clear command history */
  clearHistory: () => void;
}

/**
 * AI context with undefined default value.
 * Must be used within AIProvider.
 */
const AIContext = createContext<AIContextValue | undefined>(undefined);

/**
 * AI provider props.
 */
interface AIProviderProps {
  /** Child components */
  children: ReactNode;
  /** Optional AI service for dependency injection (useful for testing) */
  aiService?: IAIService;
  /** OpenAI API key (required if aiService is not provided) */
  apiKey?: string;
}

/**
 * Generate a unique command ID.
 */
function generateCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * AI Provider Component
 *
 * Wraps the application and provides AI state and methods via context.
 *
 * @example
 * ```tsx
 * <AIProvider apiKey={import.meta.env.VITE_OPENAI_API_KEY}>
 *   <App />
 * </AIProvider>
 * ```
 */
export function AIProvider({ children, aiService, apiKey }: AIProviderProps) {
  const [status, setStatus] = useState<AIStatus>('idle');
  const [currentCommand, setCurrentCommand] = useState<AICommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<AICommand[]>([]);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(() => {
    if (aiService) {
      return aiService;
    }
    if (apiKey) {
      try {
        return new OpenAIService({ apiKey });
      } catch {
        return null;
      }
    }
    return null;
  }, [aiService, apiKey]);

  const isReady = useMemo(() => {
    return service?.isReady() ?? false;
  }, [service]);

  const submitCommand = useCallback(
    async (
      input: string,
      boardState: SyncableObject[],
      boardService: IBoardStateService
    ): Promise<AICommandResult> => {
      if (!service) {
        const errorResult: AICommandResult = {
          success: false,
          message: 'AI service is not configured',
          toolCalls: [],
          errors: ['AI service is not available'],
        };
        setError('AI service is not configured');
        return errorResult;
      }

      const commandId = generateCommandId();
      const command: AICommand = {
        id: commandId,
        userId: 'current-user',
        input,
        status: 'processing',
        createdAt: Date.now(),
      };

      setCurrentCommand(command);
      setStatus('processing');
      setError(null);

      try {
        const toolCalls = await service.processCommand(input, boardState);

        if (toolCalls.length === 0) {
          const result: AICommandResult = {
            success: true,
            message: 'No actions needed for this command',
            toolCalls: [],
          };

          const completedCommand: AICommand = {
            ...command,
            status: 'completed',
            result,
            completedAt: Date.now(),
          };

          setCurrentCommand(completedCommand);
          setCommandHistory((prev) => [completedCommand, ...prev]);
          setStatus('completed');

          return result;
        }

        const affectedObjects: string[] = [];
        const errors: string[] = [];
        const executedToolCalls: ToolCall[] = [];

        for (const toolCall of toolCalls) {
          try {
            const toolResult = await service.executeTool(toolCall, boardService);
            executedToolCalls.push(toolCall);

            if (toolResult.affectedObjects) {
              affectedObjects.push(...toolResult.affectedObjects);
            }

            if (!toolResult.success && toolResult.errors) {
              errors.push(...toolResult.errors);
            }
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);
            errors.push(`Failed to execute ${toolCall.name}: ${errorMessage}`);
          }
        }

        const result: AICommandResult = {
          success: errors.length === 0,
          message:
            errors.length === 0
              ? `Executed ${executedToolCalls.length} action(s)`
              : `Completed with ${errors.length} error(s)`,
          toolCalls: executedToolCalls,
          affectedObjects,
          errors: errors.length > 0 ? errors : undefined,
        };

        const completedCommand: AICommand = {
          ...command,
          status: errors.length === 0 ? 'completed' : 'error',
          result,
          completedAt: Date.now(),
          error: errors.length > 0 ? errors.join('; ') : undefined,
        };

        setCurrentCommand(completedCommand);
        setCommandHistory((prev) => [completedCommand, ...prev]);
        setStatus(errors.length === 0 ? 'completed' : 'error');

        if (errors.length > 0) {
          setError(errors.join('; '));
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof AIServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'An unexpected error occurred';

        const errorResult: AICommandResult = {
          success: false,
          message: 'Command processing failed',
          toolCalls: [],
          errors: [errorMessage],
        };

        const failedCommand: AICommand = {
          ...command,
          status: 'error',
          result: errorResult,
          error: errorMessage,
          completedAt: Date.now(),
        };

        setCurrentCommand(failedCommand);
        setCommandHistory((prev) => [failedCommand, ...prev]);
        setStatus('error');
        setError(errorMessage);

        return errorResult;
      }
    },
    [service]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setCommandHistory([]);
  }, []);

  const value = useMemo<AIContextValue>(
    () => ({
      status,
      currentCommand,
      commandHistory,
      error,
      isReady,
      submitCommand,
      clearError,
      clearHistory,
    }),
    [
      status,
      currentCommand,
      commandHistory,
      error,
      isReady,
      submitCommand,
      clearError,
      clearHistory,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

/**
 * Hook to access AI context.
 *
 * @returns AI context value
 * @throws Error if used outside AIProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { submitCommand, status, error } = useAI();
 *   // ...
 * }
 * ```
 */
export function useAI(): AIContextValue {
  const context = useContext(AIContext);

  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }

  return context;
}

export { AIContext };
