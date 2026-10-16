import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Clock, Video } from 'lucide-react';
import { Card, CardHeader, CardTitle, Button, LoadingIndicator, ErrorState, EmptyState } from '../atoms';
import { InterviewFormatBadge } from '../interviews';

/**
 * Format interview date for concise display (e.g., 'Tue, Oct 20, 2026')
 */
const formatInterviewDate = (dateVal) => {
  if (!dateVal) return 'Date TBD';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Date TBD';
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Date TBD';
  }
};

/**
 * Format interview time for display (e.g., '2:30 PM')
 */
const formatInterviewTime = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Upcoming Interviews Card (Phase 6.5G)
 *
 * Shows a compact list of confirmed upcoming interviews within the horizon window,
 * linking directly to individual interview detail pages.
 */
export const UpcomingInterviewsCard = ({
  interviews = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  if (isLoading && interviews.length === 0) {
    return (
      <Card data-testid="upcoming-interviews-loading-card">
        <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <LoadingIndicator text="Loading upcoming interviews..." />
        </div>
      </Card>
    );
  }

  if (error && interviews.length === 0) {
    return (
      <Card data-testid="upcoming-interviews-error-card">
        <div style={{ padding: 'var(--space-lg)' }}>
          <ErrorState
            title="Unable to load interviews"
            message={error}
            onRetry={onRetry}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="dashboard-section-card" data-testid="upcoming-interviews-card">
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
          <Calendar size={18} color="var(--accent)" aria-hidden="true" />
          <CardTitle as="h2" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Upcoming Interviews
          </CardTitle>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: interviews.length > 0 ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
              color: interviews.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
            }}
            data-testid="upcoming-interviews-count-badge"
          >
            {interviews.length}
          </span>
        </div>

        <Link
          to="/interviews"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
          data-testid="upcoming-interviews-view-all"
        >
          View all
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </CardHeader>

      <div style={{ padding: 'var(--space-md) var(--space-lg)' }}>
        {interviews.length === 0 ? (
          <div style={{ padding: 'var(--space-lg) 0' }}>
            <EmptyState
              icon={Calendar}
              title="No upcoming interviews"
              description="You have no interviews scheduled in the near future."
              action={
                <Link to="/applications" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="sm">
                    Schedule from Applications
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
            data-testid="upcoming-interviews-list"
          >
            {interviews.slice(0, 5).map((interview) => {
              const company = interview.applicationId?.company || 'Company';
              const jobTitle = interview.applicationId?.jobTitle || 'Role';
              const dateStr = formatInterviewDate(interview.interviewDate);
              const timeStr = formatInterviewTime(interview.interviewDate);

              return (
                <li key={interview._id}>
                  <Link
                    to={`/interviews/${interview._id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    data-testid={`upcoming-interview-item-${interview._id}`}
                    aria-label={`${interview.round || 'Interview'} with ${company} for ${jobTitle} on ${dateStr} at ${timeStr}. Click for details.`}
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
                            {company}
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
                            {jobTitle}
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <InterviewFormatBadge format={interview.format} />
                          {interview.round && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 'var(--font-medium)',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {interview.round}
                            </span>
                          )}
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
                          <Clock size={12} aria-hidden="true" />
                          <span>
                            {dateStr} {timeStr ? `• ${timeStr}` : ''}
                            {interview.durationMinutes ? ` (${interview.durationMinutes}m)` : ''}
                          </span>
                        </div>

                        {interview.meetingLink && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--accent)',
                              fontSize: '11px',
                            }}
                          >
                            <Video size={12} aria-hidden="true" />
                            Meeting Link
                          </span>
                        )}
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

UpcomingInterviewsCard.propTypes = {
  interviews: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      round: PropTypes.string,
      status: PropTypes.string,
      format: PropTypes.string,
      interviewDate: PropTypes.string,
      durationMinutes: PropTypes.number,
      meetingLink: PropTypes.string,
      applicationId: PropTypes.shape({
        _id: PropTypes.string,
        company: PropTypes.string,
        jobTitle: PropTypes.string,
        status: PropTypes.string,
      }),
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};

export default UpcomingInterviewsCard;
