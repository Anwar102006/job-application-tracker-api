/**
 * In-Memory Access Token Store (Phase 6.5B)
 *
 * Architecture & Security Guarantees:
 * - Access tokens (JWT) are stored STRICTLY in module-level memory (closure).
 * - NEVER persisted to localStorage, sessionStorage, cookies, or IndexedDB.
 * - Does not use React hooks (safe for pure JS services and Axios interceptors).
 * - Does NOT store refresh tokens (refresh tokens live in localStorage per architecture).
 */

let inMemoryAccessToken = null;

/**
 * Synchronously retrieve the current in-memory access token
 * @returns {string|null} The active JWT access token or null
 */
export const getAccessToken = () => inMemoryAccessToken;

/**
 * Update the in-memory access token
 * @param {string|null} token - The fresh JWT access token
 */
export const setAccessToken = (token) => {
  inMemoryAccessToken = token || null;
};

/**
 * Clear the in-memory access token on logout or session expiration
 */
export const clearAccessToken = () => {
  inMemoryAccessToken = null;
};
