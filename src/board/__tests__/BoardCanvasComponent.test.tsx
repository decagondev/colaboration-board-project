/**
 * Board Canvas Component Tests
 *
 * Tests for the main canvas component rendering and basic functionality.
 */

import { render, screen } from '@testing-library/react';
import { BoardCanvasComponent } from '../components/BoardCanvasComponent';

/**
 * Mock Konva modules for testing.
 * Konva requires a canvas context which isn't available in jsdom.
 */
jest.mock('react-konva', () => ({
  Stage: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="konva-stage" {...props}>
      {children}
    </div>
  ),
  Layer: ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="konva-layer" {...props}>
      {children}
    </div>
  ),
  Rect: (props: Record<string, unknown>) => (
    <div data-testid="konva-rect" data-id={props.id} />
  ),
}));

describe('BoardCanvasComponent', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 768,
    });
  });

  it('should render the Stage component', () => {
    render(<BoardCanvasComponent />);

    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
  });

  it('should render multiple layers', () => {
    render(<BoardCanvasComponent />);

    const layers = screen.getAllByTestId('konva-layer');
    expect(layers.length).toBeGreaterThanOrEqual(2);
  });

  it('should render objects passed as props', () => {
    const objects = [
      { id: 'obj-1', type: 'rect', x: 100, y: 100, width: 50, height: 50 },
      { id: 'obj-2', type: 'rect', x: 200, y: 200, width: 50, height: 50 },
    ];

    render(<BoardCanvasComponent objects={objects} />);

    const rects = screen.getAllByTestId('konva-rect');
    expect(rects).toHaveLength(3);
  });

  it('should render without objects', () => {
    render(<BoardCanvasComponent objects={[]} />);

    expect(screen.getByTestId('konva-stage')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    render(
      <BoardCanvasComponent>
        <div data-testid="custom-child">Custom Layer</div>
      </BoardCanvasComponent>
    );

    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
  });
});
