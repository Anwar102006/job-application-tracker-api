import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RegisterPage } from '../RegisterPage';
import { AuthContext } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import toast from 'react-hot-toast';

vi.mock('../../services/authService');
vi.mock('react-hot-toast');

describe('RegisterPage Component (Phase 6.5C)', () => {
  const renderRegisterPage = (contextOverrides = {}) => {
    const defaultContext = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      clearAuth: vi.fn(),
      setUser: vi.fn(),
      ...contextOverrides,
    };

    return render(
      <AuthContext.Provider value={defaultContext}>
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario 6: Register renders
  it('6. renders register form with branding and input fields', () => {
    renderRegisterPage();

    expect(screen.getByRole('heading', { name: /careerpulse/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/professional headline/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByLabelText(/target role/i, { selector: 'input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  // Scenario 7: Register validation
  it('7. validates required fields, email format, and password length', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/^password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please confirm your password/i)).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();

    // Test password min length
    await user.type(screen.getByLabelText(/full name/i, { selector: 'input' }), 'Jane Doe');
    await user.type(screen.getByLabelText(/email address/i, { selector: 'input' }), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'short');
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Test password mismatch
    await user.clear(screen.getByLabelText(/^password/i, { selector: 'input' }));
    await user.clear(screen.getByLabelText(/confirm password/i, { selector: 'input' }));
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'Password999!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  // Scenario 8: confirmPassword is NOT sent
  it('8. strictly does NOT send confirmPassword to authService.register', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValueOnce({
      status: 201,
      data: {
        success: true,
        data: { id: 'usr-new', name: 'Jane Doe', email: 'jane@example.com' },
      },
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i, { selector: 'input' }), 'Jane Doe');
    await user.type(screen.getByLabelText(/email address/i, { selector: 'input' }), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'SecurePass123!');
    await user.type(screen.getByLabelText(/professional headline/i, { selector: 'input' }), 'Lead Architect');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    const sentPayload = authService.register.mock.calls[0][0];
    expect(sentPayload).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecurePass123!',
      headline: 'Lead Architect',
    });
    expect(sentPayload).not.toHaveProperty('confirmPassword');
    expect(sentPayload).not.toHaveProperty('confirmNewPassword');
  });

  // Scenario 9: Successful registration redirects to login
  it('9. notifies user on success and redirects to /login', async () => {
    const user = userEvent.setup();
    authService.register.mockResolvedValueOnce({
      status: 201,
      data: {
        success: true,
        data: { id: 'usr-new', name: 'Jane Doe', email: 'jane@example.com' },
      },
    });

    renderRegisterPage();

    await user.type(screen.getByLabelText(/full name/i, { selector: 'input' }), 'Jane Doe');
    await user.type(screen.getByLabelText(/email address/i, { selector: 'input' }), 'jane@example.com');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'SecurePass123!');
    await user.type(screen.getByLabelText(/confirm password/i, { selector: 'input' }), 'SecurePass123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account created successfully! Please sign in.');
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  // Scenario 10 (Register variant): Authenticated user redirected away
  it('10. redirects authenticated user away from register page', () => {
    renderRegisterPage({
      isAuthenticated: true,
      user: { id: 'usr-1', name: 'Existing User' },
    });

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i, { selector: 'input' })).not.toBeInTheDocument();
  });
});
