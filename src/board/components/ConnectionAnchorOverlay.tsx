/**
 * ConnectionAnchorOverlay Component
 *
 * Displays connection anchor points on connectable objects.
 * Shows 8 anchor points around the perimeter (4 edges + 4 corners).
 * Matches the exact transform used by shape rendering (rotation around top-left).
 *
 * @module board/components/ConnectionAnchorOverlay
 */

import { Circle, Rect, Group, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCallback, useMemo } from 'react';
import type { ConnectionAnchor } from '../interfaces/IConnectable';
import type { RenderableObject } from './BoardCanvasComponent';

/**
 * Visual configuration for anchor point display.
 */
interface AnchorStyleConfig {
  /** Radius of anchor points */
  radius: number;
  /** Fill color for normal state */
  fill: string;
  /** Stroke color for normal state */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Fill color when highlighted/hovered */
  highlightFill: string;
  /** Stroke color when highlighted/hovered */
  highlightStroke: string;
  /** Outline stroke color */
  outlineStroke: string;
  /** Outline stroke width */
  outlineStrokeWidth: number;
}

/**
 * Default anchor visual configuration.
 */
const DEFAULT_ANCHOR_STYLE: AnchorStyleConfig = {
  radius: 5,
  fill: '#FFFFFF',
  stroke: '#3b82f6',
  strokeWidth: 1.5,
  highlightFill: '#3b82f6',
  highlightStroke: '#1d4ed8',
  outlineStroke: '#3b82f6',
  outlineStrokeWidth: 1,
};

/**
 * Anchor position definition in local coordinates.
 */
interface AnchorPosition {
  anchor: ConnectionAnchor;
  localX: number;
  localY: number;
}

/**
 * Get anchor positions for a shape in local coordinates.
 * Anchors are positioned slightly outside the shape bounds for easier clicking.
 */
function getAnchorPositions(width: number, height: number): AnchorPosition[] {
  const halfW = width / 2;
  const halfH = height / 2;
  const offset = 0;

  return [
    { anchor: 'top', localX: halfW, localY: -offset },
    { anchor: 'topRight', localX: width + offset, localY: -offset },
    { anchor: 'right', localX: width + offset, localY: halfH },
    { anchor: 'bottomRight', localX: width + offset, localY: height + offset },
    { anchor: 'bottom', localX: halfW, localY: height + offset },
    { anchor: 'bottomLeft', localX: -offset, localY: height + offset },
    { anchor: 'left', localX: -offset, localY: halfH },
    { anchor: 'topLeft', localX: -offset, localY: -offset },
  ];
}

/**
 * Rotate a point around the origin.
 */
function rotatePoint(
  x: number,
  y: number,
  radians: number
): { x: number; y: number } {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

/**
 * Props for the ConnectionAnchorOverlay component.
 */
export interface ConnectionAnchorOverlayProps {
  /** Objects to show anchors for */
  objects: RenderableObject[];
  /** Currently highlighted object ID (e.g., on hover) */
  highlightedObjectId?: string | null;
  /** Currently highlighted anchor */
  highlightedAnchor?: ConnectionAnchor | null;
  /** Whether anchors should be visible */
  visible?: boolean;
  /** Custom anchor style configuration */
  anchorStyle?: Partial<AnchorStyleConfig>;
  /** Callback when an anchor is clicked */
  onAnchorClick?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Callback when mouse enters an anchor */
  onAnchorMouseEnter?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Callback when mouse leaves an anchor */
  onAnchorMouseLeave?: (objectId: string, anchor: ConnectionAnchor) => void;
}

/**
 * Props for a single anchor point.
 */
interface AnchorPointProps {
  objectId: string;
  objectX: number;
  objectY: number;
  anchor: ConnectionAnchor;
  localX: number;
  localY: number;
  rotation: number;
  isHighlighted: boolean;
  style: AnchorStyleConfig;
  onClick?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  onMouseEnter?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  onMouseLeave?: (objectId: string, anchor: ConnectionAnchor) => void;
}

/**
 * Renders a single anchor point.
 */
function AnchorPoint({
  objectId,
  objectX,
  objectY,
  anchor,
  localX,
  localY,
  rotation,
  isHighlighted,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: AnchorPointProps): JSX.Element {
  const worldPosition = useMemo(() => {
    const radians = (rotation * Math.PI) / 180;
    const rotated = rotatePoint(localX, localY, radians);
    return {
      x: objectX + rotated.x,
      y: objectY + rotated.y,
    };
  }, [objectX, objectY, localX, localY, rotation]);

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onClick?.(objectId, anchor, worldPosition);
    },
    [onClick, objectId, anchor, worldPosition]
  );

  const handleTap = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true;
      onClick?.(objectId, anchor, worldPosition);
    },
    [onClick, objectId, anchor, worldPosition]
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(objectId, anchor, worldPosition);
  }, [onMouseEnter, objectId, anchor, worldPosition]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.(objectId, anchor);
  }, [onMouseLeave, objectId, anchor]);

  return (
    <Circle
      x={localX}
      y={localY}
      radius={isHighlighted ? style.radius * 1.4 : style.radius}
      fill={isHighlighted ? style.highlightFill : style.fill}
      stroke={isHighlighted ? style.highlightStroke : style.stroke}
      strokeWidth={style.strokeWidth}
      onClick={handleClick}
      onTap={handleTap}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    />
  );
}

