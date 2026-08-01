import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LeaderboardSkeleton } from '../../components/LeaderboardSkeleton';

describe('LeaderboardSkeleton', () => {
  it('renders the requested number of placeholder rows', () => {
    render(<LeaderboardSkeleton rows={5} />);
    const container = screen.getByTestId('leaderboard-skeleton');
    expect(container.children).toHaveLength(5);
  });

  it('is hidden from assistive tech (carries no information)', () => {
    render(<LeaderboardSkeleton rows={3} />);
    expect(screen.getByTestId('leaderboard-skeleton').getAttribute('aria-hidden')).toBe('true');
  });
});
