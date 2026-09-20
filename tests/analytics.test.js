import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { JobApplication } from '../src/models/JobApplication.js';
import { Interview } from '../src/models/interview.model.js';

describe('Phase 5: Analytics Tests', () => {
  let userAToken;
  let userBToken;
  let userAId;
  let userBId;

  const userAData = {
    name: 'Analyst User A',
    email: 'analyst.a@example.com',
    password: 'Password123!',
  };

  const userBData = {
    name: 'Analyst User B',
    email: 'analyst.b@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    await User.deleteMany({});
    await JobApplication.deleteMany({});
    await Interview.deleteMany({});

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

  describe('GET /api/v1/analytics/overview', () => {
    it('should return clean zero values without division-by-zero errors when no applications exist', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        totalApplications: 0,
        totalInterviews: 0,
        interviewConversionRate: 0,
        offerRate: 0,
        rejectionRate: 0,
        offerToInterviewRate: 0,
      });
    });

    it('should compute mathematically accurate metrics for seeded applications and interviews', async () => {
      // Create 4 applications for User A:
      // App 1: Offered, 2 interviews
      const app1 = await JobApplication.create({
        userId: userAId,
        company: 'Company One',
        jobTitle: 'Senior Eng',
        status: 'Offered',
        isArchived: false,
      });
      await Interview.create({
        applicationId: app1._id,
        userId: userAId,
        round: 'HR Screening',
        interviewDate: new Date('2026-10-10T10:00:00.000Z'),
        durationMinutes: 30,
      });
      await Interview.create({
        applicationId: app1._id,
        userId: userAId,
        round: 'Technical Round',
        interviewDate: new Date('2026-10-12T10:00:00.000Z'),
        durationMinutes: 60,
      });

      // App 2: Interviewing, 1 interview
      const app2 = await JobApplication.create({
        userId: userAId,
        company: 'Company Two',
        jobTitle: 'Backend Dev',
        status: 'Interviewing',
        isArchived: false,
      });
      await Interview.create({
        applicationId: app2._id,
        userId: userAId,
        round: 'Coding Assessment',
        interviewDate: new Date('2026-10-14T10:00:00.000Z'),
        durationMinutes: 60,
      });

      // App 3: Rejected, 0 interviews
      await JobApplication.create({
        userId: userAId,
        company: 'Company Three',
        jobTitle: 'Fullstack Dev',
        status: 'Rejected',
        isArchived: false,
      });

      // App 4: Applied, 0 interviews
      await JobApplication.create({
        userId: userAId,
        company: 'Company Four',
        jobTitle: 'Staff Eng',
        status: 'Applied',
        isArchived: false,
      });

      // Seed 2 applications for User B (User Isolation check)
      const appB = await JobApplication.create({
        userId: userBId,
        company: 'Company B',
        jobTitle: 'DevOps',
        status: 'Offered',
        isArchived: false,
      });
      await Interview.create({
        applicationId: appB._id,
        userId: userBId,
        round: 'System Design',
        interviewDate: new Date('2026-10-15T10:00:00.000Z'),
        durationMinutes: 60,
      });

      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalApplications).toBe(4);
      expect(res.body.data.totalInterviews).toBe(3);
      // 2 out of 4 applications have >= 1 interview -> 50.0%
      expect(res.body.data.interviewConversionRate).toBe(50.0);
      // 1 out of 4 offered -> 25.0%
      expect(res.body.data.offerRate).toBe(25.0);
      // 1 out of 4 rejected -> 25.0%
      expect(res.body.data.rejectionRate).toBe(25.0);
      // 1 offered out of 2 apps with interviews -> 50.0%
      expect(res.body.data.offerToInterviewRate).toBe(50.0);

      // Verify User B's analytics are completely isolated from User A
      const resB = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.totalApplications).toBe(1);
      expect(resB.body.data.totalInterviews).toBe(1);
      expect(resB.body.data.offerRate).toBe(100.0);
    });

    it('should exclude archived applications and their child interviews from overview metrics', async () => {
      // Create App 1 (Offered, 2 interviews) - ARCHIVED
      const archivedApp = await JobApplication.create({
        userId: userAId,
        company: 'Archived Corp',
        jobTitle: 'Archived Role',
        status: 'Offered',
        isArchived: true,
      });
      await Interview.create({
        applicationId: archivedApp._id,
        userId: userAId,
        round: 'Technical Round',
        interviewDate: new Date('2026-10-10T10:00:00.000Z'),
        durationMinutes: 60,
      });
      await Interview.create({
        applicationId: archivedApp._id,
        userId: userAId,
        round: 'System Design',
        interviewDate: new Date('2026-10-12T10:00:00.000Z'),
        durationMinutes: 60,
      });

      // Create App 2 (Interviewing, 1 interview) - ACTIVE
      const activeApp = await JobApplication.create({
        userId: userAId,
        company: 'Active Corp',
        jobTitle: 'Active Role',
        status: 'Interviewing',
        isArchived: false,
      });
      await Interview.create({
        applicationId: activeApp._id,
        userId: userAId,
        round: 'Technical Round',
        interviewDate: new Date('2026-10-14T10:00:00.000Z'),
        durationMinutes: 60,
      });

      // Create App 3 (Applied) - ACTIVE
      await JobApplication.create({
        userId: userAId,
        company: 'Active Two',
        jobTitle: 'Active Two Role',
        status: 'Applied',
        isArchived: false,
      });

      const res = await request(app)
        .get('/api/v1/analytics/overview')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      // Only 2 non-archived applications
      expect(res.body.data.totalApplications).toBe(2);
      // Only 1 interview from active application (the 2 interviews from archivedApp are excluded)
      expect(res.body.data.totalInterviews).toBe(1);
      // 1 out of 2 active apps has interview -> 50.0%
      expect(res.body.data.interviewConversionRate).toBe(50.0);
      // 0 active apps offered (archived app is not counted) -> 0.0%
      expect(res.body.data.offerRate).toBe(0.0);
      expect(res.body.data.rejectionRate).toBe(0.0);
      expect(res.body.data.offerToInterviewRate).toBe(0.0);
    });
  });

  describe('GET /api/v1/analytics/status-breakdown', () => {
    it('should return guaranteed structure with all enum keys defaulting to 0 for empty database', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/status-breakdown')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byPriority');
      expect(res.body.data).toHaveProperty('byJobType');
      expect(res.body.data).toHaveProperty('byWorkplaceType');

      expect(res.body.data.byStatus).toEqual({
        Applied: 0,
        Screening: 0,
        Interviewing: 0,
        Offered: 0,
        Rejected: 0,
        Withdrawn: 0,
        Ghosted: 0,
      });

      expect(res.body.data.byPriority).toEqual({
        Low: 0,
        Medium: 0,
        High: 0,
      });

      expect(res.body.data.byJobType).toEqual({
        'Full-time': 0,
        'Part-time': 0,
        Contract: 0,
        Internship: 0,
        Freelance: 0,
      });

      expect(res.body.data.byWorkplaceType).toEqual({
        'On-site': 0,
        Hybrid: 0,
        Remote: 0,
      });
    });

    it('should correctly aggregate counts and exclude archived applications', async () => {
      await JobApplication.create({
        userId: userAId,
        company: 'Company 1',
        jobTitle: 'Role 1',
        status: 'Applied',
        priority: 'High',
        jobType: 'Full-time',
        workplaceType: 'Remote',
        isArchived: false,
      });

      await JobApplication.create({
        userId: userAId,
        company: 'Company 2',
        jobTitle: 'Role 2',
        status: 'Interviewing',
        priority: 'High',
        jobType: 'Contract',
        workplaceType: 'Hybrid',
        isArchived: false,
      });

      // Archived application should NOT be counted in breakdown
      await JobApplication.create({
        userId: userAId,
        company: 'Company 3',
        jobTitle: 'Role 3',
        status: 'Offered',
        priority: 'Low',
        jobType: 'Part-time',
        workplaceType: 'On-site',
        isArchived: true,
      });

      const res = await request(app)
        .get('/api/v1/analytics/status-breakdown')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.byStatus.Applied).toBe(1);
      expect(res.body.data.byStatus.Interviewing).toBe(1);
      expect(res.body.data.byStatus.Offered).toBe(0); // Archived excluded

      expect(res.body.data.byPriority.High).toBe(2);
      expect(res.body.data.byPriority.Low).toBe(0); // Archived excluded

      expect(res.body.data.byJobType['Full-time']).toBe(1);
      expect(res.body.data.byJobType.Contract).toBe(1);
      expect(res.body.data.byJobType['Part-time']).toBe(0); // Archived excluded

      expect(res.body.data.byWorkplaceType.Remote).toBe(1);
      expect(res.body.data.byWorkplaceType.Hybrid).toBe(1);
      expect(res.body.data.byWorkplaceType['On-site']).toBe(0); // Archived excluded
    });
  });

  describe('GET /api/v1/analytics/conversion-rates', () => {
    it('should calculate conversion funnel rates with zero-division safety', async () => {
      const emptyRes = await request(app)
        .get('/api/v1/analytics/conversion-rates')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data).toEqual({
        totalApplications: 0,
        applicationsWithInterviews: 0,
        offeredApplications: 0,
        rejectedApplications: 0,
        applicationToInterviewRate: 0,
        interviewToOfferRate: 0,
        applicationToOfferRate: 0,
        applicationToRejectionRate: 0,
      });

      // Seed 2 applications: 1 Offered with interview, 1 Rejected without interview
      const app1 = await JobApplication.create({
        userId: userAId,
        company: 'App 1',
        jobTitle: 'Engineer',
        status: 'Offered',
        isArchived: false,
      });
      await Interview.create({
        applicationId: app1._id,
        userId: userAId,
        round: 'Technical Round',
        interviewDate: new Date('2026-10-10T10:00:00.000Z'),
        durationMinutes: 60,
      });

      await JobApplication.create({
        userId: userAId,
        company: 'App 2',
        jobTitle: 'Developer',
        status: 'Rejected',
        isArchived: false,
      });

      const res = await request(app)
        .get('/api/v1/analytics/conversion-rates')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalApplications).toBe(2);
      expect(res.body.data.applicationsWithInterviews).toBe(1);
      expect(res.body.data.offeredApplications).toBe(1);
      expect(res.body.data.rejectedApplications).toBe(1);
      // 1 with interview out of 2 total -> 50.0%
      expect(res.body.data.applicationToInterviewRate).toBe(50.0);
      // 1 offered out of 1 with interview -> 100.0%
      expect(res.body.data.interviewToOfferRate).toBe(100.0);
      // 1 offered out of 2 total -> 50.0%
      expect(res.body.data.applicationToOfferRate).toBe(50.0);
      // 1 rejected out of 2 total -> 50.0%
      expect(res.body.data.applicationToRejectionRate).toBe(50.0);
    });
  });

  describe('GET /api/v1/analytics/monthly-trends', () => {
    it('should return continuous chronological months with zero-backfill for missing months', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/monthly-trends?months=6')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(6);

      // Verify all items have month in YYYY-MM format and integer count 0
      for (const item of res.body.data) {
        expect(item.month).toMatch(/^\d{4}-\d{2}$/);
        expect(item.count).toBe(0);
      }

      // Verify chronological ascending order
      for (let i = 1; i < res.body.data.length; i++) {
        expect(res.body.data[i].month > res.body.data[i - 1].month).toBe(true);
      }
    });

    it('should accurately aggregate application counts per month in UTC', async () => {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = now.getUTCMonth();

      // Application in current month
      const dateInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 15));
      await JobApplication.create({
        userId: userAId,
        company: 'Recent Corp',
        jobTitle: 'Role',
        status: 'Applied',
        appliedDate: dateInCurrentMonth,
        isArchived: false,
      });

      // Second application in current month
      await JobApplication.create({
        userId: userAId,
        company: 'Recent Corp 2',
        jobTitle: 'Role 2',
        status: 'Applied',
        appliedDate: dateInCurrentMonth,
        isArchived: false,
      });

      // Archived application in current month (MUST be excluded)
      await JobApplication.create({
        userId: userAId,
        company: 'Archived Corp',
        jobTitle: 'Archived Role',
        status: 'Applied',
        appliedDate: dateInCurrentMonth,
        isArchived: true,
      });

      const res = await request(app)
        .get('/api/v1/analytics/monthly-trends?months=6')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const currentMonthEntry = res.body.data.find((e) => e.month === currentMonthKey);
      expect(currentMonthEntry).toBeDefined();
      expect(currentMonthEntry.count).toBe(2);
    });

    it('should reject invalid months parameter with 400 Bad Request', async () => {
      const resZero = await request(app)
        .get('/api/v1/analytics/monthly-trends?months=0')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(resZero.status).toBe(400);

      const resTooBig = await request(app)
        .get('/api/v1/analytics/monthly-trends?months=25')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(resTooBig.status).toBe(400);

      const resNonInt = await request(app)
        .get('/api/v1/analytics/monthly-trends?months=abc')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(resNonInt.status).toBe(400);
    });
  });
});
