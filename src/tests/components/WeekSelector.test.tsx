import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeekSelector } from '../../components/WeekSelector';
import type { WeeklyStandingsSummary } from '../../types/domain';

const weeks: WeeklyStandingsSummary[] = [
  { weekId: '2026-W30', closedAt: '2026-07-27T00:00:00.000Z', playerCount: 120 },
  { weekId: '2026-W29', closedAt: '2026-07-20T00:00:00.000Z', playerCount: 90 },
];

describe('WeekSelector', () => {
  it('renders the live option plus one option per archived week', () => {
    render(<WeekSelector weeks={weeks} value={undefined} onChange={() => {}} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3); // live + 2 weeks
    expect(options[0]?.textContent).toContain('live');
  });

  it('reflects the selected past week', () => {
    render(<WeekSelector weeks={weeks} value="2026-W30" onChange={() => {}} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2026-W30');
  });

  it('emits a weekId when a past week is picked', () => {
    const onChange = vi.fn();
    render(<WeekSelector weeks={weeks} value={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2026-W29' } });
    expect(onChange).toHaveBeenCalledWith('2026-W29');
  });

  it('emits undefined when the live option is picked', () => {
    const onChange = vi.fn();
    render(<WeekSelector weeks={weeks} value="2026-W30" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
