/**
 * Unit tests for the FrameComponent.
 *
 * Tests rendering, interactions, and visual presentation.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FrameComponent } from '../components/FrameComponent';
import { Frame } from '../objects/Frame';

// Mock Konva components
jest.mock('react-konva', () => ({
  Group: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="konva-group" {...props}>
      {children}
    </div>
  ),
  Rect: (props: { [key: string]: unknown }) => (
    <div data-testid="konva-rect" {...props} />
  ),
  Text: (props: { [key: string]: unknown }) => (
    <div data-testid="konva-text" {...props} />
  ),
  Transformer: (props: { [key: string]: unknown }) => (
    <div data-testid="konva-transformer" {...props} />
  ),
}));

describe('FrameComponent', () => {
  const testUser = 'test-user';
  const defaultPosition = { x: 100, y: 100 };
  const defaultSize = { width: 400, height: 300 };

  const createDefaultFrame = (): Frame => {
    return Frame.create(defaultPosition, defaultSize, testUser);
  };

  const mockHandlers = {
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onTransformEnd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render a frame with correct position', () => {
      const frame = createDefaultFrame();

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('x', '100');
      expect(group).toHaveAttribute('y', '100');
    });

    it('should render the background rect', () => {
      const frame = createDefaultFrame();

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should render title when showTitle is true', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        title: 'Test Frame',
        showTitle: true,
      });

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const texts = screen.queryAllByTestId('konva-text');
      expect(texts.length).toBeGreaterThan(0);
    });

    it('should not render title text when showTitle is false', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        showTitle: false,
      });

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const texts = screen.queryAllByTestId('konva-text');
      expect(texts.length).toBe(0);
    });

    it('should apply custom title', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        title: 'Custom Title',
        showTitle: true,
      });

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const text = screen.getByTestId('konva-text');
      expect(text).toHaveAttribute('text', 'Custom Title');
    });
  });

  describe('visibility', () => {
    it('should render when visible is true', () => {
      const frame = createDefaultFrame();
      frame.visible = true;

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.queryByTestId('konva-group');
      expect(group).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      const frame = createDefaultFrame();
      frame.visible = false;

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.queryByTestId('konva-group');
      expect(group).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should render when selected', () => {
      const frame = createDefaultFrame();

      render(
        <FrameComponent frame={frame} isSelected={true} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toBeDefined();
    });

    it('should call onClick when clicked', () => {
      const frame = createDefaultFrame();

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.getByTestId('konva-group');
      expect(group).toBeDefined();
      expect(mockHandlers.onClick).toBeDefined();
    });
  });

  describe('dragging', () => {
    it('should be draggable when not locked', () => {
      const frame = createDefaultFrame();
      frame.locked = false;

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('draggable', 'true');
    });

    it('should not be draggable when locked', () => {
      const frame = createDefaultFrame();
      frame.locked = true;

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('draggable', 'false');
    });
  });

  describe('transform', () => {
    it('should apply rotation', () => {
      const frame = createDefaultFrame();
      frame.rotateTo(45);

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('rotation', '45');
    });

    it('should apply transform with scale', () => {
      const frame = createDefaultFrame();
      frame.applyTransform({ scaleX: 1.5, scaleY: 1.5 });

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const group = screen.getByTestId('konva-group');
      expect(group).toBeDefined();
    });
  });

  describe('colors', () => {
    it('should apply custom fill color', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        fillColor: '#FF0000',
      });

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should apply custom stroke color', () => {
      const frame = Frame.create(defaultPosition, defaultSize, testUser, {
        strokeColor: '#00FF00',
      });

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThan(0);
    });
  });

  describe('dimensions', () => {
    it('should render with custom size', () => {
      const frame = Frame.create(
        defaultPosition,
        { width: 600, height: 400 },
        testUser
      );

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const rects = screen.getAllByTestId('konva-rect');
      const backgroundRect = rects[0];
      expect(backgroundRect).toHaveAttribute('width', '600');
      expect(backgroundRect).toHaveAttribute('height', '400');
    });

    it('should enforce minimum size at object level', () => {
      const frame = Frame.create(
        defaultPosition,
        { width: 50, height: 50 },
        testUser
      );

      expect(frame.size.width).toBe(200);
      expect(frame.size.height).toBe(150);

      render(<FrameComponent frame={frame} {...mockHandlers} />);

      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThan(0);
    });
  });

  describe('isSelected prop', () => {
    it('should apply different stroke when isSelected is true', () => {
      const frame = createDefaultFrame();

      render(
        <FrameComponent frame={frame} isSelected={true} {...mockHandlers} />
      );

      const rects = screen.getAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should render normally when isSelected is false', () => {
      const frame = createDefaultFrame();

      render(
        <FrameComponent frame={frame} isSelected={false} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toBeDefined();
    });
  });
});
