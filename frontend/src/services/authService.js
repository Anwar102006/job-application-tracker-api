import { apiClient, refreshClient } from './apiClient';

/**
 * Authentication Service (Phase 6.5C)
 * Interacts with /auth endpoints strictly following the locked backend contract.
 */

/**
 * Register a new user account
 * @param {Object} params - Registration fields
 * @param {string} params.name - User's full name (2-50 characters)
 * @param {string} params.email - Valid email address
 * @param {string} params.password - Password (min 8 characters)
 * @param {string} [params.headline] - Professional headline (max 100 characters)
 * @param {string} [params.targetRole] - Target job role (max 100 characters)
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const register = async ({ name, email, password, headline, targetRole }) => {
  const payload = {
    name: name?.trim(),
    email: email?.trim().toLowerCase(),
    password,
  };

  if (headline !== undefined && headline !== null && String(headline).trim()) {
    payload.headline = String(headline).trim();
  }

  if (targetRole !== undefined && targetRole !== null && String(targetRole).trim()) {
    payload.targetRole = String(targetRole).trim();
  }

  return apiClient.post('/auth/register', payload);
};

/**
 * Login user with email and password
 * @param {Object} credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const login = async ({ email, password }) => {
  return apiClient.post('/auth/login', {
    email: email?.trim().toLowerCase(),
    password,
  });
};

/**
 * Revoke refresh token and logout on backend
 * CRITICAL ARCHITECTURE RULE:
 * Uses refreshClient (isolated client without 401 interceptors) to prevent recursive loops.
 * @param {string} refreshToken
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const logout = async (refreshToken) => {
  return refreshClient.post('/auth/logout', { refreshToken });
};

export default {
  register,
  login,
  logout,
};
