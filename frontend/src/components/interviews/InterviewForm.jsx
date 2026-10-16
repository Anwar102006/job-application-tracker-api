import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';
import { Button, Input, Select, Textarea } from '../atoms';
import {
  INTERVIEW_ROUNDS,
  INTERVIEW_FORMATS,
  VALID_INTERVIEW_TRANSITIONS,
} from '../../constants/interview.constants';

/**
 * Format ISO date string into `YYYY-MM-DDTHH:mm` for `<input type="datetime-local" />`
 */
const toDatetimeLocalString = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

/**
 * InterviewForm Component (Phase 6.5E)
 *
 * Controlled form for scheduling and updating interviews.
 * Enforces strict backend validation rules and finite state machine transitions.
 */
export const InterviewForm = ({
  mode = 'create',
  initialData = null,
  applications = [],
  selectedApplicationId = '',
  onSubmit,
  onCancel,
  isLoading = false,
  serverErrors = {},
  generalError = '',
}) => {
  const isEdit = mode === 'edit';

  // Form State
  const [formData, setFormData] = useState({
    applicationId: selectedApplicationId || initialData?.applicationId?._id || initialData?.applicationId || '',
    round: initialData?.round || 'HR Screening',
    interviewDate: toDatetimeLocalString(initialData?.interviewDate) || '',
    durationMinutes: initialData?.durationMinutes != null ? initialData.durationMinutes : 60,
    format: initialData?.format || 'Video Call',
    meetingLink: initialData?.meetingLink || '',
    interviewers: Array.isArray(initialData?.interviewers)
      ? initialData.interviewers.join(', ')
      : initialData?.interviewers || '',
    status: initialData?.status || 'Scheduled',
    notes: initialData?.notes || '',
  });

  const [clientErrors, setClientErrors] = useState({});

  // Merge client and server field errors
  const errors = { ...serverErrors, ...clientErrors };

  // Allowed status options in edit mode based on backend FSM
  const currentStatus = initialData?.status || 'Scheduled';
  const allowedTransitions = VALID_INTERVIEW_TRANSITIONS[currentStatus] || [];
  const isTerminalStatus = isEdit && allowedTransitions.length === 0;

  const statusOptions = [
    { value: currentStatus, label: `${currentStatus} (Current)` },
    ...allowedTransitions.map((st) => ({ value: st, label: st })),
  ];

  // Applications options for dropdown (filter out or mark archived)
  const applicationOptions = [
    { value: '', label: '-- Select an active job application --' },
    ...applications.map((app) => ({
      value: app._id,
      label: `${app.company} — ${app.jobTitle}${app.isArchived ? ' (Archived - Unavailable)' : ''}`,
      disabled: app.isArchived,
    })),
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear client-side error for this field
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!isEdit && !formData.applicationId) {
      newErrors.applicationId = 'Please select a job application';
    }

    // Check if selected application is archived
    if (!isEdit && formData.applicationId) {
      const selectedApp = applications.find((a) => a._id === formData.applicationId);
      if (selectedApp && selectedApp.isArchived) {
        newErrors.applicationId = 'Cannot schedule an interview for an archived application';
      }
    }

    if (!formData.round) {
      newErrors.round = 'Interview round is required';
    }

    if (!formData.interviewDate) {
      newErrors.interviewDate = 'Interview date and time is required';
    } else {
      const parsedDate = new Date(formData.interviewDate);
      if (isNaN(parsedDate.getTime())) {
        newErrors.interviewDate = 'Invalid date and time format';
      }
    }

    const durationNum = parseInt(formData.durationMinutes, 10);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 480) {
      newErrors.durationMinutes = 'Duration must be between 15 and 480 minutes';
    }

    if (formData.meetingLink && formData.meetingLink.length > 500) {
      newErrors.meetingLink = 'Meeting link cannot exceed 500 characters';
    }

    if (formData.notes && formData.notes.length > 2000) {
      newErrors.notes = 'Notes cannot exceed 2000 characters';
    }

    setClientErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validate()) return;

    // Convert interviewers string into array
    const interviewersList = formData.interviewers
      ? formData.interviewers
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const payload = {
      round: formData.round,
      interviewDate: new Date(formData.interviewDate).toISOString(),
      durationMinutes: parseInt(formData.durationMinutes, 10),
      format: formData.format,
      meetingLink: formData.meetingLink ? formData.meetingLink.trim() : '',
      interviewers: interviewersList,
      notes: formData.notes ? formData.notes.trim() : '',
    };

    if (isEdit) {
      payload.status = formData.status;
    }

    await onSubmit(payload, formData.applicationId);
  };

  const activeGeneralError = generalError || serverErrors.general;
  const isConflictError =
    activeGeneralError &&
    (activeGeneralError.toLowerCase().includes('conflict') ||
      activeGeneralError.toLowerCase().includes('time window'));

  return (
    <form onSubmit={handleSubmit} noValidate className="interview-form" data-testid="interview-form">
      {/* General / Conflict Error Banner */}
      {activeGeneralError && (
        <div
          role="alert"
          style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isConflictError ? 'var(--warning-subtle)' : 'var(--danger-subtle, #fef2f2)',
            color: isConflictError ? 'var(--warning-foreground)' : 'var(--danger)',
            border: `1px solid ${isConflictError ? 'var(--warning)' : 'var(--danger)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-sm)',
            fontSize: 'var(--text-sm)',
          }}
          data-testid="interview-form-error"
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div>
            <strong>{isConflictError ? 'Schedule Conflict' : 'Scheduling Error'}</strong>
            <p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>{activeGeneralError}</p>
          </div>
        </div>
      )}

      {/* Application Selection (Create Mode) */}
      {!isEdit && (
        <Select
          id="interview-app"
          label="Target Job Application"
          required
          name="applicationId"
          value={formData.applicationId}
          onChange={(e) => handleChange('applicationId', e.target.value)}
          options={applicationOptions}
          disabled={isLoading || !!selectedApplicationId}
          error={errors.applicationId}
          placeholder={null}
          data-testid="interview-app-select"
        />
      )}

      {/* Grid: Round & Format */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
          marginTop: !isEdit ? 'var(--space-md)' : 0,
        }}
      >
        <Select
          id="interview-round"
          label="Interview Round"
          required
          name="round"
          value={formData.round}
          onChange={(e) => handleChange('round', e.target.value)}
          options={INTERVIEW_ROUNDS.map((r) => ({ value: r, label: r }))}
          disabled={isLoading}
          error={errors.round}
          placeholder={null}
          data-testid="interview-round-select"
        />

        <Select
          id="interview-format"
          label="Format / Mode"
          name="format"
          value={formData.format}
          onChange={(e) => handleChange('format', e.target.value)}
          options={INTERVIEW_FORMATS.map((f) => ({ value: f, label: f }))}
          disabled={isLoading}
          error={errors.format}
          placeholder={null}
          data-testid="interview-format-select"
        />
      </div>

      {/* Grid: Date/Time & Duration */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-md)',
          marginTop: 'var(--space-md)',
        }}
      >
        <Input
          id="interview-datetime"
          label="Date & Time"
          required
          name="interviewDate"
          type="datetime-local"
          value={formData.interviewDate}
          onChange={(e) => handleChange('interviewDate', e.target.value)}
          disabled={isLoading}
          error={errors.interviewDate}
          data-testid="interview-date-input"
        />

        <Input
          id="interview-duration"
          label="Duration (Minutes)"
          name="durationMinutes"
          type="number"
          min="15"
          max="480"
          step="15"
          value={formData.durationMinutes}
          onChange={(e) => handleChange('durationMinutes', e.target.value)}
          disabled={isLoading}
          error={errors.durationMinutes}
          data-testid="interview-duration-input"
        />
      </div>

      {/* Status (Edit Mode Only) */}
      {isEdit && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          {isTerminalStatus ? (
            <Input
              id="interview-status-locked"
              label="Interview Status"
              value={`${currentStatus} (Terminal - Status Locked)`}
              disabled
              helperText={`Interviews in '${currentStatus}' state cannot be transitioned to another status.`}
              data-testid="interview-status-locked"
            />
          ) : (
            <Select
              id="interview-status"
              label="Interview Status"
              name="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              disabled={isLoading}
              error={errors.status}
              helperText={`Only valid transitions permitted from '${currentStatus}'.`}
              placeholder={null}
              data-testid="interview-status-select"
            />
          )}
        </div>
      )}

      {/* Meeting Link */}
      <div style={{ marginTop: 'var(--space-md)' }}>
        <Input
          id="interview-meetingLink"
          label="Meeting Link / Dial-in / Location"
          name="meetingLink"
          type="text"
          placeholder="https://zoom.us/j/..., Google Meet, or Office Address"
          value={formData.meetingLink}
          onChange={(e) => handleChange('meetingLink', e.target.value)}
          disabled={isLoading}
          error={errors.meetingLink}
          data-testid="interview-link-input"
        />
      </div>

      {/* Interviewers */}
      <div style={{ marginTop: 'var(--space-md)' }}>
        <Input
          id="interview-interviewers"
          label="Interviewers (Comma-separated)"
          name="interviewers"
          type="text"
          placeholder="e.g. Sarah Connor (Recruiter), John Doe (Engineering Lead)"
          value={formData.interviewers}
          onChange={(e) => handleChange('interviewers', e.target.value)}
          disabled={isLoading}
          data-testid="interview-interviewers-input"
        />
      </div>

      {/* Notes */}
      <div style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <Textarea
          id="interview-notes"
          label="Preparation & Follow-up Notes"
          name="notes"
          rows={3}
          placeholder="Topics to prepare, portfolio links, follow-up questions, or interviewer feedback..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={isLoading}
          error={errors.notes}
          data-testid="interview-notes-input"
        />
      </div>

      {/* Form Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 'var(--space-sm)',
          paddingTop: 'var(--space-sm)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          data-testid="interview-cancel-btn"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
          data-testid="interview-submit-btn"
        >
          {isEdit ? 'Save Changes' : 'Schedule Interview'}
        </Button>
      </div>
    </form>
  );
};

InterviewForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']),
  initialData: PropTypes.object,
  applications: PropTypes.array,
  selectedApplicationId: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  serverErrors: PropTypes.object,
  generalError: PropTypes.string,
};

export default InterviewForm;
