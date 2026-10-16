/**
 * Analytics Constants & Presentation Config (Phase 6.5F)
 *
 * Locked data contracts mirroring backend analytics controllers & services:
 * - GET /api/v1/analytics/overview
 * - GET /api/v1/analytics/status-breakdown
 * - GET /api/v1/analytics/conversion-rates
 * - GET /api/v1/analytics/monthly-trends
 */

export const TREND_HORIZONS = Object.freeze([
  { value: 3, label: 'Last 3 Months' },
  { value: 6, label: 'Last 6 Months (Default)' },
  { value: 12, label: 'Last 12 Months' },
  { value: 24, label: 'Last 24 Months' },
]);

export const DEFAULT_TREND_MONTHS = 6;

/**
 * Curated accessible palette mapped to design system tokens
 */
export const STATUS_COLORS = Object.freeze({
  Applied: '#3b82f6',      // Blue
  Screening: '#f59e0b',    // Amber
  Interviewing: '#8b5cf6', // Violet
  Offered: '#10b981',      // Emerald
  Rejected: '#ef4444',     // Crimson
  Withdrawn: '#64748b',    // Slate
  Ghosted: '#94a3b8',      // Gray
});

export const PRIORITY_COLORS = Object.freeze({
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
});

export const WORKPLACE_COLORS = Object.freeze({
  Remote: '#06b6d4',
  Hybrid: '#8b5cf6',
  'On-site': '#f97316',
});

export const JOB_TYPE_COLORS = Object.freeze({
  'Full-time': '#2563eb',
  'Part-time': '#0d9488',
  Contract: '#d97706',
  Internship: '#7c3aed',
  Freelance: '#db2777',
});

export const METRIC_TOOLTIPS = Object.freeze({
  totalApplications: 'Total non-archived job applications tracked in CareerPulse.',
  totalInterviews: 'Total scheduled and completed interview rounds across active applications.',
  interviewConversionRate: 'Percentage of active applications that progressed to at least one interview.',
  offerRate: 'Percentage of active applications that received a job offer.',
  rejectionRate: 'Percentage of active applications resulting in rejection.',
  offerToInterviewRate: 'Percentage of applications with interviews that converted into a job offer.',
  applicationToInterviewRate: 'Funnel step 1: Percentage of all applications reaching interview stage.',
  interviewToOfferRate: 'Funnel step 2: Percentage of interviewees who received a job offer.',
  applicationToOfferRate: 'End-to-end success rate: Applications resulting in a job offer.',
  applicationToRejectionRate: 'Overall rate of applications concluded with rejection.',
});
