import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../App';
import * as AuthContextModule from '../../context/AuthContext';
import * as analyticsService from '../../services/analyticsService';
import * as interviewService from '../../services/interviewService';
import * as applicationService from '../../services/applicationService';

vi.mock('../../services/analyticsService');
vi.mock('../../services/interviewService');
vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('Dashboard Routing (Phase 6.5G)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user from /dashboard to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  it('renders Dashboard page when authenticated directly at /dashboard', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr-1', name: 'Taylor Swift', email: 'taylor@example.com' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingOut: false,
    });

    analyticsService.getOverview.mockResolvedValue({
      data: { success: true, data: { totalApplications: 0, totalInterviews: 0 } },
    });
    analyticsService.getStatusBreakdown.mockResolvedValue({
      data: { success: true, data: {} },
    });
    interviewService.getUpcomingInterviews.mockResolvedValue({
      data: { success: true, data: [] },
    });
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-welcome-heading')).toHaveTextContent('Welcome back, Taylor Swift!');
  });

  it('renders Dashboard page when navigating via sidebar link', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr-1', name: 'Taylor Swift', email: 'taylor@example.com' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingOut: false,
    });

    analyticsService.getOverview.mockResolvedValue({
      data: { success: true, data: { totalApplications: 5, totalInterviews: 2 } },
    });
    analyticsService.getStatusBreakdown.mockResolvedValue({
      data: { success: true, data: {} },
    });
    interviewService.getUpcomingInterviews.mockResolvedValue({
      data: { success: true, data: [] },
    });
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter initialEntries={['/applications']}>
        <AppRoutes />
      </MemoryRouter>
    );

    const dashboardNavLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardNavLink).toBeInTheDocument();

    await user.click(dashboardNavLink);

    expect(await screen.findByTestId('dashboard-page')).toBeInTheDocument();
  });
});
