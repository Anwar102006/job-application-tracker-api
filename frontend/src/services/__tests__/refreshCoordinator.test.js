/* global localStorage */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  refreshAccessToken,
  refreshClient,
  _isRefreshInFlight,
  _resetCoordinatorState,
} from '../refreshCoordinator';
import { getAccessToken, setAccessToken, clearAccessToken } from '../tokenStore';
import * as authEvents from '../authEvents';
import { REFRESH_TOKEN_KEY } from '../../constants/auth.constants';

describe('refreshCoordinator (Global Shared Refresh Mutex)', () => {
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

  it('rejects cleanly if no refresh token is present in localStorage and emits session-expired', async () => {
    const emitSpy = vi.spyOn(authEvents, 'emitSessionExpired');
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    await expect(refreshAccessToken()).rejects.toThrow('No refresh token available');
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(_isRefreshInFlight()).toBe(false);
  });

  it('successfully refreshes token and updates tokenStore with new access token', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'stored-refresh-token');

    const postSpy = vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'fresh-jwt-token-123',
        },
      },
    });

    const token = await refreshAccessToken();

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenCalledWith('/auth/refresh-token', {
      refreshToken: 'stored-refresh-token',
    });
    expect(token).toBe('fresh-jwt-token-123');
    expect(getAccessToken()).toBe('fresh-jwt-token-123');
    expect(_isRefreshInFlight()).toBe(false);
  });

  it('rotates the refresh token in localStorage when backend returns rotated token', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'initial-refresh-token');

    vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          accessToken: 'new-access-jwt',
          refreshToken: 'rotated-refresh-token-456',
        },
      },
    });

    await refreshAccessToken();

    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('rotated-refresh-token-456');
    expect(getAccessToken()).toBe('new-access-jwt');
  });

  it('shares ONE single in-flight Promise among concurrent calls (no duplicate network requests)', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'concurrent-test-token');

    let resolveNetworkCall;
    const networkDeferred = new Promise((resolve) => {
      resolveNetworkCall = resolve;
    });

    const postSpy = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(networkDeferred);

    // Call refresh multiple times concurrently
    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();
    const p3 = refreshAccessToken();

    // Verify all return the identical Promise instance
    expect(p1).toBe(p2);
    expect(p2).toBe(p3);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(_isRefreshInFlight()).toBe(true);

    // Resolve in-flight call
    resolveNetworkCall({
      data: {
        success: true,
        data: {
          accessToken: 'shared-access-token',
          refreshToken: 'shared-rotated-token',
        },
      },
    });

    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);

    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(t1).toBe('shared-access-token');
    expect(t2).toBe('shared-access-token');
    expect(t3).toBe('shared-access-token');
    expect(_isRefreshInFlight()).toBe(false);
  });

  it('resets coordinator state on failure and allows a subsequent refresh to start normally', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'flaky-refresh-token');
    const emitSpy = vi.spyOn(authEvents, 'emitSessionExpired');

    const networkError = new Error('Network error during refresh');
    vi.spyOn(refreshClient, 'post').mockRejectedValueOnce(networkError);

    await expect(refreshAccessToken()).rejects.toThrow('Network error during refresh');

    expect(_isRefreshInFlight()).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(emitSpy).toHaveBeenCalledTimes(1);

    // Second subsequent call should now be able to run afresh
    localStorage.setItem(REFRESH_TOKEN_KEY, 'newly-acquired-token');
    vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: { accessToken: 'recovered-jwt' },
      },
    });

    const recoveredToken = await refreshAccessToken();
    expect(recoveredToken).toBe('recovered-jwt');
    expect(getAccessToken()).toBe('recovered-jwt');
  });

  it('emits session-expired exactly ONCE when concurrent callers share a failed refresh operation', async () => {
    localStorage.setItem(REFRESH_TOKEN_KEY, 'revoked-token');
    setAccessToken('stale-token');
    const emitSpy = vi.spyOn(authEvents, 'emitSessionExpired');

    let rejectNetworkCall;
    const networkDeferred = new Promise((_, reject) => {
      rejectNetworkCall = reject;
    });

    const postSpy = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(networkDeferred);

    const p1 = refreshAccessToken();
    const p2 = refreshAccessToken();
    const p3 = refreshAccessToken();

    expect(postSpy).toHaveBeenCalledTimes(1);

    rejectNetworkCall(new Error('Token revoked'));

    await expect(p1).rejects.toThrow('Token revoked');
    await expect(p2).rejects.toThrow('Token revoked');
    await expect(p3).rejects.toThrow('Token revoked');

    // Crucial: emitSessionExpired must only have fired ONCE for the shared failure event
    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
    expect(_isRefreshInFlight()).toBe(false);
  });
});
