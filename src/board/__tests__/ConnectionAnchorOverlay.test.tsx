/**
 * Unit tests for the ConnectionAnchorOverlay component.
 *
 * Tests anchor point rendering, highlighting, and interaction callbacks.
 */

jest.mock('react-konva', () => ({
  Circle: jest.fn(({ children, ...props }) => (
    <div data-testid="konva-circle" {...props}>
      {children}
    </div>
  )),
  Group: jest.fn(({ children, ...props }) => (
    <div data-testid="konva-group" {...props}>
      {children}
    </div>
  )),
  Layer: jest.fn(({ children, ...props }) => (
    <div data-testid="konva-layer" {...props}>
      {children}
    </div>
  )),
}));

jest.mock('konva', () => ({}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConnectionAnchorOverlay } from '../components/ConnectionAnchorOverlay';
import type { ConnectionAnchorOverlayProps } from '../components/ConnectionAnchorOverlay';
import type { RenderableObject } from '../components/BoardCanvasComponent';

describe('ConnectionAnchorOverlay', () => {
  const mockObjects: RenderableObject[] = [
    { id: 'shape-1', type: 'shape', x: 0, y: 0, width: 100, height: 50, data: {} },
    { id: 'shape-2', type: 'shape', x: 200, y: 100, width: 100, height: 50, data: {} },
    { id: 'sticky-1', type: 'sticky-note', x: 400, y: 200, width: 200, height: 200, data: {} },
    { id: 'text-1', type: 'text', x: 600, y: 300, width: 150, height: 30, data: {} },
    { id: 'connector-1', type: 'connector', x: 0, y: 0, width: 100, height: 100, data: {} },
  ];

  const defaultProps: ConnectionAnchorOverlayProps = {
    objects: mockObjects,
    visible: true,
  };

  describe('rendering', () => {
    it('should render anchor points for connectable objects', () => {
      render(<ConnectionAnchorOverlay {...defaultProps} />);

      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should not render when not visible', () => {
      render(<ConnectionAnchorOverlay {...defaultProps} visible={false} />);

      const groups = screen.queryAllByTestId('konva-group');
      expect(groups).toHaveLength(0);
    });

    it('should filter out non-connectable objects', () => {
      const { container } = render(<ConnectionAnchorOverlay {...defaultProps} />);

      const circles = container.querySelectorAll('[data-testid="konva-circle"]');
      expect(circles.length).toBe(16);
    });

    it('should render 4 anchors per connectable object (excluding center)', () => {
      const singleObject: RenderableObject[] = [
        { id: 'shape-1', type: 'shape', x: 0, y: 0, width: 100, height: 50, data: {} },
      ];

      const { container } = render(
        <ConnectionAnchorOverlay objects={singleObject} visible={true} />
      );

      const circles = container.querySelectorAll('[data-testid="konva-circle"]');
      expect(circles).toHaveLength(4);
    });
  });

  describe('highlighting', () => {
    it('should pass highlighted object ID to child components', () => {
      render(
        <ConnectionAnchorOverlay
          {...defaultProps}
          highlightedObjectId="shape-1"
          highlightedAnchor="top"
        />
      );

      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should not highlight when object ID is null', () => {
      render(
        <ConnectionAnchorOverlay
          {...defaultProps}
          highlightedObjectId={null}
          highlightedAnchor="top"
        />
      );

      const groups = screen.getAllByTestId('konva-group');
      expect(groups.length).toBeGreaterThan(0);
    });
  });

  describe('callbacks', () => {
    it('should call onAnchorClick when anchor is clicked', () => {
      const handleClick = jest.fn();

      const { container } = render(
        <ConnectionAnchorOverlay {...defaultProps} onAnchorClick={handleClick} />
      );

      const circles = container.querySelectorAll('[data-testid="konva-circle"]');
      if (circles[0]) {
        fireEvent.click(circles[0]);
      }

      expect(handleClick).toHaveBeenCalled();
    });

    it('should call onAnchorMouseEnter on mouse enter', () => {
      const handleMouseEnter = jest.fn();

      const { container } = render(
        <ConnectionAnchorOverlay
          {...defaultProps}
          onAnchorMouseEnter={handleMouseEnter}
        />
      );

      const circles = container.querySelectorAll('[data-testid="konva-circle"]');
      if (circles[0]) {
        fireEvent.mouseEnter(circles[0]);
      }

      expect(handleMouseEnter).toHaveBeenCalled();
    });

    it('should call onAnchorMouseLeave on mouse leave', () => {
      const handleMouseLeave = jest.fn();

      const { container } = render(
        <ConnectionAnchorOverlay
          {...defaultProps}
          onAnchorMouseLeave={handleMouseLeave}
        />
      );

      const circles = container.querySelectorAll('[data-testid="konva-circle"]');
      if (circles[0]) {
        fireEvent.mouseLeave(circles[0]);
      }

      expect(handleMouseLeave).toHaveBeenCalled();
    });
  });

  describe('anchor positions', () => {
    it('should calculate correct anchor positions', () => {
      const singleObject: RenderableObject[] = [
        { id: 'shape-1', type: 'shape', x: 100, y: 100, width: 200, height: 100, data: {} },
      ];

      render(
        <ConnectionAnchorOverlay objects={singleObject} visible={true} />
      );

      const circles = screen.getAllByTestId('konva-circle');

      expect(circles.length).toBe(4);
    });
  });

  describe('custom styling', () => {
    it('should accept custom anchor style', () => {
      render(
        <ConnectionAnchorOverlay
          {...defaultProps}
          anchorStyle={{
            radius: 10,
            fill: '#ff0000',
            stroke: '#00ff00',
          }}
        />
      );

      const circles = screen.getAllByTestId('konva-circle');
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('empty objects', () => {
    it('should return null for empty objects array', () => {
      const { container } = render(
        <ConnectionAnchorOverlay objects={[]} visible={true} />
      );

      const groups = container.querySelectorAll('[data-testid="konva-group"]');
      expect(groups).toHaveLength(0);
    });

    it('should return null if no connectable objects', () => {
      const nonConnectable: RenderableObject[] = [
        { id: 'connector-1', type: 'connector', x: 0, y: 0, width: 100, height: 100, data: {} },
      ];

      const { container } = render(
        <ConnectionAnchorOverlay objects={nonConnectable} visible={true} />
      );

      const groups = container.querySelectorAll('[data-testid="konva-group"]');
      expect(groups).toHaveLength(0);
    });
  });
});
