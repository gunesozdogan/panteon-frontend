import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekSelector } from '../../components/WeekSelector';
import type { WeeklyStandingsSummary } from '../../types/domain';

const weeks: WeeklyStandingsSummary[] = [
  { weekId: '2026-W30', closedAt: '2026-07-27T00:00:00.000Z', playerCount: 120 },
  { weekId: '2026-W29', closedAt: '2026-07-20T00:00:00.000Z', playerCount: 90 },
];

/** The trigger button that opens the dropdown. */
const trigger = () => screen.getByRole('button', { name: /select which week/i });

describe('WeekSelector', () => {
  it('renders the live option plus one option per archived week when opened', () => {
    render(<WeekSelector weeks={weeks} value={undefined} onChange={() => {}} />);
    fireEvent.click(trigger());
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // live + 2 weeks
    expect(options[0]?.textContent).toContain('live');
  });

  it('reflects the selected past week on the trigger', () => {
    render(<WeekSelector weeks={weeks} value="2026-W30" onChange={() => {}} />);
    expect(trigger().textContent).toContain('2026-W30');
  });

  it('marks the selected option as aria-selected', () => {
    render(<WeekSelector weeks={weeks} value="2026-W30" onChange={() => {}} />);
    fireEvent.click(trigger());
    const selected = screen.getByRole('option', { selected: true });
    expect(selected.textContent).toContain('2026-W30');
  });

  it('emits a weekId when a past week is picked', () => {
    const onChange = vi.fn();
    render(<WeekSelector weeks={weeks} value={undefined} onChange={onChange} />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('option', { name: /2026-W29/ }));
    expect(onChange).toHaveBeenCalledWith('2026-W29');
  });

  it('emits undefined when the live option is picked', () => {
    const onChange = vi.fn();
    render(<WeekSelector weeks={weeks} value="2026-W30" onChange={onChange} />);
    fireEvent.click(trigger());
    fireEvent.click(screen.getByRole('option', { name: /live/i }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
