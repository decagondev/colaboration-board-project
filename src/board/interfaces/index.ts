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

export type {
  CommandType,
  ICommand,
  IBatchCommand,
  CommandHistoryOptions,
  CommandHistoryState,
  CommandHistoryChangeEvent,
  ICommandHistory,
} from './ICommand';
export { DEFAULT_COMMAND_HISTORY_OPTIONS } from './ICommand';

export type {
  ConnectorDragState,
  ConnectorCreationOptions,
  ConnectorCreationResult,
  ConnectionChangeEvent,
  IConnectionService,
} from './IConnectionService';
export { DEFAULT_CONNECTOR_DRAG_STATE } from './IConnectionService';

export type {
  SnapBehavior,
  ContainerPadding,
  AddChildOptions,
  ContainmentCheckResult,
  ContainerChangeEvent,
  IContainer,
  IContainable,
} from './IContainer';
export {
  isContainer,
  isContainable,
  DEFAULT_CONTAINER_PADDING,
  AUTO_CONTAIN_THRESHOLD,
} from './IContainer';
