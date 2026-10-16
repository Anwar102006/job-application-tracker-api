import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Edit2,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Modal,
  LoadingIndicator,
  ErrorState,
} from '../components/atoms';
import {
  InterviewStatusBadge,
  InterviewFormatBadge,
  InterviewForm,
} from '../components/interviews';
import { StatusBadge as ApplicationStatusBadge } from '../components/applications';
import { VALID_INTERVIEW_TRANSITIONS } from '../constants/interview.constants';
import * as interviewService from '../services/interviewService';
import { getErrorMessage, getFieldErrors } from '../utils/errorUtils';

/**
 * Friendly Date & Time Formatter
 */
const formatDateTime = (dateVal) => {
  if (!dateVal) return 'Not scheduled';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Not scheduled';
    return d.toLocaleString(undefined, {
      weekday: 'long',
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
 * Format duration
 */
const formatDuration = (mins) => {
  if (!mins) return '60 minutes';
  if (mins < 60) return `${mins} minutes`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hrs} hour${hrs > 1 ? 's' : ''}`;
  return `${hrs} hour${hrs > 1 ? 's' : ''} ${remainingMins} minutes`;
};

/**
 * Interview Details Page (Phase 6.5E)
 *
 * Dedicated inspection view for a single interview:
 * - Complete metadata (round, date, duration, mode, link, interviewers, notes)
 * - Associated Job Application card with direct navigation
 * - Reschedule and Delete actions with status transition validation
 */
export const InterviewDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerErrors, setFormServerErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');

  const fetchInterview = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setNotFound(false);

    try {
      const response = await interviewService.getInterviewById(id);
      setInterview(response.data?.data || null);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load interview details.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  // Handle Edit/Reschedule
  const handleEditSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormServerErrors({});
    setFormGeneralError('');

    try {
      const response = await interviewService.updateInterview(id, payload);
      setInterview(response.data?.data || null);
      toast.success('Interview updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      const message = getErrorMessage(err);
      const fieldErrors = getFieldErrors(err);
      setFormGeneralError(message);
      setFormServerErrors(fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);

    try {
      await interviewService.deleteInterview(id);
      toast.success('Interview deleted successfully');
      navigate('/interviews', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete interview'));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-3xl)', display: 'flex', justifyContent: 'center' }}>
        <LoadingIndicator text="Loading interview details..." />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ padding: 'var(--space-2xl)', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: 'var(--space-md)', color: 'var(--text-muted)' }}>
          <AlertCircle size={48} style={{ margin: '0 auto' }} aria-hidden="true" />
        </div>
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
          Interview Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          The interview you are looking for does not exist, has been removed, or belongs to another user account.
        </p>
        <Link to="/interviews" style={{ textDecoration: 'none' }}>
          <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
            Back to Interviews
          </Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchInterview} />;
  }

  if (!interview) return null;

  const app = interview.applicationId || {};
  const allowedTransitions = VALID_INTERVIEW_TRANSITIONS[interview.status] || [];
  const isTerminal = allowedTransitions.length === 0;

  return (
    <div className="interview-details-page" data-testid="interview-details-page">
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Link
          to="/interviews"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to All Interviews</span>
        </Link>
      </div>

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
          paddingBottom: 'var(--space-lg)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xs)' }}>
            <h1
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
              data-testid="interview-round-title"
            >
              {interview.round}
            </h1>
            <InterviewStatusBadge status={interview.status} />
            <InterviewFormatBadge format={interview.format} />
          </div>

          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            {app.company ? (
              <>
                For <strong>{app.jobTitle}</strong> at <strong>{app.company}</strong>
              </>
            ) : (
              'Recruitment interview round'
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Button
            variant="outline"
            leftIcon={<Edit2 size={16} />}
            onClick={() => {
              setFormServerErrors({});
              setFormGeneralError('');
              setIsEditModalOpen(true);
            }}
            title={isTerminal ? `Status is ${interview.status} (terminal state)` : 'Edit or Reschedule'}
            data-testid="details-edit-btn"
          >
            {isTerminal ? 'Edit Details' : 'Reschedule / Edit'}
          </Button>

          <Button
            variant="danger"
            leftIcon={<Trash2 size={16} />}
            onClick={() => setIsDeleteModalOpen(true)}
            data-testid="details-delete-btn"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {/* Schedule & Timing Card */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Timing</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Date & Time
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', fontSize: 'var(--text-base)' }} data-testid="details-datetime">
                  {formatDateTime(interview.interviewDate)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Duration
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-duration">
                  {formatDuration(interview.durationMinutes)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Format
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-format">
                  {interview.format || 'Video Call'}
                </p>
              </div>

              {interview.meetingLink && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Meeting Link / Coordinates
                  </span>
                  <p style={{ margin: '2px 0 0', wordBreak: 'break-all' }}>
                    <a
                      href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        fontWeight: 'var(--font-medium)',
                      }}
                      data-testid="details-meeting-link"
                    >
                      <span>{interview.meetingLink}</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </p>
                </div>
              )}

              {interview.interviewers && interview.interviewers.length > 0 && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Interviewers
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {interview.interviewers.map((person, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-secondary)',
                          fontSize: 'var(--text-xs)',
                          border: '1px solid var(--border)',
                          fontWeight: 'var(--font-medium)',
                        }}
                      >
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Associated Job Application Card */}
        <Card>
          <CardHeader>
            <CardTitle>Associated Application</CardTitle>
          </CardHeader>
          <CardContent>
            {app._id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Company
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }} data-testid="details-app-company">
                    {app.company}
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Target Role
                  </span>
                  <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-app-role">
                    {app.jobTitle}
                  </p>
                </div>

                {app.status && (
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Application Status
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <ApplicationStatusBadge status={app.status} />
                    </div>
                  </div>
                )}

                <div style={{ paddingTop: 'var(--space-sm)' }}>
                  <Link to={`/applications/${app._id}`} style={{ textDecoration: 'none' }}>
                    <Button variant="outline" size="sm" leftIcon={<ExternalLink size={14} />}>
                      View Application Details
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                No parent application details attached.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes & Preparation Section */}
      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <FileText size={18} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <CardTitle>Notes & Preparation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {interview.notes ? (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
              }}
              data-testid="details-notes"
            >
              {interview.notes}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--text-sm)' }}>
              No preparation notes entered yet. Click &quot;Reschedule / Edit&quot; to add topics, questions, or links.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit / Reschedule Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsEditModalOpen(false);
        }}
        title={`Edit Interview: ${interview.round}`}
        data-testid="details-edit-modal"
      >
        <InterviewForm
          mode="edit"
          initialData={interview}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
          serverErrors={formServerErrors}
          generalError={formGeneralError}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsDeleteModalOpen(false);
        }}
        title="Delete Interview"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="confirm-delete-btn"
            >
              Permanently Delete
            </Button>
          </div>
        }
        data-testid="details-delete-modal"
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Are you sure you want to permanently delete this{' '}
          <strong>{interview.round}</strong> interview?
          <br />
          <br />
          <span style={{ color: 'var(--danger)', fontWeight: 'var(--font-medium)' }}>
            This will permanently remove the interview event. The parent job application will remain intact.
          </span>
        </p>
      </Modal>
    </div>
  );
};

export default InterviewDetailsPage;
