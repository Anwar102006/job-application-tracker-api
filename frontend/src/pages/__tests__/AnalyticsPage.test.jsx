import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { AnalyticsPage } from '../AnalyticsPage';
import * as analyticsService from '../../services/analyticsService';

vi.mock('../../services/analyticsService');
vi.mock('react-hot-toast');

describe('AnalyticsPage Component (Phase 6.5F)', () => {
  const mockOverview = {
    totalApplications: 15,
    totalInterviews: 8,
    interviewConversionRate: 46.7,
    offerRate: 20.0,
    rejectionRate: 26.7,
    offerToInterviewRate: 42.9,
  };

  const mockBreakdown = {
    byStatus: {
      Applied: 5,
      Screening: 2,
      Interviewing: 4,
      Offered: 3,
      Rejected: 1,
      Withdrawn: 0,
      Ghosted: 0,
    },
    byPriority: { Low: 3, Medium: 8, High: 4 },
    byJobType: {
      'Full-time': 11,
      'Part-time': 2,
      Contract: 1,
      Internship: 1,
      Freelance: 0,
    },
    byWorkplaceType: {
      'On-site': 3,
      Hybrid: 8,
      Remote: 4,
    },
  };

  const mockConversion = {
    totalApplications: 15,
    applicationsWithInterviews: 7,
    offeredApplications: 3,
    rejectedApplications: 4,
    applicationToInterviewRate: 46.7,
    interviewToOfferRate: 42.9,
    applicationToOfferRate: 20.0,
    applicationToRejectionRate: 26.7,
  };

  const mockMonthlyTrends = [
    { month: '2026-05', count: 1 },
    { month: '2026-06', count: 3 },
    { month: '2026-07', count: 2 },
    { month: '2026-08', count: 4 },
    { month: '2026-09', count: 2 },
    { month: '2026-10', count: 3 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. displays loading indicator while fetching analytics', () => {
    analyticsService.getOverview.mockReturnValue(new Promise(() => {}));
    analyticsService.getStatusBreakdown.mockReturnValue(new Promise(() => {}));
    analyticsService.getConversionRates.mockReturnValue(new Promise(() => {}));
    analyticsService.getMonthlyTrends.mockReturnValue(new Promise(() => {}));

    render(<AnalyticsPage />);

    expect(screen.getByTestId('analytics-loading-state')).toBeInTheDocument();
    expect(screen.getByText(/Computing career pipeline metrics.../i)).toBeInTheDocument();
  });

  it('2. successfully loads and renders overview metrics, conversion funnel, and breakdowns', async () => {
    analyticsService.getOverview.mockResolvedValueOnce({ data: { success: true, data: mockOverview } });
    analyticsService.getStatusBreakdown.mockResolvedValueOnce({ data: { success: true, data: mockBreakdown } });
    analyticsService.getConversionRates.mockResolvedValueOnce({ data: { success: true, data: mockConversion } });
    analyticsService.getMonthlyTrends.mockResolvedValueOnce({ data: { success: true, data: mockMonthlyTrends } });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-page')).toBeInTheDocument();
    });

    // Check KPI values
    expect(screen.getByTestId('metric-total-applications-value')).toHaveTextContent('15');
    expect(screen.getByTestId('metric-total-interviews-value')).toHaveTextContent('8');
    expect(screen.getByTestId('metric-interview-rate-value')).toHaveTextContent('46.7%');
    expect(screen.getByTestId('metric-offer-rate-value')).toHaveTextContent('20%');
    expect(screen.getByTestId('metric-offer-to-interview-value')).toHaveTextContent('42.9%');
    expect(screen.getByTestId('metric-rejection-rate-value')).toHaveTextContent('26.7%');

    // Check section components
    expect(screen.getByTestId('conversion-funnel-card')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-trends-card')).toBeInTheDocument();
    expect(screen.getByTestId('status-breakdown-card')).toBeInTheDocument();
  });

  it('3. handles empty / zero application state safely with informational banner', async () => {
    const zeroOverview = {
      totalApplications: 0,
      totalInterviews: 0,
      interviewConversionRate: 0,
      offerRate: 0,
      rejectionRate: 0,
      offerToInterviewRate: 0,
    };
    const zeroBreakdown = {
      byStatus: { Applied: 0, Screening: 0, Interviewing: 0, Offered: 0, Rejected: 0, Withdrawn: 0, Ghosted: 0 },
      byPriority: { Low: 0, Medium: 0, High: 0 },
      byJobType: { 'Full-time': 0, 'Part-time': 0, Contract: 0, Internship: 0, Freelance: 0 },
      byWorkplaceType: { 'On-site': 0, Hybrid: 0, Remote: 0 },
    };
    const zeroConversion = {
      totalApplications: 0,
      applicationsWithInterviews: 0,
      offeredApplications: 0,
      rejectedApplications: 0,
      applicationToInterviewRate: 0,
      interviewToOfferRate: 0,
      applicationToOfferRate: 0,
      applicationToRejectionRate: 0,
    };

    analyticsService.getOverview.mockResolvedValueOnce({ data: { success: true, data: zeroOverview } });
    analyticsService.getStatusBreakdown.mockResolvedValueOnce({ data: { success: true, data: zeroBreakdown } });
    analyticsService.getConversionRates.mockResolvedValueOnce({ data: { success: true, data: zeroConversion } });
    analyticsService.getMonthlyTrends.mockResolvedValueOnce({ data: { success: true, data: [] } });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('analytics-zero-notice')).toBeInTheDocument();
    expect(screen.getByTestId('metric-total-applications-value')).toHaveTextContent('0');
    expect(screen.getByTestId('metric-interview-rate-value')).toHaveTextContent('0%');
  });

  it('4. renders ErrorState with retry button when analytics loading fails', async () => {
    analyticsService.getOverview.mockRejectedValueOnce(new Error('Network connection timeout'));
    analyticsService.getStatusBreakdown.mockResolvedValueOnce({ data: { success: true, data: mockBreakdown } });
    analyticsService.getConversionRates.mockResolvedValueOnce({ data: { success: true, data: mockConversion } });
    analyticsService.getMonthlyTrends.mockResolvedValueOnce({ data: { success: true, data: [] } });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-error-state')).toBeInTheDocument();
    });

    expect(screen.getByText('Unable to load analytics')).toBeInTheDocument();
    expect(screen.getByText('Network connection timeout')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    // Trigger retry
    analyticsService.getOverview.mockResolvedValueOnce({ data: { success: true, data: mockOverview } });
    analyticsService.getStatusBreakdown.mockResolvedValueOnce({ data: { success: true, data: mockBreakdown } });
    analyticsService.getConversionRates.mockResolvedValueOnce({ data: { success: true, data: mockConversion } });
    analyticsService.getMonthlyTrends.mockResolvedValueOnce({ data: { success: true, data: mockMonthlyTrends } });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-page')).toBeInTheDocument();
    });
  });

  it('5. triggers full refresh on Refresh button click and displays toast', async () => {
    analyticsService.getOverview.mockResolvedValue({ data: { success: true, data: mockOverview } });
    analyticsService.getStatusBreakdown.mockResolvedValue({ data: { success: true, data: mockBreakdown } });
    analyticsService.getConversionRates.mockResolvedValue({ data: { success: true, data: mockConversion } });
    analyticsService.getMonthlyTrends.mockResolvedValue({ data: { success: true, data: mockMonthlyTrends } });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-page')).toBeInTheDocument();
    });

    const refreshBtn = screen.getByTestId('refresh-analytics-btn');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Analytics refreshed successfully');
    });
  });

  it('6. updates monthly trends when user changes trend horizon', async () => {
    analyticsService.getOverview.mockResolvedValue({ data: { success: true, data: mockOverview } });
    analyticsService.getStatusBreakdown.mockResolvedValue({ data: { success: true, data: mockBreakdown } });
    analyticsService.getConversionRates.mockResolvedValue({ data: { success: true, data: mockConversion } });
    analyticsService.getMonthlyTrends.mockResolvedValue({ data: { success: true, data: mockMonthlyTrends } });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-page')).toBeInTheDocument();
    });

    // Switch to 12 months horizon
    const horizon12Btn = screen.getByTestId('trend-horizon-12');
    fireEvent.click(horizon12Btn);

    await waitFor(() => {
      expect(analyticsService.getMonthlyTrends).toHaveBeenCalledWith({ months: 12 });
    });
  });
});
