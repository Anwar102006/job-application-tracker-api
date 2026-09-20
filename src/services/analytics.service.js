import mongoose from 'mongoose';
import { JobApplication } from '../models/JobApplication.js';
import {
  APPLICATION_STATUS_LIST,
  JOB_TYPES,
  WORKPLACE_TYPES,
  PRIORITY_LEVELS,
} from '../constants/applicationStatus.js';

const roundToOneDecimal = (val) => Math.round(val * 10) / 10;

export const getOverview = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [result] = await JobApplication.aggregate([
    {
      $match: {
        userId: userObjectId,
        isArchived: false,
      },
    },
    {
      $facet: {
        totalApplications: [{ $count: 'count' }],
        statusCounts: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        interviewsData: [
          {
            $lookup: {
              from: 'interviews',
              localField: '_id',
              foreignField: 'applicationId',
              as: 'interviews',
            },
          },
          {
            $project: {
              interviewCount: { $size: '$interviews' },
              hasInterview: { $gt: [{ $size: '$interviews' }, 0] },
            },
          },
          {
            $group: {
              _id: null,
              totalInterviews: { $sum: '$interviewCount' },
              appsWithInterviews: {
                $sum: { $cond: ['$hasInterview', 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]);

  const totalApplications = result?.totalApplications?.[0]?.count || 0;
  const totalInterviews = result?.interviewsData?.[0]?.totalInterviews || 0;
  const appsWithInterviews = result?.interviewsData?.[0]?.appsWithInterviews || 0;

  let offeredCount = 0;
  let rejectedCount = 0;

  for (const item of (result?.statusCounts || [])) {
    if (item._id === 'Offered') offeredCount = item.count;
    if (item._id === 'Rejected') rejectedCount = item.count;
  }

  const interviewConversionRate =
    totalApplications > 0
      ? roundToOneDecimal((appsWithInterviews / totalApplications) * 100)
      : 0.0;

  const offerRate =
    totalApplications > 0
      ? roundToOneDecimal((offeredCount / totalApplications) * 100)
      : 0.0;

  const rejectionRate =
    totalApplications > 0
      ? roundToOneDecimal((rejectedCount / totalApplications) * 100)
      : 0.0;

  const offerToInterviewRate =
    appsWithInterviews > 0
      ? roundToOneDecimal((offeredCount / appsWithInterviews) * 100)
      : 0.0;

  return {
    totalApplications,
    totalInterviews,
    interviewConversionRate,
    offerRate,
    rejectionRate,
    offerToInterviewRate,
  };
};

export const getStatusBreakdown = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [result] = await JobApplication.aggregate([
    {
      $match: {
        userId: userObjectId,
        isArchived: false,
      },
    },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        byJobType: [{ $group: { _id: '$jobType', count: { $sum: 1 } } }],
        byWorkplaceType: [
          { $group: { _id: '$workplaceType', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const byStatus = Object.fromEntries(
    APPLICATION_STATUS_LIST.map((status) => [status, 0])
  );
  const byPriority = Object.fromEntries(
    PRIORITY_LEVELS.map((priority) => [priority, 0])
  );
  const byJobType = Object.fromEntries(
    JOB_TYPES.map((jobType) => [jobType, 0])
  );
  const byWorkplaceType = Object.fromEntries(
    WORKPLACE_TYPES.map((type) => [type, 0])
  );

  for (const item of (result?.byStatus || [])) {
    if (item._id && byStatus[item._id] !== undefined) {
      byStatus[item._id] = item.count;
    }
  }

  for (const item of (result?.byPriority || [])) {
    if (item._id && byPriority[item._id] !== undefined) {
      byPriority[item._id] = item.count;
    }
  }

  for (const item of (result?.byJobType || [])) {
    if (item._id && byJobType[item._id] !== undefined) {
      byJobType[item._id] = item.count;
    }
  }

  for (const item of (result?.byWorkplaceType || [])) {
    if (item._id && byWorkplaceType[item._id] !== undefined) {
      byWorkplaceType[item._id] = item.count;
    }
  }

  return {
    byStatus,
    byPriority,
    byJobType,
    byWorkplaceType,
  };
};

export const getConversionRates = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [result] = await JobApplication.aggregate([
    {
      $match: {
        userId: userObjectId,
        isArchived: false,
      },
    },
    {
      $facet: {
        totalApplications: [{ $count: 'count' }],
        statusCounts: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ],
        interviewsData: [
          {
            $lookup: {
              from: 'interviews',
              localField: '_id',
              foreignField: 'applicationId',
              as: 'interviews',
            },
          },
          {
            $project: {
              hasInterview: { $gt: [{ $size: '$interviews' }, 0] },
            },
          },
          {
            $group: {
              _id: null,
              appsWithInterviews: {
                $sum: { $cond: ['$hasInterview', 1, 0] },
              },
            },
          },
        ],
      },
    },
  ]);

  const totalApplications = result?.totalApplications?.[0]?.count || 0;
  const applicationsWithInterviews =
    result?.interviewsData?.[0]?.appsWithInterviews || 0;

  let offeredApplications = 0;
  let rejectedApplications = 0;

  for (const item of (result?.statusCounts || [])) {
    if (item._id === 'Offered') offeredApplications = item.count;
    if (item._id === 'Rejected') rejectedApplications = item.count;
  }

  const applicationToInterviewRate =
    totalApplications > 0
      ? roundToOneDecimal((applicationsWithInterviews / totalApplications) * 100)
      : 0.0;

  const interviewToOfferRate =
    applicationsWithInterviews > 0
      ? roundToOneDecimal((offeredApplications / applicationsWithInterviews) * 100)
      : 0.0;

  const applicationToOfferRate =
    totalApplications > 0
      ? roundToOneDecimal((offeredApplications / totalApplications) * 100)
      : 0.0;

  const applicationToRejectionRate =
    totalApplications > 0
      ? roundToOneDecimal((rejectedApplications / totalApplications) * 100)
      : 0.0;

  return {
    totalApplications,
    applicationsWithInterviews,
    offeredApplications,
    rejectedApplications,
    applicationToInterviewRate,
    interviewToOfferRate,
    applicationToOfferRate,
    applicationToRejectionRate,
  };
};

export const getMonthlyTrends = async (userId, months = 6) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth(); // 0-indexed

  const monthList = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
    const yearStr = d.getUTCFullYear();
    const monthStr = String(d.getUTCMonth() + 1).padStart(2, '0');
    monthList.push(`${yearStr}-${monthStr}`);
  }

  const startDateUtc = new Date(
    Date.UTC(currentYear, currentMonth - (months - 1), 1, 0, 0, 0, 0)
  );

  const monthlyData = await JobApplication.aggregate([
    {
      $match: {
        userId: userObjectId,
        isArchived: false,
        appliedDate: { $gte: startDateUtc },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m',
            date: '$appliedDate',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const countsMap = new Map();
  for (const item of monthlyData) {
    if (item._id) {
      countsMap.set(item._id, item.count);
    }
  }

  return monthList.map((month) => ({
    month,
    count: countsMap.get(month) || 0,
  }));
};
