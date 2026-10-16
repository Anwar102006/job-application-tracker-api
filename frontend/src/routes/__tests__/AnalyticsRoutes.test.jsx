import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../App';
import * as AuthContextModule from '../../context/AuthContext';
import * as analyticsService from '../../services/analyticsService';

vi.mock('../../services/analyticsService');
vi.mock('react-hot-toast');

describe('Analytics Routing (Phase 6.5F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user from /analytics to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-page')).not.toBeInTheDocument();
  });

  it('renders Analytics page when authenticated directly at /analytics', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr-1', name: 'Jordan Lee', email: 'jordan@example.com' },
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
    analyticsService.getConversionRates.mockResolvedValue({
      data: { success: true, data: {} },
    });
    analyticsService.getMonthlyTrends.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('analytics-page')).toBeInTheDocument();
  });

  it('renders Analytics page when authenticated and navigated from sidebar', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr-1', name: 'Jordan Lee', email: 'jordan@example.com' },
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
    analyticsService.getConversionRates.mockResolvedValue({
      data: { success: true, data: {} },
    });
    analyticsService.getMonthlyTrends.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    const analyticsNavLink = screen.getByRole('link', { name: /Analytics/i });
    expect(analyticsNavLink).toBeInTheDocument();

    await user.click(analyticsNavLink);

    expect(await screen.findByTestId('analytics-page')).toBeInTheDocument();
  });
});
