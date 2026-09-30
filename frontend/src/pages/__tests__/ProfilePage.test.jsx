import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProfilePage } from '../ProfilePage';
import { AuthContext } from '../../context/AuthContext';
import * as userService from '../../services/userService';
import toast from 'react-hot-toast';

vi.mock('../../services/userService');
vi.mock('react-hot-toast');

describe('ProfilePage Component (Phase 6.5C)', () => {
  const mockClearAuth = vi.fn();
  const mockSetUser = vi.fn();

  const mockUser = {
    id: 'usr-42',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    headline: 'Senior Full Stack Engineer',
    targetRole: 'Engineering Manager',
  };

  const renderProfilePage = (contextOverrides = {}) => {
    const defaultContext = {
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      isLoggingOut: false,
      login: vi.fn(),
      logout: vi.fn(),
      clearAuth: mockClearAuth,
      setUser: mockSetUser,
      ...contextOverrides,
    };

    return render(
      <AuthContext.Provider value={defaultContext}>
        <MemoryRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario 11: Profile loads current user
  it('11. loads and displays current user details with read-only email', async () => {
    userService.getCurrentUser.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockUser,
      },
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i, { selector: 'input' })).toHaveValue('alex@example.com');
      expect(screen.getByLabelText(/email address/i, { selector: 'input' })).toHaveAttribute('readonly');
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i, { selector: 'input' })).toHaveValue('Alex Morgan');
      expect(screen.getByLabelText(/professional headline/i, { selector: 'input' })).toHaveValue('Senior Full Stack Engineer');
      expect(screen.getByLabelText(/target role/i, { selector: 'input' })).toHaveValue('Engineering Manager');
    });
  });

  // Scenario 12: Profile loading state
  it('12. displays loading indicator while profile details are being retrieved', () => {
    userService.getCurrentUser.mockReturnValueOnce(new Promise(() => {}));

    renderProfilePage();

    expect(screen.getByText(/loading profile\.\.\./i)).toBeInTheDocument();
  });

  // Scenario 13: Profile update success
  it('13. successfully updates profile without sending email, updates context and notifies', async () => {
    const user = userEvent.setup();
    userService.getCurrentUser.mockResolvedValueOnce({
      data: { success: true, data: mockUser },
    });

    const updatedUser = {
      ...mockUser,
      name: 'Alex Morgan PhD',
      headline: 'Principal Engineer',
    };

    userService.updateProfile.mockResolvedValueOnce({
      data: { success: true, data: updatedUser },
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i, { selector: 'input' })).toHaveValue('Alex Morgan');
    });

    await user.clear(screen.getByLabelText(/full name/i, { selector: 'input' }));
    await user.type(screen.getByLabelText(/full name/i, { selector: 'input' }), 'Alex Morgan PhD');
    await user.clear(screen.getByLabelText(/professional headline/i, { selector: 'input' }));
    await user.type(screen.getByLabelText(/professional headline/i, { selector: 'input' }), 'Principal Engineer');

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(userService.updateProfile).toHaveBeenCalledTimes(1);
    });

    const sentPayload = userService.updateProfile.mock.calls[0][0];
    expect(sentPayload).toEqual({
      name: 'Alex Morgan PhD',
      headline: 'Principal Engineer',
      targetRole: 'Engineering Manager',
    });
    // Critical: email MUST NEVER be sent
    expect(sentPayload).not.toHaveProperty('email');
    expect(mockSetUser).toHaveBeenCalledWith(updatedUser);
    expect(toast.success).toHaveBeenCalledWith('Profile updated successfully!');
  });

  // Scenario 14: Profile backend validation error
  it('14. handles backend field validation errors on profile update', async () => {
    const user = userEvent.setup();
    userService.getCurrentUser.mockResolvedValueOnce({
      data: { success: true, data: mockUser },
    });

    const backendError = {
      response: {
        status: 400,
        data: {
          success: false,
          errors: [
            { field: 'body.name', message: 'Name must not contain numbers' },
          ],
        },
      },
    };

    userService.updateProfile.mockRejectedValueOnce(backendError);

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i, { selector: 'input' })).toHaveValue('Alex Morgan');
    });

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    await waitFor(() => {
      expect(screen.getByText('Name must not contain numbers')).toBeInTheDocument();
    });
  });

  // Scenario 15: Password validation
  it('15. validates password required fields and minimum length', async () => {
    const user = userEvent.setup();
    userService.getCurrentUser.mockResolvedValueOnce({
      data: { success: true, data: mockUser },
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/^new password is required/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm new password is required/i)).toBeInTheDocument();

    // Test min length
    await user.type(screen.getByLabelText(/current password/i, { selector: 'input' }), 'OldPass123!');
    await user.type(screen.getByLabelText(/^new password/i, { selector: 'input' }), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), 'short');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(screen.getByText(/new password must be at least 8 characters/i)).toBeInTheDocument();
  });

  // Scenario 16: Password mismatch
  it('16. validates that confirm password must match new password', async () => {
    const user = userEvent.setup();
    userService.getCurrentUser.mockResolvedValueOnce({
      data: { success: true, data: mockUser },
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/current password/i, { selector: 'input' }), 'OldPass123!');
    await user.type(screen.getByLabelText(/^new password/i, { selector: 'input' }), 'NewStrongPassword123!');
    await user.type(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), 'DifferentPassword999!');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(userService.changePassword).not.toHaveBeenCalled();
  });

  // Scenario 17 & 18: Successful password change clears auth and redirects to login
  it('17 & 18. clears authentication, notifies user, and navigates to /login on successful password change', async () => {
    const user = userEvent.setup();
    userService.getCurrentUser.mockResolvedValueOnce({
      data: { success: true, data: mockUser },
    });

    userService.changePassword.mockResolvedValueOnce({
      data: { success: true, message: 'Password changed successfully.' },
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/current password/i, { selector: 'input' }), 'OldPass123!');
    await user.type(screen.getByLabelText(/^new password/i, { selector: 'input' }), 'BrandNewPassword123!');
    await user.type(screen.getByLabelText(/confirm new password/i, { selector: 'input' }), 'BrandNewPassword123!');
    await user.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => {
      expect(userService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass123!',
        newPassword: 'BrandNewPassword123!',
      });
      expect(mockClearAuth).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        'Password changed successfully. Please log in with your new password.'
      );
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});
