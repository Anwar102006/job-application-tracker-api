import * as userService from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getProfile = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.user._id);

  res
    .status(200)
    .json(new ApiResponse(200, user, 'User profile fetched successfully'));
});

export const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);

  res
    .status(200)
    .json(new ApiResponse(200, user, 'User profile updated successfully'));
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await userService.changePassword(
    req.user._id,
    currentPassword,
    newPassword
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, result.message));
});
