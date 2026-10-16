import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import * as AuthContextModule from '../../context/AuthContext';
import * as analyticsService from '../../services/analyticsService';
import * as interviewService from '../../services/interviewService';
import * as applicationService from '../../services/applicationService';
import toast from 'react-hot-toast';

vi.mock('../../services/analyticsService');
vi.mock('../../services/interviewService');
vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('DashboardPage (Phase 6.5G)', () => {
  const mockUser = {
    id: 'usr-42',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    targetRole: 'Staff Frontend Engineer',
    headline: 'Building world-class web applications',
  };

  const mockOverview = {
    totalApplications: 10,
    totalInterviews: 4,
    interviewConversionRate: 40,
    offerRate: 20,
    rejectionRate: 30,
    offerToInterviewRate: 50,
  };

  const mockBreakdown = {
    byStatus: {
      Applied: 3,
      Screening: 1,
      Interviewing: 2,
      Offered: 2,
      Rejected: 2,
      Withdrawn: 0,
      Ghosted: 0,
    },
  };

  const mockUpcomingInterviews = [
    {
      _id: 'iv-1',
      round: 'System Design',
      status: 'Scheduled',
      format: 'Video Call',
      interviewDate: '2026-10-22T15:00:00.000Z',
      durationMinutes: 60,
      meetingLink: 'https://zoom.us/j/123456789',
      applicationId: {
        _id: 'app-9',
        company: 'Stripe',
        jobTitle: 'Infrastructure Engineer',
        status: 'Interviewing',
      },
    },
  ];

  const mockRecentApplications = [
    {
      _id: 'app-1',
      company: 'Airbnb',
      jobTitle: 'Senior UI Engineer',
      status: 'Interviewing',
      priority: 'High',
      workplaceType: 'Remote',
      jobType: 'Full-time',
      appliedDate: '2026-10-15T09:00:00.000Z',
    },
    {
      _id: 'app-2',
      company: 'DoorDash',
      jobTitle: 'Frontend Engineer',
      status: 'Applied',
      priority: 'Medium',
      workplaceType: 'Hybrid',
      jobType: 'Full-time',
      appliedDate: '2026-10-16T11:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    analyticsService.getOverview.mockResolvedValue({
      data: { success: true, data: mockOverview },
    });
    analyticsService.getStatusBreakdown.mockResolvedValue({
      data: { success: true, data: mockBreakdown },
    });
    interviewService.getUpcomingInterviews.mockResolvedValue({
      data: { success: true, data: mockUpcomingInterviews },
    });
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: mockRecentApplications },
    });
  });

  it('renders welcome header with user profile name and targetRole badge', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-welcome-heading')).toHaveTextContent('Welcome back, Alex Morgan!');
    expect(screen.getByTestId('dashboard-user-target-role')).toHaveTextContent('Staff Frontend Engineer');
    expect(screen.getByText(/Building world-class web applications/i)).toBeInTheDocument();
  });

  it('falls back to default welcome when user profile has no name', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 'usr-99', email: 'noname@example.com' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-welcome-heading')).toHaveTextContent('Welcome back!');
    expect(screen.queryByTestId('dashboard-user-target-role')).not.toBeInTheDocument();
  });

  it('loads and renders summary KPI metric cards with correct values and navigation links', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-metric-applications-value')).toHaveTextContent('10');
      expect(screen.getByTestId('dashboard-metric-interviews-value')).toHaveTextContent('4');
      expect(screen.getByTestId('dashboard-metric-interview-rate-value')).toHaveTextContent('40%');
      expect(screen.getByTestId('dashboard-metric-offer-rate-value')).toHaveTextContent('20%');
    });

    expect(screen.getByTestId('dashboard-metric-applications')).toHaveAttribute('href', '/applications');
    expect(screen.getByTestId('dashboard-metric-interviews')).toHaveAttribute('href', '/interviews');
    expect(screen.getByTestId('dashboard-metric-interview-rate')).toHaveAttribute('href', '/analytics');
    expect(screen.getByTestId('dashboard-metric-offer-rate')).toHaveAttribute('href', '/analytics');
  });

  it('passes exact backend-supported query parameters to services', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(interviewService.getUpcomingInterviews).toHaveBeenCalledWith({ days: 14 });
      expect(applicationService.getApplications).toHaveBeenCalledWith({
        page: 1,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      expect(analyticsService.getOverview).toHaveBeenCalled();
      expect(analyticsService.getStatusBreakdown).toHaveBeenCalled();
    });
  });

  it('handles empty state for a new user with 0 applications and 0 interviews safely', async () => {
    analyticsService.getOverview.mockResolvedValue({
      data: {
        success: true,
        data: {
          totalApplications: 0,
          totalInterviews: 0,
          interviewConversionRate: 0,
          offerRate: 0,
          rejectionRate: 0,
          offerToInterviewRate: 0,
        },
      },
    });
    analyticsService.getStatusBreakdown.mockResolvedValue({
      data: { success: true, data: { byStatus: {} } },
    });
    interviewService.getUpcomingInterviews.mockResolvedValue({
      data: { success: true, data: [] },
    });
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-metric-applications-value')).toHaveTextContent('0');
      expect(screen.getByTestId('dashboard-metric-interviews-value')).toHaveTextContent('0');
      expect(screen.getByTestId('dashboard-metric-interview-rate-value')).toHaveTextContent('0%');
      expect(screen.getByTestId('dashboard-metric-offer-rate-value')).toHaveTextContent('0%');
    });

    // Zero-state empty messages appear
    expect(screen.getByText('No upcoming interviews')).toBeInTheDocument();
    expect(screen.getByText('No applications tracked yet')).toBeInTheDocument();

    // Confirm no NaN or Infinity is displayed
    expect(screen.queryByText(/NaN/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Infinity/i)).not.toBeInTheDocument();
  });

  it('handles partial API failure when interviews fail: metrics and applications still load with inline retry for interviews', async () => {
    interviewService.getUpcomingInterviews.mockRejectedValue(new Error('Upcoming interviews server error'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Metrics still load successfully
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-metric-applications-value')).toHaveTextContent('10');
    });

    // Recent applications still load successfully
    expect(screen.getByText('Airbnb')).toBeInTheDocument();

    // Upcoming interviews card shows isolated error
    expect(screen.getByTestId('upcoming-interviews-error-card')).toBeInTheDocument();
    expect(screen.getByText('Upcoming interviews server error')).toBeInTheDocument();

    // Recovering via retry button
    interviewService.getUpcomingInterviews.mockResolvedValueOnce({
      data: { success: true, data: mockUpcomingInterviews },
    });

    const user = userEvent.setup();
    const retryBtn = screen.getByRole('button', { name: /Try Again/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('System Design')).toBeInTheDocument();
    });
  });

  it('handles partial API failure when applications fail: metrics and interviews still load with inline retry for applications', async () => {
    applicationService.getApplications.mockRejectedValue(new Error('Applications network timeout'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Metrics load successfully
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-metric-applications-value')).toHaveTextContent('10');
    });

    // Interviews load successfully
    expect(screen.getByText('System Design')).toBeInTheDocument();

    // Applications card shows error
    expect(screen.getByTestId('recent-applications-error-card')).toBeInTheDocument();
    expect(screen.getByText('Applications network timeout')).toBeInTheDocument();
  });

  it('handles partial API failure when metrics fail: interviews and applications still load with inline retry for pipeline', async () => {
    analyticsService.getOverview.mockRejectedValue(new Error('Analytics service down'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Interviews and applications load successfully
    await waitFor(() => {
      expect(screen.getByText('System Design')).toBeInTheDocument();
      expect(screen.getByText('Airbnb')).toBeInTheDocument();
    });

    // Pipeline shows isolated error
    expect(screen.getByTestId('pipeline-error-card')).toBeInTheDocument();
  });

  it('triggers full refresh across all sections when clicking the header Refresh button', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-metric-applications-value')).toHaveTextContent('10');
    });

    expect(analyticsService.getOverview).toHaveBeenCalledTimes(1);
    expect(interviewService.getUpcomingInterviews).toHaveBeenCalledTimes(1);
    expect(applicationService.getApplications).toHaveBeenCalledTimes(1);

    const refreshBtn = screen.getByTestId('dashboard-refresh-btn');
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(analyticsService.getOverview).toHaveBeenCalledTimes(2);
      expect(interviewService.getUpcomingInterviews).toHaveBeenCalledTimes(2);
      expect(applicationService.getApplications).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith('Dashboard refreshed successfully');
    });
  });
});
