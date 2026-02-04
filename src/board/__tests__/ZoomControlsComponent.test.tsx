/**
 * Tests for ZoomControlsComponent
 *
 * Verifies zoom controls render correctly and handle user interactions.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ZoomControlsComponent } from '../components/ZoomControlsComponent';

describe('ZoomControlsComponent', () => {
  const mockOnZoomChange = jest.fn();

  beforeEach(() => {
    mockOnZoomChange.mockClear();
  });

  it('renders zoom controls with all buttons', () => {
    render(<ZoomControlsComponent scale={1} onZoomChange={mockOnZoomChange} />);

    expect(screen.getByLabelText('Zoom out')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom in')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset zoom to 100%')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom level')).toBeInTheDocument();
  });

  it('displays current zoom level in select', () => {
    render(<ZoomControlsComponent scale={1} onZoomChange={mockOnZoomChange} />);

    const select = screen.getByLabelText('Zoom level') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('calls onZoomChange when zoom in button is clicked', () => {
    render(
      <ZoomControlsComponent
        scale={1}
        onZoomChange={mockOnZoomChange}
        zoomStep={1.2}
      />
    );

    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(mockOnZoomChange).toHaveBeenCalledWith(1.2);
  });

  it('calls onZoomChange when zoom out button is clicked', () => {
    render(
      <ZoomControlsComponent
        scale={1}
        onZoomChange={mockOnZoomChange}
        zoomStep={1.2}
      />
    );

    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(mockOnZoomChange).toHaveBeenCalledWith(1 / 1.2);
  });

  it('calls onZoomChange with 1 when reset button is clicked', () => {
    render(<ZoomControlsComponent scale={2} onZoomChange={mockOnZoomChange} />);

    fireEvent.click(screen.getByLabelText('Reset zoom to 100%'));
    expect(mockOnZoomChange).toHaveBeenCalledWith(1);
  });

  it('calls onZoomChange when preset is selected', () => {
    render(<ZoomControlsComponent scale={1} onZoomChange={mockOnZoomChange} />);

    const select = screen.getByLabelText('Zoom level');
    fireEvent.change(select, { target: { value: '2' } });
    expect(mockOnZoomChange).toHaveBeenCalledWith(2);
  });

  it('disables zoom in button at max scale', () => {
    render(
      <ZoomControlsComponent
        scale={5}
        onZoomChange={mockOnZoomChange}
        maxScale={5}
      />
    );

    expect(screen.getByLabelText('Zoom in')).toBeDisabled();
  });

  it('disables zoom out button at min scale', () => {
    render(
      <ZoomControlsComponent
        scale={0.1}
        onZoomChange={mockOnZoomChange}
        minScale={0.1}
      />
    );

    expect(screen.getByLabelText('Zoom out')).toBeDisabled();
  });

  it('respects max scale when zooming in', () => {
    render(
      <ZoomControlsComponent
        scale={4.5}
        onZoomChange={mockOnZoomChange}
        maxScale={5}
        zoomStep={1.2}
      />
    );

    fireEvent.click(screen.getByLabelText('Zoom in'));
    expect(mockOnZoomChange).toHaveBeenCalledWith(5);
  });

  it('respects min scale when zooming out', () => {
    render(
      <ZoomControlsComponent
        scale={0.11}
        onZoomChange={mockOnZoomChange}
        minScale={0.1}
        zoomStep={1.2}
      />
    );

    fireEvent.click(screen.getByLabelText('Zoom out'));
    expect(mockOnZoomChange).toHaveBeenCalledWith(0.1);
  });

  it('shows custom zoom level when not in presets', () => {
    render(
      <ZoomControlsComponent scale={1.37} onZoomChange={mockOnZoomChange} />
    );

    const select = screen.getByLabelText('Zoom level');
    const options = select.querySelectorAll('option');
    const customOption = Array.from(options).find(
      (opt) => opt.textContent === '137%'
    );
    expect(customOption).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ZoomControlsComponent
        scale={1}
        onZoomChange={mockOnZoomChange}
        className="custom-zoom-controls"
      />
    );

    expect(
      container.querySelector('.custom-zoom-controls')
    ).toBeInTheDocument();
  });
});
