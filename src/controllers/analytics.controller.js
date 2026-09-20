import * as analyticsService from '../services/analytics.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getOverview = catchAsync(async (req, res) => {
  const data = await analyticsService.getOverview(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, data, 'Analytics overview fetched successfully'));
});

export const getStatusBreakdown = catchAsync(async (req, res) => {
  const data = await analyticsService.getStatusBreakdown(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, data, 'Status breakdown fetched successfully'));
});

export const getConversionRates = catchAsync(async (req, res) => {
  const data = await analyticsService.getConversionRates(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, data, 'Conversion rates fetched successfully'));
});

export const getMonthlyTrends = catchAsync(async (req, res) => {
  const months = req.query.months;
  const data = await analyticsService.getMonthlyTrends(req.user._id, months);

  res
    .status(200)
    .json(new ApiResponse(200, data, 'Monthly trends fetched successfully'));
});
