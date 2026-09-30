import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as applicationService from '../applicationService';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('applicationService (Phase 6.5D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. createApplication', () => {
    it('sends correct sanitized payload to POST /applications', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: { success: true, data: { _id: 'app-1', company: 'Google', jobTitle: 'Software Engineer' } },
      });

      const input = {
        company: '  Google  ',
        jobTitle: ' Software Engineer ',
        status: 'Ghosted', // Backend-supported Ghosted status must be preserved!
        priority: 'High',
        jobType: 'Full-time',
        workplaceType: 'Remote',
        location: ' Mountain View, CA ',
        jobUrl: ' https://careers.google.com/123 ',
        appliedDate: '2026-09-30',
        deadline: '2026-10-31',
        salary: {
          min: '150000',
          max: '200000',
          currency: 'usd',
          period: 'Yearly',
        },
        notes: ' Reached out via recruiter on LinkedIn ',
        extraBogusField: 'should be stripped',
      };

      const res = await applicationService.createApplication(input);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      const [url, sentPayload] = apiClient.post.mock.calls[0];

      expect(url).toBe('/applications');
      expect(sentPayload.company).toBe('Google');
      expect(sentPayload.jobTitle).toBe('Software Engineer');
      expect(sentPayload.status).toBe('Ghosted');
      expect(sentPayload.priority).toBe('High');
      expect(sentPayload.jobType).toBe('Full-time');
      expect(sentPayload.workplaceType).toBe('Remote');
      expect(sentPayload.location).toBe('Mountain View, CA');
      expect(sentPayload.jobUrl).toBe('https://careers.google.com/123');
      expect(sentPayload.salary).toEqual({
        min: 150000,
        max: 200000,
        currency: 'USD',
        period: 'Yearly',
      });
      expect(sentPayload.notes).toBe('Reached out via recruiter on LinkedIn');
      expect(sentPayload).not.toHaveProperty('extraBogusField');
      expect(res.data.data._id).toBe('app-1');
    });

    it('omits empty salary and undefined optional fields', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await applicationService.createApplication({
        company: 'Stripe',
        jobTitle: 'Backend Engineer',
        salary: { min: '', max: '', currency: '' },
      });

      const [, sentPayload] = apiClient.post.mock.calls[0];
      expect(sentPayload.company).toBe('Stripe');
      expect(sentPayload.jobTitle).toBe('Backend Engineer');
      expect(sentPayload).not.toHaveProperty('salary');
      expect(sentPayload).not.toHaveProperty('location');
    });
  });

  describe('2. getApplications', () => {
    it('sends supported query parameters to GET /applications', async () => {
      apiClient.get.mockResolvedValueOnce({
        data: { success: true, data: [], meta: { page: 1, limit: 10, totalDocs: 0, totalPages: 1 } },
      });

      const queryParams = {
        search: ' engineer ',
        status: 'Interviewing',
        priority: 'High',
        jobType: 'Full-time',
        workplaceType: 'Remote',
        isArchived: true,
        sortBy: 'company',
        sortOrder: 'asc',
        page: 2,
        limit: 20,
      };

      await applicationService.getApplications(queryParams);

      expect(apiClient.get).toHaveBeenCalledWith('/applications', {
        params: {
          search: 'engineer',
          status: 'Interviewing',
          priority: 'High',
          jobType: 'Full-time',
          workplaceType: 'Remote',
          isArchived: 'true',
          sortBy: 'company',
          sortOrder: 'asc',
          page: 2,
          limit: 20,
        },
      });
    });

    it('strips empty or unsupported parameters to prevent strict Zod validation failure', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true } });

      await applicationService.getApplications({
        search: '',
        status: '', // empty status should not be sent
        bogusFilter: 'evil', // not supported
        page: '1',
      });

      expect(apiClient.get).toHaveBeenCalledWith('/applications', {
        params: {
          page: 1,
        },
      });
      const sentParams = apiClient.get.mock.calls[0][1].params;
      expect(sentParams).not.toHaveProperty('status');
      expect(sentParams).not.toHaveProperty('search');
      expect(sentParams).not.toHaveProperty('bogusFilter');
    });
  });

  describe('3. getApplicationById', () => {
    it('uses correct endpoint GET /applications/:id', async () => {
      const mockApp = { _id: '507f1f77bcf86cd799439011', company: 'Apple' };
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: mockApp } });

      const res = await applicationService.getApplicationById('507f1f77bcf86cd799439011');

      expect(apiClient.get).toHaveBeenCalledWith('/applications/507f1f77bcf86cd799439011');
      expect(res.data.data.company).toBe('Apple');
    });
  });

  describe('4. updateApplication', () => {
    it('uses correct endpoint PATCH /applications/:id with sanitized payload', async () => {
      apiClient.patch.mockResolvedValueOnce({ data: { success: true } });

      const updateData = {
        status: 'Screening',
        notes: 'Had screening call today',
        unsupportedField: 'ignored',
      };

      await applicationService.updateApplication('507f1f77bcf86cd799439011', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/applications/507f1f77bcf86cd799439011',
        {
          status: 'Screening',
          notes: 'Had screening call today',
        }
      );
    });
  });

  describe('5. archiveApplication', () => {
    it('uses correct endpoint PATCH /applications/:id/archive', async () => {
      apiClient.patch.mockResolvedValueOnce({
        data: { success: true, data: { _id: '507f1f77bcf86cd799439011', isArchived: true } },
      });

      const res = await applicationService.archiveApplication('507f1f77bcf86cd799439011');

      expect(apiClient.patch).toHaveBeenCalledWith('/applications/507f1f77bcf86cd799439011/archive');
      expect(res.data.data.isArchived).toBe(true);
    });
  });

  describe('6. deleteApplication', () => {
    it('uses correct endpoint DELETE /applications/:id', async () => {
      apiClient.delete.mockResolvedValueOnce({
        data: { success: true, message: 'Application deleted successfully' },
      });

      const res = await applicationService.deleteApplication('507f1f77bcf86cd799439011');

      expect(apiClient.delete).toHaveBeenCalledWith('/applications/507f1f77bcf86cd799439011');
      expect(res.data.message).toBe('Application deleted successfully');
    });
  });
});
