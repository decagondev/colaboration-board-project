/**
 * Generates a UUID v4 string.
 *
 * @returns A unique identifier string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
