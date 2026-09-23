/**
 * Error Handling Utility (Phase 6.5B)
 *
 * Extracts clean, user-friendly messages from the backend ApiError envelope:
 * { success: false, message: string, error?: { code, details } }
 *
 * Prevents raw Axios error objects from leaking to the UI.
 */

/**
 * Extract human-readable error message from Axios response or fallback
 * @param {any} error - The caught error
 * @param {string} fallbackMessage - Default fallback when no specific message is found
 * @returns {string} Clean error message
 */
export const getErrorMessage = (error, fallbackMessage = 'An unexpected error occurred.') => {
  if (!error) return fallbackMessage;

  // Check if error is an Axios error with response data envelope
  if (error.response?.data) {
    const data = error.response.data;

    // Standard backend message
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message.trim();
    }

    // Direct string error
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim();
    }

    // Nested error object
    if (data.error?.message && typeof data.error.message === 'string') {
      return data.error.message.trim();
    }
  }

  // Standard Error instance message (excluding raw HTTP status codes)
  if (error.message && typeof error.message === 'string' && !error.message.startsWith('Request failed with status code')) {
    return error.message;
  }

  return fallbackMessage;
};
