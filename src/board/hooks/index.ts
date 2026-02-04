/**
 * Board module hook exports.
 */

export { useViewport } from './useViewport';
export type {
  ViewportState,
  ViewportOptions,
  UseViewportReturn,
} from './useViewport';

export { useCanvasInteraction } from './useCanvasInteraction';
export type {
  CanvasInteractionOptions,
  UseCanvasInteractionReturn,
} from './useCanvasInteraction';

export { useBoardState } from './useBoardState';
export type { CreateObjectOptions, UseBoardStateReturn } from './useBoardState';

export { useSelection } from './useSelection';
export type { UseSelectionReturn } from './useSelection';
