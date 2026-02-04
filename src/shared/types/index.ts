/**
 * Shared module type exports.
 */

/**
 * Generic unsubscribe function type.
 */
export type Unsubscribe = () => void;

/**
 * Point coordinates in 2D space.
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Size dimensions.
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Rectangle bounds.
 */
export interface Bounds extends Point, Size {}
