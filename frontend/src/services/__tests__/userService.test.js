import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentUser, updateProfile, changePassword } from '../userService';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('userService (Phase 6.5C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('fetches /users/me using apiClient', async () => {
      apiClient.get.mockResolvedValueOnce({ data: { success: true, data: { name: 'Test' } } });

      const res = await getCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/users/me');
      expect(res.data.data.name).toBe('Test');
    });
  });

  describe('updateProfile', () => {
    it('sends only allowed fields to PATCH /users/me', async () => {
      apiClient.patch.mockResolvedValueOnce({ data: { success: true } });

      await updateProfile({
        name: ' New Name ',
        headline: ' New Headline ',
        targetRole: ' New Role ',
        email: 'should.not.be.sent@test.com', // disallowed
        role: 'admin', // disallowed
      });

      expect(apiClient.patch).toHaveBeenCalledWith('/users/me', {
        name: 'New Name',
        headline: 'New Headline',
        targetRole: 'New Role',
      });
      const sentPayload = apiClient.patch.mock.calls[0][1];
      expect(sentPayload).not.toHaveProperty('email');
      expect(sentPayload).not.toHaveProperty('role');
    });
  });

  describe('changePassword', () => {
    it('sends currentPassword and newPassword to PATCH /users/change-password', async () => {
      apiClient.patch.mockResolvedValueOnce({ data: { success: true } });

      await changePassword({
        currentPassword: 'CurrentPass1!',
        newPassword: 'NewPassword2@',
      });

      expect(apiClient.patch).toHaveBeenCalledWith('/users/change-password', {
        currentPassword: 'CurrentPass1!',
        newPassword: 'NewPassword2@',
      });
    });
  });
});
