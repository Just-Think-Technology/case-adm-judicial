import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders Portal do Credor heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: /Portal do Credor/i })).toBeInTheDocument();
  });

  it('mentions /api/v1 and /health contract', () => {
    render(<HomePage />);
    expect(screen.getByText('/api/v1')).toBeInTheDocument();
    expect(screen.getByText('/health')).toBeInTheDocument();
  });
});
