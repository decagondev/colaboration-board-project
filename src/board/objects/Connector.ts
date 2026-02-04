/**
 * Connector Object
 *
 * A connector is a line that connects two board objects, automatically
 * repositioning when those objects move.
 */

import type {
  IBoardObject,
  Position,
  Size,
  BoundingBox,
  BoardObjectData,
} from '../interfaces/IBoardObject';
import type { IColorable, Color, ColorScheme } from '../interfaces/IColorable';
import type {
  ConnectionAnchor,
  ConnectionRef,
} from '../interfaces/IConnectable';
import { BOARD_COLORS, DEFAULT_COLOR_SCHEME } from '../interfaces/IColorable';
import { generateUUID } from '@shared/utils/uuid';

/**
 * Connector routing style.
 */
export type ConnectorRouteStyle = 'straight' | 'elbow' | 'curved';

/**
 * Connector arrow style.
 */
export type ConnectorArrowStyle = 'none' | 'arrow' | 'filled-arrow' | 'circle';

/**
 * Connector endpoint data.
 */
export interface ConnectorEndpoint {
  /** Connected object ID (null if free endpoint) */
  objectId: string | null;
  /** Connection anchor on the object */
  anchor: ConnectionAnchor;
  /** Absolute position (used when not connected) */
  position: Position;
}

/**
 * Connector-specific data.
 */
export interface ConnectorData {
  /** Routing style */
  routeStyle: ConnectorRouteStyle;
  /** Arrow style at start */
  startArrow: ConnectorArrowStyle;
  /** Arrow style at end */
  endArrow: ConnectorArrowStyle;
  /** Start endpoint */
  startPoint: ConnectorEndpoint;
  /** End endpoint */
  endPoint: ConnectorEndpoint;
}

/**
 * Default connector data.
 */
export const CONNECTOR_DEFAULTS: ConnectorData = {
  routeStyle: 'straight',
  startArrow: 'none',
  endArrow: 'arrow',
  startPoint: {
    objectId: null,
    anchor: 'auto',
    position: { x: 0, y: 0 },
  },
  endPoint: {
    objectId: null,
    anchor: 'auto',
    position: { x: 100, y: 100 },
  },
};

/**
 * Connector class implementing board object and colorable interfaces.
 *
 * Connectors link board objects together and automatically update their
 * path when connected objects move.
 */
export class Connector implements IBoardObject, IColorable {
  readonly id: string;
  readonly type = 'connector';
  readonly createdBy: string;
  readonly createdAt: number;
  modifiedBy: string;
  modifiedAt: number;

  private _position: Position;
  private _size: Size;
  private _zIndex: number;
  private _locked: boolean;
  private _visible: boolean;
  private _colors: ColorScheme;

  private _routeStyle: ConnectorRouteStyle;
  private _startArrow: ConnectorArrowStyle;
  private _endArrow: ConnectorArrowStyle;
  private _startPoint: ConnectorEndpoint;
  private _endPoint: ConnectorEndpoint;
  private _strokeWidth: number;

  /**
   * Create a new Connector instance.
   *
   * @param data - Connector initialization data
   */
  private constructor(data: BoardObjectData & { data: ConnectorData }) {
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

    const connectorData = data.data;
    this._routeStyle = connectorData.routeStyle;
    this._startArrow = connectorData.startArrow;
    this._endArrow = connectorData.endArrow;
    this._startPoint = { ...connectorData.startPoint };
    this._endPoint = { ...connectorData.endPoint };
    this._strokeWidth = 2;

    this._colors = {
      fill: 'transparent',
      stroke: BOARD_COLORS.black,
      text: DEFAULT_COLOR_SCHEME.text,
    };
  }

