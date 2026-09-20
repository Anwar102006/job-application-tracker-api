import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as applicationService from '../services/application.service.js';

export const createApplication = catchAsync(async (req, res) => {
  const application = await applicationService.createApplication(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, application, 'Application created successfully'));
});

export const getApplications = catchAsync(async (req, res) => {
  const { applications, meta } = await applicationService.getApplications(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, applications, 'Applications retrieved successfully', meta));
});

export const getApplicationById = catchAsync(async (req, res) => {
  const application = await applicationService.getApplicationById(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, application, 'Application retrieved successfully'));
});

export const updateApplication = catchAsync(async (req, res) => {
  const application = await applicationService.updateApplication(req.params.id, req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, application, 'Application updated successfully'));
});

export const toggleArchiveApplication = catchAsync(async (req, res) => {
  const application = await applicationService.toggleArchiveApplication(req.params.id, req.user._id);
  const message = application.isArchived
    ? 'Application archived successfully'
    : 'Application unarchived successfully';
  res.status(200).json(new ApiResponse(200, application, message));
});

export const deleteApplication = catchAsync(async (req, res) => {
  await applicationService.deleteApplication(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Application deleted successfully'));
});
