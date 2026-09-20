import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { RefreshToken } from '../../src/models/RefreshToken.js';
import { authenticate } from '../../src/middlewares/auth.middleware.js';
import { errorHandler } from '../../src/middlewares/error.middleware.js';
import { hashToken } from '../../src/utils/token.util.js';
import { env } from '../../src/config/env.js';

// Setup test app to verify auth middleware end-to-end
const protectedTestApp = express();
protectedTestApp.use(express.json());
protectedTestApp.get('/api/v1/protected-test', authenticate, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
protectedTestApp.use(errorHandler);

describe('Phase 2: Authentication & Identity Tests', () => {
  const validUserData = {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    password: 'Password123!',
    headline: 'Full Stack Engineer',
    targetRole: 'Backend Developer',
  };

  describe('User Registration (POST /api/v1/auth/register)', () => {
    it('should register a new user successfully with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User registered successfully');
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toBe(validUserData.name);
      expect(res.body.data.email).toBe(validUserData.email.toLowerCase());
      expect(res.body.data.headline).toBe(validUserData.headline);
      expect(res.body.data.targetRole).toBe(validUserData.targetRole);

      // Security check: password is NEVER returned in response
      expect(res.body.data.password).toBeUndefined();

      // Database check: password is saved as bcrypt hash
      const dbUser = await User.findOne({ email: validUserData.email.toLowerCase() }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(validUserData.password);
      expect(dbUser.password.startsWith('$2b$12$')).toBe(true);

      const isPasswordValid = await bcrypt.compare(validUserData.password, dbUser.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          name: 'Alice Duplicate',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email address is already registered');
    });

    it('should reject registration with invalid email or short password with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Bob',
          email: 'not-an-email',
          password: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject registration containing unknown fields with 400 Bad Request (Zod .strict())', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validUserData,
          email: 'unknown-field@example.com',
          role: 'admin',
          isAdmin: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
    });
  });

  describe('User Login (POST /api/v1/auth/login)', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
    });

    it('should login successfully with valid credentials and return token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Security check: password is not in user response
      expect(res.body.data.user.password).toBeUndefined();

      // Verify Access Token payload
      const decodedAccess = jwt.verify(res.body.data.accessToken, env.JWT_ACCESS_SECRET);
      expect(decodedAccess.sub).toBe(res.body.data.user._id);

      // Verify Refresh Token: ONLY the SHA-256 hash is stored in MongoDB
      const rawRefreshToken = res.body.data.refreshToken;
      expect(rawRefreshToken).toHaveLength(80); // 40 bytes hex = 80 characters

      const expectedHash = hashToken(rawRefreshToken);
      const dbRefreshToken = await RefreshToken.findOne({ tokenHash: expectedHash });
      expect(dbRefreshToken).not.toBeNull();
      expect(dbRefreshToken.userId.toString()).toBe(res.body.data.user._id);

      // Verify raw token is NOT in database
      const rawInDb = await RefreshToken.findOne({ tokenHash: rawRefreshToken });
      expect(rawInDb).toBeNull();
    });

    it('should reject login with incorrect password with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'does-not-exist@example.com',
          password: validUserData.password,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with unknown fields with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
          extraField: 'malicious-data',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
    });
  });

  describe('Authentication Middleware (authenticate)', () => {
    let accessToken;
    let userId;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send(validUserData);
      userId = regRes.body.data._id;

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: validUserData.email,
        password: validUserData.password,
      });
      accessToken = loginRes.body.data.accessToken;
    });

    it('should allow access and attach req.user with valid access token', async () => {
      const res = await request(protectedTestApp)
        .get('/api/v1/protected-test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user._id).toBe(userId);
      expect(res.body.user.email).toBe(validUserData.email.toLowerCase());
    });

    it('should reject request missing Authorization header with 401 Unauthorized', async () => {
      const res = await request(protectedTestApp).get('/api/v1/protected-test');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authentication token is required');
    });

    it('should reject malformed Authorization header with 401 Unauthorized', async () => {
      const res = await request(protectedTestApp)
        .get('/api/v1/protected-test')
        .set('Authorization', 'Basic some-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject expired access token with 401 Unauthorized', async () => {
      const expiredToken = jwt.sign(
        { sub: userId },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(protectedTestApp)
        .get('/api/v1/protected-test')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expired');
    });

    it('should reject access token signed with invalid secret with 401 Unauthorized', async () => {
      const tamperedToken = jwt.sign(
        { sub: userId },
        'wrong-secret-key-that-does-not-match-32-chars-long'
      );

      const res = await request(protectedTestApp)
        .get('/api/v1/protected-test')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid authentication token');
    });

    it('should reject request if user in token no longer exists in DB with 401 Unauthorized', async () => {
      await User.findByIdAndDelete(userId);

      const res = await request(protectedTestApp)
        .get('/api/v1/protected-test')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('no longer exists');
    });
  });

  describe('Refresh Token Rotation (POST /api/v1/auth/refresh-token)', () => {
    let initialRefreshToken;

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: validUserData.email,
        password: validUserData.password,
      });
      initialRefreshToken = loginRes.body.data.refreshToken;
    });

    it('should rotate refresh token successfully and return a new token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // The new refresh token must be different from the consumed one
      expect(res.body.data.refreshToken).not.toBe(initialRefreshToken);
      expect(typeof res.body.data.accessToken).toBe('string');
      const decodedNewAccess = jwt.verify(res.body.data.accessToken, env.JWT_ACCESS_SECRET);
      expect(decodedNewAccess.sub).toBeDefined();

      // Verify the new token is valid in MongoDB
      const newHash = hashToken(res.body.data.refreshToken);
      const newDbRecord = await RefreshToken.findOne({ tokenHash: newHash });
      expect(newDbRecord).not.toBeNull();

      // Verify the old token was atomically deleted from MongoDB
      const oldHash = hashToken(initialRefreshToken);
      const oldDbRecord = await RefreshToken.findOne({ tokenHash: oldHash });
      expect(oldDbRecord).toBeNull();
    });

    it('should make old refresh token immediately unusable after rotation (anti-replay)', async () => {
      // First rotation succeeds
      const firstRotation = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialRefreshToken });
      expect(firstRotation.status).toBe(200);

      // Second attempt using the same initial refresh token must fail with 401
      const replayAttempt = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialRefreshToken });

      expect(replayAttempt.status).toBe(401);
      expect(replayAttempt.body.success).toBe(false);
      expect(replayAttempt.body.message).toBe('Invalid or revoked refresh token');
    });

    it('should allow consecutive rotation with the newly issued refresh token', async () => {
      // Rotation 1
      const res1 = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialRefreshToken });
      expect(res1.status).toBe(200);
      const secondRefreshToken = res1.body.data.refreshToken;

      // Rotation 2 using the newly issued token
      const res2 = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: secondRefreshToken });
      expect(res2.status).toBe(200);
      expect(res2.body.data.refreshToken).not.toBe(secondRefreshToken);
    });

    it('should reject non-existent or invalid refresh token with 401 Unauthorized', async () => {
      const fakeToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: fakeToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or revoked refresh token');
    });

    it('should reject expired refresh token with 401 Unauthorized', async () => {
      // Find current user
      const user = await User.findOne({ email: validUserData.email });

      // Create an expired refresh token in DB
      const expiredRawToken = '11111111112222222222333333333344444444445555555555666666666677777777778888888888';
      const expiredHash = hashToken(expiredRawToken);
      await RefreshToken.create({
        userId: user._id,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 60000), // 1 minute in past
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: expiredRawToken });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('User Logout (POST /api/v1/auth/logout)', () => {
    let activeRefreshToken;

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: validUserData.email,
        password: validUserData.password,
      });
      activeRefreshToken = loginRes.body.data.refreshToken;
    });

    it('should revoke active refresh token on logout with 200 OK', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: activeRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Verify token hash was deleted from DB
      const tokenHash = hashToken(activeRefreshToken);
      const dbRecord = await RefreshToken.findOne({ tokenHash });
      expect(dbRecord).toBeNull();
    });

    it('should ensure revoked refresh token cannot be used to refresh session', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: activeRefreshToken });

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: activeRefreshToken });

      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.success).toBe(false);
      expect(refreshRes.body.message).toBe('Invalid or revoked refresh token');
    });

    it('should handle already-revoked or non-existent token safely and idempotently on logout', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'randomnonexistentrefreshtoken1234567890123456789012345678901234567890' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('Security & Sensitive Data Exposure Checks', () => {
    it('should never expose password hash, refresh token hash, or JWT secret in any response', async () => {
      const regRes = await request(app).post('/api/v1/auth/register').send({
        ...validUserData,
        email: 'security.check@example.com',
      });

      const regBodyString = JSON.stringify(regRes.body);
      expect(regBodyString).not.toContain('$2b$12$');
      expect(regBodyString).not.toContain('password');

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'security.check@example.com',
        password: validUserData.password,
      });

      const loginBodyString = JSON.stringify(loginRes.body);
      expect(loginBodyString).not.toContain('$2b$12$');
      expect(loginBodyString).not.toContain(env.JWT_ACCESS_SECRET);

      const tokenHash = hashToken(loginRes.body.data.refreshToken);
      expect(loginBodyString).not.toContain(tokenHash);
    });
  });
});
