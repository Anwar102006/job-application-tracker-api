import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConversionFunnelChart } from '../ConversionFunnelChart';

describe('ConversionFunnelChart Component (Phase 6.5F)', () => {
  const mockFunnelData = {
    totalApplications: 20,
    applicationsWithInterviews: 10,
    offeredApplications: 4,
    rejectedApplications: 6,
    applicationToInterviewRate: 50.0,
    interviewToOfferRate: 40.0,
    applicationToOfferRate: 20.0,
    applicationToRejectionRate: 30.0,
  };

  it('renders conversion funnel stages with accurate counts and percentages', () => {
    render(<ConversionFunnelChart data={mockFunnelData} />);

    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();

    expect(screen.getByText('Applications with Interviews')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Job Offers Extended')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Rates in summary matrix & progress bars
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('40%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('20%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('30%').length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty / zero dataset gracefully without NaN or errors', () => {
    const emptyData = {
      totalApplications: 0,
      applicationsWithInterviews: 0,
      offeredApplications: 0,
      rejectedApplications: 0,
      applicationToInterviewRate: 0,
      interviewToOfferRate: 0,
      applicationToOfferRate: 0,
      applicationToRejectionRate: 0,
    };

    render(<ConversionFunnelChart data={emptyData} />);

    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    expect(
      screen.getByText(/No applications tracked yet. Start applying to populate your conversion funnel./i)
    ).toBeInTheDocument();
  });

  it('handles undefined or null data prop safely', () => {
    render(<ConversionFunnelChart data={null} />);
    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
  });
});
