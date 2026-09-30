import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu, Sun, Moon, Briefcase, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/atoms';

/**
 * Navbar Layout Component (Phase 6.5C)
 * Header navigation with responsive branding, theme switcher,
 * authenticated user profile badge / logout, and unauthenticated auth links.
 */
export const Navbar = ({ onToggleSidebar, isDarkTheme, onToggleTheme }) => {
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : 'U';

  return (
    <header className="app-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="menu-toggle-btn"
          style={{ padding: '0.5rem' }}
        >
          <Menu size={20} aria-hidden="true" />
        </Button>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
          aria-label="CareerPulse Home"
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-hidden="true"
          >
            <Briefcase size={18} />
          </div>
          <span style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
            CareerPulse
          </span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleTheme}
          aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
          leftIcon={isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
        >
          {isDarkTheme ? 'Light' : 'Dark'}
        </Button>

        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                color: 'inherit',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-md)',
              }}
              aria-label="User Profile"
              title="Manage Profile & Settings"
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  fontWeight: 'var(--font-bold)',
                  fontSize: 'var(--text-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
                data-testid="navbar-user-avatar"
              >
                {userInitial}
              </div>
              <div className="navbar-user-info" style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    lineHeight: '1.2',
                  }}
                  data-testid="navbar-user-name"
                >
                  {user?.name || 'User'}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: '1.2',
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  data-testid="navbar-user-email"
                >
                  {user?.email || ''}
                </span>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              disabled={isLoggingOut}
              isLoading={isLoggingOut}
              aria-label="Logout"
              leftIcon={<LogOut size={16} />}
              data-testid="navbar-logout-btn"
            >
              Logout
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" aria-label="Sign in">
                Sign In
              </Button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm" aria-label="Register">
                Register
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

Navbar.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired,
  isDarkTheme: PropTypes.bool.isRequired,
  onToggleTheme: PropTypes.func.isRequired,
};

export default Navbar;
