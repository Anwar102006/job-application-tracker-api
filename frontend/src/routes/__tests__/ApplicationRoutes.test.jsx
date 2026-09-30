import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../../App';
import * as AuthContextModule from '../../context/AuthContext';
import * as applicationService from '../../services/applicationService';

vi.mock('../../services/applicationService');
vi.mock('react-hot-toast');

describe('Application Routing (Phase 6.5D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 27. /applications is protected
  it('27. redirects unauthenticated user from /applications to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/applications']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Should redirect to /login and render login form
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByTestId('applications-page')).not.toBeInTheDocument();
  });

  // 28. /applications/:id is protected
  it('28. redirects unauthenticated user from /applications/:id to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/applications/507f1f77bcf86cd799439011']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.queryByTestId('application-details-page')).not.toBeInTheDocument();
  });

  // 29. Application navigation works in Sidebar
  it('29. renders Applications page when authenticated and navigated from sidebar', async () => {
    const user = userEvent.setup();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr-1', name: 'Taylor Swift', email: 'taylor@example.com' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoggingOut: false,
    });

    applicationService.getApplications.mockResolvedValue({
      data: {
        success: true,
        data: [],
        meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Initial page is Design System Demo
    expect(screen.getByRole('heading', { name: /Design System & UI Foundation/i })).toBeInTheDocument();

    // Click "Applications" link in navigation
    const appsNavLink = screen.getByRole('link', { name: /Applications/i });
    expect(appsNavLink).toBeInTheDocument();

    await user.click(appsNavLink);

    // Should navigate to /applications and render ApplicationsPage
    expect(await screen.findByTestId('applications-page')).toBeInTheDocument();
    expect(screen.getByText('Add Application')).toBeInTheDocument();
  });
});
