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
