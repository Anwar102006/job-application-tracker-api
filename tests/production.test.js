import request from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

describe('Phase 6: Production Readiness & Documentation Tests', () => {
  describe('Swagger UI & Documentation Infrastructure', () => {
    it('should serve Swagger UI at GET /api/v1/docs/ with 200 OK and HTML content', async () => {
      const res = await request(app).get('/api/v1/docs/');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('Swagger UI');
    });

    it('should serve raw OpenAPI JSON specification at GET /api/v1/docs/swagger.json with 200 OK', async () => {
      const res = await request(app).get('/api/v1/docs/swagger.json');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toHaveProperty('openapi', '3.0.3');
      expect(res.body).toHaveProperty('info');
      expect(res.body.info).toHaveProperty('title', 'Job Application Tracker API');
      expect(res.body).toHaveProperty('paths');

      // Verify all 25 existing API operations are documented
      let documentedOperationCount = 0;
      for (const pathKey in res.body.paths) {
        documentedOperationCount += Object.keys(res.body.paths[pathKey]).length;
      }

      // Exactly 25 documented API endpoints (24 domain + 1 health)
      expect(documentedOperationCount).toBe(25);

      // Verify documentation routes are NOT listed as domain endpoints in the spec
      expect(res.body.paths['/docs']).toBeUndefined();
      expect(res.body.paths['/docs/swagger.json']).toBeUndefined();

      // Verify security scheme uses bearerAuth
      expect(res.body.components.securitySchemes).toHaveProperty('bearerAuth');
      expect(res.body.components.securitySchemes.bearerAuth).toHaveProperty('type', 'http');
      expect(res.body.components.securitySchemes.bearerAuth).toHaveProperty('scheme', 'bearer');
    });
  });

  describe('Health Check Infrastructure Contract', () => {
    it('should return 200 OK with operational status and ISO timestamp', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.statusCode).toBe(200);
      expect(res.body.message).toBe('Job Application Tracker API is operational');
      expect(res.body.data).toHaveProperty('status', 'healthy');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(new Date(res.body.data.timestamp).toISOString()).toBe(res.body.data.timestamp);
    });
  });

  describe('Production Environment & Pool Configuration', () => {
    it('should have valid TRUST_PROXY and DB pool defaults in env config', () => {
      expect(env).toHaveProperty('TRUST_PROXY');
      expect(typeof env.TRUST_PROXY).toBe('string');

      expect(env).toHaveProperty('DB_MAX_POOL_SIZE');
      expect(typeof env.DB_MAX_POOL_SIZE).toBe('number');
      expect(env.DB_MAX_POOL_SIZE).toBeGreaterThanOrEqual(1);

      expect(env).toHaveProperty('DB_MIN_POOL_SIZE');
      expect(typeof env.DB_MIN_POOL_SIZE).toBe('number');
      expect(env.DB_MIN_POOL_SIZE).toBeGreaterThanOrEqual(1);

      expect(env).toHaveProperty('DB_SERVER_SELECTION_TIMEOUT_MS');
      expect(typeof env.DB_SERVER_SELECTION_TIMEOUT_MS).toBe('number');

      expect(env).toHaveProperty('DB_SOCKET_TIMEOUT_MS');
      expect(typeof env.DB_SOCKET_TIMEOUT_MS).toBe('number');
    });
  });
});
