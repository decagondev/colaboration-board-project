/**
 * Shape Object
 *
 * Base class and specific implementations for shape objects
 * including Rectangle, Circle, and Line.
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
import { BOARD_COLORS, DEFAULT_COLOR_SCHEME as _DEFAULT_COLOR_SCHEME } from '../interfaces/IColorable';
void _DEFAULT_COLOR_SCHEME;
import { calculateConnectionPoints } from '../interfaces/IConnectable';
import { generateUUID } from '@shared/utils/uuid';
import type { ShapeType } from '../shapes';

export type { ShapeType } from '../shapes';

/**
 * Shape-specific data.
 */
export interface ShapeData {
  /** Shape type */
  shapeType: ShapeType;
  /** Fill color */
  fillColor: Color;
  /** Stroke color */
  strokeColor: Color;
  /** Stroke width */
  strokeWidth: number;
  /** Corner radius for rectangles */
  cornerRadius?: number;
  /** Line endpoints for line shapes */
  points?: number[];
}

/**
 * Default shape data.
 */
export const SHAPE_DEFAULTS: ShapeData = {
  shapeType: 'rectangle',
  fillColor: BOARD_COLORS.blue,
  strokeColor: '#333333',
  strokeWidth: 2,
  cornerRadius: 0,
};

/**
 * Shape class implementing board object interfaces.
 *
 * A shape is a geometric object that can be:
 * - Rectangle (with optional corner radius)
 * - Ellipse (circle when width === height)
 * - Triangle
 * - Line
 */
export class Shape
  implements IBoardObject, ITransformable, ISelectable, IColorable, IConnectable
{
  readonly id: string;
  readonly type = 'shape' as const;
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
  private _colors: ColorScheme;
  private _shapeType: ShapeType;
  private _strokeWidth: number;
  private _cornerRadius: number;
  private _points: number[] | undefined;
  private _connectedIds: string[] = [];

  /**
   * Creates a new Shape instance.
   *
   * @param data - Serialized shape data
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

    const shapeData = data.data as Partial<ShapeData> | undefined;
    this._shapeType = shapeData?.shapeType ?? SHAPE_DEFAULTS.shapeType;
    this._strokeWidth = shapeData?.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth;
    this._cornerRadius =
      shapeData?.cornerRadius ?? SHAPE_DEFAULTS.cornerRadius ?? 0;
    this._points = shapeData?.points;

    this._colors = {
      fill: shapeData?.fillColor ?? SHAPE_DEFAULTS.fillColor,
      stroke: shapeData?.strokeColor ?? SHAPE_DEFAULTS.strokeColor,
      text: '#333333',
    };
  }

  /**
   * Create a new shape with default values.
   *
   * @param shapeType - Type of shape to create
   * @param position - Position on the canvas
   * @param size - Size of the shape
   * @param createdBy - User ID creating the shape
   * @param options - Optional overrides
   * @returns New Shape instance
   */
  static create(
    shapeType: ShapeType,
    position: Position,
    size: Size,
    createdBy: string,
    options?: Partial<ShapeData>
  ): Shape {
    const now = Date.now();

    return new Shape({
      id: generateUUID(),
      type: 'shape',
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
        shapeType,
        fillColor: options?.fillColor ?? SHAPE_DEFAULTS.fillColor,
        strokeColor: options?.strokeColor ?? SHAPE_DEFAULTS.strokeColor,
        strokeWidth: options?.strokeWidth ?? SHAPE_DEFAULTS.strokeWidth,
        cornerRadius: options?.cornerRadius ?? SHAPE_DEFAULTS.cornerRadius,
        points: options?.points,
      },
    });
  }

  /**
   * Create a rectangle shape.
   */
  static createRectangle(
    position: Position,
    size: Size,
    createdBy: string,
    options?: Partial<Omit<ShapeData, 'shapeType'>>
  ): Shape {
    return Shape.create('rectangle', position, size, createdBy, {
      ...options,
      shapeType: 'rectangle',
    });
  }

  /**
   * Create an ellipse shape.
   */
  static createEllipse(
    position: Position,
    size: Size,
    createdBy: string,
    options?: Partial<Omit<ShapeData, 'shapeType'>>
  ): Shape {
    return Shape.create('ellipse', position, size, createdBy, {
      ...options,
      shapeType: 'ellipse',
    });
  }

  /**
   * Create a line shape.
   */
  static createLine(
    startPoint: Position,
    endPoint: Position,
    createdBy: string,
    options?: Partial<Omit<ShapeData, 'shapeType' | 'points'>>
  ): Shape {
    const minX = Math.min(startPoint.x, endPoint.x);
    const minY = Math.min(startPoint.y, endPoint.y);
    const maxX = Math.max(startPoint.x, endPoint.x);
    const maxY = Math.max(startPoint.y, endPoint.y);

    return Shape.create(
      'line',
      { x: minX, y: minY },
      { width: maxX - minX || 1, height: maxY - minY || 1 },
      createdBy,
      {
        ...options,
        shapeType: 'line',
        points: [
          startPoint.x - minX,
          startPoint.y - minY,
          endPoint.x - minX,
          endPoint.y - minY,
        ],
      }
    );
  }

  get shapeType(): ShapeType {
    return this._shapeType;
  }

  get strokeWidth(): number {
    return this._strokeWidth;
  }

  set strokeWidth(value: number) {
    this._strokeWidth = Math.max(0, Math.min(20, value));
    this.markModified();
  }

  get cornerRadius(): number {
    return this._cornerRadius;
  }

  set cornerRadius(value: number) {
    this._cornerRadius = Math.max(0, value);
    this.markModified();
  }

  get points(): number[] | undefined {
    return this._points ? [...this._points] : undefined;
  }

  set points(value: number[] | undefined) {
    this._points = value ? [...value] : undefined;
    this.markModified();
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

    if (this._shapeType === 'ellipse') {
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      const rx = bounds.width / 2;
      const ry = bounds.height / 2;
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
    }

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

  clone(): Shape {
    return new Shape({
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
        shapeType: this._shapeType,
        fillColor: this._colors.fill,
        strokeColor: this._colors.stroke,
        strokeWidth: this._strokeWidth,
        cornerRadius: this._cornerRadius,
        points: this._points,
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

  readonly canRotate = true;
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
      {
        handle: 'rotation',
        position: { x: bounds.x + bounds.width / 2, y: bounds.y - 30 },
        cursor: HANDLE_CURSORS.rotation,
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
    this.markModified();
  }

  getAvailableColors(): Color[] {
    return Object.values(BOARD_COLORS);
  }

  readonly hasFill = true;
  readonly hasStroke = true;
  readonly hasTextColor = false;

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
