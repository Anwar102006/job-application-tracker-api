import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MonthlyTrendsChart } from '../MonthlyTrendsChart';

describe('MonthlyTrendsChart Component (Phase 6.5F)', () => {
  const mockMonthlyData = [
    { month: '2026-05', count: 2 },
    { month: '2026-06', count: 4 },
    { month: '2026-07', count: 1 },
    { month: '2026-08', count: 5 },
    { month: '2026-09', count: 3 },
    { month: '2026-10', count: 6 },
  ];

  it('renders application volume trends with calculated stats', () => {
    render(
      <MonthlyTrendsChart
        data={mockMonthlyData}
        months={6}
        onMonthsChange={vi.fn()}
      />
    );

    expect(screen.getByText('Application Volume Trends')).toBeInTheDocument();
    expect(screen.getByText('Monthly application submissions over time')).toBeInTheDocument();

    // Stats: Total = 2+4+1+5+3+6 = 21, Peak = 6, Avg = 3.5
    expect(screen.getByText('21')).toBeInTheDocument(); // Period Total
    expect(screen.getByText('6')).toBeInTheDocument(); // Peak Month
    expect(screen.getByText('3.5')).toBeInTheDocument(); // Monthly Avg
  });

  it('renders horizon selection pills and triggers onMonthsChange', () => {
    const handleMonthsChange = vi.fn();
    render(
      <MonthlyTrendsChart
        data={mockMonthlyData}
        months={6}
        onMonthsChange={handleMonthsChange}
      />
    );

    expect(screen.getByTestId('trend-horizon-3')).toBeInTheDocument();
    expect(screen.getByTestId('trend-horizon-6')).toBeInTheDocument();
    expect(screen.getByTestId('trend-horizon-12')).toBeInTheDocument();
    expect(screen.getByTestId('trend-horizon-24')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('trend-horizon-12'));
    expect(handleMonthsChange).toHaveBeenCalledWith(12);
  });

  it('handles empty data array without crash and shows 0 stats', () => {
    render(<MonthlyTrendsChart data={[]} months={6} />);

    expect(screen.getByText('Application Volume Trends')).toBeInTheDocument();
    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(1);
  });
});
