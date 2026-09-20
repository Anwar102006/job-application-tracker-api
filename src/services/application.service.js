import mongoose from 'mongoose';
import { JobApplication } from '../models/JobApplication.js';
import { Interview } from '../models/interview.model.js';
import { ApiError } from '../utils/ApiError.js';
import { VALID_APPLICATION_TRANSITIONS } from '../constants/applicationStatus.js';

export const createApplication = async (userId, applicationData) => {
  const application = await JobApplication.create({
    ...applicationData,
    userId,
  });

  return application;
};

export const getApplications = async (userId, queryOptions = {}) => {
  const {
    search,
    status,
    priority,
    jobType,
    workplaceType,
    isArchived = false,
    sortBy = 'appliedDate',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = queryOptions;

  const filter = {
    userId,
    isArchived,
  };

  if (status) {
    filter.status = status;
  }

  if (priority) {
    filter.priority = priority;
  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (workplaceType) {
    filter.workplaceType = workplaceType;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const sort = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [totalDocs, applications] = await Promise.all([
    JobApplication.countDocuments(filter),
    JobApplication.find(filter).sort(sort).skip(skip).limit(limit),
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
    applications,
    meta,
  };
};

export const getApplicationById = async (applicationId, userId) => {
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

  const appObj = application.toObject();
  appObj.interviews = interviews;

  return appObj;
};

export const updateApplication = async (applicationId, userId, updateData) => {
  const application = await JobApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    throw new ApiError(404, 'Job application not found');
  }

  if (application.isArchived) {
    throw new ApiError(400, 'Cannot modify an archived application. Please unarchive it first.');
  }

  if (updateData.status && updateData.status !== application.status) {
    const allowedTransitions = VALID_APPLICATION_TRANSITIONS[application.status] || [];

    if (allowedTransitions.length === 0) {
      throw new ApiError(400, `Cannot change status from terminal state '${application.status}'`);
    }

    if (!allowedTransitions.includes(updateData.status)) {
      throw new ApiError(
        400,
        `Invalid status transition from '${application.status}' to '${updateData.status}'`
      );
    }
  }

  Object.assign(application, updateData);
  await application.save();

  return application;
};

export const toggleArchiveApplication = async (applicationId, userId) => {
  const application = await JobApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    throw new ApiError(404, 'Job application not found');
  }

  application.isArchived = !application.isArchived;
  await application.save();

  return application;
};

export const deleteApplication = async (applicationId, userId) => {
  const application = await JobApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    throw new ApiError(404, 'Job application not found');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Cascade delete child interviews
    await Interview.deleteMany({ applicationId, userId }, { session });

    // Delete parent job application
    await JobApplication.deleteOne({ _id: applicationId, userId }, { session });

    await session.commitTransaction();

    return { message: 'Application deleted successfully' };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

