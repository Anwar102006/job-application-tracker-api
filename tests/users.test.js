import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { RefreshToken } from '../src/models/RefreshToken.js';

describe('Phase 5: User Profile & Security Tests', () => {
  const userData = {
    name: 'Ada Lovelace',
    email: 'ada.lovelace@example.com',
    password: 'Password123!',
    headline: 'Computational Mathematician',
    targetRole: 'Senior Research Scientist',
  };

  let token;
  let userId;

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    userId = regRes.body.data._id;

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    token = loginRes.body.data.accessToken;
  });

  describe('GET /api/v1/users/me', () => {
    it('should retrieve the authenticated user profile with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', userId);
      expect(res.body.data.name).toBe(userData.name);
      expect(res.body.data.email).toBe(userData.email.toLowerCase());
      expect(res.body.data.headline).toBe(userData.headline);
      expect(res.body.data.targetRole).toBe(userData.targetRole);
      expect(res.body.data).toHaveProperty('createdAt');
      expect(res.body.data).toHaveProperty('updatedAt');
    });

    it('should never expose password or internal token hashes in profile response', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.tokenHash).toBeUndefined();
    });

    it('should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update allowed fields (name, headline, targetRole) with 200 OK', async () => {
      const updatePayload = {
        name: 'Augusta Ada King',
        headline: 'First Computer Programmer',
        targetRole: 'Principal Systems Architect',
      };

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updatePayload.name);
      expect(res.body.data.headline).toBe(updatePayload.headline);
      expect(res.body.data.targetRole).toBe(updatePayload.targetRole);

      // Verify persistence in database
      const dbUser = await User.findById(userId);
      expect(dbUser.name).toBe(updatePayload.name);
      expect(dbUser.headline).toBe(updatePayload.headline);
      expect(dbUser.targetRole).toBe(updatePayload.targetRole);
    });

    it('should reject updates with protected field (email) with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'new.email@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation Error');
    });

    it('should reject updates with protected field (password) with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'NewHackedPassword123!' });

      expect(res.status).toBe(400);
    });

    it('should reject updates with protected field (role) or _id with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin', _id: '654321654321654321654321' });

      expect(res.status).toBe(400);
    });

    it('should reject empty update payload {} with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should reject unrecognized unknown fields with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ unknownProperty: 'malicious' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/users/change-password', () => {
    it('should change password successfully, invalidate old password, and revoke all refresh tokens', async () => {
      // Create a second login session on another device
      const secondLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      const secondRefreshToken = secondLoginRes.body.data.refreshToken;

      // Verify tokens exist in database
      const activeTokensBefore = await RefreshToken.find({ userId });
      expect(activeTokensBefore.length).toBeGreaterThanOrEqual(2);

      const changePassPayload = {
        currentPassword: userData.password,
        newPassword: 'NewPassword999!',
      };

      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(changePassPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Password changed successfully. All active sessions have been revoked.'
      );

      // Verify all refresh tokens for this user are now revoked in DB
      const activeTokensAfter = await RefreshToken.find({ userId });
      expect(activeTokensAfter.length).toBe(0);

      // Verify old refresh token is rejected
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: secondRefreshToken });
      expect(refreshRes.status).toBe(401);

      // Verify old password cannot be used to login
      const oldLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      expect(oldLoginRes.status).toBe(401);

      // Verify new password successfully logs in
      const newLoginRes = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: changePassPayload.newPassword,
      });
      expect(newLoginRes.status).toBe(200);
      expect(newLoginRes.body.data).toHaveProperty('accessToken');
    });

    it('should reject password change with incorrect current password with 401 Unauthorized', async () => {
      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid current password');
    });

    it('should reject password change when new password is the same as current password with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: userData.password,
          newPassword: userData.password,
        });

      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toContain(
        'New password cannot be the same as the current password'
      );
    });

    it('should reject password change when new password is too short with 400 Bad Request', async () => {
      const res = await request(app)
        .patch('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: userData.password,
          newPassword: 'short',
        });

      expect(res.status).toBe(400);
    });

    it('should cleanly abort transaction and leave database unchanged if an error occurs during session revocation', async () => {
      // Monkey-patch RefreshToken.deleteMany to throw inside the transaction
      const originalDeleteMany = RefreshToken.deleteMany;
      try {
        RefreshToken.deleteMany = async () => {
          throw new Error('Simulated token revocation failure in transaction');
        };

        const res = await request(app)
          .patch('/api/v1/users/change-password')
          .set('Authorization', `Bearer ${token}`)
          .send({
            currentPassword: userData.password,
            newPassword: 'AbortedPassword123!',
          });

        expect(res.status).toBe(500);
      } finally {
        RefreshToken.deleteMany = originalDeleteMany;
      }

      // Verify that the user password remains the old password
      const loginOldRes = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: userData.password,
      });
      expect(loginOldRes.status).toBe(200);

      // Verify that the new password was NOT saved
      const loginNewRes = await request(app).post('/api/v1/auth/login').send({
        email: userData.email,
        password: 'AbortedPassword123!',
      });
      expect(loginNewRes.status).toBe(401);

      // Verify that refresh tokens were NOT deleted
      const remainingTokens = await RefreshToken.find({ userId });
      expect(remainingTokens.length).toBeGreaterThanOrEqual(1);
    });
  });
});
