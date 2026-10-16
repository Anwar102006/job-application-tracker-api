import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../App';
import * as AuthContextModule from '../../context/AuthContext';
import * as interviewService from '../../services/interviewService';
import * as applicationService from '../../services/applicationService';

vi.mock('../../services/interviewService');
vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('Interview Routing (Phase 6.5E)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated user from /interviews to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/interviews']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByTestId('interviews-page')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user from /interviews/:id to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/interviews/507f1f77bcf86cd799439011']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByTestId('interview-details-card')).not.toBeInTheDocument();
  });

  it('renders Interviews page when authenticated and navigated from sidebar', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr-1', name: 'Taylor Swift', email: 'taylor@example.com' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingOut: false,
    });

    interviewService.getUpcomingInterviews.mockResolvedValue({
      data: { success: true, data: [] },
    });
    interviewService.getInterviews.mockResolvedValue({
      data: {
        success: true,
        data: [],
        meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 },
      },
    });
    applicationService.getApplications.mockResolvedValue({
      data: { success: true, data: [] },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    const interviewsNavLink = screen.getByRole('link', { name: /Interviews/i });
    expect(interviewsNavLink).toBeInTheDocument();

    await user.click(interviewsNavLink);

    expect(await screen.findByTestId('interviews-page')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-interview-btn')).toBeInTheDocument();
  });
});
