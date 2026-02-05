/**
 * Transformer Component
 *
 * Wrapper around Konva's Transformer for handling resize/rotate operations.
 */

import React, { useRef, useEffect } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

/**
 * Bounding box type for transformer operations.
 * Represents the transformed box dimensions and position.
 */
interface TransformerBox {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Props for the TransformerComponent.
 */
export interface TransformerComponentProps {
  /** Array of Konva node references to attach transformer to */
  nodes: (Konva.Node | null)[];
  /** Whether rotation is enabled */
  rotateEnabled?: boolean;
  /** Whether to keep aspect ratio during resize */
  keepRatio?: boolean;
  /** Whether to enable all anchors */
  enabledAnchors?: string[];
  /** Border stroke color */
  borderStroke?: string;
  /** Border stroke width */
  borderStrokeWidth?: number;
  /** Anchor fill color */
  anchorFill?: string;
  /** Anchor stroke color */
  anchorStroke?: string;
  /** Anchor size */
  anchorSize?: number;
  /** Corner radius for anchors */
  anchorCornerRadius?: number;
  /** Callback when transform starts */
  onTransformStart?: () => void;
  /** Callback during transform */
  onTransform?: () => void;
  /** Callback when transform ends */
  onTransformEnd?: () => void;
  /** Whether to flip on resize past zero */
  flipEnabled?: boolean;
  /** Bounding box function to limit transformer */
  boundBoxFunc?: (oldBox: TransformerBox, newBox: TransformerBox) => TransformerBox;
  /** Minimum width for resize */
  minWidth?: number;
  /** Minimum height for resize */
  minHeight?: number;
}

/**
 * Default transformer configuration.
 */
export const TRANSFORMER_DEFAULTS = {
  borderStroke: '#4A90D9',
  borderStrokeWidth: 1,
  anchorFill: '#FFFFFF',
  anchorStroke: '#4A90D9',
  anchorSize: 8,
  anchorCornerRadius: 2,
  rotateEnabled: true,
  keepRatio: false,
  flipEnabled: false,
  minWidth: 20,
  minHeight: 20,
};

/**
 * Default enabled anchors for resize.
 */
export const DEFAULT_ANCHORS = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/**
 * Transformer Component
 *
 * Provides resize and rotation handles for selected board objects.
 * Wraps Konva's Transformer component with sensible defaults.
 *
 * @param props - Component props
 * @returns Konva Transformer element
 *
 * @example
 * ```typescript
 * const [selectedNode, setSelectedNode] = useState<Konva.Node | null>(null);
 *
 * return (
 *   <Stage>
 *     <Layer>
 *       <Rect ref={(ref) => setSelectedNode(ref)} />
 *       {selectedNode && (
 *         <TransformerComponent
 *           nodes={[selectedNode]}
 *           onTransformEnd={() => {
 *             // Handle transform completion
 *           }}
 *         />
 *       )}
 *     </Layer>
 *   </Stage>
 * );
 * ```
 */
export function TransformerComponent({
  nodes,
  rotateEnabled = TRANSFORMER_DEFAULTS.rotateEnabled,
  keepRatio = TRANSFORMER_DEFAULTS.keepRatio,
  enabledAnchors = DEFAULT_ANCHORS,
  borderStroke = TRANSFORMER_DEFAULTS.borderStroke,
  borderStrokeWidth = TRANSFORMER_DEFAULTS.borderStrokeWidth,
  anchorFill = TRANSFORMER_DEFAULTS.anchorFill,
  anchorStroke = TRANSFORMER_DEFAULTS.anchorStroke,
  anchorSize = TRANSFORMER_DEFAULTS.anchorSize,
  anchorCornerRadius = TRANSFORMER_DEFAULTS.anchorCornerRadius,
  onTransformStart,
  onTransform,
  onTransformEnd,
  flipEnabled = TRANSFORMER_DEFAULTS.flipEnabled,
  boundBoxFunc,
  minWidth = TRANSFORMER_DEFAULTS.minWidth,
  minHeight = TRANSFORMER_DEFAULTS.minHeight,
}: TransformerComponentProps): React.ReactElement | null {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const validNodes = nodes.filter(
      (node): node is Konva.Node => node !== null
    );

    if (validNodes.length > 0) {
      transformer.nodes(validNodes);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
    }
  }, [nodes]);

  const defaultBoundBoxFunc = (
    oldBox: TransformerBox,
    newBox: TransformerBox
  ): TransformerBox => {
    if (Math.abs(newBox.width) < minWidth) {
      return oldBox;
    }
    if (Math.abs(newBox.height) < minHeight) {
      return oldBox;
    }
    return newBox;
  };

  const validNodes = nodes.filter((node): node is Konva.Node => node !== null);
  if (validNodes.length === 0) {
    return null;
  }

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled={rotateEnabled}
      keepRatio={keepRatio}
      enabledAnchors={enabledAnchors}
      borderStroke={borderStroke}
      borderStrokeWidth={borderStrokeWidth}
      anchorFill={anchorFill}
      anchorStroke={anchorStroke}
      anchorSize={anchorSize}
      anchorCornerRadius={anchorCornerRadius}
      flipEnabled={flipEnabled}
      boundBoxFunc={boundBoxFunc ?? defaultBoundBoxFunc}
      onTransformStart={onTransformStart}
      onTransform={onTransform}
      onTransformEnd={onTransformEnd}
    />
  );
}
