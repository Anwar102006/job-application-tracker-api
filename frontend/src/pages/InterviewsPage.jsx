import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Building2,
  Eye,
  CalendarCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Select,
  Card,
  CardHeader,
  CardContent,
  Modal,
  LoadingIndicator,
  EmptyState,
  ErrorState,
} from '../components/atoms';
import {
  InterviewStatusBadge,
  InterviewFormatBadge,
  InterviewForm,
} from '../components/interviews';
import {
  INTERVIEW_STATUS_LIST,
  INTERVIEW_SORT_OPTIONS,
} from '../constants/interview.constants';
import * as interviewService from '../services/interviewService';
import * as applicationService from '../services/applicationService';
import { getErrorMessage, getFieldErrors } from '../utils/errorUtils';

/**
 * Friendly Date & Time Formatter
 * E.g. 'Oct 20, 2026, 2:30 PM'
 */
const formatDateTime = (dateVal) => {
  if (!dateVal) return 'Not scheduled';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Not scheduled';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Not scheduled';
  }
};

/**
 * Format duration (minutes) to friendly string
 */
const formatDuration = (mins) => {
  if (!mins) return '60 mins';
  if (mins < 60) return `${mins} mins`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
  return `${hrs} hr${hrs > 1 ? 's' : ''} ${remainingMins} m`;
};

/**
 * Interviews Page (Phase 6.5E)
 *
 * Comprehensive interview management dashboard:
 * - Upcoming interviews in next 7 days
 * - Filterable and paginated interview history
 * - Schedule, Reschedule, and Delete modals
 */
