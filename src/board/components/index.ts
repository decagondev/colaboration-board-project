/**
 * Board module component exports.
 */

export { BoardCanvasComponent } from './BoardCanvasComponent';
export type {
  BoardCanvasProps,
  RenderableObject,
} from './BoardCanvasComponent';

export { ZoomControlsComponent } from './ZoomControlsComponent';
export type { ZoomControlsProps } from './ZoomControlsComponent';

export {
  StickyNoteComponent,
  useStickyNoteEditor,
} from './StickyNoteComponent';
export type { StickyNoteComponentProps } from './StickyNoteComponent';

export { ShapeComponent } from './ShapeComponent';
export type { ShapeComponentProps } from './ShapeComponent';

export { ConnectorComponent } from './ConnectorComponent';
export type { ConnectorComponentProps } from './ConnectorComponent';

export { FrameComponent } from './FrameComponent';
export type { FrameComponentProps } from './FrameComponent';

export { TextComponent, useTextEditor } from './TextComponent';
export type { TextComponentProps } from './TextComponent';
