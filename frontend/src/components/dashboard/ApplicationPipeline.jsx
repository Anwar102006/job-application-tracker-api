import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, LoadingIndicator, ErrorState } from '../atoms';

/**
 * Status color mappings matching CareerPulse StatusBadge tokens
 */
const STATUS_CONFIG = {
  Applied: {
    color: '#2563eb',
    bg: '#eff6ff',
    border: 'rgba(37, 99, 235, 0.25)',
  },
  Screening: {
    color: '#0891b2',
    bg: '#ecfeff',
    border: 'rgba(8, 145, 178, 0.25)',
  },
  Interviewing: {
    color: '#d97706',
    bg: '#fffbeb',
    border: 'rgba(217, 119, 6, 0.25)',
  },
  Offered: {
    color: '#059669',
    bg: '#ecfdf5',
    border: 'rgba(5, 150, 105, 0.25)',
  },
  Rejected: {
    color: '#dc2626',
    bg: '#fef2f2',
    border: 'rgba(220, 38, 38, 0.25)',
  },
  Draft: {
    color: '#64748b',
    bg: '#f1f5f9',
    border: 'rgba(100, 116, 139, 0.25)',
  },
  Shortlisted: {
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: 'rgba(124, 58, 237, 0.25)',
  },
  Accepted: {
    color: '#10b981',
    bg: '#ecfdf5',
    border: 'rgba(16, 185, 129, 0.25)',
  },
  Declined: {
    color: '#f43f5e',
    bg: '#fff1f2',
    border: 'rgba(244, 63, 94, 0.25)',
  },
  Withdrawn: {
    color: '#4b5563',
    bg: '#f3f4f6',
    border: 'rgba(75, 85, 99, 0.25)',
  },
  Ghosted: {
    color: '#6b7280',
    bg: '#f9fafb',
    border: 'rgba(107, 114, 128, 0.25)',
  },
};

/**
 * Complete list of pipeline statuses covering the known analytics contract
 * while strictly preserving valid backend statuses (e.g. Screening).
 */
export const PIPELINE_STATUS_LIST = Object.freeze([
  'Applied',
  'Screening',
  'Interviewing',
  'Offered',
  'Rejected',
  'Draft',
  'Shortlisted',
  'Accepted',
  'Declined',
  'Withdrawn',
  'Ghosted',
]);

/**
 * Application Pipeline Component (Phase 6.5G)
 *
 * Visualizes the full application stage breakdown across all backend-supported statuses.
 * Provides interactive status pills linking directly to filtered views in ApplicationsPage.
 */
export const ApplicationPipeline = ({
  breakdown = null,
  totalApplications = 0,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const byStatus = breakdown?.byStatus;

  // Dynamically resolve displayed statuses: union of canonical pipeline list and any extra keys in byStatus
  const statusList = useMemo(() => {
    const set = new Set(PIPELINE_STATUS_LIST);
    if (byStatus && typeof byStatus === 'object') {
      Object.keys(byStatus).forEach((k) => set.add(k));
    }
    return Array.from(set);
  }, [byStatus]);

  if (isLoading && !breakdown) {
    return (
      <Card data-testid="pipeline-loading-card">
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <LoadingIndicator text="Loading application pipeline..." />
        </div>
      </Card>
    );
  }

  if (error && !breakdown) {
    return (
      <Card data-testid="pipeline-error-card">
        <div style={{ padding: 'var(--space-lg)' }}>
          <ErrorState
            title="Unable to load pipeline"
            message={error}
            onRetry={onRetry}
          />
        </div>
      </Card>
    );
  }

  const safeByStatus = byStatus || {};
  const total = totalApplications || 0;

  return (
    <Card className="application-pipeline-card" data-testid="application-pipeline-card">
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
          <Layers size={18} color="var(--accent)" aria-hidden="true" />
          <CardTitle as="h2" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Application Pipeline
          </CardTitle>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              fontWeight: 'var(--font-normal)',
            }}
          >
            ({total} {total === 1 ? 'application' : 'applications'})
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
          data-testid="pipeline-view-all-link"
        >
          View all
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </CardHeader>

      <div style={{ padding: 'var(--space-lg)' }}>
        {/* Visual Multi-Segment Pipeline Distribution Bar */}
        {total > 0 ? (
          <div
            style={{
              display: 'flex',
              height: '8px',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-secondary)',
              marginBottom: 'var(--space-lg)',
            }}
            role="progressbar"
            aria-label="Application status distribution"
            aria-valuenow={100}
            aria-valuemin={0}
            aria-valuemax={100}
            data-testid="pipeline-progress-bar"
          >
            {statusList.map((status) => {
              const count = safeByStatus[status] || 0;
              if (count === 0) return null;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const cfg = STATUS_CONFIG[status] || {
                color: '#6b7280',
                bg: '#f9fafb',
                border: 'rgba(107, 114, 128, 0.25)',
              };

              return (
                <div
                  key={status}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: cfg.color,
                    transition: 'width var(--transition-normal)',
                  }}
                  title={`${status}: ${count} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              marginBottom: 'var(--space-md)',
            }}
            data-testid="pipeline-empty-notice"
          >
            No active applications in the pipeline yet.
          </div>
        )}

        {/* Status Stage Pills Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-sm)',
          }}
          data-testid="pipeline-stages-grid"
        >
          {statusList.map((status) => {
            const count = safeByStatus[status] || 0;
            const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
            const cfg = STATUS_CONFIG[status] || {
              color: '#6b7280',
              bg: '#f9fafb',
              border: 'rgba(107, 114, 128, 0.25)',
            };

            return (
              <Link
                key={status}
                to={`/applications?status=${encodeURIComponent(status)}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
                aria-label={`${status}: ${count} applications (${percentage}%). Click to filter.`}
                data-testid={`pipeline-status-${status.toLowerCase()}`}
              >
                <div
                  className="pipeline-status-pill"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${cfg.border}`,
                    backgroundColor: 'var(--surface)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: cfg.color,
                          display: 'inline-block',
                        }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 'var(--font-medium)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {status}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted)',
                        fontFeatureSettings: '"tnum"',
                      }}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 'var(--font-bold)',
                      color: 'var(--text-primary)',
                      marginTop: '4px',
                      fontFeatureSettings: '"tnum"',
                    }}
                    data-testid={`pipeline-count-${status.toLowerCase()}`}
                  >
                    {count}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

ApplicationPipeline.propTypes = {
  breakdown: PropTypes.shape({
    byStatus: PropTypes.object,
    byPriority: PropTypes.object,
    byJobType: PropTypes.object,
    byWorkplaceType: PropTypes.object,
  }),
  totalApplications: PropTypes.number,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};

export default ApplicationPipeline;
