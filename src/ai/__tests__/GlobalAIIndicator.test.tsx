/**
 * Unit tests for GlobalAIIndicator component.
 *
 * Tests the visual indicator for global AI processing state.
 */

import React from 'react';
import { render, screen, cleanup, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalAIIndicator } from '../components/GlobalAIIndicator';
import { defaultAICommandQueueService } from '../services/AICommandQueueService';
import type { QueuedCommand } from '../interfaces/IAICommandQueue';

jest.mock('../services/AICommandQueueService', () => ({
  defaultAICommandQueueService: {
    subscribe: jest.fn(),
  },
}));

const mockSubscribe = defaultAICommandQueueService.subscribe as jest.MockedFunction<
  typeof defaultAICommandQueueService.subscribe
>;

describe('GlobalAIIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when no command is processing', () => {
    mockSubscribe.mockImplementation((boardId, callback) => {
      callback([]);
      return jest.fn();
    });

    const { container } = render(<GlobalAIIndicator boardId="board-1" />);

    expect(container.firstChild).toBeNull();
  });

  it('renders indicator when a command is processing', () => {
    const processingCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'processing',
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    mockSubscribe.mockImplementation((boardId, callback) => {
      callback([processingCommand]);
      return jest.fn();
    });

    render(<GlobalAIIndicator boardId="board-1" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('does not show user info by default', () => {
    const processingCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'processing',
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    mockSubscribe.mockImplementation((boardId, callback) => {
      callback([processingCommand]);
      return jest.fn();
    });

    render(<GlobalAIIndicator boardId="board-1" />);

    expect(screen.queryByText(/Requested by/)).not.toBeInTheDocument();
  });

  it('shows user info when showUser is true', () => {
    const processingCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'processing',
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    mockSubscribe.mockImplementation((boardId, callback) => {
      callback([processingCommand]);
      return jest.fn();
    });

    render(<GlobalAIIndicator boardId="board-1" showUser />);

    expect(screen.getByText('Requested by user-1')).toBeInTheDocument();
  });

  it('unsubscribes when unmounted', () => {
    const mockUnsubscribe = jest.fn();
    mockSubscribe.mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<GlobalAIIndicator boardId="board-1" />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('subscribes with processing status filter', () => {
    mockSubscribe.mockReturnValue(jest.fn());

    render(<GlobalAIIndicator boardId="board-1" />);

    expect(mockSubscribe).toHaveBeenCalledWith(
      'board-1',
      expect.any(Function),
      { statusFilter: ['processing'] }
    );
  });

  it('does not render when boardId is empty', () => {
    mockSubscribe.mockReturnValue(jest.fn());

    const { container } = render(<GlobalAIIndicator boardId="" />);

    expect(container.firstChild).toBeNull();
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const processingCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'processing',
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    mockSubscribe.mockImplementation((boardId, callback) => {
      callback([processingCommand]);
      return jest.fn();
    });

    render(<GlobalAIIndicator boardId="board-1" className="custom-class" />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveClass('global-ai-indicator');
    expect(indicator).toHaveClass('custom-class');
  });

  it('has correct accessibility attributes', () => {
    const processingCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'processing',
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    mockSubscribe.mockImplementation((boardId, callback) => {
      callback([processingCommand]);
      return jest.fn();
    });

    render(<GlobalAIIndicator boardId="board-1" />);

    const indicator = screen.getByRole('status');
    expect(indicator).toHaveAttribute('aria-live', 'polite');
    expect(indicator).toHaveAttribute('aria-label', 'AI is processing a command');
  });

  it('updates when processing command changes', () => {
    let capturedCallback: ((commands: QueuedCommand[]) => void) | null = null;
    mockSubscribe.mockImplementation((boardId, callback) => {
      capturedCallback = callback;
      callback([]);
      return jest.fn();
    });

    const { container } = render(<GlobalAIIndicator boardId="board-1" />);

    expect(container.firstChild).toBeNull();

    const processingCommand: QueuedCommand = {
      id: 'cmd-1',
      boardId: 'board-1',
      userId: 'user-1',
      input: 'Create a sticky note',
      status: 'processing',
      createdAt: Date.now(),
      startedAt: Date.now(),
    };

    act(() => {
      if (capturedCallback) {
        capturedCallback([processingCommand]);
      }
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  describe('position prop', () => {
    it('positions at top-right by default', () => {
      const processingCommand: QueuedCommand = {
        id: 'cmd-1',
        boardId: 'board-1',
        userId: 'user-1',
        input: 'Test',
        status: 'processing',
        createdAt: Date.now(),
        startedAt: Date.now(),
      };

      mockSubscribe.mockImplementation((boardId, callback) => {
        callback([processingCommand]);
        return jest.fn();
      });

      render(<GlobalAIIndicator boardId="board-1" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ top: '16px', right: '16px' });
    });

    it('positions at top-left when specified', () => {
      const processingCommand: QueuedCommand = {
        id: 'cmd-1',
        boardId: 'board-1',
        userId: 'user-1',
        input: 'Test',
        status: 'processing',
        createdAt: Date.now(),
        startedAt: Date.now(),
      };

      mockSubscribe.mockImplementation((boardId, callback) => {
        callback([processingCommand]);
        return jest.fn();
      });

      render(<GlobalAIIndicator boardId="board-1" position="top-left" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ top: '16px', left: '16px' });
    });

    it('positions at bottom-right when specified', () => {
      const processingCommand: QueuedCommand = {
        id: 'cmd-1',
        boardId: 'board-1',
        userId: 'user-1',
        input: 'Test',
        status: 'processing',
        createdAt: Date.now(),
        startedAt: Date.now(),
      };

      mockSubscribe.mockImplementation((boardId, callback) => {
        callback([processingCommand]);
        return jest.fn();
      });

      render(<GlobalAIIndicator boardId="board-1" position="bottom-right" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ bottom: '16px', right: '16px' });
    });

    it('positions at bottom-left when specified', () => {
      const processingCommand: QueuedCommand = {
        id: 'cmd-1',
        boardId: 'board-1',
        userId: 'user-1',
        input: 'Test',
        status: 'processing',
        createdAt: Date.now(),
        startedAt: Date.now(),
      };

      mockSubscribe.mockImplementation((boardId, callback) => {
        callback([processingCommand]);
        return jest.fn();
      });

      render(<GlobalAIIndicator boardId="board-1" position="bottom-left" />);

      const indicator = screen.getByRole('status');
      expect(indicator).toHaveStyle({ bottom: '16px', left: '16px' });
    });
  });
});
