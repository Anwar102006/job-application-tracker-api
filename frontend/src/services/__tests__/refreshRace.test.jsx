/* global localStorage */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { apiClient, refreshClient, _resetRefreshState } from '../apiClient';
import { _resetCoordinatorState } from '../refreshCoordinator';
import { getAccessToken, clearAccessToken } from '../tokenStore';
import * as authEvents from '../authEvents';
import { REFRESH_TOKEN_KEY } from '../../constants/auth.constants';

// Test harness component that triggers an API call upon mounting
const RaceTestConsumer = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="auth-loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'unauthenticated'}</div>
      <div data-testid="user-id">{user?.id || 'none'}</div>
    </div>
  );
};

describe('Cross-Boundary Concurrency Race (AuthContext boot + apiClient 401)', () => {
  let originalApiClientAdapter;

  beforeEach(() => {
    _resetRefreshState();
    _resetCoordinatorState();
    clearAccessToken();
    localStorage.clear();
    vi.restoreAllMocks();

    originalApiClientAdapter = apiClient.defaults.adapter;
  });

  afterEach(() => {
    _resetRefreshState();
    _resetCoordinatorState();
    clearAccessToken();
    localStorage.clear();
    apiClient.defaults.adapter = originalApiClientAdapter;
    vi.restoreAllMocks();
  });

  it('proves AuthContext session boot and simultaneous apiClient 401 share exactly ONE refresh request', async () => {
    // 1. Store a valid refresh token in localStorage
    localStorage.setItem(REFRESH_TOKEN_KEY, 'initial-boot-refresh-token');

    let resolveRefreshCall;
    const refreshDeferred = new Promise((resolve) => {
      resolveRefreshCall = resolve;
    });

    // Mock refreshClient.post to hold in-flight
    const refreshSpy = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(refreshDeferred);

    let callCount = 0;
    apiClient.defaults.adapter = vi.fn().mockImplementation((config) => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('Request failed with status code 401');
        error.config = config;
        error.response = { status: 401, data: { message: 'Unauthorized' } };
        return Promise.reject(error);
      }
      return Promise.resolve({
        data: { success: true, data: 'applications-data' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    });

    // 2. Start AuthContext session initialization by mounting the provider
    render(
      <AuthProvider>
        <RaceTestConsumer />
      </AuthProvider>
    );

    // At this moment, AuthContext.initSession has invoked refreshAccessToken()
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-loading')).toHaveTextContent('loading');

    // 3. While refresh is still in flight, trigger an authenticated apiClient request (no token yet)
    const apiCallPromise = apiClient.get('/applications');

    // Yield execution so apiClient dispatches, hits 401, and enters refreshCoordinator while refresh is still in flight
    await new Promise((resolve) => setTimeout(resolve, 20));

    // 4 & 5. Verify that even though apiClient encountered 401, NO SECOND refresh call is sent
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // 6. Resolve the single in-flight refresh operation
    const mockJwt = `header.${btoa(JSON.stringify({ sub: 'usr-boot-race', role: 'engineer' }))}.signature`;
    
    await act(async () => {
      resolveRefreshCall({
        data: {
          success: true,
          data: {
            accessToken: mockJwt,
            refreshToken: 'rotated-boot-refresh-token',
          },
        },
      });
    });

    const apiResponse = await apiCallPromise;

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready');
    });

    // 8. Verify ONLY ONE refresh HTTP request occurred across the entire application
    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith('/auth/refresh-token', {
      refreshToken: 'initial-boot-refresh-token',
    });

    // 9. Verify both callers received resulting state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-id')).toHaveTextContent('usr-boot-race');
    expect(getAccessToken()).toBe(mockJwt);

    // 10. Verify original API request succeeded
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.data.data).toBe('applications-data');

    // 11. Verify the refresh token is rotated exactly once in localStorage
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rotated-boot-refresh-token');
  });

  it('guarantees React StrictMode double-mounting creates only ONE refresh request', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'strictmode-token');

    let resolveRefresh;
    const refreshDeferred = new Promise((resolve) => {
      resolveRefresh = resolve;
    });

    const refreshSpy = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(refreshDeferred);

    // Mount first time
    const { unmount } = render(
      <AuthProvider>
        <RaceTestConsumer />
      </AuthProvider>
    );

    // StrictMode unmounts
    unmount();

    // StrictMode re-mounts second time while refresh is still in flight
    render(
      <AuthProvider>
        <RaceTestConsumer />
      </AuthProvider>
    );

    // MUST have called refreshClient.post EXACTLY ONCE
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    const mockJwt = `header.${btoa(JSON.stringify({ sub: 'usr-strict' }))}.signature`;
    resolveRefresh({
      data: {
        success: true,
        data: {
          accessToken: mockJwt,
          refreshToken: 'strict-rotated-token',
        },
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready');
    });

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('strict-rotated-token');
  });

  it('guarantees concurrent callers share the same failed refresh operation without duplicate requests or duplicate session-expired events', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'stale-boot-token');

    let rejectRefresh;
    const refreshDeferred = new Promise((_, reject) => {
      rejectRefresh = reject;
    });

    const refreshSpy = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(refreshDeferred);
    const sessionExpiredSpy = vi.spyOn(authEvents, 'emitSessionExpired');

    let callCount = 0;
    apiClient.defaults.adapter = vi.fn().mockImplementation((config) => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('Request failed with status code 401');
        error.config = config;
        error.response = { status: 401, data: { message: 'Unauthorized' } };
        return Promise.reject(error);
      }
      return Promise.resolve({ data: { success: true } });
    });

    // 1. AuthContext initiates refresh on boot
    render(
      <AuthProvider>
        <RaceTestConsumer />
      </AuthProvider>
    );

    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // 2. apiClient triggers 401 concurrently
    const apiCallPromise = apiClient.get('/applications');

    // Yield execution to allow 401 to be intercepted
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // 3. Prepare expectation before triggering rejection to ensure rejection handler is attached
    const failureError = new Error('Invalid refresh token');
    const apiCallRejection = expect(apiCallPromise).rejects.toEqual(failureError);

    await act(async () => {
      rejectRefresh(failureError);
    });

    // 4. apiClient call must reject with the failure
    await apiCallRejection;

    // 5. AuthContext must finish loading and be unauthenticated
    await waitFor(() => {
      expect(screen.getByTestId('auth-loading')).toHaveTextContent('ready');
    });
    expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');

    // 6. Refresh token request was sent EXACTLY ONCE
    expect(refreshSpy).toHaveBeenCalledTimes(1);

    // 7. session-expired event was emitted EXACTLY ONCE across the entire failure event
    expect(sessionExpiredSpy).toHaveBeenCalledTimes(1);

    // 8. Storage and in-memory tokens are completely cleaned up
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});

