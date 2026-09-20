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
