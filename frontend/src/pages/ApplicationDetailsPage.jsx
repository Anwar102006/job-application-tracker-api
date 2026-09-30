import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  ExternalLink,
  Edit2,
  Archive,
  ArchiveRestore,
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
  EmptyState,
} from '../components/atoms';
import { StatusBadge, PriorityBadge, ApplicationForm } from '../components/applications';
import * as applicationService from '../services/applicationService';
import { getErrorMessage, getFieldErrors } from '../utils/errorUtils';

/**
 * Format date for friendly display
 */
const formatDate = (dateVal) => {
  if (!dateVal) return 'Not specified';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Not specified';
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Not specified';
  }
};

/**
 * Format salary object
 */
const formatSalaryDetails = (salary) => {
  if (!salary || (salary.min == null && salary.max == null)) return null;

  const currencySymbol = salary.currency === 'USD' ? '$' : salary.currency === 'EUR' ? '€' : salary.currency === 'GBP' ? '£' : salary.currency === 'INR' ? '₹' : `${salary.currency} `;
  const periodLabel = salary.period ? `per ${salary.period.toLowerCase().replace('ly', '')}` : '';

  if (salary.min != null && salary.max != null) {
    return `${currencySymbol}${Number(salary.min).toLocaleString('en-US')} - ${currencySymbol}${Number(salary.max).toLocaleString('en-US')} ${periodLabel}`;
  }
  if (salary.min != null) {
    return `Starting from ${currencySymbol}${Number(salary.min).toLocaleString('en-US')} ${periodLabel}`;
  }
  if (salary.max != null) {
    return `Up to ${currencySymbol}${Number(salary.max).toLocaleString('en-US')} ${periodLabel}`;
  }
  return null;
};

/**
 * Application Details Page (Phase 6.5D)
 *
 * Full application inspection view:
 * - Complete metadata: company, job title, status, location, salary, dates, notes
 * - Edit, Archive/Unarchive, and Delete capabilities
 * - Archive restrictions respected (cannot edit while archived)
 */