/**
 * Props for object indicator group.
 */
interface ObjectIndicatorProps {
  object: RenderableObject;
  isObjectHighlighted: boolean;
  highlightedAnchor?: ConnectionAnchor | null;
  style: AnchorStyleConfig;
  onClick?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  onMouseEnter?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  onMouseLeave?: (objectId: string, anchor: ConnectionAnchor) => void;
}

/**
 * Renders all anchor points for a single object.
 */
function ObjectIndicator({
  object,
  isObjectHighlighted,
  highlightedAnchor,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ObjectIndicatorProps): JSX.Element {
  const rotation = (object.data?.rotation as number) ?? 0;
  const anchors = useMemo(
    () => getAnchorPositions(object.width, object.height),
    [object.width, object.height]
  );

  return (
    <Group x={object.x} y={object.y} rotation={rotation}>
      {/* Highlight outline when object is hovered */}
      {isObjectHighlighted && (
        <Rect
          x={-2}
          y={-2}
          width={object.width + 4}
          height={object.height + 4}
          stroke={style.outlineStroke}
          strokeWidth={style.outlineStrokeWidth}
          cornerRadius={4}
          dash={[5, 5]}
          listening={false}
        />
      )}
      {/* Anchor points */}
      {anchors.map(({ anchor, localX, localY }) => (
        <AnchorPoint
          key={`${object.id}-${anchor}`}
          objectId={object.id}
          objectX={object.x}
          objectY={object.y}
          anchor={anchor}
          localX={localX}
          localY={localY}
          rotation={rotation}
          isHighlighted={isObjectHighlighted && highlightedAnchor === anchor}
          style={style}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      ))}
    </Group>
  );
}

/**
 * ConnectionAnchorOverlay displays connection anchor points on connectable objects.
 *
 * Shows 8 anchor points around each connectable shape (4 edges + 4 corners).
 * Anchors rotate with the shape and report their world position when clicked.
 *
 * @param props - Component properties
 * @returns Konva Layer containing all anchors, or null if not visible
 */
export function ConnectionAnchorOverlay({
  objects,
  highlightedObjectId,
  highlightedAnchor,
  visible = true,
  anchorStyle,
  onAnchorClick,
  onAnchorMouseEnter,
  onAnchorMouseLeave,
}: ConnectionAnchorOverlayProps): JSX.Element | null {
  const mergedStyle = useMemo<AnchorStyleConfig>(
    () => ({
      ...DEFAULT_ANCHOR_STYLE,
      ...anchorStyle,
    }),
    [anchorStyle]
  );

  const connectableObjects = useMemo(() => {
    return objects.filter(
      (obj) =>
        obj.type === 'shape' ||
        obj.type === 'sticky-note' ||
        obj.type === 'text'
    );
  }, [objects]);

  if (!visible || connectableObjects.length === 0) {
    return null;
  }

  return (
    <Layer listening={true}>
      {connectableObjects.map((obj) => (
        <ObjectIndicator
          key={`indicator-${obj.id}`}
          object={obj}
          isObjectHighlighted={highlightedObjectId === obj.id}
          highlightedAnchor={highlightedAnchor}
          style={mergedStyle}
          onClick={onAnchorClick}
          onMouseEnter={onAnchorMouseEnter}
          onMouseLeave={onAnchorMouseLeave}
        />
      ))}
    </Layer>
  );
}

export default ConnectionAnchorOverlay;
