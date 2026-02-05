/**
 * Labelable Interface
 *
 * For objects that can display a centered text label.
 * Follows Interface Segregation Principle (ISP) - focused on label functionality only.
 *
 * @module board/interfaces/ILabelable
 */

/**
 * Label configuration options.
 */
export interface LabelConfig {
  /** Label text content */
  text: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font family */
  fontFamily: string;
  /** Font weight (normal, bold) */
  fontWeight: 'normal' | 'bold';
  /** Text color */
  color: string;
  /** Horizontal alignment */
  align: 'left' | 'center' | 'right';
  /** Vertical alignment */
  verticalAlign: 'top' | 'middle' | 'bottom';
  /** Whether label is visible */
  visible: boolean;
  /** Padding around the label */
  padding: number;
}

/**
 * Interface for objects that can display a text label.
 *
 * Labelable objects have a centered text label that can be
 * customized and toggled on/off.
 */
export interface ILabelable {
  /**
   * Current label configuration.
   */
  readonly label: LabelConfig;

  /**
   * Whether this object supports labels.
   */
  readonly isLabelable: boolean;

  /**
   * Set the label text.
   *
   * @param text - New label text (empty string hides label)
   */
  setLabelText(text: string): void;

  /**
   * Set the label font size.
   *
   * @param size - Font size in pixels
   */
  setLabelFontSize(size: number): void;

  /**
   * Set the label color.
   *
   * @param color - Text color (hex string)
   */
  setLabelColor(color: string): void;

  /**
   * Set the label visibility.
   *
   * @param visible - Whether label should be visible
   */
  setLabelVisible(visible: boolean): void;

  /**
   * Apply full label configuration.
   *
   * @param config - Partial label config to apply
   */
  applyLabelConfig(config: Partial<LabelConfig>): void;

  /**
   * Get label text for display (may include truncation).
   *
   * @param maxWidth - Maximum width for text
   * @returns Display text, potentially truncated
   */
  getLabelDisplayText(maxWidth: number): string;
}

/**
 * Default label configuration.
 */
export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  text: '',
  fontSize: 14,
  fontFamily: 'Arial, sans-serif',
  fontWeight: 'normal',
  color: '#333333',
  align: 'center',
  verticalAlign: 'middle',
  visible: true,
  padding: 8,
};

/**
 * Minimum font size for labels.
 */
export const MIN_LABEL_FONT_SIZE = 8;

/**
 * Maximum font size for labels.
 */
export const MAX_LABEL_FONT_SIZE = 72;

/**
 * Type guard to check if an object is labelable.
 *
 * @param obj - Object to check
 * @returns True if object implements ILabelable
 */
export function isLabelable(obj: unknown): obj is ILabelable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'label' in obj &&
    'isLabelable' in obj &&
    (obj as ILabelable).isLabelable === true &&
    typeof (obj as ILabelable).setLabelText === 'function'
  );
}

/**
 * Calculate the best font size to fit text within bounds.
 *
 * @param text - Text to fit
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param baseFontSize - Starting font size
 * @returns Adjusted font size
 */
export function calculateFitFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number
): number {
  const charWidth = baseFontSize * 0.6;
  const textWidth = text.length * charWidth;
  const lineHeight = baseFontSize * 1.2;

  const widthScale = maxWidth / Math.max(textWidth, 1);
  const heightScale = maxHeight / Math.max(lineHeight, 1);
  const scale = Math.min(widthScale, heightScale, 1);

  const adjustedSize = baseFontSize * scale;

  return Math.max(MIN_LABEL_FONT_SIZE, Math.min(MAX_LABEL_FONT_SIZE, adjustedSize));
}

/**
 * Truncate text to fit within a maximum width.
 *
 * @param text - Text to truncate
 * @param maxWidth - Maximum width in pixels
 * @param fontSize - Font size for calculation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(
  text: string,
  maxWidth: number,
  fontSize: number
): string {
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);

  if (text.length <= maxChars) {
    return text;
  }

  if (maxChars <= 3) {
    return text.substring(0, maxChars);
  }

  return text.substring(0, maxChars - 3) + '...';
}
