import request from 'supertest';
import app from '../../src/app.js';
import { JobApplication } from '../../src/models/JobApplication.js';

describe('Phase 3: Job Applications Domain Tests', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;

  const userAData = {
    name: 'User A',
    email: 'user.a@example.com',
    password: 'Password123!',
  };

  const userBData = {
    name: 'User B',
    email: 'user.b@example.com',
    password: 'Password123!',
  };

  const validApplicationPayload = {
    company: 'Google',
    jobTitle: 'Senior Software Engineer',
    jobType: 'Full-time',
    workplaceType: 'Hybrid',
    location: 'Mountain View, CA',
    salary: {
      min: 150000,
      max: 220000,
      currency: 'USD',
      period: 'Yearly',
    },
    jobUrl: 'https://careers.google.com/jobs/12345',
    status: 'Applied',
    priority: 'High',
    notes: 'Referred by alumni',
    tags: ['Tech', 'Backend', 'Go'],
  };

  beforeEach(async () => {
    // Register & login User A
    const regA = await request(app).post('/api/v1/auth/register').send(userAData);
    userAId = regA.body.data._id;
    const loginA = await request(app).post('/api/v1/auth/login').send({
      email: userAData.email,
      password: userAData.password,
    });
    userAToken = loginA.body.data.accessToken;

    // Register & login User B
    const regB = await request(app).post('/api/v1/auth/register').send(userBData);
    userBId = regB.body.data._id;
    const loginB = await request(app).post('/api/v1/auth/login').send({
      email: userBData.email,
      password: userBData.password,
    });
    userBToken = loginB.body.data.accessToken;
  });

  describe('Application Creation (POST /api/v1/applications)', () => {
    it('should create an application successfully for authenticated user with 201 Created', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validApplicationPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.company).toBe(validApplicationPayload.company);
      expect(res.body.data.jobTitle).toBe(validApplicationPayload.jobTitle);
      expect(res.body.data.userId).toBe(userAId);
      expect(res.body.data.isArchived).toBe(false);
      expect(res.body.data.status).toBe('Applied');

      // Verify in DB
      const dbApp = await JobApplication.findById(res.body.data._id);
      expect(dbApp).not.toBeNull();
      expect(dbApp.userId.toString()).toBe(userAId);
    });

    it('should reject unauthenticated application creation with 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .send(validApplicationPayload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject application creation containing unknown fields (Zod strict) with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validApplicationPayload,
          extraField: 'not-allowed',
          isAdmin: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
    });

    it('should reject client-supplied userId to prevent ownership manipulation', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validApplicationPayload,
          userId: userBId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid enum values with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validApplicationPayload,
          status: 'InvalidStatus',
          jobType: 'Super-Full-Time',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Ownership & IDOR Protection', () => {
    let appAId;
    let appBId;

    beforeEach(async () => {
      // User A creates application A
      const resA = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          company: 'Company A',
          jobTitle: 'Role A',
        });
      appAId = resA.body.data._id;

      // User B creates application B
      const resB = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          company: 'Company B',
          jobTitle: 'Role B',
        });
      appBId = resB.body.data._id;
    });

    it('should allow User A to retrieve their own Application A', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${appAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(appAId);
      expect(res.body.data.company).toBe('Company A');
    });

    it('should prevent User A from retrieving User B application (returns 404)', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${appBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Job application not found');
    });

    it('should prevent User A from modifying User B application (returns 404)', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${appBId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ company: 'Hacked Company' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify Application B is unchanged in DB
      const dbAppB = await JobApplication.findById(appBId);
      expect(dbAppB.company).toBe('Company B');
    });

    it('should prevent User A from archiving User B application (returns 404)', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${appBId}/archive`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const dbAppB = await JobApplication.findById(appBId);
      expect(dbAppB.isArchived).toBe(false);
    });

    it('should prevent User A from deleting User B application (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/v1/applications/${appBId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      const dbAppB = await JobApplication.findById(appBId);
      expect(dbAppB).not.toBeNull();
    });
  });

  describe('Listing, Search, Filter, Sort & Pagination (GET /api/v1/applications)', () => {
    beforeEach(async () => {
      // Seed applications for User A
      await JobApplication.create([
        {
          userId: userAId,
          company: 'Amazon',
          jobTitle: 'Backend SDE',
          status: 'Applied',
          priority: 'High',
          jobType: 'Full-time',
          workplaceType: 'Remote',
          appliedDate: new Date('2026-01-10'),
          isArchived: false,
        },
        {
          userId: userAId,
          company: 'Microsoft',
          jobTitle: 'Frontend Engineer',
          status: 'Interviewing',
          priority: 'Medium',
          jobType: 'Full-time',
          workplaceType: 'Hybrid',
          appliedDate: new Date('2026-01-15'),
          isArchived: false,
        },
        {
          userId: userAId,
          company: 'Netflix',
          jobTitle: 'Staff Engineer',
          status: 'Offered',
          priority: 'High',
          jobType: 'Contract',
          workplaceType: 'Remote',
          appliedDate: new Date('2026-01-20'),
          isArchived: false,
        },
        {
          userId: userAId,
          company: 'Archived Corp',
          jobTitle: 'Old Role',
          status: 'Rejected',
          priority: 'Low',
          jobType: 'Part-time',
          workplaceType: 'On-site',
          appliedDate: new Date('2025-12-01'),
          isArchived: true,
        },
        // App for User B (must never leak)
        {
          userId: userBId,
          company: 'Apple',
          jobTitle: 'iOS Developer',
          status: 'Interviewing',
          priority: 'High',
          jobType: 'Full-time',
          workplaceType: 'On-site',
          isArchived: false,
        },
      ]);
    });

    it('should list only non-archived applications for User A by default', async () => {
      const res = await request(app)
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.meta.totalDocs).toBe(3);

      const companies = res.body.data.map((a) => a.company);
      expect(companies).toContain('Amazon');
      expect(companies).toContain('Microsoft');
      expect(companies).toContain('Netflix');
      expect(companies).not.toContain('Archived Corp');
      expect(companies).not.toContain('Apple'); // User B
    });

    it('should filter by status correctly', async () => {
      const res = await request(app)
        .get('/api/v1/applications?status=Interviewing')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].company).toBe('Microsoft');
    });

    it('should filter by priority and jobType correctly', async () => {
      const res = await request(app)
        .get('/api/v1/applications?priority=High&jobType=Full-time')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].company).toBe('Amazon');
    });

    it('should filter archived applications when isArchived=true', async () => {
      const res = await request(app)
        .get('/api/v1/applications?isArchived=true')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].company).toBe('Archived Corp');
      expect(res.body.data[0].isArchived).toBe(true);
    });

    it('should sort applications correctly', async () => {
      const res = await request(app)
        .get('/api/v1/applications?sortBy=appliedDate&sortOrder=asc')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].company).toBe('Amazon');
      expect(res.body.data[2].company).toBe('Netflix');
    });

    it('should paginate applications with accurate metadata', async () => {
      const res = await request(app)
        .get('/api/v1/applications?page=1&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 2,
        totalDocs: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPrevPage: false,
      });

      const resPage2 = await request(app)
        .get('/api/v1/applications?page=2&limit=2')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data).toHaveLength(1);
      expect(resPage2.body.meta.hasPrevPage).toBe(true);
      expect(resPage2.body.meta.hasNextPage).toBe(false);
    });

    it('should perform text search accurately within user scope', async () => {
      const res = await request(app)
        .get('/api/v1/applications?search=Netflix')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].company).toBe('Netflix');
    });
  });

  describe('Application Updates & State Machine (PATCH /api/v1/applications/:id)', () => {
    let appId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          company: 'Stripe',
          jobTitle: 'Staff Infrastructure Engineer',
          status: 'Applied',
        });
      appId = res.body.data._id;
    });

    it('should partially update application details without changing other fields', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          notes: 'Had a quick chat with recruiter',
          priority: 'High',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe('Had a quick chat with recruiter');
      expect(res.body.data.priority).toBe('High');
      expect(res.body.data.company).toBe('Stripe');
      expect(res.body.data.jobTitle).toBe('Staff Infrastructure Engineer');
    });

    it('should allow valid FSM status transition Applied -> Screening -> Interviewing -> Offered', async () => {
      // Applied -> Screening
      const step1 = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Screening' });
      expect(step1.status).toBe(200);
      expect(step1.body.data.status).toBe('Screening');

      // Screening -> Interviewing
      const step2 = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Interviewing' });
      expect(step2.status).toBe(200);
      expect(step2.body.data.status).toBe('Interviewing');

      // Interviewing -> Offered
      const step3 = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Offered' });
      expect(step3.status).toBe(200);
      expect(step3.body.data.status).toBe('Offered');
    });

    it('should reject invalid FSM transition Applied -> Offered with 400 Bad Request', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Offered' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Invalid status transition from 'Applied' to 'Offered'");
    });

    it('should reject status changes from terminal state Rejected with 400 Bad Request', async () => {
      // First reject the application (valid transition from Applied -> Rejected)
      await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Rejected' });

      // Attempt to change status from terminal state
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Interviewing' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Cannot change status from terminal state 'Rejected'");
    });

    it('should reject modifications to archived applications with 400 Bad Request', async () => {
      // Archive application
      await request(app)
        .patch(`/api/v1/applications/${appId}/archive`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Attempt update
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ notes: 'Trying to update archived' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Cannot modify an archived application');
    });
  });

  describe('Archive & Unarchive (PATCH /api/v1/applications/:id/archive)', () => {
    let appId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          company: 'Meta',
          jobTitle: 'Software Engineer',
        });
      appId = res.body.data._id;
    });

    it('should toggle isArchived from false to true', async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}/archive`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isArchived).toBe(true);
      expect(res.body.message).toBe('Application archived successfully');
    });

    it('should unarchive an archived application when toggled again', async () => {
      // Archive first
      await request(app)
        .patch(`/api/v1/applications/${appId}/archive`)
        .set('Authorization', `Bearer ${userAToken}`);

      // Unarchive
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}/archive`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isArchived).toBe(false);
      expect(res.body.message).toBe('Application unarchived successfully');
    });
  });

  describe('Application Deletion (DELETE /api/v1/applications/:id)', () => {
    let appId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          company: 'Uber',
          jobTitle: 'Platform Engineer',
        });
      appId = res.body.data._id;
    });

    it('should delete application permanently with 200 OK', async () => {
      const res = await request(app)
        .delete(`/api/v1/applications/${appId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Application deleted successfully');

      // Verify deletion in DB
      const dbApp = await JobApplication.findById(appId);
      expect(dbApp).toBeNull();
    });

    it('should return 404 when deleting a non-existent application', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .delete(`/api/v1/applications/${fakeId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Query-Plan & Index Verification', () => {
    beforeEach(async () => {
      await JobApplication.create([
        {
          userId: userAId,
          company: 'Bloomberg',
          jobTitle: 'Financial Software Developer',
          status: 'Interviewing',
          appliedDate: new Date(),
          isArchived: false,
        },
      ]);
    });

    it('should verify that application list query uses compound index without COLLSCAN', async () => {
      const explanation = await JobApplication.find({
        userId: userAId,
        isArchived: false,
      })
        .sort({ appliedDate: -1 })
        .explain('executionStats');

      const assertNoCollscan = (plan) => {
        expect(plan.stage).not.toBe('COLLSCAN');
        if (plan.inputStage) assertNoCollscan(plan.inputStage);
        if (plan.inputStages) plan.inputStages.forEach(assertNoCollscan);
      };

      assertNoCollscan(explanation.queryPlanner.winningPlan);
      expect(explanation.executionStats.executionSuccess).toBe(true);
    });

    it('should verify that status filter query uses compound index without COLLSCAN', async () => {
      const explanation = await JobApplication.find({
        userId: userAId,
        isArchived: false,
        status: 'Interviewing',
      }).explain('executionStats');

      const assertNoCollscan = (plan) => {
        expect(plan.stage).not.toBe('COLLSCAN');
        if (plan.inputStage) assertNoCollscan(plan.inputStage);
        if (plan.inputStages) plan.inputStages.forEach(assertNoCollscan);
      };

      assertNoCollscan(explanation.queryPlanner.winningPlan);
      expect(explanation.executionStats.executionSuccess).toBe(true);
    });

    it('should verify that keyword text search query executes using TEXT index', async () => {
      const explanation = await JobApplication.find({
        userId: userAId,
        $text: { $search: 'Bloomberg' },
      }).explain('executionStats');

      expect(explanation.executionStats.executionSuccess).toBe(true);
      expect(explanation.queryPlanner.winningPlan).toBeDefined();
    });
  });
});
