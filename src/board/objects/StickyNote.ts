/**
 * Sticky Note Object
 *
 * Implements a sticky note board object with text editing,
 * color customization, and connector support.
 */

import type {
  IBoardObject,
  BoardObjectData,
  Position,
  Size,
  BoundingBox,
} from '../interfaces/IBoardObject';
import type {
  ITransformable,
  Transform,
  TransformUpdate,
} from '../interfaces/ITransformable';
import type {
  ISelectable,
  SelectionState,
  SelectionHandle,
  HandlePosition,
} from '../interfaces/ISelectable';
import type { IEditable, EditMode } from '../interfaces/IEditable';
import type { IColorable, Color, ColorScheme } from '../interfaces/IColorable';
import type {
  IConnectable,
  ConnectionPoint,
  ConnectionAnchor,
} from '../interfaces/IConnectable';
import {
  createDefaultTransform,
  DEFAULT_MIN_SIZE,
} from '../interfaces/ITransformable';
import {
  DEFAULT_SELECTION_STATE,
  HANDLE_CURSORS,
} from '../interfaces/ISelectable';
import {
  BOARD_COLORS,
  DEFAULT_COLOR_SCHEME,
  getContrastingTextColor,
} from '../interfaces/IColorable';
import { calculateConnectionPoints } from '../interfaces/IConnectable';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Sticky note specific data stored in the data field.
 */
export interface StickyNoteData {
  /** Text content of the sticky note */
  text: string;
  /** Fill color */
  fillColor: Color;
  /** Text color */
  textColor: Color;
  /** Font size in pixels */
  fontSize: number;
  /** Text alignment */
  textAlign: 'left' | 'center' | 'right';
}

/**
 * Default sticky note dimensions.
 */
export const STICKY_NOTE_DEFAULT_SIZE: Size = {
  width: 200,
  height: 150,
};

/**
 * Default sticky note data.
 */
export const STICKY_NOTE_DEFAULTS: StickyNoteData = {
  text: '',
  fillColor: BOARD_COLORS.yellow,
  textColor: '#333333',
  fontSize: 16,
  textAlign: 'left',
};

/**
 * Sticky Note class implementing all board object interfaces.
 *
 * A sticky note is a rectangular colored note with editable text content.
 * It supports:
 * - Drag and drop positioning
 * - Resize via handles
 * - Double-click to edit text
 * - Color customization
 * - Connector attachment points
 */
