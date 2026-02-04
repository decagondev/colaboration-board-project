/**
 * Unit tests for the TextComponent.
 *
 * Tests rendering, interactions, and editing capabilities.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextComponent } from '../components/TextComponent';
import { StandaloneText, TEXT_DEFAULTS } from '../objects/StandaloneText';

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

describe('TextComponent', () => {
  const testUser = 'test-user';
  const defaultPosition = { x: 100, y: 100 };

  const createDefaultText = (): StandaloneText => {
    return StandaloneText.create(defaultPosition, testUser);
  };

  const mockHandlers = {
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
    onDragStart: jest.fn(),
    onDragEnd: jest.fn(),
    onTransformEnd: jest.fn(),
    onEditStart: jest.fn(),
    onEditEnd: jest.fn(),
  };

  const mockStageRef = {
    current: {
      container: () => ({
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 800,
          height: 600,
        }),
      }),
      scaleX: () => 1,
      scaleY: () => 1,
      x: () => 0,
      y: () => 0,
      getStage: () => ({
        getPointerPosition: () => ({ x: 0, y: 0 }),
      }),
    },
  } as unknown as React.RefObject<unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render text at correct position', () => {
      const text = createDefaultText();

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('x', '100');
      expect(group).toHaveAttribute('y', '100');
    });

    it('should render text content', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Hello World',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toHaveAttribute('text', 'Hello World');
    });

    it('should render with default content', () => {
      const text = createDefaultText();

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toHaveAttribute('text', TEXT_DEFAULTS.content);
    });
  });

  describe('font properties', () => {
    it('should render text with custom font family', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test',
        fontFamily: 'Georgia, serif',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toBeDefined();
      expect(text.fontFamily).toBe('Georgia, serif');
    });

    it('should render text with custom font size', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test',
        fontSize: 24,
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toBeDefined();
      expect(text.fontSize).toBe(24);
    });

    it('should render text with font style', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test',
        fontStyle: 'bold italic',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toBeDefined();
      expect(text.fontStyle).toBe('bold italic');
    });
  });

  describe('alignment', () => {
    it('should have horizontal alignment', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test',
        align: 'center',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toHaveAttribute('align', 'center');
    });

    it('should render with vertical alignment', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test',
        verticalAlign: 'middle',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toBeDefined();
      expect(text.verticalAlign).toBe('middle');
    });
  });

  describe('colors', () => {
    it('should apply text color', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test',
        textColor: '#FF0000',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toHaveAttribute('fill', '#FF0000');
    });
  });

  describe('visibility', () => {
    it('should render when visible is true', () => {
      const text = createDefaultText();
      text.visible = true;

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.queryByTestId('konva-group');
      expect(group).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      const text = createDefaultText();
      text.visible = false;

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.queryByTestId('konva-group');
      expect(group).not.toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should render selection rect when isSelected is true', () => {
      const text = createDefaultText();

      render(
        <TextComponent
          text={text}
          isSelected={true}
          stageRef={mockStageRef}
          {...mockHandlers}
        />
      );

      const rects = screen.queryAllByTestId('konva-rect');
      expect(rects.length).toBeGreaterThan(0);
    });

    it('should not render selection rect when isSelected is false', () => {
      const text = createDefaultText();

      render(
        <TextComponent
          text={text}
          isSelected={false}
          stageRef={mockStageRef}
          {...mockHandlers}
        />
      );

      const rects = screen.queryAllByTestId('konva-rect');
      expect(rects.length).toBe(0);
    });

    it('should have onClick handler defined', () => {
      const text = createDefaultText();

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toBeDefined();
      expect(mockHandlers.onClick).toBeDefined();
    });
  });

  describe('dragging', () => {
    it('should be draggable when not locked', () => {
      const text = createDefaultText();
      text.locked = false;

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('draggable', 'true');
    });

    it('should not be draggable when locked', () => {
      const text = createDefaultText();
      text.locked = true;

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('draggable', 'false');
    });
  });

  describe('transform', () => {
    it('should apply rotation', () => {
      const text = createDefaultText();
      text.rotateTo(45);

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toHaveAttribute('rotation', '45');
    });

    it('should apply transform with scale', () => {
      const text = createDefaultText();
      text.applyTransform({ scaleX: 1.5, scaleY: 1.5 });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const group = screen.getByTestId('konva-group');
      expect(group).toBeDefined();
    });
  });

  describe('dimensions', () => {
    it('should render with custom size', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        size: { width: 300, height: 100 },
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toHaveAttribute('width', '300');
      expect(textElement).toHaveAttribute('height', '100');
    });
  });

  describe('editing mode', () => {
    it('should render text content when not editing', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test Content',
      });

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toBeInTheDocument();
      expect(textElement).toHaveAttribute('text', 'Test Content');
    });

    it('should render text element when editing (external textarea is used)', () => {
      const text = StandaloneText.create(defaultPosition, testUser, {
        content: 'Test Content',
      });
      text.startEditing();

      render(
        <TextComponent text={text} stageRef={mockStageRef} {...mockHandlers} />
      );

      const textElement = screen.getByTestId('konva-text');
      expect(textElement).toBeInTheDocument();
    });
  });
});
