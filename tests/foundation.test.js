import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { ApiError } from '../src/utils/ApiError.js';
import { ApiResponse } from '../src/utils/ApiResponse.js';

describe('Phase 1 Foundation & Smoke Tests', () => {
  describe('Health Endpoint', () => {
    it('should return 200 and healthy status on GET /api/v1/health', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('statusCode', 200);
      expect(res.body.data).toHaveProperty('status', 'healthy');
      expect(res.body.data).toHaveProperty('timestamp');
    });
  });

  describe('404 Route Handling', () => {
    it('should return 404 for unmapped route', async () => {
      const res = await request(app).get('/api/v1/non-existent-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('statusCode', 404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Route not found');
    });
  });

  describe('ApiError and ApiResponse Utilities', () => {
    it('should construct an operational ApiError correctly', () => {
      const error = new ApiError(409, 'Conflict detected', [{ field: 'email', message: 'In use' }]);

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Conflict detected');
      expect(error.isOperational).toBe(true);
      expect(error.errors).toHaveLength(1);
    });

    it('should construct an ApiResponse correctly', () => {
      const response = new ApiResponse(201, { id: '123' }, 'Resource created');

      expect(response.statusCode).toBe(201);
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: '123' });
      expect(response.message).toBe('Resource created');
    });
  });

  describe('Database In-Memory Connection', () => {
    it('should be connected to MongoDB in test environment', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });
  });
});
