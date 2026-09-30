/* global localStorage */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { AuthContext } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import toast from 'react-hot-toast';

vi.mock('../../services/authService');
vi.mock('react-hot-toast');

describe('LoginPage Component (Phase 6.5C)', () => {
  const mockLogin = vi.fn();

  const renderLoginPage = (contextOverrides = {}, initialEntries = ['/login']) => {
    const defaultContext = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      login: mockLogin,
      logout: vi.fn(),
      clearAuth: vi.fn(),
      setUser: vi.fn(),
      ...contextOverrides,
    };

    return render(
      <AuthContext.Provider value={defaultContext}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/register" element={<div data-testid="register-page">Register Page</div>} />
            <Route path="/target" element={<div data-testid="target-page">Target Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // Scenario 1: Login renders
  it('1. renders login form with CareerPulse branding, inputs, and controls', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /careerpulse/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /sign in to your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/register');
  });

  // Scenario 2: Login required-field validation
  it('2. validates required fields on submission', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  // Scenario 3: Login invalid email
  it('3. validates email format correctly', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  // Scenario 4: Successful login
  it('4. logs in successfully, notifies user, and navigates to intended location', async () => {
    const user = userEvent.setup();
    const fakeAuthData = {
      user: { id: 'usr-1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'fake-jwt',
      refreshToken: 'fake-refresh',
    };

    authService.login.mockResolvedValueOnce({
      data: {
        success: true,
        data: fakeAuthData,
      },
    });

    renderLoginPage(
      {},
      [{ pathname: '/login', state: { from: { pathname: '/target' } } }]
    );

    await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'SecurePass123!',
      });
      expect(mockLogin).toHaveBeenCalledWith(fakeAuthData);
      expect(toast.success).toHaveBeenCalledWith('Welcome back!');
      expect(screen.getByTestId('target-page')).toBeInTheDocument();
    });
  });

  // Scenario 5: Login backend error
  it('5. handles backend field and general errors cleanly', async () => {
    const user = userEvent.setup();
    const backendError = {
      response: {
        status: 401,
        data: {
          success: false,
          message: 'Invalid credentials provided.',
          errors: [
            { field: 'body.email', message: 'User with this email not found' },
          ],
        },
      },
    };

    authService.login.mockRejectedValueOnce(backendError);

    renderLoginPage();

    await user.type(screen.getByLabelText(/email address/i), 'unknown@example.com');
    await user.type(screen.getByLabelText(/^password/i), 'WrongPass123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials provided.')).toBeInTheDocument();
      expect(screen.getByText('User with this email not found')).toBeInTheDocument();
    });
  });

  // Scenario 10: Authenticated user redirected away from login
  it('10. redirects authenticated user away from login page', () => {
    renderLoginPage({
      isAuthenticated: true,
      user: { id: '1', name: 'Existing User' },
    });

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
  });
});
