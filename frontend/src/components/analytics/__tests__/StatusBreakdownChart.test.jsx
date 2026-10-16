import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBreakdownChart } from '../StatusBreakdownChart';

describe('StatusBreakdownChart Component (Phase 6.5F)', () => {
  const mockBreakdown = {
    byStatus: {
      Applied: 5,
      Screening: 2,
      Interviewing: 4,
      Offered: 2,
      Rejected: 1,
      Withdrawn: 0,
      Ghosted: 0,
    },
    byPriority: {
      Low: 3,
      Medium: 7,
      High: 4,
    },
    byWorkplaceType: {
      'On-site': 2,
      Hybrid: 8,
      Remote: 4,
    },
    byJobType: {
      'Full-time': 10,
      'Part-time': 2,
      Contract: 1,
      Internship: 1,
      Freelance: 0,
    },
  };

  it('renders application breakdown card and default Status breakdown', () => {
    render(<StatusBreakdownChart data={mockBreakdown} />);

    expect(screen.getByText('Application Breakdown')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-tab-byStatus')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-tab-byPriority')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-tab-byWorkplaceType')).toBeInTheDocument();
    expect(screen.getByTestId('dimension-tab-byJobType')).toBeInTheDocument();

    // Verify status items are rendered in summary grid
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Interviewing')).toBeInTheDocument();
    expect(screen.getByText('Offered')).toBeInTheDocument();
  });

  it('switches dimensions when tabs are clicked', () => {
    render(<StatusBreakdownChart data={mockBreakdown} />);

    // Click Priority tab
    fireEvent.click(screen.getByTestId('dimension-tab-byPriority'));
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();

    // Click Workplace tab
    fireEvent.click(screen.getByTestId('dimension-tab-byWorkplaceType'));
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.getByText('On-site')).toBeInTheDocument();

    // Click Job Type tab
    fireEvent.click(screen.getByTestId('dimension-tab-byJobType'));
    expect(screen.getByText('Full-time')).toBeInTheDocument();
    expect(screen.getByText('Contract')).toBeInTheDocument();
  });

  it('handles empty / zero counts gracefully with informative empty message', () => {
    const emptyBreakdown = {
      byStatus: {
        Applied: 0,
        Screening: 0,
        Interviewing: 0,
        Offered: 0,
        Rejected: 0,
        Withdrawn: 0,
        Ghosted: 0,
      },
      byPriority: { Low: 0, Medium: 0, High: 0 },
      byWorkplaceType: { 'On-site': 0, Hybrid: 0, Remote: 0 },
      byJobType: {
        'Full-time': 0,
        'Part-time': 0,
        Contract: 0,
        Internship: 0,
        Freelance: 0,
      },
    };

    render(<StatusBreakdownChart data={emptyBreakdown} />);

    expect(screen.getByText('Application Breakdown')).toBeInTheDocument();
    expect(
      screen.getByText(/No application data for this breakdown. Track applications to view demographic distributions./i)
    ).toBeInTheDocument();
  });
});
