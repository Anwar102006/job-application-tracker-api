import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  BarChart3,
  Settings,
  X,
  Layers,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/atoms';

/**
 * Sidebar Layout Component (Phase 6.5C)
 * Left navigation drawer supporting active route styling,
 * accessible mobile dismissal, profile navigation, and mobile logout.
 */
export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAuthenticated, logout, isLoggingOut } = useAuth();

  const navItems = [
    { label: 'Design System Demo', icon: Layers, to: '/', enabled: true },
    { label: 'Dashboard', icon: LayoutDashboard, badge: 'Phase 6.5F', enabled: false },
    { label: 'Applications', icon: Briefcase, badge: 'Phase 6.5D', enabled: false },
    { label: 'Interviews', icon: Calendar, badge: 'Phase 6.5E', enabled: false },
    { label: 'Analytics', icon: BarChart3, badge: 'Phase 6.5F', enabled: false },
    { label: 'Profile & Settings', icon: Settings, to: '/profile', enabled: true },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="modal-backdrop"
          onClick={onClose}
          style={{ zIndex: 'calc(var(--z-modal) - 1)' }}
          aria-hidden="true"
        />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`.trim()} aria-label="Main Navigation">
        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
            }}
          >
            Navigation
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close navigation sidebar"
            style={{ padding: '0.25rem' }}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>

        <nav style={{ padding: 'var(--space-md) var(--space-sm)', flex: 1 }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.enabled && item.to === location.pathname;

              const content = (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                    fontSize: 'var(--text-sm)',
                    cursor: item.enabled ? 'pointer' : 'not-allowed',
                    userSelect: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  className={item.enabled ? 'sidebar-nav-link' : 'sidebar-nav-disabled'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              );

              if (item.enabled && item.to) {
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      onClick={onClose}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {content}
                    </Link>
                  </li>
                );
              }

              return <li key={item.label}>{content}</li>;
            })}
          </ul>
        </nav>

        <div
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          {isAuthenticated && (
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  logout();
                }}
                disabled={isLoggingOut}
                isLoading={isLoggingOut}
                aria-label="Mobile logout"
                leftIcon={<LogOut size={16} />}
                style={{ width: '100%' }}
                data-testid="sidebar-logout-btn"
              >
                Logout
              </Button>
            </div>
          )}
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>CareerPulse v1.0</strong>
            <br />
            Phase 6.5C Authentication & User Profile
          </p>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
