import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RankBadge } from '../../components/RankBadge';

describe('RankBadge', () => {
  it('renders the rank number and an accessible label', () => {
    render(<RankBadge rank={7} />);
    const badge = screen.getByLabelText('Rank 7');
    expect(badge.textContent).toBe('7');
  });

  it('applies podium styling for ranks 1–3', () => {
    render(<RankBadge rank={1} />);
    expect(screen.getByLabelText('Rank 1').className).toContain('text-gold');
  });

  it('uses neutral styling outside the podium', () => {
    render(<RankBadge rank={42} />);
    const cls = screen.getByLabelText('Rank 42').className;
    expect(cls).not.toContain('text-gold');
  });
});
