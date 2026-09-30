import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Sidebar } from '../Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

describe('Navbar and Sidebar Layout Integration (Phase 6.5C)', () => {
  const mockLogout = vi.fn();

  const mockUser = {
    id: 'usr-1',
    name: 'Taylor Swift',
    email: 'taylor@example.com',
  };

  const renderLayout = (contextOverrides = {}, initialEntries = ['/']) => {
    const defaultContext = {
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isLoggingOut: false,
      login: vi.fn(),
      logout: mockLogout,
      clearAuth: vi.fn(),
      setUser: vi.fn(),
      ...contextOverrides,
    };

    return render(
      <AuthContext.Provider value={defaultContext}>
        <MemoryRouter initialEntries={initialEntries}>
          <Navbar
            onToggleSidebar={vi.fn()}
            isDarkTheme={false}
            onToggleTheme={vi.fn()}
          />
          <Sidebar isOpen={true} onClose={vi.fn()} />
          <Routes>
            <Route path="/" element={<div data-testid="page-home">Home</div>} />
            <Route path="/profile" element={<div data-testid="page-profile">Profile</div>} />
            <Route path="/login" element={<div data-testid="page-login">Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario 21: Navbar authenticated state
  it('21. displays user initials, name, email, profile link, and logout button when authenticated', () => {
    renderLayout();

    expect(screen.getByTestId('navbar-user-avatar')).toHaveTextContent('T');
    expect(screen.getByTestId('navbar-user-name')).toHaveTextContent('Taylor Swift');
    expect(screen.getByTestId('navbar-user-email')).toHaveTextContent('taylor@example.com');
    expect(screen.getByLabelText(/user profile/i)).toHaveAttribute('href', '/profile');
    expect(screen.getByTestId('navbar-logout-btn')).toBeInTheDocument();
  });

  // Scenario 22: Logout action
  it('22. triggers logout action when clicking navbar logout button', async () => {
    const user = userEvent.setup();
    renderLayout();

    const logoutBtn = screen.getByTestId('navbar-logout-btn');
    await user.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  // Scenario 23: Sidebar profile navigation
  it('23. renders Profile & Settings in sidebar with active state on /profile', () => {
    renderLayout({}, ['/profile']);

    const profileLink = screen.getByRole('link', { name: /profile & settings/i });
    expect(profileLink).toHaveAttribute('href', '/profile');
    expect(profileLink).toHaveAttribute('aria-current', 'page');
  });

  // Scenario 24: Logout loading/disabled state
  it('24. disables logout buttons and shows loading state while logout is in progress', () => {
    renderLayout({
      isLoggingOut: true,
    });

    const navbarLogout = screen.getByTestId('navbar-logout-btn');
    expect(navbarLogout).toBeDisabled();
    expect(navbarLogout).toHaveAttribute('aria-busy', 'true');

    const sidebarLogout = screen.getByTestId('sidebar-logout-btn');
    expect(sidebarLogout).toBeDisabled();
    expect(sidebarLogout).toHaveAttribute('aria-busy', 'true');
  });

  // Scenario 19 & 20: Protected route redirects unauthenticated user & preserves destination
  it('19 & 20. redirects unauthenticated user and preserves intended route in state', () => {
    const LocationWatcher = () => {
      const location = useLocation();
      return (
        <div>
          <div data-testid="current-path">{location.pathname}</div>
          <div data-testid="preserved-path">{location.state?.from?.pathname || 'none'}</div>
        </div>
      );
    };

    render(
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          isLoading: false,
          user: null,
        }}
      >
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <div>Secret Profile Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LocationWatcher />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent('/login');
    expect(screen.getByTestId('preserved-path')).toHaveTextContent('/profile');
    expect(screen.queryByText('Secret Profile Content')).not.toBeInTheDocument();
  });
});
