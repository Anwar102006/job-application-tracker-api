import axios from 'axios';
import { getAccessToken } from './tokenStore';
import { refreshClient, refreshAccessToken } from './refreshCoordinator';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Primary Application API Client
 * Used for all authenticated and general application requests.
 */
export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Re-export isolated refreshClient for backwards compatibility
export { refreshClient };

// Request Interceptor: Synchronously inject in-memory JWT access token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 Concurrency Management State within apiClient
let isRefreshing = false;
let failedQueue = [];

/**
 * Process the queue of concurrent apiClient requests waiting for refresh resolution
 * @param {Error|null} error - Error if refresh failed, rejecting all queued promises
 * @param {string|null} token - Fresh access token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      apiClient(config)
        .then(resolve)
        .catch(reject);
    }
  });
  failedQueue = [];
};

// Response Interceptor: 401 handling with concurrency control and anti-loop guards
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Reject non-401 errors, requests without config, or responses missing
    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Do NOT attempt token refresh for authentication endpoints (login, register, refresh)
    const requestUrl = originalRequest.url || '';
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh-token')
    ) {
      return Promise.reject(error);
    }

    // Rule A: If config._retry is already true, reject immediately (prevent infinite retry loops)
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Rule C: If another request is currently refreshing the token in apiClient, enqueue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    // Rule B: First 401 request encountered in apiClient - mark retry and coordinate through refreshCoordinator
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Delegate to the single shared refresh coordinator across the entire application
      const newAccessToken = await refreshAccessToken();

      // Update original request headers and retry
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Resolve all queued requests with new token
      processQueue(null, newAccessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failure: reject all queued requests in apiClient
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Internal helper to reset module refresh state (for test isolation)
 */
export const _resetRefreshState = () => {
  isRefreshing = false;
  failedQueue = [];
};

/**
 * Internal helper to check queue length (for test assertions)
 */
export const _getFailedQueueLength = () => failedQueue.length;

export default apiClient;