export const InterviewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL
  const currentFilters = useMemo(() => {
    return {
      status: searchParams.get('status') || '',
      sortBy: searchParams.get('sortBy') || 'interviewDate',
      sortOrder: searchParams.get('sortOrder') || 'asc',
      page: parseInt(searchParams.get('page') || '1', 10),
    };
  }, [searchParams]);

  // Data states
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [isUpcomingLoading, setIsUpcomingLoading] = useState(true);

  const [interviews, setInterviews] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, totalDocs: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active applications for schedule dropdown
  const [applications, setApplications] = useState([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [deletingInterview, setDeletingInterview] = useState(null);

  // Form Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerErrors, setFormServerErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');

  // Fetch upcoming interviews
  const fetchUpcoming = useCallback(async () => {
    setIsUpcomingLoading(true);
    try {
      const response = await interviewService.getUpcomingInterviews({ days: 7 });
      setUpcomingInterviews(response.data?.data || []);
    } catch {
      // Upcoming failure is non-fatal for main list
      setUpcomingInterviews([]);
    } finally {
      setIsUpcomingLoading(false);
    }
  }, []);

  // Fetch all interviews (paginated)
  const fetchInterviews = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await interviewService.getInterviews(currentFilters);
      setInterviews(response.data?.data || []);
      setMeta(
        response.data?.meta || {
          page: currentFilters.page,
          limit: 10,
          totalDocs: response.data?.data?.length || 0,
          totalPages: 1,
        }
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load interviews. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters]);

  // Fetch applications for scheduling dropdown
  const fetchApplications = useCallback(async () => {
    try {
      const response = await applicationService.getApplications({ limit: 100, isArchived: 'false' });
      setApplications(response.data?.data || []);
    } catch {
      setApplications([]);
    }
  }, []);

  useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Filter & Pagination handlers
  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  // Create Interview
  const handleCreateSubmit = async (payload, applicationId) => {
    setIsSubmitting(true);
    setFormServerErrors({});
    setFormGeneralError('');

    try {
      await interviewService.createInterview(applicationId, payload);
      toast.success('Interview scheduled successfully!');
      setIsCreateModalOpen(false);
      fetchUpcoming();
      fetchInterviews();
    } catch (err) {
      const message = getErrorMessage(err);
      const fieldErrors = getFieldErrors(err);
      setFormGeneralError(message);
      setFormServerErrors(fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit / Reschedule Interview
  const handleEditSubmit = async (payload) => {
    if (!editingInterview) return;
    setIsSubmitting(true);
    setFormServerErrors({});
    setFormGeneralError('');

    try {
      await interviewService.updateInterview(editingInterview._id, payload);
      toast.success('Interview updated successfully!');
      setEditingInterview(null);
      fetchUpcoming();
      fetchInterviews();
    } catch (err) {
      const message = getErrorMessage(err);
      const fieldErrors = getFieldErrors(err);
      setFormGeneralError(message);
      setFormServerErrors(fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Interview
  const handleDeleteConfirm = async () => {
    if (!deletingInterview) return;
    setIsSubmitting(true);

    try {
      await interviewService.deleteInterview(deletingInterview._id);
      toast.success('Interview deleted successfully');
      setDeletingInterview(null);
      fetchUpcoming();
      fetchInterviews();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete interview'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="interviews-page" data-testid="interviews-page">
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
              margin: '0 0 var(--space-xs)',
              letterSpacing: '-0.02em',
            }}
          >
            Interviews
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
            Schedule, prepare, and track all your upcoming recruitment rounds and discussions.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={18} />}
          onClick={() => {
            setFormServerErrors({});
            setFormGeneralError('');
            setIsCreateModalOpen(true);
          }}
          data-testid="schedule-interview-btn"
        >
          Schedule Interview
        </Button>
      </div>

      {/* Upcoming Interviews Section (Next 7 Days) */}
      <section style={{ marginBottom: 'var(--space-2xl)' }} aria-labelledby="upcoming-interviews-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
          <CalendarCheck size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
          <h2
            id="upcoming-interviews-heading"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            Upcoming Interviews (Next 7 Days)
          </h2>
        </div>

        {isUpcomingLoading ? (
          <div style={{ padding: 'var(--space-xl)', display: 'flex', justifyContent: 'center' }}>
            <LoadingIndicator text="Checking upcoming schedule..." />
          </div>
        ) : upcomingInterviews.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--space-md)',
            }}
            data-testid="upcoming-interviews-grid"
          >
            {upcomingInterviews.map((item) => {
              const app = item.applicationId || {};
              return (
                <Card
                  key={item._id}
                  style={{
                    borderLeft: '4px solid var(--accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  data-testid="upcoming-interview-card"
                >
                  <CardHeader style={{ paddingBottom: 'var(--space-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-xs)' }}>
                      <div>
                        <h3
                          style={{
                            margin: '0 0 2px',
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-semibold)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {item.round}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                          <Building2 size={13} aria-hidden="true" />
                          {app._id ? (
                            <Link
                              to={`/applications/${app._id}`}
                              style={{ color: 'inherit', textDecoration: 'none', fontWeight: 'var(--font-medium)' }}
                              title="View job application"
                            >
                              {app.company} — {app.jobTitle}
                            </Link>
                          ) : (
                            <span>{app.company || 'Application'}</span>
                          )}
                        </div>
                      </div>
                      <InterviewStatusBadge status={item.status} />
                    </div>
                  </CardHeader>
                  <CardContent style={{ paddingTop: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                        <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }}>
                          {formatDateTime(item.interviewDate)}
                        </span>
                        <span>({formatDuration(item.durationMinutes)})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <InterviewFormatBadge format={item.format} />
                        {item.meetingLink && (
                          <a
                            href={item.meetingLink.startsWith('http') ? item.meetingLink : `https://${item.meetingLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              color: 'var(--accent)',
                              textDecoration: 'none',
                              marginLeft: 'auto',
                            }}
                          >
                            <span>Meeting Link</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 'var(--space-md)',
                        paddingTop: 'var(--space-sm)',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 'var(--space-xs)',
                      }}
                    >
                      <Link to={`/interviews/${item._id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye size={14} />}>
                          Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 size={14} />}
                        onClick={() => {
                          setFormServerErrors({});
                          setFormGeneralError('');
                          setEditingInterview(item);
                        }}
                      >
                        Reschedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: 'var(--space-lg)',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)',
              fontSize: 'var(--text-sm)',
            }}
            data-testid="no-upcoming-interviews"
          >
            No upcoming interviews in the next 7 days.
          </div>
        )}
      </section>

      {/* Filter and Control Bar */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <CardContent style={{ padding: 'var(--space-md)' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', alignItems: 'center' }}>
              <div style={{ minWidth: 160 }}>
                <Select
                  value={currentFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    ...INTERVIEW_STATUS_LIST.map((st) => ({ value: st, label: st })),
                  ]}
                  aria-label="Filter by interview status"
                  data-testid="filter-status-select"
                />
              </div>

              <div style={{ minWidth: 160 }}>
                <Select
                  value={currentFilters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  options={INTERVIEW_SORT_OPTIONS}
                  aria-label="Sort interviews by"
                  data-testid="sort-by-select"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleFilterChange('sortOrder', currentFilters.sortOrder === 'asc' ? 'desc' : 'asc')
                }
                title={`Sort Order: ${currentFilters.sortOrder.toUpperCase()}`}
                data-testid="sort-order-btn"
              >
                {currentFilters.sortOrder === 'asc' ? 'Ascending (↑)' : 'Descending (↓)'}
              </Button>

              {(currentFilters.status || currentFilters.sortBy !== 'interviewDate' || currentFilters.sortOrder !== 'asc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw size={14} />}
                  onClick={() => setSearchParams({ page: '1' })}
                  data-testid="reset-filters-btn"
                >
                  Reset
                </Button>
              )}
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Showing {interviews.length} of {meta.totalDocs} interview{meta.totalDocs === 1 ? '' : 's'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interviews List Section */}
      {isLoading ? (
        <div style={{ padding: 'var(--space-3xl)', display: 'flex', justifyContent: 'center' }}>
          <LoadingIndicator text="Loading interviews..." />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchInterviews} />
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No interviews scheduled yet"
          description="Track your technical rounds, HR screenings, and manager interviews in one synchronized dashboard."
          actionText="Schedule Interview"
          onAction={() => {
            setFormServerErrors({});
            setFormGeneralError('');
            setIsCreateModalOpen(true);
          }}
          data-testid="interviews-empty-state"
        />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-xl)',
            }}
            data-testid="interviews-list"
          >
            {interviews.map((item) => {
              const app = item.applicationId || {};
              return (
                <Card
                  key={item._id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-md) var(--space-lg)',
                    gap: 'var(--space-md)',
                  }}
                  data-testid={`interview-row-${item._id}`}
                >
                  {/* Left Column: Round & Company */}
                  <div style={{ minWidth: 240, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: '4px' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-semibold)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {item.round}
                      </h3>
                      <InterviewStatusBadge status={item.status} />
                      <InterviewFormatBadge format={item.format} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      <Building2 size={14} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                      {app._id ? (
                        <Link
                          to={`/applications/${app._id}`}
                          style={{
                            color: 'inherit',
                            fontWeight: 'var(--font-medium)',
                            textDecoration: 'none',
                          }}
                          className="hover-underline"
                        >
                          {app.company} — {app.jobTitle}
                        </Link>
                      ) : (
                        <span>{app.company ? `${app.company} — ${app.jobTitle}` : 'Application'}</span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Date & Duration */}
                  <div style={{ minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)' }}>
                      <Calendar size={15} style={{ color: 'var(--accent)' }} aria-hidden="true" />
                      <span>{formatDateTime(item.interviewDate)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Clock size={13} aria-hidden="true" />
                      <span>{formatDuration(item.durationMinutes)}</span>
                      {item.interviewers && item.interviewers.length > 0 && (
                        <span>• with {item.interviewers.join(', ')}</span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                    <Link to={`/interviews/${item._id}`} style={{ textDecoration: 'none' }}>
                      <Button variant="ghost" size="sm" leftIcon={<Eye size={15} />} title="View Details">
                        Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit2 size={15} />}
                      onClick={() => {
                        setFormServerErrors({});
                        setFormGeneralError('');
                        setEditingInterview(item);
                      }}
                      title="Reschedule / Edit"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingInterview(item)}
                      title="Delete Interview"
                      style={{ color: 'var(--danger)' }}
                      data-testid={`delete-interview-${item._id}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-sm)',
                marginTop: 'var(--space-lg)',
              }}
              data-testid="interviews-pagination"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(meta.page - 1)}
                disabled={!meta.hasPrevPage || isLoading}
                leftIcon={<ChevronLeft size={16} />}
              >
                Previous
              </Button>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(meta.page + 1)}
                disabled={!meta.hasNextPage || isLoading}
                rightIcon={<ChevronRight size={16} />}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsCreateModalOpen(false);
        }}
        title="Schedule Interview"
        data-testid="schedule-interview-modal"
      >
        <InterviewForm
          mode="create"
          applications={applications}
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isSubmitting}
          serverErrors={formServerErrors}
          generalError={formGeneralError}
        />
      </Modal>

      {/* Reschedule / Edit Interview Modal */}
      <Modal
        isOpen={!!editingInterview}
        onClose={() => {
          if (!isSubmitting) setEditingInterview(null);
        }}
        title={`Reschedule Interview: ${editingInterview?.round || ''}`}
        data-testid="edit-interview-modal"
      >
        {editingInterview && (
          <InterviewForm
            mode="edit"
            initialData={editingInterview}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingInterview(null)}
            isLoading={isSubmitting}
            serverErrors={formServerErrors}
            generalError={formGeneralError}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingInterview}
        onClose={() => {
          if (!isSubmitting) setDeletingInterview(null);
        }}
        title="Delete Interview"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button variant="ghost" onClick={() => setDeletingInterview(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="confirm-delete-interview-btn"
            >
              Permanently Delete
            </Button>
          </div>
        }
        data-testid="delete-interview-modal"
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete this{' '}
          <strong>{deletingInterview?.round}</strong> interview?
          <br />
          <br />
          <span style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>
            This will only remove the interview entry. The parent job application will remain untouched.
          </span>
        </p>
      </Modal>
    </div>
  );
};

export default InterviewsPage;
