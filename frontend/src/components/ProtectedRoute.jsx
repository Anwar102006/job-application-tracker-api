import PropTypes from 'prop-types';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingIndicator } from './atoms/LoadingIndicator';

/**
 * Protected Route Guard (Phase 6.5B)
 *
 * Secures routes requiring active session authentication:
 * - Shows loading state during initial session check.
 * - Redirects unauthenticated users to /login preserving intended destination in state.
 * - Renders protected children or nested <Outlet /> when authenticated.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
          padding: '2rem',
        }}
        data-testid="protected-route-loading"
      >
        <LoadingIndicator message="Verifying session..." size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node,
};

export default ProtectedRoute;
