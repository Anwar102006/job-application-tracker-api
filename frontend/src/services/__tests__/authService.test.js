import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login, logout } from '../authService';
import { apiClient, refreshClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
  refreshClient: {
    post: vi.fn(),
  },
}));

describe('authService (Phase 6.5C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('sends sanitized payload with required fields only', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await register({
        name: '  Alice Bob  ',
        email: '  Alice@Example.COM ',
        password: 'Password123!',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Alice Bob',
        email: 'alice@example.com',
        password: 'Password123!',
      });
    });

    it('includes headline and targetRole only when provided', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await register({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
        headline: '  Software Engineer  ',
        targetRole: '  Frontend Lead  ',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'Password123!',
        headline: 'Software Engineer',
        targetRole: 'Frontend Lead',
      });
    });
  });

  describe('login', () => {
    it('sends email and password to /auth/login', async () => {
      apiClient.post.mockResolvedValueOnce({ data: { success: true } });

      await login({
        email: ' User@Domain.com ',
        password: 'SecretPassword',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'user@domain.com',
        password: 'SecretPassword',
      });
    });
  });

  describe('logout', () => {
    it('uses refreshClient with refreshToken to prevent interceptor loops', async () => {
      refreshClient.post.mockResolvedValueOnce({ data: { success: true } });

      await logout('some-refresh-token');

      expect(refreshClient.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'some-refresh-token',
      });
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });
});
