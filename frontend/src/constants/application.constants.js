/**
 * Application Constants (Phase 6.5D)
 *
 * Locked data contracts mirroring backend models, validators, and enums:
 * - src/constants/applicationStatus.js
 * - src/validators/application.validator.js
 */

export const APPLICATION_STATUS = Object.freeze({
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  INTERVIEWING: 'Interviewing',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  GHOSTED: 'Ghosted',
});

export const APPLICATION_STATUS_LIST = Object.freeze(Object.values(APPLICATION_STATUS));

export const JOB_TYPES = Object.freeze([
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
]);

export const WORKPLACE_TYPES = Object.freeze([
  'On-site',
  'Hybrid',
  'Remote',
]);

export const PRIORITY_LEVELS = Object.freeze([
  'Low',
  'Medium',
  'High',
]);

export const SALARY_PERIODS = Object.freeze([
  'Hourly',
  'Monthly',
  'Yearly',
]);

export const VALID_APPLICATION_TRANSITIONS = Object.freeze({
  [APPLICATION_STATUS.APPLIED]: [
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.INTERVIEWING,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
    APPLICATION_STATUS.GHOSTED,
  ],
  [APPLICATION_STATUS.SCREENING]: [
    APPLICATION_STATUS.INTERVIEWING,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
    APPLICATION_STATUS.GHOSTED,
  ],
  [APPLICATION_STATUS.INTERVIEWING]: [
    APPLICATION_STATUS.OFFERED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
    APPLICATION_STATUS.GHOSTED,
  ],
  [APPLICATION_STATUS.OFFERED]: [
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.REJECTED]: [], // Terminal state
  [APPLICATION_STATUS.WITHDRAWN]: [], // Terminal state
  [APPLICATION_STATUS.GHOSTED]: [
    APPLICATION_STATUS.SCREENING,
    APPLICATION_STATUS.INTERVIEWING,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.WITHDRAWN,
  ],
});

/**
 * Status presentation configuration for Badge components and labels
 */
export const STATUS_CONFIG = Object.freeze({
  [APPLICATION_STATUS.APPLIED]: {
    label: 'Applied',
    variant: 'info',
    description: 'Application submitted',
  },
  [APPLICATION_STATUS.SCREENING]: {
    label: 'Screening',
    variant: 'warning',
    description: 'Under initial resume/recruiter screening',
  },
  [APPLICATION_STATUS.INTERVIEWING]: {
    label: 'Interviewing',
    variant: 'primary',
    description: 'Interviews in progress',
  },
  [APPLICATION_STATUS.OFFERED]: {
    label: 'Offered',
    variant: 'success',
    description: 'Job offer extended',
  },
  [APPLICATION_STATUS.REJECTED]: {
    label: 'Rejected',
    variant: 'danger',
    description: 'Application not moving forward',
  },
  [APPLICATION_STATUS.WITHDRAWN]: {
    label: 'Withdrawn',
    variant: 'neutral',
    description: 'Candidate withdrew application',
  },
  [APPLICATION_STATUS.GHOSTED]: {
    label: 'Ghosted',
    variant: 'neutral',
    description: 'No response from employer after follow-up',
  },
});

/**
 * Priority presentation configuration
 */
export const PRIORITY_CONFIG = Object.freeze({
  Low: {
    label: 'Low',
    variant: 'neutral',
  },
  Medium: {
    label: 'Medium',
    variant: 'info',
  },
  High: {
    label: 'High',
    variant: 'danger',
  },
});

/**
 * Backend-supported sorting options for GET /applications
 */
export const SORT_OPTIONS = Object.freeze([
  { value: 'appliedDate', label: 'Date Applied' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'company', label: 'Company Name' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
]);
