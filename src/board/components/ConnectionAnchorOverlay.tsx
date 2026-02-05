/**
 * ConnectionAnchorOverlay Component
 *
 * Displays connection indicators on connectable objects.
 * Shows a center point that can be clicked to start a connector.
 * The actual edge connection point is calculated dynamically.
 *
 * @module board/components/ConnectionAnchorOverlay
 */

import { Circle, Rect, Group, Layer } from 'react-konva';
import type Konva from 'konva';
import { useCallback, useMemo } from 'react';
import type { ConnectionAnchor } from '../interfaces/IConnectable';
import type { RenderableObject } from './BoardCanvasComponent';

/**
 * Visual configuration for connection indicator display.
 */
interface IndicatorStyleConfig {
  /** Radius of the center indicator */
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
 * Default indicator visual configuration.
 */
const DEFAULT_INDICATOR_STYLE: IndicatorStyleConfig = {
  radius: 8,
  fill: '#FFFFFF',
  stroke: '#3b82f6',
  strokeWidth: 2,
  highlightFill: '#3b82f6',
  highlightStroke: '#1d4ed8',
  outlineStroke: '#3b82f6',
  outlineStrokeWidth: 2,
};

/**
 * Props for the ConnectionAnchorOverlay component.
 */
export interface ConnectionAnchorOverlayProps {
  /** Objects to show indicators for */
  objects: RenderableObject[];
  /** Currently highlighted object ID (e.g., on hover) */
  highlightedObjectId?: string | null;
  /** Currently highlighted anchor (kept for API compatibility) */
  highlightedAnchor?: ConnectionAnchor | null;
  /** Whether indicators should be visible */
  visible?: boolean;
  /** Custom indicator style configuration */
  anchorStyle?: Partial<IndicatorStyleConfig>;
  /** Callback when an object's indicator is clicked */
  onAnchorClick?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Callback when mouse enters an object's indicator */
  onAnchorMouseEnter?: (
    objectId: string,
    anchor: ConnectionAnchor,
    position: { x: number; y: number }
  ) => void;
  /** Callback when mouse leaves an object's indicator */
  onAnchorMouseLeave?: (objectId: string, anchor: ConnectionAnchor) => void;
}

/**
 * Props for single object connection indicator.
 */
interface ObjectIndicatorProps {
  /** The object to show indicator for */
  object: RenderableObject;
  /** Whether this object is highlighted */
  isHighlighted: boolean;
  /** Style configuration */
  style: IndicatorStyleConfig;
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
 * Renders a connection indicator for a single object.
 * Shows a center point and optional outline when hovered.
 */
function ObjectIndicator({
  object,
  isHighlighted,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ObjectIndicatorProps): JSX.Element {
  const centerX = object.x + object.width / 2;
  const centerY = object.y + object.height / 2;

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      onClick?.(object.id, 'center', { x: centerX, y: centerY });
    },
    [onClick, object.id, centerX, centerY]
  );

  const handleTap = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.cancelBubble = true;
      onClick?.(object.id, 'center', { x: centerX, y: centerY });
    },
    [onClick, object.id, centerX, centerY]
  );

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.(object.id, 'center', { x: centerX, y: centerY });
  }, [onMouseEnter, object.id, centerX, centerY]);

  const handleMouseLeave = useCallback(() => {
    onMouseLeave?.(object.id, 'center');
  }, [onMouseLeave, object.id]);

  return (
    <Group key={`indicator-${object.id}`}>
      {/* Highlight outline when hovered */}
      {isHighlighted && (
        <Rect
          x={object.x - 2}
          y={object.y - 2}
          width={object.width + 4}
          height={object.height + 4}
          stroke={style.outlineStroke}
          strokeWidth={style.outlineStrokeWidth}
          cornerRadius={4}
          dash={[5, 5]}
          listening={false}
        />
      )}
      {/* Center connection indicator */}
      <Circle
        x={centerX}
        y={centerY}
        radius={isHighlighted ? style.radius * 1.2 : style.radius}
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
    </Group>
  );
}

/**
 * ConnectionAnchorOverlay displays connection indicators on connectable objects.
 *
 * This component shows a center indicator on each connectable shape.
 * When clicked, it starts connector creation. The actual edge connection
 * point is calculated dynamically based on the direction to the other object.
 *
 * @param props - Component properties
 * @returns Konva Layer containing all indicators, or null if not visible
 */
export function ConnectionAnchorOverlay({
  objects,
  highlightedObjectId,
  visible = true,
  anchorStyle,
  onAnchorClick,
  onAnchorMouseEnter,
  onAnchorMouseLeave,
}: ConnectionAnchorOverlayProps): JSX.Element | null {
  const mergedStyle = useMemo<IndicatorStyleConfig>(
    () => ({
      ...DEFAULT_INDICATOR_STYLE,
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
          isHighlighted={highlightedObjectId === obj.id}
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
