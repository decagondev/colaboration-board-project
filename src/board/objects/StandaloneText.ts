/**
 * StandaloneText Object
 *
 * A text object that exists independently on the canvas, outside of sticky
 * notes or other containers.
 */

import type {
  IBoardObject,
  Position,
  Size,
  BoundingBox,
  BoardObjectData,
} from '../interfaces/IBoardObject';
import type { ITransformable, Transform } from '../interfaces/ITransformable';
import type {
  ISelectable,
  SelectionState,
  SelectionHandle,
  HandlePosition,
} from '../interfaces/ISelectable';
import type { IEditable, EditMode } from '../interfaces/IEditable';
import type { IColorable, Color, ColorScheme } from '../interfaces/IColorable';
import {
  DEFAULT_MIN_SIZE as _DEFAULT_MIN_SIZE,
  createDefaultTransform,
} from '../interfaces/ITransformable';
import {
  DEFAULT_SELECTION_STATE,
  HANDLE_CURSORS,
} from '../interfaces/ISelectable';
import { BOARD_COLORS, DEFAULT_COLOR_SCHEME as _DEFAULT_COLOR_SCHEME } from '../interfaces/IColorable';
void _DEFAULT_MIN_SIZE;
void _DEFAULT_COLOR_SCHEME;
import { generateUUID } from '@shared/utils/uuid';

/**
 * Text alignment options.
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * Text vertical alignment options.
 */
export type TextVerticalAlign = 'top' | 'middle' | 'bottom';

/**
 * Font style options.
 */
export type FontStyle = 'normal' | 'bold' | 'italic' | 'bold italic';

/**
 * StandaloneText-specific data.
 */
export interface StandaloneTextData {
  /** Text content */
  content: string;
  /** Font family */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font style */
  fontStyle: FontStyle;
  /** Text horizontal alignment */
  align: TextAlign;
  /** Text vertical alignment */
  verticalAlign: TextVerticalAlign;
  /** Line height multiplier */
  lineHeight: number;
}

/**
 * Default text values.
 */
export const TEXT_DEFAULTS = {
  content: 'Text',
  fontFamily: 'Arial, sans-serif',
  fontSize: 16,
  fontStyle: 'normal' as FontStyle,
  align: 'left' as TextAlign,
  verticalAlign: 'top' as TextVerticalAlign,
  lineHeight: 1.2,
  minWidth: 50,
  minHeight: 20,
};

/**
 * StandaloneText class implementing board object and editable interfaces.
 *
 * Text objects support:
 * - Customizable font properties
 * - Text alignment
 * - Direct inline editing
 * - Color customization
 */
