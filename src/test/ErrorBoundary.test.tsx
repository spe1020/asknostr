import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock window.postMessage
const postMessageMock = vi.fn();
Object.defineProperty(window, 'postMessage', {
  value: postMessageMock,
});

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('catches and displays error when child throws', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. The error has been reported.')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('sends error details via postMessage', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    postMessageMock.mockClear();

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'mkstack-error',
        error: expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
          url: expect.any(String),
          timestamp: expect.any(String),
          userAgent: expect.any(String),
        }),
      }),
      '*'
    );

    consoleSpy.mockRestore();
  });

  it('uses custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});