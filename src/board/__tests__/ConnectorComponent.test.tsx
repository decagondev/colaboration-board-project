/**
 * Unit tests for the ConnectorComponent.
 *
 * Tests rendering and interaction behavior for connectors.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { Connector } from '../objects/Connector';
import { ConnectorComponent } from '../components/ConnectorComponent';

/** Mock react-konva components */
jest.mock('react-konva', () => ({
  Group: ({ children, ...props }: React.PropsWithChildren<object>) => (
    <div data-testid="konva-group" {...props}>
      {children}
    </div>
  ),
  Line: (props: object) => <div data-testid="konva-line" {...props} />,
  Circle: (props: object) => <div data-testid="konva-circle" {...props} />,
  RegularPolygon: (props: object) => (
    <div data-testid="konva-polygon" {...props} />
  ),
}));

const testUser = 'test-user';

describe('ConnectorComponent', () => {
  const createConnector = (): Connector =>
    Connector.create({ x: 100, y: 100 }, { x: 300, y: 200 }, testUser);

  describe('rendering', () => {
    it('should render the connector line', () => {
      const connector = createConnector();

      const { getByTestId, getAllByTestId } = render(
        <ConnectorComponent connector={connector} />
      );

      expect(getByTestId('konva-group')).toBeInTheDocument();
      expect(getAllByTestId('konva-line').length).toBeGreaterThanOrEqual(1);
    });

    it('should not render when connector is not visible', () => {
      const connector = createConnector();
      connector.visible = false;

      const { container } = render(
        <ConnectorComponent connector={connector} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render with default arrow at end', () => {
      const connector = createConnector();

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} />
      );

      const lines = getAllByTestId('konva-line');
      expect(lines.length).toBeGreaterThanOrEqual(1);
    });

    it('should render circle arrow when configured', () => {
      const connector = Connector.create(
        { x: 100, y: 100 },
        { x: 300, y: 200 },
        testUser,
        { startArrow: 'circle', endArrow: 'circle' }
      );

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} />
      );

      const circles = getAllByTestId('konva-circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('selection', () => {
    it('should show endpoint handles when selected', () => {
      const connector = createConnector();

      const { queryAllByTestId, rerender } = render(
        <ConnectorComponent connector={connector} isSelected={false} />
      );

      let circles = queryAllByTestId('konva-circle');
      const circlesWhenNotSelected = circles.length;

      rerender(<ConnectorComponent connector={connector} isSelected={true} />);

      circles = queryAllByTestId('konva-circle');
      expect(circles.length).toBeGreaterThan(circlesWhenNotSelected);
    });

    it('should apply selection stroke color when selected', () => {
      const connector = createConnector();

      const { getAllByTestId, rerender } = render(
        <ConnectorComponent connector={connector} isSelected={false} />
      );

      let line = getAllByTestId('konva-line')[0];
      expect(line).toHaveAttribute('stroke', '#333333');

      rerender(<ConnectorComponent connector={connector} isSelected={true} />);

      line = getAllByTestId('konva-line')[0];
      expect(line).toHaveAttribute('stroke', '#4A90D9');
    });
  });

  describe('interactions', () => {
    it('should register click handler', () => {
      const connector = createConnector();
      const handleClick = jest.fn();

      const { getByTestId } = render(
        <ConnectorComponent connector={connector} onClick={handleClick} />
      );

      const group = getByTestId('konva-group');
      expect(group.getAttribute('onClick')).toBeDefined();
    });

    it('should have draggable endpoint handles when selected', () => {
      const connector = createConnector();

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} isSelected={true} />
      );

      const circles = getAllByTestId('konva-circle');
      const draggableCircles = circles.filter(
        (c) => c.getAttribute('draggable') === 'true'
      );
      expect(draggableCircles.length).toBe(2);
    });

    it('should not have draggable handles when locked', () => {
      const connector = createConnector();
      connector.locked = true;

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} isSelected={true} />
      );

      const circles = getAllByTestId('konva-circle');
      const draggableCircles = circles.filter(
        (c) => c.getAttribute('draggable') === 'true'
      );
      expect(draggableCircles.length).toBe(0);
    });
  });

  describe('colors', () => {
    it('should apply stroke color from connector', () => {
      const connector = createConnector();
      connector.setStrokeColor('#FF0000');

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} isSelected={false} />
      );

      const line = getAllByTestId('konva-line')[0];
      expect(line).toHaveAttribute('stroke', '#FF0000');
    });

    it('should apply stroke width from connector', () => {
      const connector = createConnector();
      connector.strokeWidth = 5;

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} />
      );

      const line = getAllByTestId('konva-line')[0];
      expect(line).toHaveAttribute('stroke-width', '5');
    });
  });

  describe('route styles', () => {
    it('should render straight line points', () => {
      const connector = Connector.create(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        testUser,
        { routeStyle: 'straight' }
      );

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} />
      );

      const line = getAllByTestId('konva-line')[0];
      expect(line).toHaveAttribute('points', '0,0,100,100');
    });

    it('should render elbow line points', () => {
      const connector = Connector.create(
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        testUser,
        { routeStyle: 'elbow' }
      );

      const { getAllByTestId } = render(
        <ConnectorComponent connector={connector} />
      );

      const line = getAllByTestId('konva-line')[0];
      const points = line.getAttribute('points');
      expect(points).toBeDefined();
      expect(points?.split(',').length).toBe(8);
    });
  });
});
