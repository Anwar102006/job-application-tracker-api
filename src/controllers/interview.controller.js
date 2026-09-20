import * as interviewService from '../services/interview.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

export const createInterview = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const interview = await interviewService.createInterview(
    applicationId,
    req.user._id,
    req.body
  );

  res
    .status(201)
    .json(new ApiResponse(201, interview, 'Interview scheduled successfully'));
});

export const getInterviewsByApplication = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const interviews = await interviewService.getInterviewsByApplication(
    applicationId,
    req.user._id
  );

  res
    .status(200)
    .json(new ApiResponse(200, interviews, 'Interviews fetched successfully'));
});

export const getAllInterviews = catchAsync(async (req, res) => {
  const { interviews, meta } = await interviewService.getAllInterviews(
    req.user._id,
    req.query
  );

  res
    .status(200)
    .json(new ApiResponse(200, interviews, 'Interviews fetched successfully', meta));
});

export const getUpcomingInterviews = catchAsync(async (req, res) => {
  const interviews = await interviewService.getUpcomingInterviews(
    req.user._id,
    req.query
  );

  res
    .status(200)
    .json(
      new ApiResponse(200, interviews, 'Upcoming interviews fetched successfully')
    );
});

export const getInterviewById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const interview = await interviewService.getInterviewById(id, req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, interview, 'Interview fetched successfully'));
});

export const updateInterview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const interview = await interviewService.updateInterview(
    id,
    req.user._id,
    req.body
  );

  res
    .status(200)
    .json(new ApiResponse(200, interview, 'Interview updated successfully'));
});

export const deleteInterview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await interviewService.deleteInterview(id, req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, result, 'Interview deleted successfully'));
});
