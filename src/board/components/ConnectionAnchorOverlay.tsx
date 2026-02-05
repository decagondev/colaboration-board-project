/**
 * ConnectionAnchorOverlay Component
 *
 * Displays connection anchor points on connectable objects.
 * Shows visual indicators for where connectors can attach.
 *
 * @module board/components/ConnectionAnchorOverlay
 */

import { Circle, Group, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCallback, useMemo } from 'react';
import type {
  ConnectionAnchor,
  ConnectionPoint,
} from '../interfaces/IConnectable';
import { calculateConnectionPoints } from '../interfaces/IConnectable';
import type { RenderableObject } from './BoardCanvasComponent';

/**
 * Visual configuration for anchor point display.
 */
interface AnchorStyleConfig {
  /** Radius of the anchor circle */
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
}

/**
 * Default anchor visual configuration.
 */
const DEFAULT_ANCHOR_STYLE: AnchorStyleConfig = {
  radius: 6,
  fill: '#FFFFFF',
  stroke: '#3b82f6',
  strokeWidth: 2,
  highlightFill: '#3b82f6',
  highlightStroke: '#1d4ed8',
};

/**
 * Props for the ConnectionAnchorOverlay component.
 */
export interface ConnectionAnchorOverlayProps {
  /** Objects to show anchors for */
  objects: RenderableObject[];
  /** Currently highlighted object ID (e.g., on hover) */
  highlightedObjectId?: string | null;
  /** Currently highlighted anchor on the highlighted object */
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
 * Single anchor point visual representation.
 */
interface AnchorPointProps {
  /** Object ID this anchor belongs to */
  objectId: string;
  /** Connection point data */
  connectionPoint: ConnectionPoint;
  /** Whether this anchor is highlighted */
  isHighlighted: boolean;
  /** Style configuration */
  style: AnchorStyleConfig;
  /** Click handler */
  onClick?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Mouse enter handler */
  onMouseEnter?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Mouse leave handler */
  onMouseLeave?: (objectId: string, anchor: ConnectionAnchor) => void;
}

/**
 * Renders a single anchor point circle.
 *
 * @param props - Anchor point properties
 * @returns Konva Circle element for the anchor
 */
function AnchorPoint({
  objectId,
  connectionPoint,
  isHighlighted,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: AnchorPointProps): JSX.Element {
  const { anchor, position } = connectionPoint;

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onClick?.(objectId, anchor, position);
    },
    [onClick, objectId, anchor, position]
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(objectId, anchor, position);
  }, [onMouseEnter, objectId, anchor, position]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.(objectId, anchor);
  }, [onMouseLeave, objectId, anchor]);

  const handleTap = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true;
      onClick?.(objectId, anchor, position);
    },
    [onClick, objectId, anchor, position]
  );

  return (
    <Circle
      x={position.x}
      y={position.y}
      radius={isHighlighted ? style.radius * 1.3 : style.radius}
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
 * Renders anchor points for a single object.
 */
interface ObjectAnchorsProps {
  /** The object to show anchors for */
  object: RenderableObject;
  /** Whether this object is highlighted */
  isHighlighted: boolean;
  /** Specific anchor to highlight on this object */
  highlightedAnchor?: ConnectionAnchor | null;
  /** Style configuration */
  style: AnchorStyleConfig;
  /** Anchor click handler */
  onAnchorClick?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Anchor mouse enter handler */
  onAnchorMouseEnter?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Anchor mouse leave handler */
  onAnchorMouseLeave?: (objectId: string, anchor: ConnectionAnchor) => void;
}

/**
 * Renders all anchor points for a single connectable object.
 *
 * @param props - Object anchors properties
 * @returns Group containing all anchor points
 */
function ObjectAnchors({
  object,
  isHighlighted,
  highlightedAnchor,
  style,
  onAnchorClick,
  onAnchorMouseEnter,
  onAnchorMouseLeave,
}: ObjectAnchorsProps): JSX.Element {
  const connectionPoints = useMemo(() => {
    return calculateConnectionPoints(
      object.x,
      object.y,
      object.width,
      object.height
    ).filter((cp) => cp.anchor !== 'center');
  }, [object.x, object.y, object.width, object.height]);

  return (
    <Group key={`anchors-${object.id}`}>
      {connectionPoints.map((cp) => (
        <AnchorPoint
          key={`${object.id}-${cp.anchor}`}
          objectId={object.id}
          connectionPoint={cp}
          isHighlighted={isHighlighted && highlightedAnchor === cp.anchor}
          style={style}
          onClick={onAnchorClick}
          onMouseEnter={onAnchorMouseEnter}
          onMouseLeave={onAnchorMouseLeave}
        />
      ))}
    </Group>
  );
}

/**
 * ConnectionAnchorOverlay displays visual connection anchor points on objects.
 *
 * This component is responsible for:
 * - Showing anchor points (top, right, bottom, left) on connectable objects
 * - Highlighting anchors on hover or during connector creation
 * - Providing click/hover callbacks for connector attachment logic
 *
 * @param props - Component properties
 * @returns Konva Layer containing all anchor overlays, or null if not visible
 *
 * @example
 * ```tsx
 * <ConnectionAnchorOverlay
 *   objects={boardObjects}
 *   visible={isConnectorToolActive}
 *   highlightedObjectId={hoveredObjectId}
 *   highlightedAnchor={nearestAnchor}
 *   onAnchorClick={handleAnchorClick}
 * />
 * ```
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
        <ObjectAnchors
          key={`obj-anchors-${obj.id}`}
          object={obj}
          isHighlighted={highlightedObjectId === obj.id}
          highlightedAnchor={
            highlightedObjectId === obj.id ? highlightedAnchor : null
          }
          style={mergedStyle}
          onAnchorClick={onAnchorClick}
          onAnchorMouseEnter={onAnchorMouseEnter}
          onAnchorMouseLeave={onAnchorMouseLeave}
        />
      ))}
    </Layer>
  );
}

export default ConnectionAnchorOverlay;
