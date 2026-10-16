import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Calendar, BarChart3, RotateCcw, Target } from 'lucide-react';
import { Button } from '../atoms';

/**
 * Dashboard Header & Quick Actions Bar (Phase 6.5G)
 *
 * Greets the authenticated user with real profile metadata,
 * summarizes the dashboard role, and exposes fast-navigation quick actions.
 */
export const DashboardHeader = ({
  user,
  onRefresh,
  isRefreshing = false,
}) => {
  const greeting = user?.name ? `Welcome back, ${user.name}!` : 'Welcome back!';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
      }}
      data-testid="dashboard-header"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-xs)',
          justifyContent: 'space-between',
        }}
        className="dashboard-header-top"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <h1
              className="page-title"
              style={{ margin: 0 }}
              data-testid="dashboard-welcome-heading"
            >
              {greeting}
            </h1>
            {user?.targetRole && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                }}
                data-testid="dashboard-user-target-role"
              >
                <Target size={12} aria-hidden="true" />
                {user.targetRole}
              </span>
            )}
          </div>
          <p
            className="page-subtitle"
            style={{ margin: 'var(--space-xs) 0 0 0' }}
          >
            {user?.headline
              ? `${user.headline} • Manage your active job search, interviews, and pipeline performance.`
              : 'Overview of your active job search, upcoming interviews, and pipeline health.'}
          </p>
        </div>

        {/* Quick Actions Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
            marginTop: 'var(--space-sm)',
          }}
          data-testid="dashboard-quick-actions"
        >
          <Link to="/applications?action=new" style={{ textDecoration: 'none' }}>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              data-testid="dashboard-add-application-btn"
            >
              Add Application
            </Button>
          </Link>

          <Link to="/applications" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Briefcase size={16} />}
              data-testid="dashboard-view-applications-btn"
            >
              Applications
            </Button>
          </Link>

          <Link to="/interviews" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Calendar size={16} />}
              data-testid="dashboard-view-interviews-btn"
            >
              Interviews
            </Button>
          </Link>

          <Link to="/analytics" style={{ textDecoration: 'none' }}>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BarChart3 size={16} />}
              data-testid="dashboard-view-analytics-btn"
            >
              Analytics
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            isLoading={isRefreshing}
            leftIcon={<RotateCcw size={16} />}
            aria-label="Refresh dashboard data"
            data-testid="dashboard-refresh-btn"
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

DashboardHeader.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    targetRole: PropTypes.string,
    headline: PropTypes.string,
  }),
  onRefresh: PropTypes.func.isRequired,
  isRefreshing: PropTypes.bool,
};

export default DashboardHeader;
