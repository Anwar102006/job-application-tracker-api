import { apiClient } from './apiClient';
import { DEFAULT_TREND_MONTHS } from '../constants/analytics.constants';

/**
 * Analytics Service (Phase 6.5F)
 *
 * Implements communication with backend analytics endpoints:
 * - GET /api/v1/analytics/overview
 * - GET /api/v1/analytics/status-breakdown
 * - GET /api/v1/analytics/conversion-rates
 * - GET /api/v1/analytics/monthly-trends
 *
 * Enforces strict query parameter sanitization to satisfy backend Zod schemas.
 */

/**
 * Sanitize query parameters for GET /analytics/monthly-trends.
 * Backend schema accepts only `months` (int 1-24) and rejects unrecognized keys with 400.
 *
 * @param {Object} [params={}] - Raw query parameters
 * @returns {Object} Cleaned query parameters
 */
export const sanitizeTrendsParams = (params = {}) => {
  const clean = {};

  if (params.months !== undefined && params.months !== null && params.months !== '') {
    const num = Number(params.months);
    if (!isNaN(num) && Number.isInteger(num) && num >= 1 && num <= 24) {
      clean.months = num;
    }
  }

  return clean;
};

/**
 * Fetch high-level analytics overview metrics
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getOverview = async () => {
  return apiClient.get('/analytics/overview');
};

/**
 * Fetch application status, priority, job type, and workplace breakdowns
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getStatusBreakdown = async () => {
  return apiClient.get('/analytics/status-breakdown');
};

/**
 * Fetch application-to-interview and interview-to-offer conversion rates
 *
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getConversionRates = async () => {
  return apiClient.get('/analytics/conversion-rates');
};

/**
 * Fetch monthly application volume trends over the specified window (1-24 months)
 *
 * @param {Object} [params={ months: 6 }] - Horizon options
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export const getMonthlyTrends = async (params = { months: DEFAULT_TREND_MONTHS }) => {
  const cleanParams = sanitizeTrendsParams(params);
  return apiClient.get('/analytics/monthly-trends', { params: cleanParams });
};

export default {
  getOverview,
  getStatusBreakdown,
  getConversionRates,
  getMonthlyTrends,
  sanitizeTrendsParams,
};
