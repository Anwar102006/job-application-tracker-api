import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as analyticsService from '../analyticsService';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('analyticsService (Phase 6.5F)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. getOverview', () => {
    it('calls GET /analytics/overview and returns backend payload', async () => {
      const mockOverview = {
        totalApplications: 12,
        totalInterviews: 8,
        interviewConversionRate: 50.0,
        offerRate: 16.7,
        rejectionRate: 25.0,
        offerToInterviewRate: 33.3,
      };

      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockOverview },
      });

      const res = await analyticsService.getOverview();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/overview');
      expect(res.data.data).toEqual(mockOverview);
    });
  });

  describe('2. getStatusBreakdown', () => {
    it('calls GET /analytics/status-breakdown and returns breakdown structure', async () => {
      const mockBreakdown = {
        byStatus: {
          Applied: 4,
          Screening: 2,
          Interviewing: 3,
          Offered: 2,
          Rejected: 1,
          Withdrawn: 0,
          Ghosted: 0,
        },
        byPriority: { Low: 3, Medium: 6, High: 3 },
        byJobType: {
          'Full-time': 8,
          'Part-time': 2,
          Contract: 1,
          Internship: 1,
          Freelance: 0,
        },
        byWorkplaceType: {
          'On-site': 2,
          Hybrid: 6,
          Remote: 4,
        },
      };

      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockBreakdown },
      });

      const res = await analyticsService.getStatusBreakdown();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/status-breakdown');
      expect(res.data.data).toEqual(mockBreakdown);
    });
  });

  describe('3. getConversionRates', () => {
    it('calls GET /analytics/conversion-rates and returns conversion metrics', async () => {
      const mockConversion = {
        totalApplications: 10,
        applicationsWithInterviews: 5,
        offeredApplications: 2,
        rejectedApplications: 3,
        applicationToInterviewRate: 50.0,
        interviewToOfferRate: 40.0,
        applicationToOfferRate: 20.0,
        applicationToRejectionRate: 30.0,
      };

      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockConversion },
      });

      const res = await analyticsService.getConversionRates();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/conversion-rates');
      expect(res.data.data).toEqual(mockConversion);
    });
  });

  describe('4. getMonthlyTrends', () => {
    it('calls GET /analytics/monthly-trends with default months=6', async () => {
      const mockTrends = [
        { month: '2026-05', count: 1 },
        { month: '2026-06', count: 3 },
        { month: '2026-07', count: 2 },
        { month: '2026-08', count: 4 },
        { month: '2026-09', count: 0 },
        { month: '2026-10', count: 2 },
      ];

      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: mockTrends },
      });

      const res = await analyticsService.getMonthlyTrends();

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/analytics/monthly-trends', {
        params: { months: 6 },
      });
      expect(res.data.data).toEqual(mockTrends);
    });

    it('passes custom valid months integer', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

      await analyticsService.getMonthlyTrends({ months: 12 });

      expect(apiClient.get).toHaveBeenCalledWith('/analytics/monthly-trends', {
        params: { months: 12 },
      });
    });

    it('sanitizes and excludes unrecognized query parameters to avoid 400', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

      await analyticsService.getMonthlyTrends({
        months: 3,
        status: 'Applied',
        userId: 'hack',
        arbitrary: 'test',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/analytics/monthly-trends', {
        params: { months: 3 },
      });
    });
  });

  describe('5. sanitizeTrendsParams helper', () => {
    it('returns empty object when no params provided', () => {
      expect(analyticsService.sanitizeTrendsParams()).toEqual({});
      expect(analyticsService.sanitizeTrendsParams({})).toEqual({});
    });

    it('validates integer range 1 to 24 inclusive', () => {
      expect(analyticsService.sanitizeTrendsParams({ months: 1 })).toEqual({ months: 1 });
      expect(analyticsService.sanitizeTrendsParams({ months: 24 })).toEqual({ months: 24 });
      expect(analyticsService.sanitizeTrendsParams({ months: '6' })).toEqual({ months: 6 });

      // Out of bounds
      expect(analyticsService.sanitizeTrendsParams({ months: 0 })).toEqual({});
      expect(analyticsService.sanitizeTrendsParams({ months: 25 })).toEqual({});
      expect(analyticsService.sanitizeTrendsParams({ months: -5 })).toEqual({});

      // Non-integer and invalid types
      expect(analyticsService.sanitizeTrendsParams({ months: 5.5 })).toEqual({});
      expect(analyticsService.sanitizeTrendsParams({ months: 'abc' })).toEqual({});
      expect(analyticsService.sanitizeTrendsParams({ months: null })).toEqual({});
    });

    it('strictly strips unrecognized keys', () => {
      const input = { months: 6, extra: 'forbidden', limit: 10 };
      expect(analyticsService.sanitizeTrendsParams(input)).toEqual({ months: 6 });
    });
  });
});