  /**
   * Create a new Connector.
   *
   * @param startPosition - Start point position
   * @param endPosition - End point position
   * @param createdBy - User ID creating the connector
   * @param options - Optional configuration
   * @returns New Connector instance
   */
  static create(
    startPosition: Position,
    endPosition: Position,
    createdBy: string,
    options?: Partial<ConnectorData> & {
      strokeColor?: Color;
      strokeWidth?: number;
    }
  ): Connector {
    const now = Date.now();

    const minX = Math.min(startPosition.x, endPosition.x);
    const minY = Math.min(startPosition.y, endPosition.y);
    const maxX = Math.max(startPosition.x, endPosition.x);
    const maxY = Math.max(startPosition.y, endPosition.y);

    const connector = new Connector({
      id: generateUUID(),
      type: 'connector',
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      zIndex: now,
      locked: false,
      visible: true,
      createdBy,
      createdAt: now,
      modifiedBy: createdBy,
      modifiedAt: now,
      data: {
        routeStyle: options?.routeStyle ?? CONNECTOR_DEFAULTS.routeStyle,
        startArrow: options?.startArrow ?? CONNECTOR_DEFAULTS.startArrow,
        endArrow: options?.endArrow ?? CONNECTOR_DEFAULTS.endArrow,
        startPoint: {
          objectId: options?.startPoint?.objectId ?? null,
          anchor: options?.startPoint?.anchor ?? 'auto',
          position: startPosition,
        },
        endPoint: {
          objectId: options?.endPoint?.objectId ?? null,
          anchor: options?.endPoint?.anchor ?? 'auto',
          position: endPosition,
        },
      },
    });

    if (options?.strokeColor) {
      connector._colors.stroke = options.strokeColor;
    }
    if (options?.strokeWidth !== undefined) {
      connector._strokeWidth = options.strokeWidth;
    }

    return connector;
  }

  /**
   * Create a connector between two objects.
   *
   * @param startRef - Start object reference
   * @param endRef - End object reference
   * @param startPos - Start position (from connection point)
   * @param endPos - End position (from connection point)
   * @param createdBy - User ID
   * @param options - Optional configuration
   * @returns New Connector instance
   */
  static createBetweenObjects(
    startRef: ConnectionRef,
    endRef: ConnectionRef,
    startPos: Position,
    endPos: Position,
    createdBy: string,
    options?: Partial<Omit<ConnectorData, 'startPoint' | 'endPoint'>>
  ): Connector {
    return Connector.create(startPos, endPos, createdBy, {
      ...options,
      startPoint: {
        objectId: startRef.objectId,
        anchor: startRef.anchor,
        position: startPos,
      },
      endPoint: {
        objectId: endRef.objectId,
        anchor: endRef.anchor,
        position: endPos,
      },
    });
  }

  get routeStyle(): ConnectorRouteStyle {
    return this._routeStyle;
  }

  set routeStyle(value: ConnectorRouteStyle) {
    this._routeStyle = value;
    this.markModified();
  }

  get startArrow(): ConnectorArrowStyle {
    return this._startArrow;
  }

  set startArrow(value: ConnectorArrowStyle) {
    this._startArrow = value;
    this.markModified();
  }

  get endArrow(): ConnectorArrowStyle {
    return this._endArrow;
  }

  set endArrow(value: ConnectorArrowStyle) {
    this._endArrow = value;
    this.markModified();
  }

  get startPoint(): ConnectorEndpoint {
    return { ...this._startPoint };
  }

  get endPoint(): ConnectorEndpoint {
    return { ...this._endPoint };
  }

  get strokeWidth(): number {
    return this._strokeWidth;
  }

  set strokeWidth(value: number) {
    this._strokeWidth = Math.max(1, Math.min(20, value));
    this.markModified();
  }

  /**
   * Get the points array for rendering.
   *
   * @returns Points array [x1, y1, x2, y2, ...]
   */
  getPoints(): number[] {
    const start = this._startPoint.position;
    const end = this._endPoint.position;

    if (this._routeStyle === 'straight') {
      return [start.x, start.y, end.x, end.y];
    }

    if (this._routeStyle === 'elbow') {
      const midX = (start.x + end.x) / 2;
      return [start.x, start.y, midX, start.y, midX, end.y, end.x, end.y];
    }

    return [start.x, start.y, end.x, end.y];
  }

  /**
   * Update the start endpoint position.
   *
   * @param position - New position
   */
  setStartPosition(position: Position): void {
    this._startPoint.position = { ...position };
    this.updateBounds();
    this.markModified();
  }

  /**
   * Update the end endpoint position.
   *
   * @param position - New position
   */
  setEndPosition(position: Position): void {
    this._endPoint.position = { ...position };
    this.updateBounds();
    this.markModified();
  }

