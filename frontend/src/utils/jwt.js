/**
 * Client-side JWT Payload Decoder (Phase 6.5B)
 *
 * Lightweight, dependency-free decoder for standard JWT payloads.
 * Only decodes payload claims (e.g. sub, role); does not verify signature (verification is server-side).
 */

/**
 * Parse and decode JWT claims from base64url payload
 * @param {string} token - The raw JWT string
 * @returns {Object|null} Decoded JSON claims or null if invalid
 */
export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};
