import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { setAccessToken, getAccessToken, clearAccessToken } from '../../services/tokenStore';
import { refreshClient } from '../../services/apiClient';
import { _resetCoordinatorState } from '../../services/refreshCoordinator';
import { emitSessionExpired } from '../../services/authEvents';
import { REFRESH_TOKEN_KEY } from '../../constants/auth.constants';

// Test consumer component
const TestConsumer = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading-status">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-id">{user?.id || 'none'}</div>
      <button
        onClick={() =>
          login({
            user: { id: 'usr-123', name: 'Alice' },
            accessToken: 'test.access.token',
            refreshToken: 'test-refresh-token',
          })
        }
      >
        Login
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    _resetCoordinatorState();
    clearAccessToken();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    _resetCoordinatorState();
    clearAccessToken();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders in unauthenticated state when no refresh token is stored', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('none');
    expect(getAccessToken()).toBeNull();
  });

  it('initializes session when a stored refresh token is present in localStorage', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'valid-persisted-refresh-token');

    // Create a mock JWT with sub claim: base64 for '{"sub":"usr-999","role":"admin"}'
    const payload = btoa(JSON.stringify({ sub: 'usr-999', role: 'admin' }));
    const mockJwt = `header.${payload}.signature`;

    vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: mockJwt,
          refreshToken: 'rotated-refresh-token',
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('usr-999');
    expect(getAccessToken()).toBe(mockJwt);
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rotated-refresh-token');
  });

  it('clears session when session initialization refresh fails', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'stale-refresh-token');
    setAccessToken('old-access-token');

    vi.spyOn(refreshClient, 'post').mockRejectedValueOnce(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('updates state and token storage on login()', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    act(() => {
      screen.getByText('Login').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('usr-123');
    expect(getAccessToken()).toBe('test.access.token');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('test-refresh-token');
  });

  it('clears state, tokenStore, and localStorage on logout()', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'active-refresh-token');
    setAccessToken('active-access-token');

    const logoutSpy = vi.spyOn(refreshClient, 'post').mockImplementation((url) => {
      if (url === '/auth/logout') {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({
        data: {
          success: true,
          data: { accessToken: 'active-access-token' },
        },
      });
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(logoutSpy).toHaveBeenCalledWith('/auth/logout', {
      refreshToken: 'active-refresh-token',
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it('cleans up session when session-expired event is emitted', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    });

    // Simulate login first
    act(() => {
      screen.getByText('Login').click();
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');

    // Simulate session expired event
    act(() => {
      emitSessionExpired();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