  /**
   * Connect the start to an object.
   *
   * @param objectId - Object ID
   * @param anchor - Connection anchor
   * @param position - Connection position
   */
  connectStart(
    objectId: string,
    anchor: ConnectionAnchor,
    position: Position
  ): void {
    this._startPoint = {
      objectId,
      anchor,
      position: { ...position },
    };
    this.updateBounds();
    this.markModified();
  }

  /**
   * Connect the end to an object.
   *
   * @param objectId - Object ID
   * @param anchor - Connection anchor
   * @param position - Connection position
   */
  connectEnd(
    objectId: string,
    anchor: ConnectionAnchor,
    position: Position
  ): void {
    this._endPoint = {
      objectId,
      anchor,
      position: { ...position },
    };
    this.updateBounds();
    this.markModified();
  }

  /**
   * Disconnect the start from its object.
   */
  disconnectStart(): void {
    this._startPoint.objectId = null;
    this._startPoint.anchor = 'auto';
    this.markModified();
  }

  /**
   * Disconnect the end from its object.
   */
  disconnectEnd(): void {
    this._endPoint.objectId = null;
    this._endPoint.anchor = 'auto';
    this.markModified();
  }

  /**
   * Check if the connector is connected to an object.
   *
   * @param objectId - Object ID to check
   * @returns True if connected to the object
   */
  isConnectedTo(objectId: string): boolean {
    return (
      this._startPoint.objectId === objectId ||
      this._endPoint.objectId === objectId
    );
  }

  /**
   * Update bounds based on endpoint positions.
   */
  private updateBounds(): void {
    const start = this._startPoint.position;
    const end = this._endPoint.position;

    const minX = Math.min(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxX = Math.max(start.x, end.x);
    const maxY = Math.max(start.y, end.y);

    this._position = { x: minX, y: minY };
    this._size = {
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }

  private markModified(): void {
    this.modifiedAt = Date.now();
  }

  get position(): Position {
    return { ...this._position };
  }

  set position(value: Position) {
    const dx = value.x - this._position.x;
    const dy = value.y - this._position.y;

    this._startPoint.position.x += dx;
    this._startPoint.position.y += dy;
    this._endPoint.position.x += dx;
    this._endPoint.position.y += dy;

    this._position = { ...value };
    this.markModified();
  }

  get size(): Size {
    return { ...this._size };
  }

  set size(_value: Size) {
    /** Connectors don't support direct size setting */
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
    const lineWidth = this._strokeWidth + 10;
    const start = this._startPoint.position;
    const end = this._endPoint.position;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      const distSq = (point.x - start.x) ** 2 + (point.y - start.y) ** 2;
      return distSq <= lineWidth ** 2;
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - start.x) * dx + (point.y - start.y) * dy) /
          (length * length)
      )
    );

    const nearestX = start.x + t * dx;
    const nearestY = start.y + t * dy;
    const distSq = (point.x - nearestX) ** 2 + (point.y - nearestY) ** 2;

    return distSq <= (lineWidth / 2) ** 2;
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

  clone(): Connector {
    return new Connector({
      ...this.toJSON(),
      id: generateUUID(),
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    });
  }

  toJSON(): BoardObjectData & { data: ConnectorData } {
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
        routeStyle: this._routeStyle,
        startArrow: this._startArrow,
        endArrow: this._endArrow,
        startPoint: { ...this._startPoint },
        endPoint: { ...this._endPoint },
      },
    };
  }

  get colors(): ColorScheme {
    return { ...this._colors };
  }

  setFillColor(_color: Color): void {
    /** Connectors don't have fill */
  }

  setStrokeColor(color: Color): void {
    this._colors.stroke = color;
    this.markModified();
  }

  setTextColor(_color: Color): void {
    /** Connectors don't have text */
  }

  applyColorScheme(scheme: Partial<ColorScheme>): void {
    if (scheme.stroke !== undefined) {
      this._colors.stroke = scheme.stroke;
    }
    this.markModified();
  }

  getAvailableColors(): Color[] {
    return Object.values(BOARD_COLORS);
  }

  readonly hasFill = false;
  readonly hasStroke = true;
  readonly hasTextColor = false;
}
