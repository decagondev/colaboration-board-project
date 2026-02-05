/**
 * AI module interface exports.
 */

export type {
  IAIService,
  IBoardStateService,
  ToolCall,
  ToolParameter,
  ToolDefinition,
  AICommandResult,
  AIStatus,
  AICommand,
} from './IAIService';

export { AIServiceError } from './IAIService';

export type {
  IAICommandQueue,
  QueuedCommand,
  CommandQueueStatus,
  QueueSubscriptionOptions,
  QueueCallback,
  CommandCallback,
} from './IAICommandQueue';

export { AICommandQueueError } from './IAICommandQueue';
