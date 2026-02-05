/**
 * Environment-aware factory for AI services.
 *
 * This module contains code that uses Vite's import.meta.env,
 * which is separated from the main service for testability.
 */

import { OpenAIService } from './OpenAIService';
import { AIServiceError } from '../interfaces/IAIService';

/**
 * Create an OpenAIService instance with environment configuration.
 *
 * Reads API key from VITE_OPENAI_API_KEY environment variable.
 *
 * @param apiKey - Optional API key override
 * @returns Configured OpenAIService instance
 * @throws AIServiceError if API key is not configured
 */
export function createOpenAIService(apiKey?: string): OpenAIService {
  const key = apiKey ?? import.meta.env.VITE_OPENAI_API_KEY ?? '';
  if (!key) {
    throw new AIServiceError(
      'VITE_OPENAI_API_KEY environment variable is not set',
      'MISSING_ENV_VAR'
    );
  }

  return new OpenAIService({ apiKey: key });
}
