import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { MobileAuthMenu } from './MobileAuthMenu';

// Mock the hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ user: null })
}));

vi.mock('@/hooks/useLoggedInAccounts', () => ({
  useLoggedInAccounts: () => ({ currentUser: null })
}));

vi.mock('@/hooks/useLoginActions', () => ({
  useLoginActions: () => ({ nsec: vi.fn() })
}));

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({ mutate: vi.fn() })
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('MobileAuthMenu', () => {
  it('renders mobile auth menu when user is not logged in', () => {
    render(
      <TestApp>
        <MobileAuthMenu />
      </TestApp>
    );

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with correct button text and icon', () => {
    render(
      <TestApp>
        <MobileAuthMenu />
      </TestApp>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Account');
    expect(button).toBeInTheDocument();
  });
});
