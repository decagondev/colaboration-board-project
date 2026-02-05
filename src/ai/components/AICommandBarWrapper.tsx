/**
 * AI Command Bar Wrapper Component
 *
 * Connects the AICommandBarComponent with the board context and AI context.
 * Creates the IBoardStateService adapter from board context operations.
 */

import { useCallback, useMemo } from 'react';
import { useBoard } from '@board/context/BoardContext';
import { useAuth } from '@auth/context/AuthContext';
import { useAI } from '../context/AIContext';
import { AICommandBarComponent } from './AICommandBarComponent';
import type { IBoardStateService, AICommandResult } from '../interfaces/IAIService';
import type { SyncableObject } from '@sync/interfaces/ISyncService';
import { generateUUID } from '@shared/utils';

/**
 * Props for AICommandBarWrapper.
 */
export interface AICommandBarWrapperProps {
  /** Optional CSS class name */
  className?: string;
}

/**
 * AI Command Bar Wrapper
 *
 * Integrates the AI command bar with the board and auth contexts.
 * Creates the necessary board service adapter for AI tool execution.
 *
 * @example
 * ```tsx
 * <BoardProvider board={board}>
 *   <AIProvider apiKey={apiKey}>
 *     <AICommandBarWrapper />
 *   </AIProvider>
 * </BoardProvider>
 * ```
 */
export function AICommandBarWrapper({
  className = '',
}: AICommandBarWrapperProps): React.JSX.Element {
  const { user } = useAuth();
  const { objects, createObject, updateObject, deleteObject } = useBoard();
  const { status, error, isReady, submitCommand, clearError } = useAI();

  /**
   * Create IBoardStateService adapter from board context.
   * This bridges the gap between the AI service expectations and board context operations.
   */
  const boardService: IBoardStateService = useMemo(
    () => ({
      getObjects: () => objects,
      getObject: (id: string) => objects.find((obj) => obj.id === id),
      createObject: async (objectData: Partial<SyncableObject>): Promise<string> => {
        const now = Date.now();
        const id = objectData.id ?? generateUUID();
        const newObject: SyncableObject = {
          id,
          type: objectData.type ?? 'sticky-note',
          x: objectData.x ?? 0,
          y: objectData.y ?? 0,
          width: objectData.width ?? 200,
          height: objectData.height ?? 200,
          zIndex: objectData.zIndex ?? objects.length + 1,
          createdBy: user?.uid ?? 'anonymous',
          createdAt: now,
          modifiedBy: user?.uid ?? 'anonymous',
          modifiedAt: now,
          data: objectData.data,
        };
        await createObject(newObject);
        return id;
      },
      updateObject: async (id: string, updates: Partial<SyncableObject>): Promise<void> => {
        await updateObject(id, updates);
      },
      deleteObject: async (id: string): Promise<void> => {
        await deleteObject(id);
      },
      deleteObjects: async (ids: string[]): Promise<void> => {
        for (const id of ids) {
          await deleteObject(id);
        }
      },
    }),
    [objects, createObject, updateObject, deleteObject, user?.uid]
  );

  /**
   * Handle command submission.
   * Bridges the AI context with board state.
   */
  const handleSubmit = useCallback(
    async (input: string): Promise<AICommandResult | null> => {
      clearError();
      const result = await submitCommand(input, objects, boardService);
      return result;
    },
    [objects, boardService, submitCommand, clearError]
  );

  /**
   * Handle successful command.
   */
  const handleCommandSuccess = useCallback((result: AICommandResult) => {
    console.log('AI command succeeded:', result.message);
  }, []);

  /**
   * Handle command error.
   */
  const handleCommandError = useCallback((err: Error) => {
    console.error('AI command failed:', err.message);
  }, []);

  return (
    <AICommandBarComponent
      onSubmit={handleSubmit}
      isProcessing={status === 'processing'}
      isReady={isReady}
      error={error}
      onCommandSuccess={handleCommandSuccess}
      onCommandError={handleCommandError}
      placeholder="Ask AI to create, move, or organize objects..."
      className={className}
    />
  );
}
