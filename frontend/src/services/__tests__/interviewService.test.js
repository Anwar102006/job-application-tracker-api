import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as interviewService from '../interviewService';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('interviewService (Phase 6.5E)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. createInterview', () => {
    it('sends correct sanitized payload to POST /applications/:applicationId/interviews', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { _id: 'intv-001', round: 'Technical Round' } },
      });

      const input = {
        round: 'Technical Round',
        interviewDate: '2026-10-25T14:00:00.000Z',
        durationMinutes: 45,
        format: 'Video Call',
        meetingLink: ' https://zoom.us/j/123456789 ',
        interviewers: [' Alice Smith ', ' Bob Jones '],
        notes: ' Focus on system design and scaling ',
        status: 'Completed', // MUST BE STRIPPED on create per backend createInterviewSchema!
        extraBogusField: 'forbidden',
      };

      const res = await interviewService.createInterview('app-123', input);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      const [url, sentPayload] = apiClient.post.mock.calls[0];

      expect(url).toBe('/applications/app-123/interviews');
      expect(sentPayload.round).toBe('Technical Round');
      expect(sentPayload.interviewDate).toBe('2026-10-25T14:00:00.000Z');
      expect(sentPayload.durationMinutes).toBe(45);
      expect(sentPayload.format).toBe('Video Call');
      expect(sentPayload.meetingLink).toBe('https://zoom.us/j/123456789');
      expect(sentPayload.interviewers).toEqual(['Alice Smith', 'Bob Jones']);
      expect(sentPayload.notes).toBe('Focus on system design and scaling');
      expect(sentPayload).not.toHaveProperty('status');
      expect(sentPayload).not.toHaveProperty('extraBogusField');
      expect(res.data.data._id).toBe('intv-001');
    });

    it('handles comma-separated string for interviewers', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await interviewService.createInterview('app-123', {
        round: 'HR Screening',
        interviewDate: '2026-10-20T10:00:00.000Z',
        interviewers: 'Jane Doe, John Smith,  ',
      });

      const [, sentPayload] = apiClient.post.mock.calls[0];
      expect(sentPayload.interviewers).toEqual(['Jane Doe', 'John Smith']);
    });
  });

  describe('2. getInterviewsByApplication', () => {
    it('calls GET /applications/:applicationId/interviews', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: [{ _id: 'intv-1' }] },
      });

      const res = await interviewService.getInterviewsByApplication('app-456');

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      expect(apiClient.get).toHaveBeenCalledWith('/applications/app-456/interviews');
      expect(res.data.data).toHaveLength(1);
    });
  });

  describe('3. getInterviews', () => {
    it('sends only valid backend-supported query parameters to GET /interviews', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: [], meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 } },
      });

      const queryParams = {
        status: 'Scheduled',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        sortBy: 'interviewDate',
        sortOrder: 'asc',
        page: '2',
        limit: '25',
        unsupportedParam: 'attack_or_bogus',
      };

      await interviewService.getInterviews(queryParams);

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      const [url, config] = apiClient.get.mock.calls[0];

      expect(url).toBe('/interviews');
      expect(config.params.status).toBe('Scheduled');
      expect(config.params.sortBy).toBe('interviewDate');
      expect(config.params.sortOrder).toBe('asc');
      expect(config.params.page).toBe(2);
      expect(config.params.limit).toBe(25);
      expect(config.params).not.toHaveProperty('unsupportedParam');
    });

    it('omits invalid or unrecognized sort fields', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true } });

      await interviewService.getInterviews({
        sortBy: 'unsupportedField',
        sortOrder: 'invalidOrder',
        page: '-1',
      });

      const [, config] = apiClient.get.mock.calls[0];
      expect(config.params).not.toHaveProperty('sortBy');
      expect(config.params).not.toHaveProperty('sortOrder');
      expect(config.params).not.toHaveProperty('page');
    });
  });

  describe('4. getUpcomingInterviews', () => {
    it('calls GET /interviews/upcoming with sanitized days parameter', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: [] },
      });

      await interviewService.getUpcomingInterviews({ days: 14, bogus: 'ignored' });

      expect(apiClient.get).toHaveBeenCalledTimes(1);
      const [url, config] = apiClient.get.mock.calls[0];

      expect(url).toBe('/interviews/upcoming');
      expect(config.params.days).toBe(14);
      expect(config.params).not.toHaveProperty('bogus');
    });

    it('defaults or omits invalid days', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true } });

      await interviewService.getUpcomingInterviews({ days: 999 });

      const [, config] = apiClient.get.mock.calls[0];
      // 999 > 365 so it is omitted from query
      expect(config.params).not.toHaveProperty('days');
    });
  });

  describe('5. getInterviewById', () => {
    it('calls GET /interviews/:id', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: { _id: 'intv-999' } },
      });

      const res = await interviewService.getInterviewById('intv-999');

      expect(apiClient.get).toHaveBeenCalledWith('/interviews/intv-999');
      expect(res.data.data._id).toBe('intv-999');
    });
  });

  describe('6. updateInterview', () => {
    it('sends sanitized update payload including status to PATCH /interviews/:id', async () => {
      apiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: { _id: 'intv-001', status: 'Rescheduled' } },
      });

      const updateData = {
        round: 'System Design',
        interviewDate: '2026-10-28T16:00:00.000Z',
        durationMinutes: 90,
        status: 'Rescheduled', // Permitted in update!
        notes: 'Rescheduled upon candidate request',
        extraField: 'shouldBeOmitted',
      };

      const res = await interviewService.updateInterview('intv-001', updateData);

      expect(apiClient.patch).toHaveBeenCalledTimes(1);
      const [url, sentPayload] = apiClient.patch.mock.calls[0];

      expect(url).toBe('/interviews/intv-001');
      expect(sentPayload.round).toBe('System Design');
      expect(sentPayload.interviewDate).toBe('2026-10-28T16:00:00.000Z');
      expect(sentPayload.durationMinutes).toBe(90);
      expect(sentPayload.status).toBe('Rescheduled');
      expect(sentPayload.notes).toBe('Rescheduled upon candidate request');
      expect(sentPayload).not.toHaveProperty('extraField');
      expect(res.data.data.status).toBe('Rescheduled');
    });
  });

  describe('7. deleteInterview', () => {
    it('calls DELETE /interviews/:id', async () => {
      apiClient.delete.mockResolvedValueOnce({
        data: { success: true, message: 'Interview deleted' },
      });

      const res = await interviewService.deleteInterview('intv-001');

      expect(apiClient.delete).toHaveBeenCalledWith('/interviews/intv-001');
      expect(res.data.success).toBe(true);
    });
  });
});
