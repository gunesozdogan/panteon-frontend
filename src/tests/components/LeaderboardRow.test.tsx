import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '../../types/domain';
import { LeaderboardRow } from '../../components/LeaderboardRow';

const entry: LeaderboardEntry = {
  rank: 5,
  playerId: 'p4',
  username: 'Player_4',
  score: 1234567,
};

describe('LeaderboardRow', () => {
  it('shows rank, username and formatted score', () => {
    render(<LeaderboardRow entry={entry} />);
    expect(screen.getByLabelText('Rank 5')).toBeTruthy();
    expect(screen.getByText('Player_4')).toBeTruthy();
    expect(screen.getByText('1,234,567')).toBeTruthy();
  });

  it('tags and flags the row when it is the viewing player', () => {
    const { container } = render(<LeaderboardRow entry={entry} isMe />);
    expect(screen.getByText('You')).toBeTruthy();
    expect(container.querySelector('[aria-current="true"]')).toBeTruthy();
  });

  it('renders the prize (money) only when showPrize is set', () => {
    const withPrize: LeaderboardEntry = { ...entry, prize: 4000000 };
    const { rerender } = render(<LeaderboardRow entry={withPrize} />);
    expect(screen.queryByText(/Prize/)).toBeNull();

    rerender(<LeaderboardRow entry={withPrize} showPrize />);
    expect(screen.getByText('Prize')).toBeTruthy();
    expect(screen.getByText('🪙 40,000.00')).toBeTruthy();
  });
});
