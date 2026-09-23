/* global localStorage */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, refreshClient, _resetRefreshState } from '../apiClient';
import { _resetCoordinatorState } from '../refreshCoordinator';
import { setAccessToken, getAccessToken, clearAccessToken } from '../tokenStore';
import * as authEvents from '../authEvents';
import { REFRESH_TOKEN_KEY } from '../../constants/auth.constants';

describe('apiClient & Authentication Transport Architecture', () => {
  let originalApiClientAdapter;

  beforeEach(() => {
    _resetRefreshState();
    _resetCoordinatorState();
    clearAccessToken();
    localStorage.clear();
    vi.restoreAllMocks();

    originalApiClientAdapter = apiClient.defaults.adapter;
    // Default mock adapter to prevent jsdom unhandled network errors
    apiClient.defaults.adapter = vi.fn().mockImplementation((config) => {
      return Promise.resolve({
        data: { success: true, url: config.url },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
    });
  });

  afterEach(() => {
    _resetRefreshState();
    _resetCoordinatorState();
    clearAccessToken();
    localStorage.clear();
    apiClient.defaults.adapter = originalApiClientAdapter;
    vi.restoreAllMocks();
  });

  describe('Request Interceptor', () => {
    it('attaches Bearer authorization header when access token is present', async () => {
      setAccessToken('test-jwt-token-123');

      const config = { headers: {} };
      const interceptedConfig = await apiClient.interceptors.request.handlers[0].fulfilled(config);

      expect(interceptedConfig.headers.Authorization).toBe('Bearer test-jwt-token-123');
    });

    it('does NOT attach Authorization header when tokenStore has no token', async () => {
      clearAccessToken();

      const config = { headers: {} };
      const interceptedConfig = await apiClient.interceptors.request.handlers[0].fulfilled(config);

      expect(interceptedConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('Refresh Client Isolation', () => {
    it('does NOT have any response interceptors attached (prevents recursive loops)', () => {
      expect(refreshClient.interceptors.response.handlers.length).toBe(0);
    });

    it('has identical base URL and timeout settings as apiClient', () => {
      expect(refreshClient.defaults.baseURL).toBe(apiClient.defaults.baseURL);
      expect(refreshClient.defaults.timeout).toBe(apiClient.defaults.timeout);
    });
  });

  describe('401 Refresh Handling & Concurrency Queue', () => {
    it('bypasses refresh flow for authentication endpoints (/auth/login, /auth/register, /auth/refresh-token)', async () => {
      const error = {
        config: { url: '/auth/login', headers: {} },
        response: { status: 401 },
      };

      const refreshSpy = vi.spyOn(refreshClient, 'post');

      await expect(
        apiClient.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);

      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('immediately rejects if config._retry is already true (anti-infinite-loop guard)', async () => {
      const error = {
        config: { url: '/applications', headers: {}, _retry: true },
        response: { status: 401 },
      };

      const refreshSpy = vi.spyOn(refreshClient, 'post');

      await expect(
        apiClient.interceptors.response.handlers[0].rejected(error)
      ).rejects.toEqual(error);

      expect(refreshSpy).not.toHaveBeenCalled();
    });

    it('teardowns session and emits session-expired when 401 occurs and no refreshToken is in localStorage', async () => {
      const emitSpy = vi.spyOn(authEvents, 'emitSessionExpired');
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setAccessToken('expired-access-token');

      const error = {
        config: { url: '/applications', headers: {} },
        response: { status: 401 },
      };

      await expect(
        apiClient.interceptors.response.handlers[0].rejected(error)
      ).rejects.toThrow('No refresh token available');

      expect(getAccessToken()).toBeNull();
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('triggers exactly one refresh call and retries original request with new token on refresh success', async () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, 'valid-refresh-token');

      const refreshSpy = vi.spyOn(refreshClient, 'post').mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            accessToken: 'new-rotated-access-token',
            refreshToken: 'new-rotated-refresh-token',
          },
        },
      });

      const error = {
        config: { url: '/applications', headers: {} },
        response: { status: 401 },
      };

      const responsePromise = apiClient.interceptors.response.handlers[0].rejected(error);
      const result = await responsePromise;

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(refreshSpy).toHaveBeenCalledWith('/auth/refresh-token', {
        refreshToken: 'valid-refresh-token',
      });
      expect(getAccessToken()).toBe('new-rotated-access-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('new-rotated-refresh-token');
      expect(error.config.headers.Authorization).toBe('Bearer new-rotated-access-token');
      expect(result.data.url).toBe('/applications');
    });

    it('shares a single refresh request among concurrent 401 requests and retries all queued requests', async () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, 'valid-refresh-token');

      let resolveRefresh;
      const refreshDeferred = new Promise((resolve) => {
        resolveRefresh = resolve;
      });

      const refreshSpy = vi.spyOn(refreshClient, 'post').mockReturnValueOnce(refreshDeferred);

      const error1 = {
        config: { url: '/applications', headers: {} },
        response: { status: 401 },
      };
      const error2 = {
        config: { url: '/analytics/overview', headers: {} },
        response: { status: 401 },
      };
      const error3 = {
        config: { url: '/users/me', headers: {} },
        response: { status: 401 },
      };

      // Trigger first 401 (initiates refresh)
      const p1 = apiClient.interceptors.response.handlers[0].rejected(error1);
      // Trigger concurrent 401s while refresh is in flight (joins queue)
      const p2 = apiClient.interceptors.response.handlers[0].rejected(error2);
      const p3 = apiClient.interceptors.response.handlers[0].rejected(error3);

      expect(refreshSpy).toHaveBeenCalledTimes(1);

      // Now resolve the single in-flight refresh call
      resolveRefresh({
        data: {
          success: true,
          data: {
            accessToken: 'shared-new-access-token',
            refreshToken: 'shared-new-refresh-token',
          },
        },
      });

      const [res1, res2, res3] = await Promise.all([p1, p2, p3]);

      expect(refreshSpy).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe('shared-new-access-token');
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe('shared-new-refresh-token');
      expect(error1.config.headers.Authorization).toBe('Bearer shared-new-access-token');
      expect(error2.config.headers.Authorization).toBe('Bearer shared-new-access-token');
      expect(error3.config.headers.Authorization).toBe('Bearer shared-new-access-token');
      expect(res1.data.url).toBe('/applications');
      expect(res2.data.url).toBe('/analytics/overview');
      expect(res3.data.url).toBe('/users/me');
    });

    it('rejects all queued requests, clears tokens, and emits session-expired when refresh fails', async () => {
      localStorage.setItem(REFRESH_TOKEN_KEY, 'invalid-or-revoked-token');
      setAccessToken('stale-access-token');

      const emitSpy = vi.spyOn(authEvents, 'emitSessionExpired');
      const refreshError = new Error('Refresh token revoked');

      let rejectRefresh;
      const refreshDeferred = new Promise((_, reject) => {
        rejectRefresh = reject;
      });

      vi.spyOn(refreshClient, 'post').mockReturnValueOnce(refreshDeferred);

      const error1 = {
        config: { url: '/applications', headers: {} },
        response: { status: 401 },
      };
      const error2 = {
        config: { url: '/analytics/overview', headers: {} },
        response: { status: 401 },
      };

      const p1 = apiClient.interceptors.response.handlers[0].rejected(error1);
      const p2 = apiClient.interceptors.response.handlers[0].rejected(error2);

      rejectRefresh(refreshError);

      await expect(p1).rejects.toEqual(refreshError);
      await expect(p2).rejects.toEqual(refreshError);

      expect(getAccessToken()).toBeNull();
      expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });
});
