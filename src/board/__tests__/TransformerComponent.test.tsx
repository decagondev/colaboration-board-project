/**
 * Unit tests for the TransformerComponent.
 *
 * Tests rendering of the Konva Transformer wrapper.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  TransformerComponent,
  TRANSFORMER_DEFAULTS,
  DEFAULT_ANCHORS,
} from '../components/TransformerComponent';

// Mock Konva components - must use function for forwardRef
const mockTransformerInstance = {
  nodes: jest.fn(),
  getLayer: jest.fn(() => ({
    batchDraw: jest.fn(),
  })),
};

jest.mock('react-konva', () => {
  const ReactActual = require('react');
  return {
    Transformer: ReactActual.forwardRef(
      (props: { [key: string]: unknown }, ref: React.Ref<unknown>) => {
        ReactActual.useImperativeHandle(ref, () => mockTransformerInstance);
        return <div data-testid="konva-transformer" />;
      }
    ),
  };
});

describe('TransformerComponent', () => {
  const mockNode = {
    id: () => 'test-node',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should not render when nodes array is empty', () => {
      render(<TransformerComponent nodes={[]} />);

      const transformer = screen.queryByTestId('konva-transformer');
      expect(transformer).not.toBeInTheDocument();
    });

    it('should not render when nodes array has only null values', () => {
      render(<TransformerComponent nodes={[null, null]} />);

      const transformer = screen.queryByTestId('konva-transformer');
      expect(transformer).not.toBeInTheDocument();
    });

    it('should render when nodes array has valid node', () => {
      render(
        <TransformerComponent
          nodes={[mockNode as unknown as import('konva').default.Node]}
        />
      );

      const transformer = screen.getByTestId('konva-transformer');
      expect(transformer).toBeInTheDocument();
    });

    it('should render when nodes array has mixed null and valid nodes', () => {
      render(
        <TransformerComponent
          nodes={[null, mockNode as unknown as import('konva').default.Node]}
        />
      );

      const transformer = screen.getByTestId('konva-transformer');
      expect(transformer).toBeInTheDocument();
    });
  });

  describe('node attachment', () => {
    it('should call nodes() with valid nodes', () => {
      render(
        <TransformerComponent
          nodes={[mockNode as unknown as import('konva').default.Node]}
        />
      );

      expect(mockTransformerInstance.nodes).toHaveBeenCalled();
    });

    it('should filter out null nodes before attaching', () => {
      render(
        <TransformerComponent
          nodes={[null, mockNode as unknown as import('konva').default.Node]}
        />
      );

      expect(mockTransformerInstance.nodes).toHaveBeenCalled();
      const nodesCall = mockTransformerInstance.nodes.mock.calls[0][0];
      expect(nodesCall).toHaveLength(1);
    });
  });

  describe('DEFAULT_ANCHORS', () => {
    it('should export default anchors with all positions', () => {
      expect(DEFAULT_ANCHORS).toEqual([
        'top-left',
        'top-center',
        'top-right',
        'middle-left',
        'middle-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ]);
    });

    it('should have 8 anchor positions', () => {
      expect(DEFAULT_ANCHORS).toHaveLength(8);
    });
  });

  describe('TRANSFORMER_DEFAULTS', () => {
    it('should export default border stroke color', () => {
      expect(TRANSFORMER_DEFAULTS.borderStroke).toBe('#4A90D9');
    });

    it('should export default anchor fill color', () => {
      expect(TRANSFORMER_DEFAULTS.anchorFill).toBe('#FFFFFF');
    });

    it('should export default anchor stroke color', () => {
      expect(TRANSFORMER_DEFAULTS.anchorStroke).toBe('#4A90D9');
    });

    it('should export default anchor size', () => {
      expect(TRANSFORMER_DEFAULTS.anchorSize).toBe(8);
    });

    it('should export default anchor corner radius', () => {
      expect(TRANSFORMER_DEFAULTS.anchorCornerRadius).toBe(2);
    });

    it('should export default rotation enabled', () => {
      expect(TRANSFORMER_DEFAULTS.rotateEnabled).toBe(true);
    });

    it('should export default keep ratio', () => {
      expect(TRANSFORMER_DEFAULTS.keepRatio).toBe(false);
    });

    it('should export default flip enabled', () => {
      expect(TRANSFORMER_DEFAULTS.flipEnabled).toBe(false);
    });

    it('should export default minimum width', () => {
      expect(TRANSFORMER_DEFAULTS.minWidth).toBe(20);
    });

    it('should export default minimum height', () => {
      expect(TRANSFORMER_DEFAULTS.minHeight).toBe(20);
    });
  });

  describe('props acceptance', () => {
    it('should accept rotateEnabled prop', () => {
      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            rotateEnabled={false}
          />
        );
      }).not.toThrow();
    });

    it('should accept keepRatio prop', () => {
      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            keepRatio={true}
          />
        );
      }).not.toThrow();
    });

    it('should accept custom border stroke color', () => {
      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            borderStroke="#FF0000"
          />
        );
      }).not.toThrow();
    });

    it('should accept custom anchor colors', () => {
      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            anchorFill="#00FF00"
            anchorStroke="#0000FF"
          />
        );
      }).not.toThrow();
    });

    it('should accept onTransformStart callback', () => {
      const onTransformStart = jest.fn();

      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            onTransformStart={onTransformStart}
          />
        );
      }).not.toThrow();
    });

    it('should accept onTransform callback', () => {
      const onTransform = jest.fn();

      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            onTransform={onTransform}
          />
        );
      }).not.toThrow();
    });

    it('should accept onTransformEnd callback', () => {
      const onTransformEnd = jest.fn();

      expect(() => {
        render(
          <TransformerComponent
            nodes={[mockNode as unknown as import('konva').default.Node]}
            onTransformEnd={onTransformEnd}
          />
        );
      }).not.toThrow();
    });
  });
});
