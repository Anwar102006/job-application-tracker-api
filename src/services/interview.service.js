import { Interview } from '../models/interview.model.js';
import { JobApplication } from '../models/JobApplication.js';
import { ApiError } from '../utils/ApiError.js';
import {
  INTERVIEW_STATUS,
  VALID_INTERVIEW_TRANSITIONS,
} from '../constants/interviewStatus.js';

export const checkSchedulingConflict = async (
  userId,
  interviewDate,
  durationMinutes,
  excludeInterviewId = null
) => {
  const newStart = new Date(interviewDate);
  const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

  const conflictQuery = {
    userId,
    status: { $in: [INTERVIEW_STATUS.SCHEDULED, INTERVIEW_STATUS.RESCHEDULED] },
    interviewDate: { $lt: newEnd },
    $expr: {
      $gt: [
        { $add: ['$interviewDate', { $multiply: ['$durationMinutes', 60000] }] },
        newStart,
      ],
    },
  };

  if (excludeInterviewId) {
    conflictQuery._id = { $ne: excludeInterviewId };
  }

  const conflictingInterview = await Interview.findOne(conflictQuery);

  if (conflictingInterview) {
    throw new ApiError(
      409,
      'Interview schedule conflict: You already have an active interview scheduled during this time window.'
    );
  }
};

export const createInterview = async (applicationId, userId, interviewData) => {
  const application = await JobApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    throw new ApiError(404, 'Job application not found');
  }

  if (application.isArchived) {
    throw new ApiError(
      400,
      'Cannot schedule an interview for an archived application. Please unarchive it first.'
    );
  }

  const duration = interviewData.durationMinutes || 60;
  await checkSchedulingConflict(userId, interviewData.interviewDate, duration);

  const interview = await Interview.create({
    ...interviewData,
    applicationId,
    userId,
    status: INTERVIEW_STATUS.SCHEDULED,
  });

  return interview;
};

export const getInterviewsByApplication = async (applicationId, userId) => {
  const application = await JobApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    throw new ApiError(404, 'Job application not found');
  }

  const interviews = await Interview.find({ applicationId, userId }).sort({
    interviewDate: 1,
  });

  return interviews;
};

export const getAllInterviews = async (userId, queryOptions = {}) => {
  const {
    status,
    startDate,
    endDate,
    sortBy = 'interviewDate',
    sortOrder = 'asc',
    page = 1,
    limit = 10,
  } = queryOptions;

  const filter = { userId };

  if (status) {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.interviewDate = {};
    if (startDate) {
      filter.interviewDate.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.interviewDate.$lte = new Date(endDate);
    }
  }

  const sort = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [totalDocs, interviews] = await Promise.all([
    Interview.countDocuments(filter),
    Interview.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('applicationId', 'company jobTitle status'),
  ]);

  const totalPages = Math.ceil(totalDocs / limit) || 1;

  const meta = {
    page,
    limit,
    totalDocs,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    interviews,
    meta,
  };
};

export const getUpcomingInterviews = async (userId, queryOptions = {}) => {
  const { days = 7 } = queryOptions;
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const filter = {
    userId,
    interviewDate: { $gte: now, $lte: futureDate },
    status: { $in: [INTERVIEW_STATUS.SCHEDULED, INTERVIEW_STATUS.RESCHEDULED] },
  };

  const interviews = await Interview.find(filter)
    .sort({ interviewDate: 1 })
    .populate('applicationId', 'company jobTitle status');

  return interviews;
};

export const getInterviewById = async (id, userId) => {
  const interview = await Interview.findOne({ _id: id, userId }).populate(
    'applicationId',
    'company jobTitle status'
  );

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  return interview;
};

export const updateInterview = async (id, userId, updateData) => {
  const interview = await Interview.findOne({ _id: id, userId });

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  if (updateData.status && updateData.status !== interview.status) {
    const allowedTransitions = VALID_INTERVIEW_TRANSITIONS[interview.status] || [];

    if (allowedTransitions.length === 0) {
      throw new ApiError(
        400,
        `Cannot change status from terminal state '${interview.status}'`
      );
    }

    if (!allowedTransitions.includes(updateData.status)) {
      throw new ApiError(
        400,
        `Invalid status transition from '${interview.status}' to '${updateData.status}'`
      );
    }
  }

  const targetStatus = updateData.status || interview.status;
  const isActive = [
    INTERVIEW_STATUS.SCHEDULED,
    INTERVIEW_STATUS.RESCHEDULED,
  ].includes(targetStatus);

  if (isActive) {
    const targetDate = updateData.interviewDate
      ? new Date(updateData.interviewDate)
      : interview.interviewDate;
    const targetDuration =
      updateData.durationMinutes !== undefined
        ? updateData.durationMinutes
        : interview.durationMinutes;

    if (
      updateData.interviewDate ||
      updateData.durationMinutes ||
      updateData.status
    ) {
      await checkSchedulingConflict(
        userId,
        targetDate,
        targetDuration,
        interview._id
      );
    }
  }

  Object.assign(interview, updateData);
  await interview.save();

  return interview;
};

export const deleteInterview = async (id, userId) => {
  const interview = await Interview.findOneAndDelete({ _id: id, userId });

  if (!interview) {
    throw new ApiError(404, 'Interview not found');
  }

  return { message: 'Interview deleted successfully' };
};