export const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formServerErrors, setFormServerErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState('');

  // Fetch application details
  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setNotFound(false);

    try {
      const response = await applicationService.getApplicationById(id);
      const appData = response.data?.data || response.data;
      if (!appData) {
        setNotFound(true);
      } else {
        setApplication(appData);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(getErrorMessage(err, 'Failed to load application details.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  // Handle Edit Submit
  const handleEditSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormServerErrors({});
    setFormGeneralError('');

    try {
      const response = await applicationService.updateApplication(id, payload);
      const updated = response.data?.data || response.data;
      setApplication(updated);
      toast.success('Application updated successfully!');
      setIsEditModalOpen(false);
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setFormServerErrors(fieldErrors);
      }
      setFormGeneralError(getErrorMessage(err, 'Failed to update application.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Archive / Unarchive
  const handleArchiveConfirm = async () => {
    setIsSubmitting(true);

    try {
      const res = await applicationService.archiveApplication(id);
      const isNowArchived = res.data?.data?.isArchived;
      setApplication((prev) => ({ ...prev, isArchived: isNowArchived }));
      toast.success(
        isNowArchived
          ? 'Application archived successfully'
          : 'Application unarchived successfully'
      );
      setIsArchiveModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update application archive status.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);

    try {
      await applicationService.deleteApplication(id);
      toast.success('Application deleted successfully');
      navigate('/applications', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete application.'));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: 'var(--space-3xl) 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
        <LoadingIndicator size="lg" label="Loading application details..." />
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', margin: 0 }}>
          Loading application details...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-xl) 0' }}>
        <EmptyState
          icon={AlertCircle}
          title="Application Not Found"
          description="The job application you are looking for does not exist or you do not have permission to view it."
          action={
            <Link to="/applications" style={{ textDecoration: 'none' }}>
              <Button variant="primary" leftIcon={<ArrowLeft size={16} />}>
                Back to Applications
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-xl) 0' }}>
        <ErrorState
          title="Failed to Load Application"
          message={error}
          onRetry={fetchApplication}
        />
      </div>
    );
  }

  if (!application) return null;

  const salaryFormatted = formatSalaryDetails(application.salary);

  return (
    <div className="application-details-page" data-testid="application-details-page" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Back button and page navigation */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <Link to="/applications" style={{ textDecoration: 'none' }}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} data-testid="back-to-apps-btn">
            Back to Applications
          </Button>
        </Link>
      </div>

      {/* Archived Notice Banner */}
      {application.isArchived && (
        <div
          role="status"
          style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
          }}
          data-testid="archived-banner"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <Archive size={18} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              This application is <strong>archived</strong>. You must unarchive it before making modifications.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveModalOpen(true)}
            leftIcon={<ArchiveRestore size={16} />}
            data-testid="unarchive-banner-btn"
          >
            Unarchive Now
          </Button>
        </div>
      )}

      {/* Header Card */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <div
          style={{
            padding: 'var(--space-xl)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-md)',
          }}
        >
          {/* Title and Company */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-xs)' }}>
              <h1
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
                data-testid="details-job-title"
              >
                {application.jobTitle}
              </h1>
              <StatusBadge status={application.status} />
              <PriorityBadge priority={application.priority} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-base)',
                flexWrap: 'wrap',
                marginTop: 'var(--space-xs)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'var(--font-semibold)' }} data-testid="details-company">
                <Building2 size={18} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                {application.company}
              </span>

              {application.location && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={18} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                  {application.location}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormServerErrors({});
                setFormGeneralError('');
                setIsEditModalOpen(true);
              }}
              disabled={application.isArchived}
              title={application.isArchived ? 'Unarchive application to edit' : 'Edit Application'}
              leftIcon={<Edit2 size={16} />}
              data-testid="details-edit-btn"
            >
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsArchiveModalOpen(true)}
              leftIcon={application.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              data-testid="details-archive-btn"
            >
              {application.isArchived ? 'Unarchive' : 'Archive'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              style={{ color: 'var(--danger)' }}
              leftIcon={<Trash2 size={16} />}
              data-testid="details-delete-btn"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        {/* Core Job Information */}
        <Card>
          <CardHeader>
            <CardTitle>Role Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Job Type
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-job-type">
                  {application.jobType || 'Full-time'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Workplace
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-workplace-type">
                  {application.workplaceType || 'On-site'}
                </p>
              </div>

              {salaryFormatted && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Compensation
                  </span>
                  <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--success)' }} data-testid="details-salary">
                    {salaryFormatted}
                  </p>
                </div>
              )}

              {application.jobUrl && (
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Job Posting
                  </span>
                  <p style={{ margin: '2px 0 0' }}>
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                        wordBreak: 'break-all',
                        fontWeight: 'var(--font-medium)',
                      }}
                      data-testid="details-job-url"
                    >
                      <span>Visit Job Posting</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Date Applied
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-applied-date">
                  {formatDate(application.appliedDate)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Application Deadline
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 'var(--font-medium)', color: 'var(--text-primary)' }} data-testid="details-deadline">
                  {formatDate(application.deadline)}
                </p>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Record Created
                </span>
                <p style={{ margin: '2px 0 0', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {formatDate(application.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <Card style={{ marginBottom: 'var(--space-xl)' }}>
        <CardHeader>
          <CardTitle style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
            <FileText size={18} aria-hidden="true" />
            <span>Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {application.notes ? (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
              }}
              data-testid="details-notes"
            >
              {application.notes}
            </div>
          ) : (
            <p style={{ margin: 0, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--text-sm)' }} data-testid="details-no-notes">
              No notes added yet. Click &quot;Edit&quot; to add thoughts, interview details, or contacts.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsEditModalOpen(false);
        }}
        title={`Edit Application: ${application.company}`}
        data-testid="details-edit-modal"
      >
        <ApplicationForm
          mode="edit"
          initialData={application}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditModalOpen(false)}
          isLoading={isSubmitting}
          serverErrors={formServerErrors}
          generalError={formGeneralError}
        />
      </Modal>

      {/* Archive / Unarchive Modal */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsArchiveModalOpen(false);
        }}
        title={application.isArchived ? 'Unarchive Application' : 'Archive Application'}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button variant="ghost" onClick={() => setIsArchiveModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleArchiveConfirm}
              isLoading={isSubmitting}
              disabled={isSubmitting}
              data-testid="confirm-archive-btn"
            >
              {application.isArchived ? 'Unarchive Application' : 'Archive Application'}
            </Button>
          </div>
        }
        data-testid="details-archive-modal"
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {application.isArchived ? (
            <>
              Are you sure you want to unarchive this application for{' '}
              <strong>{application.company}</strong>? It will return to your active list.
            </>
          ) : (
            <>
              Are you sure you want to archive this application for{' '}
              <strong>{application.company}</strong>? It will be marked as archived and cannot be edited until restored.
            </>
          )}
        </p>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsDeleteModalOpen(false);
        }}
        title="Delete Application"
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
          Are you sure you want to permanently delete this application for{' '}
          <strong>{application.jobTitle}</strong> at <strong>{application.company}</strong>?
          <br />
          <br />
          <span style={{ color: 'var(--danger)', fontWeight: 'var(--font-medium)' }}>
            This action is permanent and will cascade-delete all associated records.
          </span>
        </p>
      </Modal>
    </div>
  );
};

export default ApplicationDetailsPage;
