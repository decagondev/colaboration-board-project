/**
 * Text measurement utilities for calculating text dimensions.
 * Uses canvas 2D context for accurate text measurement.
 */

/**
 * Text measurement options.
 */
export interface TextMeasureOptions {
  /** Text content to measure */
  text: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font family (defaults to Arial) */
  fontFamily?: string;
  /** Font style (normal, italic, bold, etc.) */
  fontStyle?: string;
  /** Padding to add around the text */
  padding?: number;
}

/**
 * Result of text measurement.
 */
export interface TextMeasureResult {
  /** Width needed to fit the text */
  width: number;
  /** Height needed to fit the text */
  height: number;
}

let measureCanvas: HTMLCanvasElement | null = null;

/**
 * Gets or creates a shared canvas for text measurement.
 *
 * @returns Canvas 2D rendering context
 */
function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
  }
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2D context for text measurement');
  }
  return ctx;
}

/**
 * Measures the dimensions needed to display text with given styling.
 * Uses a line height multiplier that approximates Konva's text rendering.
 *
 * @param options - Text measurement options
 * @returns Measured width and height for the text
 *
 * @example
 * const { width, height } = measureText({
 *   text: 'Hello World',
 *   fontSize: 16,
 *   fontFamily: 'Arial',
 *   padding: 10
 * });
 */
export function measureText(options: TextMeasureOptions): TextMeasureResult {
  const {
    text,
    fontSize,
    fontFamily = 'Arial',
    fontStyle = 'normal',
    padding = 0,
  } = options;

  const ctx = getMeasureContext();
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;

  const lines = text.split('\n');
  let maxWidth = 0;

  for (const line of lines) {
    const metrics = ctx.measureText(line || ' ');
    maxWidth = Math.max(maxWidth, metrics.width);
  }

  const lineHeight = fontSize * 1.4;
  const totalHeight = Math.max(lines.length * lineHeight, fontSize * 1.5);

  return {
    width: Math.ceil(maxWidth) + padding * 2,
    height: Math.ceil(totalHeight) + padding * 2,
  };
}
