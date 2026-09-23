import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getAccessToken, setAccessToken, clearAccessToken } from '../services/tokenStore';
import { refreshClient } from '../services/apiClient';
import { refreshAccessToken } from '../services/refreshCoordinator';
import { onSessionExpired } from '../services/authEvents';
import { REFRESH_TOKEN_KEY } from '../constants/auth.constants';
import { parseJwt } from '../utils/jwt';

export const AuthContext = createContext(null);

/**
 * Authentication Context Provider (Phase 6.5B)
 *
 * Core Architectural Invariants:
 * 1. The in-memory tokenStore is the ONLY authoritative source of the access token.
 * 2. React state never stores or duplicates the raw JWT access token.
 * 3. Handles session initialization on browser reload via global refreshCoordinator.
 * 4. Listens for cross-cutting session-expired events from refreshCoordinator/apiClient.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated state is derived from presence of active user and in-memory access token
  const isAuthenticated = useMemo(() => {
    return Boolean(user && getAccessToken());
  }, [user]);

  /**
   * Complete login session following successful authentication call
   * @param {Object} authPayload - Contains { user, accessToken, refreshToken }
   */
  const handleLoginSuccess = useCallback((authPayload) => {
    if (!authPayload) return;

    const { user: userData, accessToken, refreshToken } = authPayload;

    if (accessToken) {
      setAccessToken(accessToken);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (userData) {
      setUser(userData);
    } else if (accessToken) {
      const claims = parseJwt(accessToken);
      if (claims?.sub) {
        setUser({ id: claims.sub, role: claims.role || 'user' });
      }
    }
  }, []);

  /**
   * Log out current user: revoke server-side refresh token and clear local session
   */
  const logout = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (storedRefreshToken) {
        await refreshClient.post('/auth/logout', { refreshToken: storedRefreshToken });
      }
    } catch {
      // Logout is designed to be idempotent; local teardown always proceeds
    } finally {
      clearAccessToken();
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  /**
   * App boot session initialization:
   * Restores session if a valid refreshToken exists in localStorage via global refreshCoordinator
   */
  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedRefreshToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const accessToken = await refreshAccessToken();

        if (!isMounted) return;

        if (accessToken) {
          const claims = parseJwt(accessToken);
          setUser({
            id: claims?.sub || 'user',
            role: claims?.role || 'user',
          });
        } else {
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    // Subscribe to session-expired notifications from apiClient
    const unsubscribe = onSessionExpired(() => {
      if (isMounted) {
        clearAccessToken();
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login: handleLoginSuccess,
      logout,
      setUser,
    }),
    [user, isAuthenticated, isLoading, handleLoginSuccess, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to consume authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
