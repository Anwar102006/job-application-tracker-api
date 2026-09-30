import { apiClient } from './apiClient';

/**
 * User Service (Phase 6.5C)
 * Interacts with /users endpoints strictly following the locked backend contract.
 */

/**
 * Fetch current authenticated user's profile
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getCurrentUser = async () => {
  return apiClient.get('/users/me');
};

/**
 * Update authenticated user's profile
 * Only name, headline, and targetRole are allowed by the backend schema.
 * @param {Object} data - Profile update payload
 * @param {string} [data.name] - User name
 * @param {string} [data.headline] - Professional headline
 * @param {string} [data.targetRole] - Target job role
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const updateProfile = async (data = {}) => {
  const payload = {};

  if (data.name !== undefined && data.name !== null) {
    payload.name = String(data.name).trim();
  }

  if (data.headline !== undefined && data.headline !== null) {
    payload.headline = String(data.headline).trim();
  }

  if (data.targetRole !== undefined && data.targetRole !== null) {
    payload.targetRole = String(data.targetRole).trim();
  }

  return apiClient.patch('/users/me', payload);
};

/**
 * Change authenticated user's password
 * Backend requires currentPassword and newPassword, and invalidates all refresh tokens on success.
 * @param {Object} params
 * @param {string} params.currentPassword - Current password
 * @param {string} params.newPassword - New password (must be different from current)
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const changePassword = async ({ currentPassword, newPassword }) => {
  return apiClient.patch('/users/change-password', {
    currentPassword,
    newPassword,
  });
};

export default {
  getCurrentUser,
  updateProfile,
  changePassword,
};
