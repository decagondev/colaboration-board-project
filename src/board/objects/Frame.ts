/**
 * Frame Object
 *
 * A frame is a container that visually groups other board objects.
 * Objects can be added to a frame to organize content on the board.
 */

import type {
  IBoardObject,
  Position,
  Size,
  BoundingBox,
  BoardObjectData,
} from '../interfaces/IBoardObject';
import type {
  ITransformable,
  Transform,
} from '../interfaces/ITransformable';
import type {
  ISelectable,
  SelectionState,
  SelectionHandle,
  HandlePosition,
} from '../interfaces/ISelectable';
import type { IColorable, Color, ColorScheme } from '../interfaces/IColorable';
import {
  DEFAULT_MIN_SIZE,
  createDefaultTransform,
} from '../interfaces/ITransformable';
import {
  DEFAULT_SELECTION_STATE,
  HANDLE_CURSORS,
} from '../interfaces/ISelectable';
import { BOARD_COLORS, DEFAULT_COLOR_SCHEME } from '../interfaces/IColorable';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Frame-specific data.
 */
export interface FrameData {
  /** Frame title/label */
  title: string;
  /** IDs of objects contained in this frame */
  childIds: string[];
  /** Whether the frame shows its title */
  showTitle: boolean;
  /** Background opacity (0-1) */
  backgroundOpacity: number;
}

/**
 * Default frame values.
 */
export const FRAME_DEFAULTS = {
  title: 'Frame',
  showTitle: true,
  backgroundOpacity: 0.1,
  minWidth: 200,
  minHeight: 150,
  titleHeight: 32,
};

/**
 * Frame class implementing board object and container interfaces.
 *
 * Frames act as visual containers that group related objects together.
 * They support:
 * - Titled headers
 * - Background fill
 * - Object containment tracking
 * - Resize and transform operations
 */
