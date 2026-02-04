/**
 * Colorable Interface
 *
 * For objects that have color properties.
 */

/**
 * Color value (hex string, rgba, or named color).
 */
export type Color = string;

/**
 * Predefined color palette for board objects.
 */
export const BOARD_COLORS = {
  yellow: '#FFE066',
  orange: '#FFB366',
  red: '#FF6666',
  pink: '#FF66B2',
  purple: '#B366FF',
  blue: '#66B3FF',
  cyan: '#66FFE6',
  green: '#66FF66',
  lime: '#B3FF66',
  white: '#FFFFFF',
  gray: '#CCCCCC',
  black: '#333333',
} as const;

/**
 * Available color names.
 */
export type BoardColorName = keyof typeof BOARD_COLORS;

/**
 * Color scheme for objects with multiple color properties.
 */
export interface ColorScheme {
  /** Background/fill color */
  fill: Color;
  /** Border/stroke color */
  stroke: Color;
  /** Text color */
  text: Color;
}

/**
 * Interface for objects that have color properties.
 *
 * Colorable objects have fill, stroke, and optionally text colors
 * that can be customized by the user.
 */
export interface IColorable {
  /**
   * Current color scheme.
   */
  colors: ColorScheme;

  /**
   * Set the fill/background color.
   *
   * @param color - New fill color
   */
  setFillColor(color: Color): void;

  /**
   * Set the stroke/border color.
   *
   * @param color - New stroke color
   */
  setStrokeColor(color: Color): void;

  /**
   * Set the text color.
   *
   * @param color - New text color
   */
  setTextColor(color: Color): void;

  /**
   * Apply a full color scheme.
   *
   * @param scheme - Color scheme to apply
   */
  applyColorScheme(scheme: Partial<ColorScheme>): void;

  /**
   * Get available colors for this object type.
   *
   * @returns Array of available colors
   */
  getAvailableColors(): Color[];

  /**
   * Whether the object supports fill color.
   */
  readonly hasFill: boolean;

  /**
   * Whether the object supports stroke color.
   */
  readonly hasStroke: boolean;

  /**
   * Whether the object supports text color.
   */
  readonly hasTextColor: boolean;
}

/**
 * Default color scheme for board objects.
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  fill: BOARD_COLORS.yellow,
  stroke: '#000000',
  text: '#333333',
};

/**
 * Get contrasting text color for a background.
 *
 * @param backgroundColor - Background color in hex format
 * @returns Black or white for best contrast
 */
export function getContrastingTextColor(backgroundColor: Color): Color {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#333333' : '#FFFFFF';
}

/**
 * Type guard to check if an object is colorable.
 *
 * @param obj - Object to check
 * @returns True if object implements IColorable
 */
export function isColorable(obj: unknown): obj is IColorable {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'colors' in obj &&
    typeof (obj as IColorable).setFillColor === 'function' &&
    typeof (obj as IColorable).setStrokeColor === 'function'
  );
}
