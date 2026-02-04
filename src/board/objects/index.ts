/**
 * Board module object exports.
 */

export { ObjectFactory, getObjectFactory } from './ObjectFactory';
export type { CreateObjectOptions, ObjectCreator } from './ObjectFactory';

export {
  StickyNote,
  STICKY_NOTE_DEFAULT_SIZE,
  STICKY_NOTE_DEFAULTS,
} from './StickyNote';
export type { StickyNoteData } from './StickyNote';

export { Shape, SHAPE_DEFAULTS } from './Shape';
export type { ShapeType, ShapeData } from './Shape';

export { Connector, CONNECTOR_DEFAULTS } from './Connector';
export type {
  ConnectorRouteStyle,
  ConnectorArrowStyle,
  ConnectorEndpoint,
  ConnectorData,
} from './Connector';

export { Frame, FRAME_DEFAULTS } from './Frame';
export type { FrameData } from './Frame';

export { StandaloneText, TEXT_DEFAULTS } from './StandaloneText';
export type {
  TextAlign,
  TextVerticalAlign,
  FontStyle,
  StandaloneTextData,
} from './StandaloneText';