export class Frame
  implements IBoardObject, ITransformable, ISelectable, IColorable
{
  readonly id: string;
  readonly type = 'frame';
  readonly createdBy: string;
  readonly createdAt: number;
  modifiedBy: string;
  modifiedAt: number;

  private _position: Position;
  private _size: Size;
  private _zIndex: number;
  private _locked: boolean;
  private _visible: boolean;
  private _transform: Transform;
  private _selectionState: SelectionState;
  private _colors: ColorScheme;

  private _title: string;
  private _childIds: string[];
  private _showTitle: boolean;
  private _backgroundOpacity: number;

  /**
   * Create a new Frame instance.
   *
   * @param data - Frame initialization data
   */
  private constructor(data: BoardObjectData & { data: FrameData }) {
    this.id = data.id;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt;
    this.modifiedBy = data.modifiedBy;
    this.modifiedAt = data.modifiedAt;

    this._position = { x: data.x, y: data.y };
    this._size = { width: data.width, height: data.height };
    this._zIndex = data.zIndex;
    this._locked = data.locked;
    this._visible = data.visible;

    this._transform = createDefaultTransform();
    this._transform.x = data.x;
    this._transform.y = data.y;
    this._transform.width = data.width;
    this._transform.height = data.height;

    this._selectionState = { ...DEFAULT_SELECTION_STATE };

    this._colors = {
      fill: BOARD_COLORS.gray,
      stroke: BOARD_COLORS.black,
      text: DEFAULT_COLOR_SCHEME.text,
    };

    const frameData = data.data;
    this._title = frameData.title;
    this._childIds = [...frameData.childIds];
    this._showTitle = frameData.showTitle;
    this._backgroundOpacity = frameData.backgroundOpacity;
  }

  /**
   * Create a new Frame.
   *
   * @param position - Frame position
   * @param size - Frame size
   * @param createdBy - User ID creating the frame
   * @param options - Optional configuration
   * @returns New Frame instance
   */
  static create(
    position: Position,
    size: Size,
    createdBy: string,
    options?: Partial<FrameData> & {
      fillColor?: Color;
      strokeColor?: Color;
    }
  ): Frame {
    const now = Date.now();

    const frame = new Frame({
      id: generateUUID(),
      type: 'frame',
      x: position.x,
      y: position.y,
      width: Math.max(FRAME_DEFAULTS.minWidth, size.width),
      height: Math.max(FRAME_DEFAULTS.minHeight, size.height),
      zIndex: now,
      locked: false,
      visible: true,
      createdBy,
      createdAt: now,
      modifiedBy: createdBy,
      modifiedAt: now,
      data: {
        title: options?.title ?? FRAME_DEFAULTS.title,
        childIds: options?.childIds ?? [],
        showTitle: options?.showTitle ?? FRAME_DEFAULTS.showTitle,
        backgroundOpacity:
          options?.backgroundOpacity ?? FRAME_DEFAULTS.backgroundOpacity,
      },
    });

    if (options?.fillColor) {
      frame._colors.fill = options.fillColor;
    }
    if (options?.strokeColor) {
      frame._colors.stroke = options.strokeColor;
    }

    return frame;
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
    this.markModified();
  }

  get childIds(): readonly string[] {
    return [...this._childIds];
  }

  get showTitle(): boolean {
    return this._showTitle;
  }

  set showTitle(value: boolean) {
    this._showTitle = value;
    this.markModified();
  }

  get backgroundOpacity(): number {
    return this._backgroundOpacity;
  }

  set backgroundOpacity(value: number) {
    this._backgroundOpacity = Math.max(0, Math.min(1, value));
    this.markModified();
  }

  /**
   * Add an object to this frame.
   *
   * @param objectId - Object ID to add
   */
  addChild(objectId: string): void {
    if (!this._childIds.includes(objectId)) {
      this._childIds.push(objectId);
      this.markModified();
    }
  }

  /**
   * Remove an object from this frame.
   *
   * @param objectId - Object ID to remove
   */
  removeChild(objectId: string): void {
    const index = this._childIds.indexOf(objectId);
    if (index !== -1) {
      this._childIds.splice(index, 1);
      this.markModified();
    }
  }

  /**
   * Check if an object is in this frame.
   *
   * @param objectId - Object ID to check
   * @returns True if the object is in this frame
   */
  containsChild(objectId: string): boolean {
    return this._childIds.includes(objectId);
  }

  /**
   * Clear all children from this frame.
   */
  clearChildren(): void {
    this._childIds = [];
    this.markModified();
  }

  /**
   * Get the content area bounds (excluding title).
   *
   * @returns Bounding box of content area
   */
  getContentBounds(): BoundingBox {
    const titleOffset = this._showTitle ? FRAME_DEFAULTS.titleHeight : 0;
    return {
      x: this._position.x,
      y: this._position.y + titleOffset,
      width: this._size.width,
      height: this._size.height - titleOffset,
    };
  }

  private markModified(): void {
    this.modifiedAt = Date.now();
  }

  get position(): Position {
    return { ...this._position };
  }

  set position(value: Position) {
    this._position = { ...value };
    this._transform.x = value.x;
    this._transform.y = value.y;
    this.markModified();
  }

  get size(): Size {
    return { ...this._size };
  }

  set size(value: Size) {
    this._size = {
      width: Math.max(FRAME_DEFAULTS.minWidth, value.width),
      height: Math.max(FRAME_DEFAULTS.minHeight, value.height),
    };
    this._transform.width = this._size.width;
    this._transform.height = this._size.height;
    this.markModified();
  }

  get zIndex(): number {
    return this._zIndex;
  }

  set zIndex(value: number) {
    this._zIndex = value;
    this.markModified();
  }

  get locked(): boolean {
    return this._locked;
  }

  set locked(value: boolean) {
    this._locked = value;
    this.markModified();
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
    this.markModified();
  }

  getBounds(): BoundingBox {
    return {
      x: this._position.x,
      y: this._position.y,
      width: this._size.width,
      height: this._size.height,
    };
  }

  containsPoint(point: Position): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }

  intersects(bounds: BoundingBox): boolean {
    const myBounds = this.getBounds();
    return !(
      myBounds.x + myBounds.width < bounds.x ||
      bounds.x + bounds.width < myBounds.x ||
      myBounds.y + myBounds.height < bounds.y ||
      bounds.y + bounds.height < myBounds.y
    );
  }

  clone(): Frame {
    return new Frame({
      ...this.toJSON(),
      id: generateUUID(),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });
  }

  toJSON(): BoardObjectData & { data: FrameData } {
    return {
      id: this.id,
      type: this.type,
      x: this._position.x,
      y: this._position.y,
      width: this._size.width,
      height: this._size.height,
      zIndex: this._zIndex,
      locked: this._locked,
      visible: this._visible,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      modifiedBy: this.modifiedBy,
      modifiedAt: this.modifiedAt,
      data: {
        title: this._title,
        childIds: [...this._childIds],
        showTitle: this._showTitle,
        backgroundOpacity: this._backgroundOpacity,
      },
    };
  }

  get transform(): Transform {
    return { ...this._transform };
  }

  moveTo(position: Position): void {
    this.position = position;
  }

  moveBy(delta: Position): void {
    this.position = {
      x: this._position.x + delta.x,
      y: this._position.y + delta.y,
    };
  }

  resizeTo(size: Size): void {
    this.size = size;
  }

  rotateTo(degrees: number): void {
    this._transform.rotation = degrees % 360;
    this.markModified();
  }

  rotateBy(degrees: number): void {
    this._transform.rotation = (this._transform.rotation + degrees) % 360;
    this.markModified();
  }

  applyTransform(transform: Partial<Transform>): void {
    if (transform.x !== undefined && transform.y !== undefined) {
      this.position = { x: transform.x, y: transform.y };
    }
    if (transform.width !== undefined && transform.height !== undefined) {
      this.size = { width: transform.width, height: transform.height };
    }
    if (transform.rotation !== undefined) {
      this._transform.rotation = transform.rotation;
    }
    if (transform.scaleX !== undefined) {
      this._transform.scaleX = transform.scaleX;
    }
    if (transform.scaleY !== undefined) {
      this._transform.scaleY = transform.scaleY;
    }
    this.markModified();
  }

  getCenter(): Position {
    return {
      x: this._position.x + this._size.width / 2,
      y: this._position.y + this._size.height / 2,
    };
  }

  resetTransform(): void {
    this._transform = createDefaultTransform();
    this._transform.x = this._position.x;
    this._transform.y = this._position.y;
    this._transform.width = this._size.width;
    this._transform.height = this._size.height;
    this.markModified();
  }

  readonly canRotate = true;
  readonly canFreeResize = true;

  get minSize(): Size {
    return { width: FRAME_DEFAULTS.minWidth, height: FRAME_DEFAULTS.minHeight };
  }

  get maxSize(): Size {
    return { width: Infinity, height: Infinity };
  }

  get selectionState(): SelectionState {
    return { ...this._selectionState };
  }

  select(asPrimary?: boolean): void {
    this._selectionState.isSelected = true;
    this._selectionState.isPrimarySelection = asPrimary ?? true;
  }

  deselect(): void {
    this._selectionState.isSelected = false;
    this._selectionState.isPrimarySelection = false;
    this._selectionState.isMultiSelected = false;
  }

  setHovered(hovered: boolean): void {
    this._selectionState.isHovered = hovered;
  }

  getSelectionBounds(): BoundingBox {
    return this.getBounds();
  }

  getHandlePositions(): HandlePosition[] {
    const bounds = this.getBounds();
    const handles: HandlePosition[] = [
      {
        handle: 'top-left',
        position: { x: bounds.x, y: bounds.y },
        cursor: HANDLE_CURSORS['top-left'],
      },
      {
        handle: 'top',
        position: { x: bounds.x + bounds.width / 2, y: bounds.y },
        cursor: HANDLE_CURSORS.top,
      },
      {
        handle: 'top-right',
        position: { x: bounds.x + bounds.width, y: bounds.y },
        cursor: HANDLE_CURSORS['top-right'],
      },
      {
        handle: 'right',
        position: { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 },
        cursor: HANDLE_CURSORS.right,
      },
      {
        handle: 'bottom-right',
        position: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        cursor: HANDLE_CURSORS['bottom-right'],
      },
      {
        handle: 'bottom',
        position: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height },
        cursor: HANDLE_CURSORS.bottom,
      },
      {
        handle: 'bottom-left',
        position: { x: bounds.x, y: bounds.y + bounds.height },
        cursor: HANDLE_CURSORS['bottom-left'],
      },
      {
        handle: 'left',
        position: { x: bounds.x, y: bounds.y + bounds.height / 2 },
        cursor: HANDLE_CURSORS.left,
      },
    ];

    if (this.canRotate) {
      handles.push({
        handle: 'rotation',
        position: { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
        cursor: HANDLE_CURSORS.rotation,
      });
    }

    return handles;
  }

  hitTestHandle(point: Position, tolerance = 8): SelectionHandle | null {
    for (const handle of this.getHandlePositions()) {
      const dx = point.x - handle.position.x;
      const dy = point.y - handle.position.y;
      if (Math.sqrt(dx * dx + dy * dy) <= tolerance) {
        return handle.handle;
      }
    }
    return null;
  }

  readonly isSelectable = true;

  get colors(): ColorScheme {
    return { ...this._colors };
  }

  setFillColor(color: Color): void {
    this._colors.fill = color;
    this.markModified();
  }

  setStrokeColor(color: Color): void {
    this._colors.stroke = color;
    this.markModified();
  }

  setTextColor(color: Color): void {
    this._colors.text = color;
    this.markModified();
  }

  applyColorScheme(scheme: Partial<ColorScheme>): void {
    if (scheme.fill !== undefined) {
      this._colors.fill = scheme.fill;
    }
    if (scheme.stroke !== undefined) {
      this._colors.stroke = scheme.stroke;
    }
    if (scheme.text !== undefined) {
      this._colors.text = scheme.text;
    }
    this.markModified();
  }

  getAvailableColors(): Color[] {
    return Object.values(BOARD_COLORS);
  }

  readonly hasFill = true;
  readonly hasStroke = true;
  readonly hasTextColor = true;
}
