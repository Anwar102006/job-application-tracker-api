import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { JobApplication } from '../src/models/JobApplication.js';
import { Interview } from '../src/models/interview.model.js';
import * as applicationService from '../src/services/application.service.js';

describe('Phase 4: Interview Scheduling & Atomic Cascade Deletion Tests', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;
  let appAId;
  let appBId;

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

  const validInterviewPayload = {
    round: 'Technical Round',
    interviewDate: '2026-10-15T10:00:00.000Z',
    durationMinutes: 60,
    format: 'Video Call',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    interviewers: ['Senior Eng 1', 'Engineering Lead'],
    notes: 'Prepare system design and architecture notes',
  };

  beforeAll(async () => {
    await Interview.syncIndexes();
    await JobApplication.syncIndexes();
  });

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

    // Create Application for User A
    const appARes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        company: 'Google',
        jobTitle: 'Senior Software Engineer',
      });
    appAId = appARes.body.data._id;

    // Create Application for User B
    const appBRes = await request(app)
      .post('/api/v1/applications')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        company: 'Netflix',
        jobTitle: 'Backend Engineer',
      });
    appBId = appBRes.body.data._id;
  });

  describe('Interview Creation (POST /api/v1/applications/:applicationId/interviews)', () => {
    it('should create an interview successfully with 201 Created and default status Scheduled', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validInterviewPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.applicationId).toBe(appAId);
      expect(res.body.data.userId).toBe(userAId);
      expect(res.body.data.status).toBe('Scheduled');
      expect(res.body.data.round).toBe('Technical Round');
      expect(res.body.data.durationMinutes).toBe(60);
      expect(res.body.data.format).toBe('Video Call');
      expect(res.body.data.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
      expect(res.body.data.interviewers).toEqual(['Senior Eng 1', 'Engineering Lead']);
    });

    it('should reject creation when status is supplied in the request body with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validInterviewPayload,
          status: 'Completed',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation Error');
    });

    it('should reject creation with client-supplied userId or _id with 400 Bad Request', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validInterviewPayload,
          userId: userBId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject creation when required fields (round or interviewDate) are missing', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          durationMinutes: 45,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid durationMinutes (< 15 or > 480) with 400 Bad Request', async () => {
      const resLow = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validInterviewPayload,
          durationMinutes: 10,
        });
      expect(resLow.status).toBe(400);

      const resHigh = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          ...validInterviewPayload,
          durationMinutes: 500,
        });
      expect(resHigh.status).toBe(400);
    });

    it('should reject interview creation on an archived application with 400 Bad Request', async () => {
      // Archive User A's application
      await request(app)
        .patch(`/api/v1/applications/${appAId}/archive`)
        .set('Authorization', `Bearer ${userAToken}`);

      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validInterviewPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('archived');
    });

    it('should return 404 Not Found when scheduling interview for non-existent application', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/v1/applications/${nonExistentId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validInterviewPayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 Not Found when User A tries to schedule interview for User B application', async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${appBId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send(validInterviewPayload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Ownership & IDOR Protection', () => {
    let userAInterviewId;
    let userBInterviewId;

    beforeEach(async () => {
      // Create Interview for User A
      const resA = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'HR Screening',
          interviewDate: '2026-10-10T10:00:00.000Z',
          durationMinutes: 30,
        });
      userAInterviewId = resA.body.data._id;

      // Create Interview for User B
      const resB = await request(app)
        .post(`/api/v1/applications/${appBId}/interviews`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          round: 'Hiring Manager',
          interviewDate: '2026-10-10T10:00:00.000Z',
          durationMinutes: 45,
        });
      userBInterviewId = resB.body.data._id;
    });

    it('should allow User A to retrieve their own interview by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/interviews/${userAInterviewId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(userAInterviewId);
      expect(res.body.data.round).toBe('HR Screening');
    });

    it('should prevent User A from retrieving User B interview with 404 Not Found', async () => {
      const res = await request(app)
        .get(`/api/v1/interviews/${userBInterviewId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should prevent User A from updating User B interview with 404 Not Found', async () => {
      const res = await request(app)
        .patch(`/api/v1/interviews/${userBInterviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ notes: 'Malicious update' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should prevent User A from deleting User B interview with 404 Not Found', async () => {
      const res = await request(app)
        .delete(`/api/v1/interviews/${userBInterviewId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should prevent User A from listing interviews belonging to User B application with 404 Not Found', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${appBId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should never leak User B interviews in User A global list', async () => {
      const res = await request(app)
        .get('/api/v1/interviews')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.map((i) => i._id);
      expect(returnedIds).toContain(userAInterviewId);
      expect(returnedIds).not.toContain(userBInterviewId);
    });
  });

  describe('Interview Status FSM', () => {
    let interviewId;

    beforeEach(async () => {
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Technical Round',
          interviewDate: '2026-10-20T10:00:00.000Z',
          durationMinutes: 60,
        });
      interviewId = res.body.data._id;
    });

    it('should allow valid transitions from Scheduled to Completed, Rescheduled, Cancelled, and No Show', async () => {
      // Scheduled -> Rescheduled
      const resRescheduled = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Rescheduled' });
      expect(resRescheduled.status).toBe(200);
      expect(resRescheduled.body.data.status).toBe('Rescheduled');

      // Rescheduled -> No Show
      const resNoShow = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'No Show' });
      expect(resNoShow.status).toBe(200);
      expect(resNoShow.body.data.status).toBe('No Show');

      // No Show -> Cancelled
      const resCancelled = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Cancelled' });
      expect(resCancelled.status).toBe(200);
      expect(resCancelled.body.data.status).toBe('Cancelled');
    });

    it('should reject invalid transitions (e.g. Rescheduled -> Scheduled or No Show -> Completed)', async () => {
      // Scheduled -> Rescheduled
      await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Rescheduled' });

      // Rescheduled -> Scheduled (invalid regression)
      const resInvalid = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Scheduled' });
      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.success).toBe(false);
      expect(resInvalid.body.message).toContain('Invalid status transition');
    });

    it('should reject transitions from terminal state Completed with 400 Bad Request', async () => {
      // Transition to Completed
      await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Completed' });

      // Attempt transition out of Completed
      const res = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Rescheduled' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('terminal state');
    });

    it('should reject transitions from terminal state Cancelled with 400 Bad Request', async () => {
      // Transition to Cancelled
      await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Cancelled' });

      // Attempt transition out of Cancelled
      const res = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Scheduled' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('terminal state');
    });

    it('should ensure Interview FSM does not modify parent JobApplication status', async () => {
      // Verify parent status is 'Applied'
      const parentBefore = await JobApplication.findById(appAId);
      expect(parentBefore.status).toBe('Applied');

      // Update interview to Completed
      await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Completed' });

      // Verify parent status remains 'Applied'
      const parentAfter = await JobApplication.findById(appAId);
      expect(parentAfter.status).toBe('Applied');
    });
  });

  describe('Scheduling Conflict Policy', () => {
    beforeEach(async () => {
      // Schedule baseline active interview: 2026-10-15 from 10:00 to 11:00 (60 min)
      await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'HR Screening',
          interviewDate: '2026-10-15T10:00:00.000Z',
          durationMinutes: 60,
        });
    });

    it('should reject overlapping interview with 409 Conflict', async () => {
      // Overlaps: 10:30 to 11:30
      const resOverlap = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Technical Round',
          interviewDate: '2026-10-15T10:30:00.000Z',
          durationMinutes: 60,
        });

      expect(resOverlap.status).toBe(409);
      expect(resOverlap.body.success).toBe(false);
      expect(resOverlap.body.message).toContain('conflict');
    });

    it('should accept non-overlapping interview with 201 Created', async () => {
      // Non-overlapping: 14:00 to 15:00
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Technical Round',
          interviewDate: '2026-10-15T14:00:00.000Z',
          durationMinutes: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should accept boundary-touching intervals without conflict', async () => {
      // Touches end: 11:00 to 12:00
      const resAfter = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Behavioral',
          interviewDate: '2026-10-15T11:00:00.000Z',
          durationMinutes: 60,
        });
      expect(resAfter.status).toBe(201);

      // Touches start: 09:00 to 10:00
      const resBefore = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Offer Discussion',
          interviewDate: '2026-10-15T09:00:00.000Z',
          durationMinutes: 60,
        });
      expect(resBefore.status).toBe(201);
    });

    it('should exclude the updated interview itself during conflict check', async () => {
      const listRes = await request(app)
        .get('/api/v1/interviews')
        .set('Authorization', `Bearer ${userAToken}`);
      const interviewId = listRes.body.data[0]._id;

      // Updating notes on the same interval should succeed
      const resUpdate = await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ notes: 'Updated notes without time change' });

      expect(resUpdate.status).toBe(200);
      expect(resUpdate.body.data.notes).toBe('Updated notes without time change');
    });

    it('should not conflict with Completed or Cancelled interviews', async () => {
      const listRes = await request(app)
        .get('/api/v1/interviews')
        .set('Authorization', `Bearer ${userAToken}`);
      const interviewId = listRes.body.data[0]._id;

      // Cancel the 10:00-11:00 interview
      await request(app)
        .patch(`/api/v1/interviews/${interviewId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: 'Cancelled' });

      // Schedule another interview in the same slot (10:15 - 11:15)
      const res = await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Coding Assessment',
          interviewDate: '2026-10-15T10:15:00.000Z',
          durationMinutes: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should allow different users to schedule interviews at the same time window', async () => {
      // User B schedules at the exact same 10:00-11:00 time
      const res = await request(app)
        .post(`/api/v1/applications/${appBId}/interviews`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          round: 'System Design',
          interviewDate: '2026-10-15T10:00:00.000Z',
          durationMinutes: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Queries, Upcoming Filter & Route Precedence', () => {
    beforeEach(async () => {
      const now = Date.now();
      const in2Days = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();
      const in5Days = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString();
      const in20Days = new Date(now + 20 * 24 * 60 * 60 * 1000).toISOString();

      await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'HR Screening',
          interviewDate: in2Days,
          durationMinutes: 30,
        });

      await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Technical Round',
          interviewDate: in5Days,
          durationMinutes: 60,
        });

      await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'System Design',
          interviewDate: in20Days,
          durationMinutes: 60,
        });
    });

    it('should query upcoming interviews within 7 days by default and enforce route precedence (/upcoming before /:id)', async () => {
      const res = await request(app)
        .get('/api/v1/interviews/upcoming')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // 2 interviews within 7 days; 1 is at 20 days
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].round).toBe('HR Screening');
      expect(res.body.data[1].round).toBe('Technical Round');
    });

    it('should query upcoming interviews with custom days parameter', async () => {
      const res = await request(app)
        .get('/api/v1/interviews/upcoming?days=30')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });

    it('should support date range filtering in global interview list', async () => {
      const now = new Date();
      const start = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
      const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .get(`/api/v1/interviews?startDate=${start}&endDate=${end}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].round).toBe('HR Screening');
    });

    it('should attach child interviews in getApplicationById (GET /api/v1/applications/:id)', async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${appAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(appAId);
      expect(Array.isArray(res.body.data.interviews)).toBe(true);
      expect(res.body.data.interviews.length).toBe(3);
    });
  });

  describe('Transactional Cascade Deletion & Rollback', () => {
    it('should atomically delete parent application and all child interviews', async () => {
      // Create 2 child interviews for Application A
      await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'HR Screening',
          interviewDate: '2026-10-15T10:00:00.000Z',
        });

      await request(app)
        .post(`/api/v1/applications/${appAId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'Technical Round',
          interviewDate: '2026-10-15T14:00:00.000Z',
        });

      // Verify interviews exist
      const beforeCount = await Interview.countDocuments({ applicationId: appAId });
      expect(beforeCount).toBe(2);

      // Delete parent application
      const deleteRes = await request(app)
        .delete(`/api/v1/applications/${appAId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Verify application is deleted
      const appInDb = await JobApplication.findById(appAId);
      expect(appInDb).toBeNull();

      // Verify all child interviews are cascade deleted
      const afterCount = await Interview.countDocuments({ applicationId: appAId });
      expect(afterCount).toBe(0);
    });

    it('should cleanly abort transaction and leave database unchanged if an error occurs during deletion', async () => {
      // Create an application and an interview
      const createRes = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          company: 'Rollback Corp',
          jobTitle: 'Reliability Engineer',
        });
      const rollbackAppId = createRes.body.data._id;

      await request(app)
        .post(`/api/v1/applications/${rollbackAppId}/interviews`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          round: 'System Design',
          interviewDate: '2026-11-01T10:00:00.000Z',
        });

      // Verify data exists before failure
      expect(await JobApplication.findById(rollbackAppId)).not.toBeNull();
      expect(await Interview.countDocuments({ applicationId: rollbackAppId })).toBe(1);

      // Monkey-patch JobApplication.deleteOne and force it to reject inside the transaction
      const originalDeleteOne = JobApplication.deleteOne;
      try {
        JobApplication.deleteOne = async () => {
          throw new Error('Simulated database failure during transaction execution');
        };

        // Call service deleteApplication and expect it to throw
        await expect(
          applicationService.deleteApplication(rollbackAppId, userAId)
        ).rejects.toThrow('Simulated database failure during transaction execution');
      } finally {
        // Restore original function
        JobApplication.deleteOne = originalDeleteOne;
      }

      // Verify that transaction rolled back: BOTH application and interview still exist!
      const appAfterRollback = await JobApplication.findById(rollbackAppId);
      expect(appAfterRollback).not.toBeNull();
      expect(appAfterRollback.company).toBe('Rollback Corp');

      const interviewsAfterRollback = await Interview.countDocuments({
        applicationId: rollbackAppId,
      });
      expect(interviewsAfterRollback).toBe(1);
    });
  });

  describe('Database Indexes & Query Plan Verification', () => {
    it('should use compound index { userId: 1, interviewDate: 1 } without COLLSCAN for upcoming queries', async () => {
      const explanation = await Interview.find({
        userId: userAId,
        interviewDate: { $gte: new Date() },
      })
        .sort({ interviewDate: 1 })
        .explain('executionStats');

      const winningPlan = explanation.queryPlanner.winningPlan;
      expect(winningPlan.stage).not.toBe('COLLSCAN');

      // Check if winning plan stage is IXSCAN or contains IXSCAN within inputStage
      const stages = [];
      let currentStage = winningPlan;
      while (currentStage) {
        stages.push(currentStage.stage);
        currentStage = currentStage.inputStage;
      }
      expect(stages).toContain('IXSCAN');
      expect(explanation.executionStats.executionSuccess).toBe(true);
    });
  });
});
