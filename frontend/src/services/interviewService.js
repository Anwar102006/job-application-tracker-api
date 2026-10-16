import { apiClient } from './apiClient';
import {
  INTERVIEW_ROUNDS,
  INTERVIEW_FORMATS,
  INTERVIEW_STATUS_LIST,
  INTERVIEW_SORT_OPTIONS,
} from '../constants/interview.constants';

/**
 * Interview Service (Phase 6.5E)
 *
 * Implements communication with backend interview endpoints:
 * - POST   /api/v1/applications/:applicationId/interviews
 * - GET    /api/v1/applications/:applicationId/interviews
 * - GET    /api/v1/interviews
 * - GET    /api/v1/interviews/upcoming
 * - GET    /api/v1/interviews/:id
 * - PATCH  /api/v1/interviews/:id
 * - DELETE /api/v1/interviews/:id
 *
 * Enforces strict backend payload sanitization to respect Zod strict schemas.
 */

const ALLOWED_SORT_FIELDS = INTERVIEW_SORT_OPTIONS.map((opt) => opt.value);

/**
 * Sanitize query parameters for GET /interviews to satisfy strict backend schema.
 *
 * @param {Object} [params={}] - Raw query parameters
 * @returns {Object} Cleaned query parameters
 */
export const sanitizeQueryParams = (params = {}) => {
  const clean = {};

  if (params.status && INTERVIEW_STATUS_LIST.includes(params.status)) {
    clean.status = params.status;
  }

  if (params.startDate) {
    try {
      const d = new Date(params.startDate);
      if (!isNaN(d.getTime())) clean.startDate = d.toISOString();
    } catch {
      // ignore invalid date
    }
  }

  if (params.endDate) {
    try {
      const d = new Date(params.endDate);
      if (!isNaN(d.getTime())) clean.endDate = d.toISOString();
    } catch {
      // ignore invalid date
    }
  }

  if (params.sortBy && ALLOWED_SORT_FIELDS.includes(params.sortBy)) {
    clean.sortBy = params.sortBy;
  }

  if (params.sortOrder === 'asc' || params.sortOrder === 'desc') {
    clean.sortOrder = params.sortOrder;
  }

  if (params.page !== undefined && params.page !== null && params.page !== '') {
    const pageNum = parseInt(params.page, 10);
    if (!isNaN(pageNum) && pageNum >= 1) {
      clean.page = pageNum;
    }
  }

  if (params.limit !== undefined && params.limit !== null && params.limit !== '') {
    const limitNum = parseInt(params.limit, 10);
    if (!isNaN(limitNum) && limitNum >= 1 && limitNum <= 100) {
      clean.limit = limitNum;
    }
  }

  return clean;
};

/**
 * Sanitize query parameters for GET /interviews/upcoming.
 *
 * @param {Object} [params={}] - Raw upcoming query parameters
 * @returns {Object} Cleaned query parameters
 */
export const sanitizeUpcomingParams = (params = {}) => {
  const clean = {};

  if (params.days !== undefined && params.days !== null && params.days !== '') {
    const daysNum = parseInt(params.days, 10);
    if (!isNaN(daysNum) && daysNum >= 1 && daysNum <= 365) {
      clean.days = daysNum;
    }
  }

  return clean;
};

/**
 * Sanitize interview body payload for create/update.
 * Strictly respects backend createInterviewSchema and updateInterviewSchema.
 *
 * @param {Object} data - Raw form/interview data
 * @param {boolean} [isUpdate=false] - Whether this is an update (PATCH) request
 * @returns {Object} Sanitized payload
 */
export const sanitizeInterviewPayload = (data = {}, isUpdate = false) => {
  const payload = {};

  if (data.round && INTERVIEW_ROUNDS.includes(data.round)) {
    payload.round = data.round;
  }

  if (data.interviewDate) {
    try {
      const dateObj = new Date(data.interviewDate);
      if (!isNaN(dateObj.getTime())) {
        payload.interviewDate = dateObj.toISOString();
      }
    } catch {
      // ignore invalid date
    }
  }

  if (data.durationMinutes !== undefined && data.durationMinutes !== null && data.durationMinutes !== '') {
    const duration = parseInt(data.durationMinutes, 10);
    if (!isNaN(duration) && duration >= 15 && duration <= 480) {
      payload.durationMinutes = duration;
    }
  }

  if (data.format && INTERVIEW_FORMATS.includes(data.format)) {
    payload.format = data.format;
  }

  if (data.meetingLink !== undefined && data.meetingLink !== null) {
    const linkStr = String(data.meetingLink).trim();
    if (linkStr || isUpdate) payload.meetingLink = linkStr;
  }

  if (Array.isArray(data.interviewers)) {
    payload.interviewers = data.interviewers
      .map((item) => String(item).trim())
      .filter(Boolean);
  } else if (typeof data.interviewers === 'string') {
    payload.interviewers = data.interviewers
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (data.notes !== undefined && data.notes !== null) {
    const notesStr = String(data.notes).trim();
    if (notesStr || isUpdate) payload.notes = notesStr;
  }

  // Status is ONLY allowed during update, NOT during create (backend sets it to Scheduled by default)
  if (isUpdate && data.status && INTERVIEW_STATUS_LIST.includes(data.status)) {
    payload.status = data.status;
  }

  return payload;
};

/**
 * Schedule a new interview for a job application
 *
 * @param {string} applicationId - Target application ID
 * @param {Object} data - Interview payload
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const createInterview = async (applicationId, data) => {
  const payload = sanitizeInterviewPayload(data, false);
  return apiClient.post(`/applications/${applicationId}/interviews`, payload);
};

/**
 * Fetch all interviews for a specific job application
 *
 * @param {string} applicationId - Target application ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getInterviewsByApplication = async (applicationId) => {
  return apiClient.get(`/applications/${applicationId}/interviews`);
};

/**
 * Fetch all interviews for the authenticated user (paginated & filtered)
 *
 * @param {Object} [params={}] - Filter and pagination options
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getInterviews = async (params = {}) => {
  const cleanParams = sanitizeQueryParams(params);
  return apiClient.get('/interviews', { params: cleanParams });
};

/**
 * Fetch upcoming scheduled interviews within the specified horizon
 *
 * @param {Object} [params={}] - Horizon filter (e.g. { days: 7 })
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getUpcomingInterviews = async (params = {}) => {
  const cleanParams = sanitizeUpcomingParams(params);
  return apiClient.get('/interviews/upcoming', { params: cleanParams });
};

/**
 * Fetch single interview details by ID
 *
 * @param {string} id - Interview ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getInterviewById = async (id) => {
  return apiClient.get(`/interviews/${id}`);
};

/**
 * Update an existing interview (reschedule, change status, add notes)
 *
 * @param {string} id - Interview ID
 * @param {Object} data - Update payload
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const updateInterview = async (id, data) => {
  const payload = sanitizeInterviewPayload(data, true);
  return apiClient.patch(`/interviews/${id}`, payload);
};

/**
 * Delete an interview permanently
 *
 * @param {string} id - Interview ID
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const deleteInterview = async (id) => {
  return apiClient.delete(`/interviews/${id}`);
};

export default {
  createInterview,
  getInterviewsByApplication,
  getInterviews,
  getUpcomingInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  sanitizeInterviewPayload,
  sanitizeQueryParams,
  sanitizeUpcomingParams,
};
