import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Textarea,
} from '../atoms';
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_LIST,
  JOB_TYPES,
  WORKPLACE_TYPES,
  PRIORITY_LEVELS,
  SALARY_PERIODS,
  VALID_APPLICATION_TRANSITIONS,
} from '../../constants/application.constants';

/**
 * Format ISO date or date object to YYYY-MM-DD for HTML5 date inputs
 */
const formatDateForInput = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Reusable Application Form Component (Phase 6.5D)
 *
 * Supports both create and edit modes.
 * Centralizes client validation, field rendering, and payload sanitization.
 */
export const ApplicationForm = ({
  initialData = null,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
  serverErrors = {},
  generalError = '',
}) => {
  const isEdit = mode === 'edit';

  // Initialize form state
  const [formData, setFormData] = useState({
    company: '',
    jobTitle: '',
    status: APPLICATION_STATUS.APPLIED,
    priority: 'Medium',
    jobType: 'Full-time',
    workplaceType: 'On-site',
    location: '',
    jobUrl: '',
    appliedDate: formatDateForInput(new Date()),
    deadline: '',
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'USD',
    salaryPeriod: 'Yearly',
    notes: '',
  });

  const [clientErrors, setClientErrors] = useState({});

  // Sync initialData when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        company: initialData.company || '',
        jobTitle: initialData.jobTitle || '',
        status: initialData.status || APPLICATION_STATUS.APPLIED,
        priority: initialData.priority || 'Medium',
        jobType: initialData.jobType || 'Full-time',
        workplaceType: initialData.workplaceType || 'On-site',
        location: initialData.location || '',
        jobUrl: initialData.jobUrl || '',
        appliedDate: formatDateForInput(initialData.appliedDate) || formatDateForInput(new Date()),
        deadline: formatDateForInput(initialData.deadline) || '',
        salaryMin: initialData.salary?.min !== null && initialData.salary?.min !== undefined ? String(initialData.salary.min) : '',
        salaryMax: initialData.salary?.max !== null && initialData.salary?.max !== undefined ? String(initialData.salary.max) : '',
        salaryCurrency: initialData.salary?.currency || 'USD',
        salaryPeriod: initialData.salary?.period || 'Yearly',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  // Determine allowed status transitions for edit mode
  let statusOptions = APPLICATION_STATUS_LIST;
  let isStatusDisabled = false;
  let statusHelperText = '';

  if (isEdit && initialData?.status) {
    const currentStatus = initialData.status;
    const allowed = VALID_APPLICATION_TRANSITIONS[currentStatus] || [];
    if (allowed.length === 0) {
      // Terminal state (e.g. Rejected or Withdrawn)
      statusOptions = [currentStatus];
      isStatusDisabled = true;
      statusHelperText = `Cannot change status from terminal state '${currentStatus}'.`;
    } else {
      // Current status + allowed next statuses
      statusOptions = [currentStatus, ...allowed.filter((s) => s !== currentStatus)];
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    if (clientErrors[field]) {
      setClientErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.company || !formData.company.trim()) {
      errors.company = 'Company name is required';
    } else if (formData.company.trim().length > 100) {
      errors.company = 'Company name cannot exceed 100 characters';
    }

    if (!formData.jobTitle || !formData.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    } else if (formData.jobTitle.trim().length > 100) {
      errors.jobTitle = 'Job title cannot exceed 100 characters';
    }

    if (formData.location && formData.location.trim().length > 100) {
      errors.location = 'Location cannot exceed 100 characters';
    }

    if (formData.jobUrl && formData.jobUrl.trim().length > 500) {
      errors.jobUrl = 'Job URL cannot exceed 500 characters';
    }

    if (formData.notes && formData.notes.length > 2000) {
      errors.notes = 'Notes cannot exceed 2000 characters';
    }

    // Salary validation
    const minNum = formData.salaryMin !== '' ? Number(formData.salaryMin) : null;
    const maxNum = formData.salaryMax !== '' ? Number(formData.salaryMax) : null;

    if (minNum !== null) {
      if (isNaN(minNum) || minNum < 0) {
        errors.salaryMin = 'Minimum salary cannot be negative';
      }
    }

    if (maxNum !== null) {
      if (isNaN(maxNum) || maxNum < 0) {
        errors.salaryMax = 'Maximum salary cannot be negative';
      }
    }

    if (minNum !== null && maxNum !== null && !isNaN(minNum) && !isNaN(maxNum)) {
      if (minNum > maxNum) {
        errors.salaryMin = 'Minimum salary cannot exceed maximum salary';
      }
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Build structured payload for service sanitization
    const payload = {
      company: formData.company.trim(),
      jobTitle: formData.jobTitle.trim(),
      status: formData.status,
      priority: formData.priority,
      jobType: formData.jobType,
      workplaceType: formData.workplaceType,
      location: formData.location.trim(),
      jobUrl: formData.jobUrl.trim(),
      appliedDate: formData.appliedDate || undefined,
      deadline: formData.deadline || (isEdit ? null : undefined),
      notes: formData.notes.trim(),
    };

    // Include salary if any field provided
    const hasSalary = formData.salaryMin !== '' || formData.salaryMax !== '';
    if (hasSalary) {
      payload.salary = {
        min: formData.salaryMin !== '' ? Number(formData.salaryMin) : null,
        max: formData.salaryMax !== '' ? Number(formData.salaryMax) : null,
        currency: formData.salaryCurrency || 'USD',
        period: formData.salaryPeriod || 'Yearly',
      };
    }

    onSubmit(payload);
  };

  // Merge client errors and server validation errors
  const errors = { ...serverErrors, ...clientErrors };

  return (
    <form onSubmit={handleSubmit} noValidate className="application-form" data-testid="application-form">
      {/* General Error Banner */}
      {generalError && (
        <div
          role="alert"
          style={{
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: 'var(--text-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          <AlertCircle size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      {/* Row 1: Company & Job Title */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
        <Input
          id="app-company"
          label="Company Name"
          required
          placeholder="e.g. Acme Corp"
          value={formData.company}
          onChange={(e) => handleChange('company', e.target.value)}
          error={errors.company}
          disabled={isLoading}
          maxLength={100}
          data-testid="app-company-input"
        />

        <Input
          id="app-jobTitle"
          label="Job Title"
          required
          placeholder="e.g. Senior Software Engineer"
          value={formData.jobTitle}
          onChange={(e) => handleChange('jobTitle', e.target.value)}
          error={errors.jobTitle}
          disabled={isLoading}
          maxLength={100}
          data-testid="app-jobTitle-input"
        />
      </div>

      {/* Row 2: Status & Priority */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        <Select
          id="app-status"
          label="Application Status"
          required
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={statusOptions.map((s) => ({ value: s, label: s }))}
          error={errors.status}
          helperText={statusHelperText}
          disabled={isLoading || isStatusDisabled}
          placeholder={null}
          data-testid="app-status-select"
        />

        <Select
          id="app-priority"
          label="Priority"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          options={PRIORITY_LEVELS.map((p) => ({ value: p, label: p }))}
          error={errors.priority}
          disabled={isLoading}
          placeholder={null}
          data-testid="app-priority-select"
        />
      </div>

      {/* Row 3: Job Type & Workplace Type */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        <Select
          id="app-jobType"
          label="Job Type"
          value={formData.jobType}
          onChange={(e) => handleChange('jobType', e.target.value)}
          options={JOB_TYPES.map((t) => ({ value: t, label: t }))}
          error={errors.jobType}
          disabled={isLoading}
          placeholder={null}
          data-testid="app-jobType-select"
        />

        <Select
          id="app-workplaceType"
          label="Workplace Type"
          value={formData.workplaceType}
          onChange={(e) => handleChange('workplaceType', e.target.value)}
          options={WORKPLACE_TYPES.map((w) => ({ value: w, label: w }))}
          error={errors.workplaceType}
          disabled={isLoading}
          placeholder={null}
          data-testid="app-workplaceType-select"
        />
      </div>

      {/* Row 4: Location & Job URL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        <Input
          id="app-location"
          label="Location"
          placeholder="e.g. San Francisco, CA or Remote"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          error={errors.location}
          disabled={isLoading}
          maxLength={100}
          data-testid="app-location-input"
        />

        <Input
          id="app-jobUrl"
          label="Job Posting URL"
          type="url"
          placeholder="https://company.com/careers/123"
          value={formData.jobUrl}
          onChange={(e) => handleChange('jobUrl', e.target.value)}
          error={errors.jobUrl}
          disabled={isLoading}
          maxLength={500}
          data-testid="app-jobUrl-input"
        />
      </div>

      {/* Row 5: Dates (Applied Date & Deadline) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        <Input
          id="app-appliedDate"
          label="Date Applied"
          type="date"
          value={formData.appliedDate}
          onChange={(e) => handleChange('appliedDate', e.target.value)}
          error={errors.appliedDate}
          disabled={isLoading}
          data-testid="app-appliedDate-input"
        />

        <Input
          id="app-deadline"
          label="Application Deadline"
          type="date"
          value={formData.deadline}
          onChange={(e) => handleChange('deadline', e.target.value)}
          error={errors.deadline}
          disabled={isLoading}
          data-testid="app-deadline-input"
        />
      </div>

      {/* Row 6: Compensation / Salary */}
      <div style={{ marginTop: 'var(--space-md)' }}>
        <label className="form-label" style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>
          Compensation (Optional)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-sm)' }}>
          <Input
            id="app-salaryMin"
            label="Min Salary"
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 90000"
            value={formData.salaryMin}
            onChange={(e) => handleChange('salaryMin', e.target.value)}
            error={errors.salaryMin}
            disabled={isLoading}
            data-testid="app-salaryMin-input"
          />

          <Input
            id="app-salaryMax"
            label="Max Salary"
            type="number"
            min="0"
            step="1000"
            placeholder="e.g. 130000"
            value={formData.salaryMax}
            onChange={(e) => handleChange('salaryMax', e.target.value)}
            error={errors.salaryMax}
            disabled={isLoading}
            data-testid="app-salaryMax-input"
          />

          <Select
            id="app-salaryCurrency"
            label="Currency"
            value={formData.salaryCurrency}
            onChange={(e) => handleChange('salaryCurrency', e.target.value)}
            options={[
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
              { value: 'GBP', label: 'GBP (£)' },
              { value: 'CAD', label: 'CAD ($)' },
              { value: 'INR', label: 'INR (₹)' },
            ]}
            error={errors['salary.currency']}
            disabled={isLoading}
            placeholder={null}
            data-testid="app-salaryCurrency-select"
          />

          <Select
            id="app-salaryPeriod"
            label="Period"
            value={formData.salaryPeriod}
            onChange={(e) => handleChange('salaryPeriod', e.target.value)}
            options={SALARY_PERIODS.map((p) => ({ value: p, label: p }))}
            error={errors['salary.period']}
            disabled={isLoading}
            placeholder={null}
            data-testid="app-salaryPeriod-select"
          />
        </div>
      </div>

      {/* Row 7: Notes */}
      <div style={{ marginTop: 'var(--space-md)' }}>
        <Textarea
          id="app-notes"
          label="Personal Notes"
          placeholder="Add referral info, recruiter contacts, tech stack highlights, or thoughts on the role..."
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          error={errors.notes}
          disabled={isLoading}
          rows={3}
          maxLength={2000}
          helperText={`${formData.notes.length}/2000 characters`}
          data-testid="app-notes-textarea"
        />
      </div>

      {/* Form Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          marginTop: 'var(--space-lg)',
          paddingTop: 'var(--space-md)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="app-cancel-btn"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
          data-testid="app-submit-btn"
        >
          {isEdit ? 'Save Changes' : 'Create Application'}
        </Button>
      </div>
    </form>
  );
};

ApplicationForm.propTypes = {
  initialData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isLoading: PropTypes.bool,
  serverErrors: PropTypes.object,
  generalError: PropTypes.string,
};

export default ApplicationForm;