export class StandaloneText
  implements IBoardObject, ITransformable, ISelectable, IEditable, IColorable
{
  readonly id: string;
  readonly type = 'text';
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

  private _content: string;
  private _originalContent: string;
  private _editMode: EditMode;
  private _fontFamily: string;
  private _fontSize: number;
  private _fontStyle: FontStyle;
  private _align: TextAlign;
  private _verticalAlign: TextVerticalAlign;
  private _lineHeight: number;

  /**
   * Create a new StandaloneText instance.
   *
   * @param data - Text initialization data
   */
  private constructor(data: BoardObjectData & { data: StandaloneTextData }) {
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

    this._transform = createDefaultTransform(data.x, data.y, data.width, data.height);

    this._selectionState = { ...DEFAULT_SELECTION_STATE };
    this._editMode = 'view';

    this._colors = {
      fill: 'transparent',
      stroke: 'transparent',
      text: BOARD_COLORS.black,
    };

    const textData = data.data;
    this._content = textData.content;
    this._originalContent = textData.content;
    this._fontFamily = textData.fontFamily;
    this._fontSize = textData.fontSize;
    this._fontStyle = textData.fontStyle;
    this._align = textData.align;
    this._verticalAlign = textData.verticalAlign;
    this._lineHeight = textData.lineHeight;
  }

  /**
   * Create a new StandaloneText.
   *
   * @param position - Text position
   * @param createdBy - User ID creating the text
   * @param options - Optional configuration
   * @returns New StandaloneText instance
   */
  static create(
    position: Position,
    createdBy: string,
    options?: Partial<StandaloneTextData> & {
      size?: Size;
      textColor?: Color;
    }
  ): StandaloneText {
    const now = Date.now();
    const content = options?.content ?? TEXT_DEFAULTS.content;

    const text = new StandaloneText({
      id: generateUUID(),
      type: 'text',
      x: position.x,
      y: position.y,
      width: options?.size?.width ?? 200,
      height: options?.size?.height ?? 30,
      zIndex: now,
      locked: false,
      visible: true,
      createdBy,
      createdAt: now,
      modifiedBy: createdBy,
      modifiedAt: now,
      data: {
        content,
        fontFamily: options?.fontFamily ?? TEXT_DEFAULTS.fontFamily,
        fontSize: options?.fontSize ?? TEXT_DEFAULTS.fontSize,
        fontStyle: options?.fontStyle ?? TEXT_DEFAULTS.fontStyle,
        align: options?.align ?? TEXT_DEFAULTS.align,
        verticalAlign: options?.verticalAlign ?? TEXT_DEFAULTS.verticalAlign,
        lineHeight: options?.lineHeight ?? TEXT_DEFAULTS.lineHeight,
      },
    });

    if (options?.textColor) {
      text._colors.text = options.textColor;
    }

    return text;
  }

  get content(): string {
    return this._content;
  }

  set content(value: string) {
    this._content = value;
    this.markModified();
  }

  get fontFamily(): string {
    return this._fontFamily;
  }

  set fontFamily(value: string) {
    this._fontFamily = value;
    this.markModified();
  }

  get fontSize(): number {
    return this._fontSize;
  }

  set fontSize(value: number) {
    this._fontSize = Math.max(8, Math.min(200, value));
    this.markModified();
  }

  get fontStyle(): FontStyle {
    return this._fontStyle;
  }

  set fontStyle(value: FontStyle) {
    this._fontStyle = value;
    this.markModified();
  }

  get align(): TextAlign {
    return this._align;
  }

  set align(value: TextAlign) {
    this._align = value;
    this.markModified();
  }

  get verticalAlign(): TextVerticalAlign {
    return this._verticalAlign;
  }

  set verticalAlign(value: TextVerticalAlign) {
    this._verticalAlign = value;
    this.markModified();
  }

  get lineHeight(): number {
    return this._lineHeight;
  }

  set lineHeight(value: number) {
    this._lineHeight = Math.max(0.5, Math.min(3, value));
    this.markModified();
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
      width: Math.max(TEXT_DEFAULTS.minWidth, value.width),
      height: Math.max(TEXT_DEFAULTS.minHeight, value.height),
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

  clone(): StandaloneText {
    return new StandaloneText({
      ...this.toJSON(),
      id: generateUUID(),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });
  }

  toJSON(): BoardObjectData & { data: StandaloneTextData } {
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
        content: this._content,
        fontFamily: this._fontFamily,
        fontSize: this._fontSize,
        fontStyle: this._fontStyle,
        align: this._align,
        verticalAlign: this._verticalAlign,
        lineHeight: this._lineHeight,
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
    this._transform = createDefaultTransform(
      this._position.x,
      this._position.y,
      this._size.width,
      this._size.height
    );
    this.markModified();
  }

  readonly canRotate = true;
  readonly canFreeResize = true;

  get minSize(): Size {
    return { width: TEXT_DEFAULTS.minWidth, height: TEXT_DEFAULTS.minHeight };
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
    return [
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

  get editMode(): EditMode {
    return this._editMode;
  }

  startEditing(): boolean {
    if (!this._locked) {
      this._editMode = 'edit';
      this._originalContent = this._content;
      return true;
    }
    return false;
  }

  finishEditing(): boolean {
    const wasEditing = this._editMode === 'edit';
    this._editMode = 'view';
    return wasEditing;
  }

  cancelEditing(): void {
    this._content = this._originalContent;
    this._editMode = 'view';
  }

  updateContent(content: string): void {
    if (this._editMode === 'edit') {
      this._content = content;
      this.markModified();
    }
  }

  getOriginalContent(): string {
    return this._originalContent;
  }

  hasUnsavedChanges(): boolean {
    return (
      this._content !== this._originalContent && this._editMode === 'edit'
    );
  }

  readonly isEditable = true;

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
