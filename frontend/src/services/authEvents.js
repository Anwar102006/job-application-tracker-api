/**
 * Auth Events Bus (Phase 6.5B)
 *
 * Minimal, deterministic pub/sub event mechanism for cross-boundary authentication state changes.
 * Zero external libraries.
 */

const sessionExpiredListeners = new Set();

/**
 * Emit a session-expired event to all active subscribers.
 * Invoked when refresh token is invalid/expired, triggering AuthContext cleanup.
 */
export const emitSessionExpired = () => {
  sessionExpiredListeners.forEach((callback) => {
    try {
      callback();
    } catch {
      // Isolate listener errors so all subscribers receive the notification
    }
  });
};

/**
 * Subscribe to session-expired notifications.
 * @param {Function} callback - Function invoked on session expiration
 * @returns {Function} Unsubscribe function to clean up listener
 */
export const onSessionExpired = (callback) => {
  if (typeof callback === 'function') {
    sessionExpiredListeners.add(callback);
  }
  return () => {
    sessionExpiredListeners.delete(callback);
  };
};

/**
 * Reset all active listeners (primarily for test teardown)
 */
export const clearAuthEventListeners = () => {
  sessionExpiredListeners.clear();
};
