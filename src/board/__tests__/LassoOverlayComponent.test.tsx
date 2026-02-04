/**
 * Unit tests for the LassoOverlayComponent.
 *
 * Tests rendering of the lasso selection rectangle.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  LassoOverlayComponent,
  LASSO_DEFAULTS,
} from '../components/LassoOverlayComponent';
import type { LassoState } from '../interfaces/ISelectionService';
import { DEFAULT_LASSO_STATE } from '../interfaces/ISelectionService';

// Mock Konva components
jest.mock('react-konva', () => ({
  Rect: (props: { [key: string]: unknown }) => (
    <div data-testid="konva-rect" {...props} />
  ),
}));

describe('LassoOverlayComponent', () => {
  const activeLassoState: LassoState = {
    isActive: true,
    startPoint: { x: 100, y: 100 },
    endPoint: { x: 200, y: 200 },
    bounds: {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
    },
  };

  describe('rendering', () => {
    it('should not render when lasso is not active', () => {
      render(<LassoOverlayComponent lassoState={DEFAULT_LASSO_STATE} />);

      const rect = screen.queryByTestId('konva-rect');
      expect(rect).not.toBeInTheDocument();
    });

    it('should not render when bounds are null', () => {
      const lassoState: LassoState = {
        isActive: true,
        startPoint: { x: 100, y: 100 },
        endPoint: null,
        bounds: null,
      };

      render(<LassoOverlayComponent lassoState={lassoState} />);

      const rect = screen.queryByTestId('konva-rect');
      expect(rect).not.toBeInTheDocument();
    });

    it('should render when lasso is active with bounds', () => {
      render(<LassoOverlayComponent lassoState={activeLassoState} />);

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toBeInTheDocument();
    });

    it('should render at correct position and size', () => {
      render(<LassoOverlayComponent lassoState={activeLassoState} />);

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('x', '100');
      expect(rect).toHaveAttribute('y', '100');
      expect(rect).toHaveAttribute('width', '100');
      expect(rect).toHaveAttribute('height', '100');
    });
  });

  describe('styling', () => {
    it('should use default colors', () => {
      render(<LassoOverlayComponent lassoState={activeLassoState} />);

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', LASSO_DEFAULTS.fillColor);
      expect(rect).toHaveAttribute('stroke', LASSO_DEFAULTS.strokeColor);
      expect(rect).toHaveAttribute(
        'stroke-width',
        String(LASSO_DEFAULTS.strokeWidth)
      );
    });

    it('should accept custom fill color', () => {
      render(
        <LassoOverlayComponent
          lassoState={activeLassoState}
          fillColor="#FF0000"
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', '#FF0000');
    });

    it('should accept custom stroke color', () => {
      render(
        <LassoOverlayComponent
          lassoState={activeLassoState}
          strokeColor="#00FF00"
        />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('stroke', '#00FF00');
    });

    it('should accept custom stroke width', () => {
      render(
        <LassoOverlayComponent lassoState={activeLassoState} strokeWidth={3} />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('stroke-width', '3');
    });

    it('should accept custom fill opacity', () => {
      render(
        <LassoOverlayComponent lassoState={activeLassoState} fillOpacity={0.5} />
      );

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toHaveAttribute('opacity', '0.5');
    });
  });

  describe('interaction', () => {
    it('should render the lasso rect element', () => {
      render(<LassoOverlayComponent lassoState={activeLassoState} />);

      const rect = screen.getByTestId('konva-rect');
      expect(rect).toBeInTheDocument();
    });
  });
});
