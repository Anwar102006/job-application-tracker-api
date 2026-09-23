/* global localStorage */
import axios from 'axios';
import { setAccessToken, clearAccessToken } from './tokenStore';
import { emitSessionExpired } from './authEvents';
import { REFRESH_TOKEN_KEY } from '../constants/auth.constants';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Dedicated Isolated Refresh Client
 * CRITICAL ARCHITECTURE RULE:
 * This client contains NO response interceptors to prevent recursive refresh loops.
 */
export const refreshClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Module-level shared in-flight refresh Promise
let refreshPromise = null;

/**
 * Global Shared Refresh Coordinator (Phase 6.5B Concurrency Architecture)
 *
 * Core Architectural Invariant:
 * EVERY refresh-token request in the entire frontend MUST go through this coordinator.
 * There is EXACTLY ONE in-flight refresh-token HTTP request active across the application.
 *
 * All concurrent callers (AuthContext boot session, apiClient 401 interceptor, StrictMode effects)
 * receive the identical in-flight Promise and share the exact same network response.
 *
 * @returns {Promise<string>} Resolves with the fresh in-memory access token
 */
export const refreshAccessToken = () => {
  // If a refresh is already in-flight, return the existing shared Promise
  if (refreshPromise) {
    return refreshPromise;
  }

  const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  // If no refresh token exists in localStorage, reject immediately and emit session expiration
  if (!storedRefreshToken) {
    clearAccessToken();
    emitSessionExpired();
    return Promise.reject(new Error('No refresh token available'));
  }

  // Create the single shared in-flight refresh operation
  refreshPromise = refreshClient
    .post('/auth/refresh-token', {
      refreshToken: storedRefreshToken,
    })
    .then((response) => {
      const responseData = response.data?.data || response.data || {};
      const newAccessToken = responseData.accessToken;
      const rotatedRefreshToken = responseData.refreshToken;

      if (!newAccessToken) {
        throw new Error('Refresh response did not contain access token');
      }

      // Authoritative tokenStore update
      setAccessToken(newAccessToken);

      // Rotate stored refresh token in localStorage if backend returned a new one
      if (rotatedRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, rotatedRefreshToken);
      }

      return newAccessToken;
    })
    .catch((error) => {
      // Clear tokens and emit session expired once per refresh failure event
      clearAccessToken();
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      emitSessionExpired();
      throw error;
    })
    .finally(() => {
      // Unconditionally release the mutex so future requests can initiate a new refresh
      refreshPromise = null;
    });

  return refreshPromise;
};

/**
 * Helper to inspect active coordinator promise state (for test assertions)
 */
export const _isRefreshInFlight = () => refreshPromise !== null;

/**
 * Helper to reset coordinator state (for test teardown)
 */
export const _resetCoordinatorState = () => {
  refreshPromise = null;
};
