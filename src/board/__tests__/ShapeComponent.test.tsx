/**
 * Unit tests for the ShapeComponent.
 *
 * Tests rendering and interaction behavior for different shape types.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Shape } from '../objects/Shape';
import { ShapeComponent } from '../components/ShapeComponent';

/** Mock react-konva components */
jest.mock('react-konva', () => ({
  Group: ({ children, ...props }: React.PropsWithChildren<object>) => (
    <div data-testid="konva-group" {...props}>
      {children}
    </div>
  ),
  Rect: (props: object) => <div data-testid="konva-rect" {...props} />,
  Ellipse: (props: object) => <div data-testid="konva-ellipse" {...props} />,
  Line: (props: object) => <div data-testid="konva-line" {...props} />,
  RegularPolygon: (props: object) => (
    <div data-testid="konva-polygon" {...props} />
  ),
}));

const testUser = 'test-user';

describe('ShapeComponent', () => {
  const createRectangle = (): Shape =>
    Shape.createRectangle(
      { x: 100, y: 100 },
      { width: 200, height: 150 },
      testUser
    );

  const createEllipse = (): Shape =>
    Shape.createEllipse(
      { x: 100, y: 100 },
      { width: 200, height: 150 },
      testUser
    );

  const createLine = (): Shape =>
    Shape.createLine({ x: 0, y: 0 }, { x: 200, y: 150 }, testUser);

  const createTriangle = (): Shape =>
    Shape.create(
      'triangle',
      { x: 100, y: 100 },
      { width: 100, height: 100 },
      testUser
    );

  describe('rendering', () => {
    it('should render a rectangle shape', () => {
      const shape = createRectangle();

      const { getByTestId, queryByTestId } = render(
        <ShapeComponent shape={shape} />
      );

      expect(getByTestId('konva-group')).toBeInTheDocument();
      expect(getByTestId('konva-rect')).toBeInTheDocument();
      expect(queryByTestId('konva-ellipse')).not.toBeInTheDocument();
    });

    it('should render an ellipse shape', () => {
      const shape = createEllipse();

      const { getByTestId, queryByTestId } = render(
        <ShapeComponent shape={shape} />
      );

      expect(getByTestId('konva-group')).toBeInTheDocument();
      expect(getByTestId('konva-ellipse')).toBeInTheDocument();
      expect(queryByTestId('konva-rect')).not.toBeInTheDocument();
    });

    it('should render a line shape', () => {
      const shape = createLine();

      const { getByTestId, queryByTestId } = render(
        <ShapeComponent shape={shape} />
      );

      expect(getByTestId('konva-group')).toBeInTheDocument();
      expect(getByTestId('konva-line')).toBeInTheDocument();
      expect(queryByTestId('konva-rect')).not.toBeInTheDocument();
    });

    it('should render a triangle shape', () => {
      const shape = createTriangle();

      const { getByTestId } = render(<ShapeComponent shape={shape} />);

      expect(getByTestId('konva-group')).toBeInTheDocument();
      expect(getByTestId('konva-polygon')).toBeInTheDocument();
    });

    it('should apply position and size from shape', () => {
      const shape = createRectangle();

      const { getByTestId } = render(<ShapeComponent shape={shape} />);

      const group = getByTestId('konva-group');
      expect(group).toHaveAttribute('x', '100');
      expect(group).toHaveAttribute('y', '100');
    });

    it('should render rectangle with corner radius', () => {
      const shape = Shape.create(
        'rectangle',
        { x: 0, y: 0 },
        { width: 100, height: 100 },
        testUser,
        { cornerRadius: 15 }
      );

      const { getByTestId } = render(<ShapeComponent shape={shape} />);

      const rect = getByTestId('konva-rect');
      expect(rect).toHaveAttribute('cornerRadius', '15');
    });
  });

  describe('interactions', () => {
    it('should register click handler', () => {
      const shape = createRectangle();
      const handleClick = jest.fn();

      const { getByTestId } = render(
        <ShapeComponent shape={shape} onClick={handleClick} />
      );

      const group = getByTestId('konva-group');
      const clickProp = group.getAttribute('onClick');
      expect(clickProp).toBeDefined();
    });

    it('should be draggable when not locked', () => {
      const shape = createRectangle();
      const handleDragStart = jest.fn();

      const { getByTestId } = render(
        <ShapeComponent shape={shape} onDragStart={handleDragStart} />
      );

      const group = getByTestId('konva-group');
      expect(group).toHaveAttribute('draggable', 'true');
    });

    it('should not be draggable when locked', () => {
      const shape = createRectangle();
      shape.locked = true;

      const { getByTestId } = render(<ShapeComponent shape={shape} />);

      const group = getByTestId('konva-group');
      expect(group).toHaveAttribute('draggable', 'false');
    });

    it('should register drag end handler', () => {
      const shape = createRectangle();
      const handleDragEnd = jest.fn();

      const { getByTestId } = render(
        <ShapeComponent shape={shape} onDragEnd={handleDragEnd} />
      );

      const group = getByTestId('konva-group');
      const onDragEndProp = group.getAttribute('onDragEnd');
      expect(onDragEndProp).toBeDefined();
    });

    it('should register transform end handler', () => {
      const shape = createRectangle();
      const handleTransformEnd = jest.fn();

      const { getByTestId } = render(
        <ShapeComponent shape={shape} onTransformEnd={handleTransformEnd} />
      );

      const group = getByTestId('konva-group');
      const onTransformEndProp = group.getAttribute('onTransformEnd');
      expect(onTransformEndProp).toBeDefined();
    });
  });

  describe('colors', () => {
    it('should apply fill color from shape', () => {
      const shape = createRectangle();
      shape.setFillColor('#FF8040');

      const { getByTestId } = render(<ShapeComponent shape={shape} />);

      const rect = getByTestId('konva-rect');
      expect(rect).toHaveAttribute('fill', '#FF8040');
    });

    it('should apply stroke color from shape when not selected', () => {
      const shape = createRectangle();
      shape.setStrokeColor('#0064C8');

      const { getByTestId } = render(
        <ShapeComponent shape={shape} isSelected={false} />
      );

      const rect = getByTestId('konva-rect');
      expect(rect).toHaveAttribute('stroke', '#0064C8');
    });

    it('should apply selection stroke color when selected', () => {
      const shape = createRectangle();

      const { getByTestId } = render(
        <ShapeComponent shape={shape} isSelected={true} />
      );

      const rect = getByTestId('konva-rect');
      expect(rect).toHaveAttribute('stroke', '#4A90D9');
    });
  });

  describe('rotation', () => {
    it('should apply rotation transform', () => {
      const shape = createRectangle();
      shape.rotateTo(45);

      const { getByTestId } = render(<ShapeComponent shape={shape} />);

      const group = getByTestId('konva-group');
      expect(group).toHaveAttribute('rotation', '45');
    });
  });
});
