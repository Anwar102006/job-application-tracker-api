/**
 * Interview Constants (Phase 6.5E)
 *
 * Mirrors backend constants defined in:
 * src/constants/interviewStatus.js
 */

export const INTERVIEW_STATUS = Object.freeze({
  SCHEDULED: 'Scheduled',
  COMPLETED: 'Completed',
  RESCHEDULED: 'Rescheduled',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
});

export const INTERVIEW_STATUS_LIST = Object.freeze(Object.values(INTERVIEW_STATUS));

export const INTERVIEW_ROUNDS = Object.freeze([
  'HR Screening',
  'Technical Round',
  'Coding Assessment',
  'System Design',
  'Hiring Manager',
  'Behavioral',
  'Offer Discussion',
  'Other',
]);

export const INTERVIEW_FORMATS = Object.freeze([
  'Video Call',
  'Phone Call',
  'In-Person',
  'Online Assessment',
]);

/**
 * Finite State Machine for Interview Status Transitions
 * Exactly mirrors backend VALID_INTERVIEW_TRANSITIONS
 */
export const VALID_INTERVIEW_TRANSITIONS = Object.freeze({
  [INTERVIEW_STATUS.SCHEDULED]: Object.freeze([
    INTERVIEW_STATUS.COMPLETED,
    INTERVIEW_STATUS.RESCHEDULED,
    INTERVIEW_STATUS.CANCELLED,
    INTERVIEW_STATUS.NO_SHOW,
  ]),
  [INTERVIEW_STATUS.RESCHEDULED]: Object.freeze([
    INTERVIEW_STATUS.COMPLETED,
    INTERVIEW_STATUS.RESCHEDULED,
    INTERVIEW_STATUS.CANCELLED,
    INTERVIEW_STATUS.NO_SHOW,
  ]),
  [INTERVIEW_STATUS.NO_SHOW]: Object.freeze([
    INTERVIEW_STATUS.RESCHEDULED,
    INTERVIEW_STATUS.CANCELLED,
  ]),
  [INTERVIEW_STATUS.COMPLETED]: Object.freeze([]),
  [INTERVIEW_STATUS.CANCELLED]: Object.freeze([]),
});

/**
 * Visual configuration for Interview Status Badges
 */
export const INTERVIEW_STATUS_CONFIG = Object.freeze({
  [INTERVIEW_STATUS.SCHEDULED]: {
    label: 'Scheduled',
    variant: 'info',
    description: 'Interview is scheduled and pending.',
  },
  [INTERVIEW_STATUS.COMPLETED]: {
    label: 'Completed',
    variant: 'success',
    description: 'Interview has been completed.',
  },
  [INTERVIEW_STATUS.RESCHEDULED]: {
    label: 'Rescheduled',
    variant: 'warning',
    description: 'Interview date/time has been rescheduled.',
  },
  [INTERVIEW_STATUS.CANCELLED]: {
    label: 'Cancelled',
    variant: 'neutral',
    description: 'Interview was cancelled.',
  },
  [INTERVIEW_STATUS.NO_SHOW]: {
    label: 'No Show',
    variant: 'danger',
    description: 'Interview was missed or candidate/interviewer was a no-show.',
  },
});

/**
 * Visual configuration for Interview Formats
 */
export const INTERVIEW_FORMAT_CONFIG = Object.freeze({
  'Video Call': { label: 'Video Call', icon: 'video' },
  'Phone Call': { label: 'Phone Call', icon: 'phone' },
  'In-Person': { label: 'In-Person', icon: 'building' },
  'Online Assessment': { label: 'Online Assessment', icon: 'code' },
});

export const INTERVIEW_SORT_OPTIONS = Object.freeze([
  { value: 'interviewDate', label: 'Interview Date' },
  { value: 'createdAt', label: 'Date Added' },
  { value: 'durationMinutes', label: 'Duration' },
]);
