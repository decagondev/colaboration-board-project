/**
 * ShapeFlyoutComponent Unit Tests
 *
 * Tests for the ShapeFlyoutComponent functionality.
 */

jest.mock('react-konva', () => ({
  Rect: () => null,
  Ellipse: () => null,
  Line: () => null,
  Circle: () => null,
  Group: () => null,
  Shape: () => null,
}));

jest.mock('konva', () => ({
  default: {},
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShapeFlyoutComponent } from '../../components/ShapeFlyoutComponent';
import { ShapeRegistry } from '../ShapeRegistry';
import type { ShapeDefinition } from '../ShapeDefinition';

/**
 * Create a mock shape definition for testing.
 */
function createMockDefinition(
  type: string,
  category: 'basic' | 'flowchart' = 'basic',
  label?: string
): ShapeDefinition {
  return {
    type: type as ShapeDefinition['type'],
    label: label ?? `Test ${type}`,
    icon: '□',
    category,
    defaultSize: { width: 100, height: 100 },
    render: () => React.createElement('div'),
    description: `Test ${type} description`,
  };
}

describe('ShapeFlyoutComponent', () => {
  const mockOnClose = jest.fn();
  const mockOnShapeSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    ShapeRegistry.clear();
    ShapeRegistry.register(createMockDefinition('rectangle', 'basic', 'Rectangle'));
    ShapeRegistry.register(createMockDefinition('ellipse', 'basic', 'Ellipse'));
    ShapeRegistry.register(createMockDefinition('diamond', 'flowchart', 'Diamond'));
  });

  afterEach(() => {
    ShapeRegistry.clear();
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={false}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display the title "Shapes"', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByText('Shapes')).toBeInTheDocument();
    });

    it('should display category headers', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByText('Basic Shapes')).toBeInTheDocument();
      expect(screen.getByText('Flowchart Shapes')).toBeInTheDocument();
    });

    it('should display shape buttons with labels', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByText('Rectangle')).toBeInTheDocument();
      expect(screen.getByText('Ellipse')).toBeInTheDocument();
      expect(screen.getByText('Diamond')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onShapeSelect and onClose when a shape is clicked', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      fireEvent.click(screen.getByText('Rectangle'));

      expect(mockOnShapeSelect).toHaveBeenCalledWith('rectangle');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button is clicked', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      fireEvent.click(screen.getByLabelText('Close'));

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('selection state', () => {
    it('should highlight the selected shape', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
          selectedShape="rectangle"
        />
      );

      const rectangleButton = screen.getByLabelText('Rectangle');
      expect(rectangleButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not highlight unselected shapes', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
          selectedShape="rectangle"
        />
      );

      const ellipseButton = screen.getByLabelText('Ellipse');
      expect(ellipseButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-label on dialog', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-label',
        'Shape Selection'
      );
    });

    it('should have aria-label on shape buttons', () => {
      render(
        <ShapeFlyoutComponent
          isOpen={true}
          onClose={mockOnClose}
          onShapeSelect={mockOnShapeSelect}
        />
      );

      expect(screen.getByLabelText('Rectangle')).toBeInTheDocument();
      expect(screen.getByLabelText('Ellipse')).toBeInTheDocument();
      expect(screen.getByLabelText('Diamond')).toBeInTheDocument();
    });
  });
});
