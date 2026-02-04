/**
 * Board module interface exports.
 */

export type {
  Position,
  Size,
  BoundingBox,
  IBoardObject,
  BoardObjectType,
  BoardObjectData,
} from './IBoardObject';

export type {
  Transform,
  TransformUpdate,
  ITransformable,
} from './ITransformable';
export { DEFAULT_MIN_SIZE, createDefaultTransform } from './ITransformable';

export type {
  SelectionState,
  SelectionHandle,
  HandlePosition,
  ISelectable,
} from './ISelectable';
export { DEFAULT_SELECTION_STATE, HANDLE_CURSORS } from './ISelectable';

export type {
  EditMode,
  EditEventType,
  EditEvent,
  IEditable,
} from './IEditable';
export { isEditable } from './IEditable';

export type {
  Color,
  BoardColorName,
  ColorScheme,
  IColorable,
} from './IColorable';
export {
  BOARD_COLORS,
  DEFAULT_COLOR_SCHEME,
  getContrastingTextColor,
  isColorable,
} from './IColorable';

export type {
  ConnectionAnchor,
  ConnectionPoint,
  ConnectionRef,
  IConnectable,
} from './IConnectable';
export { calculateConnectionPoints, isConnectable } from './IConnectable';

export type {
  SelectionMode,
  LassoState,
  SelectionChangeEvent,
  ISelectionService,
  DraggedHandle,
} from './ISelectionService';
export { DEFAULT_LASSO_STATE } from './ISelectionService';