export class StickyNote
  implements
    IBoardObject,
    ITransformable,
    ISelectable,
    IEditable,
    IColorable,
    IConnectable
{
  readonly id: string;
  readonly type = 'sticky-note' as const;
  readonly createdBy: string;
  readonly createdAt: number;
  modifiedBy: string;
  modifiedAt: number;

  private _position: Position;
  private _size: Size;
  private _zIndex: number;
  private _locked: boolean = false;
  private _visible: boolean = true;
  private _transform: Transform;
  private _selectionState: SelectionState = { ...DEFAULT_SELECTION_STATE };
  private _editMode: EditMode = 'view';
  private _content: string;
  private _originalContent: string | null = null;
  private _colors: ColorScheme;
  private _fontSize: number;
  private _textAlign: 'left' | 'center' | 'right';
  private _connectedIds: string[] = [];

  /**
   * Creates a new StickyNote instance.
   *
   * @param data - Serialized sticky note data
   */
  constructor(data: BoardObjectData) {
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

    this._transform = createDefaultTransform(
      data.x,
      data.y,
      data.width,
      data.height
    );

    const noteData = data.data as Partial<StickyNoteData> | undefined;
    this._content = noteData?.text ?? STICKY_NOTE_DEFAULTS.text;
    this._fontSize = noteData?.fontSize ?? STICKY_NOTE_DEFAULTS.fontSize;
    this._textAlign = noteData?.textAlign ?? STICKY_NOTE_DEFAULTS.textAlign;

    this._colors = {
      fill: noteData?.fillColor ?? STICKY_NOTE_DEFAULTS.fillColor,
      stroke: '#00000000',
      text: noteData?.textColor ?? STICKY_NOTE_DEFAULTS.textColor,
    };
  }

  /**
   * Create a new sticky note with default values.
   *
   * @param position - Position on the canvas
   * @param createdBy - User ID creating the note
   * @param options - Optional overrides
   * @returns New StickyNote instance
   */
  static create(
    position: Position,
    createdBy: string,
    options?: Partial<StickyNoteData & { size: Size }>
  ): StickyNote {
    const now = Date.now();
    const size = options?.size ?? STICKY_NOTE_DEFAULT_SIZE;

    return new StickyNote({
      id: generateUUID(),
      type: 'sticky-note',
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      zIndex: now,
      locked: false,
      visible: true,
      createdBy,
      createdAt: now,
      modifiedBy: createdBy,
      modifiedAt: now,
      data: {
        text: options?.text ?? STICKY_NOTE_DEFAULTS.text,
        fillColor: options?.fillColor ?? STICKY_NOTE_DEFAULTS.fillColor,
        textColor: options?.textColor ?? STICKY_NOTE_DEFAULTS.textColor,
        fontSize: options?.fontSize ?? STICKY_NOTE_DEFAULTS.fontSize,
        textAlign: options?.textAlign ?? STICKY_NOTE_DEFAULTS.textAlign,
      },
    });
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
      width: Math.max(this.minSize.width, value.width),
      height: Math.max(this.minSize.height, value.height),
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

  private markModified(): void {
    this.modifiedAt = Date.now();
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

  clone(): StickyNote {
    return new StickyNote({
      ...this.toJSON(),
      id: generateUUID(),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });
  }

  toJSON(): BoardObjectData {
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
        text: this._content,
        fillColor: this._colors.fill,
        textColor: this._colors.text,
        fontSize: this._fontSize,
        textAlign: this._textAlign,
      },
    };
  }

  get transform(): Transform {
    return { ...this._transform };
  }

  set transform(value: Transform) {
    this.applyTransform(value);
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

  resizeTo(size: Size, _anchor?: Position): void {
    this.size = size;
  }

  rotateTo(degrees: number, _center?: Position): void {
    this._transform.rotation = degrees;
    this.markModified();
  }

  rotateBy(degrees: number, _center?: Position): void {
    this._transform.rotation += degrees;
    this.markModified();
  }

  applyTransform(update: TransformUpdate): void {
    if (update.x !== undefined || update.y !== undefined) {
      this._position = {
        x: update.x ?? this._position.x,
        y: update.y ?? this._position.y,
      };
      this._transform.x = this._position.x;
      this._transform.y = this._position.y;
    }

    if (update.width !== undefined || update.height !== undefined) {
      this._size = {
        width: Math.max(this.minSize.width, update.width ?? this._size.width),
        height: Math.max(
          this.minSize.height,
          update.height ?? this._size.height
        ),
      };
      this._transform.width = this._size.width;
      this._transform.height = this._size.height;
    }

    if (update.rotation !== undefined) {
      this._transform.rotation = update.rotation;
    }

    if (update.scaleX !== undefined) {
      this._transform.scaleX = update.scaleX;
    }

    if (update.scaleY !== undefined) {
      this._transform.scaleY = update.scaleY;
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
    this._transform = createDefaultTransform(
      this._position.x,
      this._position.y,
      this._size.width,
      this._size.height
    );
    this.markModified();
  }

  readonly canRotate = false;
  readonly canFreeResize = true;
  readonly minSize = DEFAULT_MIN_SIZE;

  get selectionState(): SelectionState {
    return { ...this._selectionState };
  }

  select(asPrimary: boolean = true): void {
    this._selectionState = {
      ...this._selectionState,
      isSelected: true,
      isPrimarySelection: asPrimary,
      isMultiSelected: !asPrimary,
    };
  }

  deselect(): void {
    this._selectionState = { ...DEFAULT_SELECTION_STATE };
  }

  setHovered(hovered: boolean): void {
    this._selectionState = {
      ...this._selectionState,
      isHovered: hovered,
    };
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
        position: {
          x: bounds.x + bounds.width,
          y: bounds.y + bounds.height / 2,
        },
        cursor: HANDLE_CURSORS.right,
      },
      {
        handle: 'bottom-right',
        position: { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        cursor: HANDLE_CURSORS['bottom-right'],
      },
      {
        handle: 'bottom',
        position: {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height,
        },
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

    return handles;
  }

  hitTestHandle(
    point: Position,
    tolerance: number = 8
  ): SelectionHandle | null {
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

  get editMode(): EditMode {
    return this._editMode;
  }

  get content(): string {
    return this._content;
  }

  set content(value: string) {
    this._content = value;
    this.markModified();
  }

  startEditing(): boolean {
    if (this._locked) return false;
    this._editMode = 'edit';
    this._originalContent = this._content;
    return true;
  }

  finishEditing(): boolean {
    if (this._editMode !== 'edit') return false;
    this._editMode = 'view';
    this._originalContent = null;
    this.markModified();
    return true;
  }

  cancelEditing(): void {
    if (this._editMode !== 'edit') return;
    if (this._originalContent !== null) {
      this._content = this._originalContent;
    }
    this._editMode = 'view';
    this._originalContent = null;
  }

  updateContent(content: string): void {
    if (this._editMode === 'edit') {
      this._content = content;
    }
  }

  getOriginalContent(): string | null {
    return this._originalContent;
  }

  hasUnsavedChanges(): boolean {
    return this._editMode === 'edit' && this._content !== this._originalContent;
  }

  readonly isEditable = true;
  readonly maxContentLength = 1000;
  readonly placeholder = 'Enter text...';

  get colors(): ColorScheme {
    return { ...this._colors };
  }

  setFillColor(color: Color): void {
    this._colors.fill = color;
    this._colors.text = getContrastingTextColor(color);
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
  readonly hasStroke = false;
  readonly hasTextColor = true;

  get fontSize(): number {
    return this._fontSize;
  }

  set fontSize(value: number) {
    this._fontSize = Math.max(8, Math.min(72, value));
    this.markModified();
  }

  get textAlign(): 'left' | 'center' | 'right' {
    return this._textAlign;
  }

  set textAlign(value: 'left' | 'center' | 'right') {
    this._textAlign = value;
    this.markModified();
  }

  getConnectionPoints(): ConnectionPoint[] {
    const bounds = this.getBounds();
    return calculateConnectionPoints(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      this._transform.rotation
    );
  }

  getNearestConnectionPoint(position: Position): ConnectionPoint {
    const points = this.getConnectionPoints();
    let nearest = points[0];
    let minDist = Infinity;

    for (const point of points) {
      const dx = position.x - point.position.x;
      const dy = position.y - point.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        nearest = point;
      }
    }

    return nearest;
  }

  getConnectionPoint(anchor: ConnectionAnchor): ConnectionPoint | undefined {
    return this.getConnectionPoints().find((p) => p.anchor === anchor);
  }

  get connectedIds(): readonly string[] {
    return [...this._connectedIds];
  }

  attachConnector(connectorId: string, _anchor: ConnectionAnchor): void {
    if (!this._connectedIds.includes(connectorId)) {
      this._connectedIds.push(connectorId);
    }
  }

  detachConnector(connectorId: string): void {
    const index = this._connectedIds.indexOf(connectorId);
    if (index !== -1) {
      this._connectedIds.splice(index, 1);
    }
  }

  readonly isConnectable = true;
}
