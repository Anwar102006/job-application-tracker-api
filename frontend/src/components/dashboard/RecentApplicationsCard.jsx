import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Briefcase, ArrowRight, Plus, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, LoadingIndicator, ErrorState, EmptyState } from '../atoms';
import { StatusBadge, PriorityBadge } from '../applications';

/**
 * Format application submission date (e.g., 'Oct 14, 2026')
 */
const formatAppliedDate = (dateVal) => {
  if (!dateVal) return 'Date N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Date N/A';
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Date N/A';
  }
};

/**
 * Recent Applications Card (Phase 6.5G)
 *
 * Displays the most recently created or updated applications,
 * with quick access to application details and the full applications directory.
 */
export const RecentApplicationsCard = ({
  applications = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  if (isLoading && applications.length === 0) {
    return (
      <Card data-testid="recent-applications-loading-card">
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <LoadingIndicator text="Loading recent applications..." />
        </div>
      </Card>
    );
  }

  if (error && applications.length === 0) {
    return (
      <Card data-testid="recent-applications-error-card">
        <div style={{ padding: 'var(--space-lg)' }}>
          <ErrorState
            title="Unable to load applications"
            message={error}
            onRetry={onRetry}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="dashboard-section-card" data-testid="recent-applications-card">
      <CardHeader
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          padding: 'var(--space-md) var(--space-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Briefcase size={18} color="var(--accent)" aria-hidden="true" />
          <CardTitle as="h2" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Recent Applications
          </CardTitle>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: applications.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              color: applications.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
            }}
            data-testid="recent-applications-count-badge"
          >
            {applications.length}
          </span>
        </div>

        <Link
          to="/applications"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
          data-testid="recent-applications-view-all"
        >
          View all
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </CardHeader>

      <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
        {applications.length === 0 ? (
          <div style={{ padding: 'var(--space-lg) 0' }}>
            <EmptyState
              icon={Briefcase}
              title="No applications tracked yet"
              description="Start tracking your job search by adding your first application."
              action={
                <Link to="/applications?action=new" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm" leftIcon={<Plus size={16} />}>
                    Add Application
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}
            data-testid="recent-applications-list"
          >
            {applications.slice(0, 5).map((app) => {
              const appliedDateStr = formatAppliedDate(app.appliedDate || app.createdAt);

              return (
                <li key={app._id}>
                  <Link
                    to={`/applications/${app._id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    data-testid={`recent-application-item-${app._id}`}
                    aria-label={`${app.company} - ${app.jobTitle}, status: ${app.status}. Click for details.`}
                  >
                    <div
                      className="dashboard-item-card"
                      style={{
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        transition: 'all var(--transition-fast)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-xs)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 'var(--space-sm)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--font-semibold)',
                              color: 'var(--text-primary)',
                              margin: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {app.company}
                          </h3>
                          <p
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-secondary)',
                              margin: '2px 0 0 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {app.jobTitle}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <StatusBadge status={app.status} />
                          {app.priority && <PriorityBadge priority={app.priority} />}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 'var(--space-xs)',
                          paddingTop: 'var(--space-xs)',
                          borderTop: '1px solid var(--border-subtle)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={12} aria-hidden="true" />
                          <span>Applied {appliedDateStr}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                          {app.workplaceType && <span>{app.workplaceType}</span>}
                          {app.jobType && (
                            <>
                              <span>•</span>
                              <span>{app.jobType}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
};

RecentApplicationsCard.propTypes = {
  applications: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      company: PropTypes.string.isRequired,
      jobTitle: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      priority: PropTypes.string,
      workplaceType: PropTypes.string,
      jobType: PropTypes.string,
      appliedDate: PropTypes.string,
      createdAt: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};

export default RecentApplicationsCard;
