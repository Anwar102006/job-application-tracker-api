import { apiClient } from './apiClient';
import {
  APPLICATION_STATUS_LIST,
  JOB_TYPES,
  WORKPLACE_TYPES,
  PRIORITY_LEVELS,
  SALARY_PERIODS,
} from '../constants/application.constants';

/**
 * Application Service (Phase 6.5D)
 *
 * Implements communication with backend application endpoints:
 * - POST   /api/v1/applications
 * - GET    /api/v1/applications
 * - GET    /api/v1/applications/:id
 * - PATCH  /api/v1/applications/:id
 * - PATCH  /api/v1/applications/:id/archive
 * - DELETE /api/v1/applications/:id
 *
 * Enforces strict backend payload sanitization to respect Zod strict schemas.
 */

/**
 * Sanitize query parameters for GET /applications to prevent sending
 * empty strings or unexpected keys to backend strict Zod query schema.
 *
 * @param {Object} [params={}] - Raw query parameters
 * @returns {Object} Cleaned query parameters
 */
export const sanitizeQueryParams = (params = {}) => {
  const clean = {};

  if (typeof params.search === 'string' && params.search.trim()) {
    clean.search = params.search.trim();
  }

  if (params.status && APPLICATION_STATUS_LIST.includes(params.status)) {
    clean.status = params.status;
  }

  if (params.priority && PRIORITY_LEVELS.includes(params.priority)) {
    clean.priority = params.priority;
  }

  if (params.jobType && JOB_TYPES.includes(params.jobType)) {
    clean.jobType = params.jobType;
  }

  if (params.workplaceType && WORKPLACE_TYPES.includes(params.workplaceType)) {
    clean.workplaceType = params.workplaceType;
  }

  if (params.isArchived !== undefined && params.isArchived !== null && params.isArchived !== '') {
    if (typeof params.isArchived === 'boolean') {
      clean.isArchived = params.isArchived ? 'true' : 'false';
    } else if (params.isArchived === 'true' || params.isArchived === 'false') {
      clean.isArchived = params.isArchived;
    }
  }

  if (typeof params.sortBy === 'string' && params.sortBy.trim()) {
    clean.sortBy = params.sortBy.trim();
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
 * Sanitize application body payload for create/update.
 * Removes empty strings, undefined keys, and invalid nested fields to satisfy strict Zod schemas.
 *
 * @param {Object} data - Raw form/application data
 * @param {boolean} [isUpdate=false] - Whether this is an update (PATCH) request
 * @returns {Object} Sanitized payload
 */
export const sanitizeApplicationPayload = (data = {}, isUpdate = false) => {
  const payload = {};

  if (data.company !== undefined) {
    payload.company = typeof data.company === 'string' ? data.company.trim() : data.company;
  }

  if (data.jobTitle !== undefined) {
    payload.jobTitle = typeof data.jobTitle === 'string' ? data.jobTitle.trim() : data.jobTitle;
  }

  if (data.jobType && JOB_TYPES.includes(data.jobType)) {
    payload.jobType = data.jobType;
  }

  if (data.workplaceType && WORKPLACE_TYPES.includes(data.workplaceType)) {
    payload.workplaceType = data.workplaceType;
  }

  if (data.location !== undefined && data.location !== null) {
    const loc = String(data.location).trim();
    if (loc || isUpdate) payload.location = loc;
  }

  if (data.jobUrl !== undefined && data.jobUrl !== null) {
    const url = String(data.jobUrl).trim();
    if (url || isUpdate) payload.jobUrl = url;
  }

  if (data.status && APPLICATION_STATUS_LIST.includes(data.status)) {
    payload.status = data.status;
  }

  if (data.priority && PRIORITY_LEVELS.includes(data.priority)) {
    payload.priority = data.priority;
  }

  if (data.appliedDate) {
    payload.appliedDate = new Date(data.appliedDate).toISOString();
  }

  if (data.deadline !== undefined) {
    if (data.deadline === null || data.deadline === '') {
      if (isUpdate) payload.deadline = null;
    } else {
      payload.deadline = new Date(data.deadline).toISOString();
    }
  }

  if (data.notes !== undefined && data.notes !== null) {
    const notesStr = String(data.notes).trim();
    if (notesStr || isUpdate) payload.notes = notesStr;
  }

  if (Array.isArray(data.tags)) {
    payload.tags = data.tags.map((t) => String(t).trim()).filter(Boolean);
  }

  // Handle salary object
  if (data.salary && typeof data.salary === 'object') {
    const salary = {};

    if (data.salary.min !== undefined && data.salary.min !== null && data.salary.min !== '') {
      const minVal = Number(data.salary.min);
      if (!isNaN(minVal)) salary.min = minVal;
    }

    if (data.salary.max !== undefined && data.salary.max !== null && data.salary.max !== '') {
      const maxVal = Number(data.salary.max);
      if (!isNaN(maxVal)) salary.max = maxVal;
    }

    if (data.salary.currency && String(data.salary.currency).trim().length === 3) {
      salary.currency = String(data.salary.currency).trim().toUpperCase();
    }

    if (data.salary.period && SALARY_PERIODS.includes(data.salary.period)) {
      salary.period = data.salary.period;
    }

    if (Object.keys(salary).length > 0) {
      payload.salary = salary;
    }
  }

  return payload;
};

/**
 * Create a new job application
 * @param {Object} data - Application creation payload
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const createApplication = async (data) => {
  const payload = sanitizeApplicationPayload(data, false);
  return apiClient.post('/applications', payload);
};

/**
 * Fetch paginated/filtered list of applications
 * @param {Object} [params={}] - Filter and pagination parameters
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getApplications = async (params = {}) => {
  const cleanParams = sanitizeQueryParams(params);
  return apiClient.get('/applications', { params: cleanParams });
};

/**
 * Fetch a single job application by ID
 * @param {string} id - Mongo ObjectId
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getApplicationById = async (id) => {
  return apiClient.get(`/applications/${id}`);
};

/**
 * Update an existing job application
 * @param {string} id - Mongo ObjectId
 * @param {Object} data - Application update payload
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const updateApplication = async (id, data) => {
  const payload = sanitizeApplicationPayload(data, true);
  return apiClient.patch(`/applications/${id}`, payload);
};

/**
 * Toggle archive status for an application
 * @param {string} id - Mongo ObjectId
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const archiveApplication = async (id) => {
  return apiClient.patch(`/applications/${id}/archive`);
};

/**
 * Delete an application permanently (cascades interviews on backend)
 * @param {string} id - Mongo ObjectId
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const deleteApplication = async (id) => {
  return apiClient.delete(`/applications/${id}`);
};

export default {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  archiveApplication,
  deleteApplication,
  sanitizeQueryParams,
  sanitizeApplicationPayload,
};
