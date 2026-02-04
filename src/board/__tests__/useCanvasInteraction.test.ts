/**
 * Tests for useCanvasInteraction hook
 *
 * Verifies canvas pan and zoom interaction handlers work correctly.
 */

import { renderHook, act } from '@testing-library/react';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import type { ViewportState } from '../hooks/useViewport';

describe('useCanvasInteraction', () => {
  const createMockStageRef = () => ({
    current: {
      getPointerPosition: jest.fn().mockReturnValue({ x: 100, y: 100 }),
    } as unknown as HTMLElement,
  });

  const defaultViewport: ViewportState = {
    x: 0,
    y: 0,
    scale: 1,
  };

  it('returns all expected handlers', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>
      )
    );

    expect(result.current.handleWheel).toBeDefined();
    expect(result.current.handleDragEnd).toBeDefined();
    expect(result.current.handleDragMove).toBeDefined();
    expect(result.current.zoomTo).toBeDefined();
    expect(result.current.zoomIn).toBeDefined();
    expect(result.current.zoomOut).toBeDefined();
    expect(result.current.resetView).toBeDefined();
    expect(result.current.panTo).toBeDefined();
  });

  it('zoomIn increases scale by sensitivity factor', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const options = { zoomSensitivity: 1.2 };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    act(() => {
      result.current.zoomIn();
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...defaultViewport,
      scale: 1.2,
    });
  });

  it('zoomOut decreases scale by sensitivity factor', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const options = { zoomSensitivity: 1.2 };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    act(() => {
      result.current.zoomOut();
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...defaultViewport,
      scale: 1 / 1.2,
    });
  });

  it('zoomIn respects maxScale', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const viewport: ViewportState = { x: 0, y: 0, scale: 4.9 };
    const options = { maxScale: 5, zoomSensitivity: 1.2 };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        viewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    act(() => {
      result.current.zoomIn();
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...viewport,
      scale: 5,
    });
  });

  it('zoomOut respects minScale', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const viewport: ViewportState = { x: 0, y: 0, scale: 0.11 };
    const options = { minScale: 0.1, zoomSensitivity: 1.2 };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        viewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    act(() => {
      result.current.zoomOut();
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...viewport,
      scale: 0.1,
    });
  });

  it('resetView sets scale to 1 and position to origin', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const viewport: ViewportState = { x: 100, y: 200, scale: 2.5 };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        viewport,
        setViewport,
        stageRef as React.RefObject<unknown>
      )
    );

    act(() => {
      result.current.resetView();
    });

    expect(setViewport).toHaveBeenCalledWith({
      x: 0,
      y: 0,
      scale: 1,
    });
  });

  it('panTo updates position', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>
      )
    );

    act(() => {
      result.current.panTo(150, 250);
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...defaultViewport,
      x: 150,
      y: 250,
    });
  });

  it('zoomTo sets specific scale', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>
      )
    );

    act(() => {
      result.current.zoomTo(2);
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...defaultViewport,
      scale: 2,
    });
  });

  it('zoomTo clamps to bounds', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const options = { minScale: 0.1, maxScale: 5 };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    act(() => {
      result.current.zoomTo(10);
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...defaultViewport,
      scale: 5,
    });

    setViewport.mockClear();

    act(() => {
      result.current.zoomTo(0.01);
    });

    expect(setViewport).toHaveBeenCalledWith({
      ...defaultViewport,
      scale: 0.1,
    });
  });

  it('does not zoom when zoomEnabled is false', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const options = { zoomEnabled: false };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    const mockEvent = {
      evt: {
        preventDefault: jest.fn(),
        deltaY: -100,
      },
    };

    act(() => {
      result.current.handleWheel(
        mockEvent as unknown as Parameters<typeof result.current.handleWheel>[0]
      );
    });

    expect(setViewport).not.toHaveBeenCalled();
  });

  it('does not pan when panEnabled is false', () => {
    const stageRef = createMockStageRef();
    const setViewport = jest.fn();
    const options = { panEnabled: false };

    const { result } = renderHook(() =>
      useCanvasInteraction(
        defaultViewport,
        setViewport,
        stageRef as React.RefObject<unknown>,
        options
      )
    );

    const mockEvent = {
      target: stageRef.current,
      type: 'dragend',
    };

    Object.assign(mockEvent.target, {
      x: () => 50,
      y: () => 75,
    });

    act(() => {
      result.current.handleDragEnd(
        mockEvent as unknown as Parameters<
          typeof result.current.handleDragEnd
        >[0]
      );
    });

    expect(setViewport).not.toHaveBeenCalled();
  });
});
